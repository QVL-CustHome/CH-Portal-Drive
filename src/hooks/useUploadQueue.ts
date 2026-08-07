import { useCallback, useRef, useState } from "react";
import { ApiError } from "../api/client";
import { createFolder, listNodes, uploadFile } from "../api/drive";

export type UploadStatus = "queued" | "uploading" | "done" | "error";

export interface UploadItem {
  id: string;
  /** Chemin relatif affiché à l'utilisateur (le nom seul hors import de dossier). */
  label: string;
  file: File;
  /** Dossiers à traverser sous `parentId`, dans l'ordre. */
  segments: string[];
  parentId: string | null;
  status: UploadStatus;
  error?: string;
}

export interface UploadQueue {
  items: UploadItem[];
  paused: boolean;
  running: boolean;
  total: number;
  done: number;
  failed: number;
  remaining: number;
  finished: boolean;
  enqueue: (files: FileList | File[], parentId: string | null) => void;
  pause: () => void;
  resume: () => void;
  retryFailed: () => void;
  dismiss: () => void;
}

interface Params {
  /** Appelé quand la file se vide, pour rafraîchir la liste et le quota. */
  onBatchFinished: () => void;
  describeError: (error: unknown) => string;
}

/**
 * File d'attente d'envoi de fichiers.
 *
 * Elle existe pour une raison précise : l'import d'un dossier volumineux
 * perdait des fichiers en silence. La boucle d'origine s'arrêtait à la première
 * erreur — un seul doublon ou une coupure réseau et tout le reste n'était
 * jamais envoyé — et sautait sans un mot les fichiers dont le dossier cible
 * n'avait pas pu être créé.
 *
 * Ici, **chaque fichier est indépendant** : un échec est enregistré sur sa
 * ligne et la file continue. Rien n'est perdu sans être signalé, et l'on peut
 * réessayer les échecs, mettre en pause et reprendre.
 */
export function useUploadQueue({ onBatchFinished, describeError }: Params): UploadQueue {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [paused, setPaused] = useState(false);
  const [running, setRunning] = useState(false);

  const itemsRef = useRef<UploadItem[]>([]);
  const pausedRef = useRef(false);
  const pumpingRef = useRef(false);
  // Cache des dossiers créés, partagé par tout le lot : un même dossier n'est
  // résolu qu'une fois, quel que soit le nombre de fichiers qu'il contient.
  const foldersRef = useRef(new Map<string, string>());

  const apply = useCallback((next: UploadItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const update = useCallback(
    (transform: (items: UploadItem[]) => UploadItem[]) => apply(transform(itemsRef.current)),
    [apply]
  );

  const setStatus = useCallback(
    (id: string, status: UploadStatus, error?: string) =>
      update((current) =>
        current.map((item) => (item.id === id ? { ...item, status, error } : item))
      ),
    [update]
  );

  /** Crée le dossier s'il manque, le retrouve s'il existe déjà. */
  const ensureFolder = useCallback(async (name: string, parent: string): Promise<string> => {
    try {
      const node = await createFolder(name, parent);
      return node.id;
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const listing = await listNodes(parent);
        const existing = listing.items.find((n) => n.kind === "folder" && n.name === name);
        if (existing) return existing.id;
      }
      throw error;
    }
  }, []);

  const ensurePath = useCallback(
    async (segments: string[], parentId: string | null): Promise<string | null> => {
      let parent = parentId;
      let path = "";
      for (const segment of segments) {
        if (parent === null) return null;
        path = path ? `${path}/${segment}` : segment;
        const cle = `${parentId ?? "root"}::${path}`;
        let id = foldersRef.current.get(cle);
        if (id === undefined) {
          id = await ensureFolder(segment, parent);
          foldersRef.current.set(cle, id);
        }
        parent = id;
      }
      return parent;
    },
    [ensureFolder]
  );

  const pump = useCallback(async () => {
    if (pumpingRef.current) return;
    pumpingRef.current = true;
    setRunning(true);
    let auMoinsUnEnvoi = false;

    try {
      for (;;) {
        if (pausedRef.current) break;
        const suivant = itemsRef.current.find((item) => item.status === "queued");
        if (!suivant) break;

        setStatus(suivant.id, "uploading");
        try {
          const cible = await ensurePath(suivant.segments, suivant.parentId);
          if (cible === null) {
            throw new Error("dossier cible introuvable");
          }
          await uploadFile(suivant.file, cible);
          setStatus(suivant.id, "done");
          auMoinsUnEnvoi = true;
        } catch (error) {
          setStatus(suivant.id, "error", describeError(error));
        }
      }
    } finally {
      pumpingRef.current = false;
      setRunning(false);
      if (auMoinsUnEnvoi) onBatchFinished();
    }
  }, [describeError, ensurePath, onBatchFinished, setStatus]);

  const enqueue = useCallback(
    (files: FileList | File[], parentId: string | null) => {
      const liste = Array.from(files);
      if (liste.length === 0) return;

      const nouveaux: UploadItem[] = liste.map((file, index) => {
        const relatif = file.webkitRelativePath || file.name;
        const segments = relatif.split("/").filter(Boolean).slice(0, -1);
        return {
          id: `${Date.now()}-${index}-${relatif}`,
          label: relatif,
          file,
          segments,
          parentId,
          status: "queued",
        };
      });

      // Un nouveau lot repart de zéro : on retire les lignes déjà terminées
      // pour que le compteur reflète l'envoi en cours.
      update((current) => [...current.filter((item) => item.status !== "done"), ...nouveaux]);
      pausedRef.current = false;
      setPaused(false);
      void pump();
    },
    [pump, update]
  );

  const pause = useCallback(() => {
    pausedRef.current = true;
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
    setPaused(false);
    void pump();
  }, [pump]);

  const retryFailed = useCallback(() => {
    update((current) =>
      current.map((item) =>
        item.status === "error" ? { ...item, status: "queued", error: undefined } : item
      )
    );
    pausedRef.current = false;
    setPaused(false);
    void pump();
  }, [pump, update]);

  const dismiss = useCallback(() => {
    foldersRef.current.clear();
    apply([]);
  }, [apply]);

  const done = items.filter((item) => item.status === "done").length;
  const failed = items.filter((item) => item.status === "error").length;
  const remaining = items.filter(
    (item) => item.status === "queued" || item.status === "uploading"
  ).length;

  return {
    items,
    paused,
    running,
    total: items.length,
    done,
    failed,
    remaining,
    finished: items.length > 0 && remaining === 0,
    enqueue,
    pause,
    resume,
    retryFailed,
    dismiss,
  };
}
