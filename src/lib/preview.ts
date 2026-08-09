import type { Node } from "../api/drive";

/**
 * Formats prévisualisables. La liste double volontairement celle que l'API sert
 * en `Content-Disposition: inline` : un type absent de la liste serveur serait
 * téléchargé par le navigateur au lieu de s'afficher, et la visionneuse
 * resterait vide. Toute évolution se fait donc des deux côtés.
 */
const IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
];
const DOCUMENT_MIMES = ["application/pdf"];
/** Conteneurs que les navigateurs lisent nativement. */
const VIDEO_MIMES = ["video/mp4", "video/webm", "video/ogg"];

export type PreviewKind = "image" | "document" | "video";

function typePrincipal(mime: string | null): string {
  return (mime ?? "").split(";")[0]!.trim().toLowerCase();
}

/** Nature de la prévisualisation d'un nœud, ou `null` s'il n'est pas affichable. */
export function previewKind(node: Node): PreviewKind | null {
  if (node.kind !== "file") {
    return null;
  }
  const mime = typePrincipal(node.mime);
  if (IMAGE_MIMES.includes(mime)) {
    return "image";
  }
  if (DOCUMENT_MIMES.includes(mime)) {
    return "document";
  }
  if (VIDEO_MIMES.includes(mime)) {
    return "video";
  }
  return null;
}

/** Une image ou une vidéo : ce qui se parcourt d'un média à l'autre. */
export function isGalleryMedia(node: Node): boolean {
  const kind = previewKind(node);
  return kind === "image" || kind === "video";
}

export function isPreviewable(node: Node): boolean {
  return previewKind(node) !== null;
}
