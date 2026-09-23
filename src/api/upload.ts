import {
  createUploader,
  fileUploadSource,
  type CanopOpenUploadBody,
  type CanopPutChunkResponse,
  type CanopUploadBytes,
  type CanopUploadNode,
  type CanopUploadSessionResponse,
  type CanopUploadTransport,
} from "canopui";
import { request } from "./client";

/** Taille d'un morceau. L'API refuse au-delà de 16 Mio. */
const TAILLE_CHUNK = 16 * 1024 * 1024;

/**
 * Au-delà de cette taille, on découpe au lieu d'envoyer d'un bloc.
 *
 * La passerelle plafonne `/api/drive` à 17 Mio — la place d'un morceau et de
 * son enveloppe HTTP, pas davantage. Un fichier envoyé entier au-dessus de
 * cette borne repart en 413, et Cloudflare coupe de toute façon vers 100 Mo.
 * Le découpage est donc le seul chemin qui mène aux gros fichiers, jusqu'aux
 * 10 Gio que l'API accepte de réserver.
 */
const SEUIL_ENVOI_DIRECT = TAILLE_CHUNK;

/**
 * Transport d'envoi branché sur CH-Api-Drive.
 *
 * CanopUI fournit bien `createUploadTransport`, mais il vise un autre contrat :
 * routes préfixées `/v1`, dossier parent passé en champ de formulaire, et
 * surtout un jeton JWT lisible en JavaScript. Le portail, lui, s'authentifie
 * par cookie `ch_token` (HttpOnly) : il n'a aucun jeton à fournir.
 *
 * On emprunte donc le point d'extension prévu (`createUploader({ transport })`)
 * en réutilisant le client du portail. Le cookie de session et le
 * renouvellement automatique sur 401 viennent avec — ce qui compte pour un
 * envoi de plusieurs gigaoctets, dont la durée peut dépasser la validité du
 * jeton.
 */
export const driveUploadTransport: CanopUploadTransport = {
  open: (body: CanopOpenUploadBody) =>
    request<CanopUploadSessionResponse>("/drive/uploads", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  putChunk: (
    sessionId: string,
    chunkIndex: number,
    bytes: CanopUploadBytes,
    signal?: AbortSignal,
  ) =>
    request<CanopPutChunkResponse>(`/drive/uploads/${sessionId}/chunks/${chunkIndex}`, {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      body: bytes as BodyInit,
      signal,
    }),

  status: (sessionId: string) => request<CanopUploadSessionResponse>(`/drive/uploads/${sessionId}`),

  complete: (sessionId: string) =>
    request<CanopUploadNode>(`/drive/uploads/${sessionId}/complete`, {
      method: "POST",
    }),

  abort: (sessionId: string) => request<void>(`/drive/uploads/${sessionId}`, { method: "DELETE" }),

  uploadSingleShot: (
    fileName: string,
    bytes: CanopUploadBytes,
    mime: string | undefined,
    parentId: string | undefined,
    signal?: AbortSignal,
  ) => {
    const form = new FormData();
    form.set("file", new Blob([bytes], { type: mime ?? "application/octet-stream" }), fileName);
    // L'API lit le dossier parent en paramètre de requête, pas dans le formulaire.
    const query = parentId ? `?parent=${encodeURIComponent(parentId)}` : "";
    return request<CanopUploadNode>(`/drive/files${query}`, {
      method: "POST",
      body: form,
      signal,
    });
  },
};

/** Envoi d'un fichier, interruptible et reprenable en cours de route. */
export interface FileUpload {
  start: () => Promise<void>;
  /** Reprend après une pause, sans renvoyer les morceaux déjà reçus. */
  resume: () => Promise<void>;
  pause: () => void;
}

export function createFileUpload(
  file: File,
  parentId: string,
  onProgress?: (ratio: number) => void,
): FileUpload {
  const uploader = createUploader({
    // Inutilisés : le transport ci-dessus remplace celui que CanopUI
    // construirait à partir de ces deux réglages.
    basePath: "",
    getToken: () => null,
    transport: driveUploadTransport,
    chunkSize: TAILLE_CHUNK,
    singleShotThreshold: SEUIL_ENVOI_DIRECT,
    onProgress: onProgress ? (progress) => onProgress(progress.ratio) : undefined,
  });
  const source = fileUploadSource(file);

  return {
    start: async () => {
      await uploader.start({ source, parentId });
    },
    resume: async () => {
      await uploader.resume();
    },
    pause: () => uploader.pause(),
  };
}

/**
 * Une mise en pause remonte sous forme d'erreur : c'est le seul moyen
 * d'interrompre la boucle d'envoi. Elle ne doit pas être comptée comme un échec.
 */
export function estMiseEnPause(error: unknown): boolean {
  return error instanceof Error && error.name === "PauseError";
}
