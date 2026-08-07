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

export type PreviewKind = "image" | "document";

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
  return null;
}

export function isPreviewable(node: Node): boolean {
  return previewKind(node) !== null;
}
