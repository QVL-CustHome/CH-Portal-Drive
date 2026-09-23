import { useCallback, useMemo, useState } from "react";
import type { CanopLightboxItem } from "canopui";
import { contentUrlFor, getPreviewInfo, previewPageUrl, type Node } from "../api/drive";
import { isGalleryMedia, previewKind } from "../lib/preview";

interface Params {
  items: Node[];
  /** La corbeille ne prévisualise rien : on y range, on n'y consulte pas. */
  enabled: boolean;
  t: (key: string, params?: Record<string, string>) => string;
  onUnavailable: (message: string) => void;
}

export interface FilePreview {
  items: CanopLightboxItem[];
  index: number | null;
  open: (node: Node) => Promise<void>;
  setIndex: (index: number) => void;
  close: () => void;
}

/**
 * Visionneuse de fichiers.
 *
 * Deux façons d'ouvrir, selon la nature du fichier :
 *
 *  - **image ou vidéo** : on parcourt les médias du dossier, pour passer de
 *    l'un à l'autre sans refermer la visionneuse ;
 *  - **PDF** : on parcourt ses pages, rendues en images par le serveur. Les
 *    afficher dans une `iframe` laisserait le lecteur du navigateur imposer sa
 *    barre d'outils et sa page minuscule sur desktop, et ne montrerait rien du
 *    tout sur mobile — seulement une proposition de téléchargement.
 */
export function useFilePreview({ items, enabled, t, onUnavailable }: Params): FilePreview {
  const [index, setIndex] = useState<number | null>(null);
  const [lightboxItems, setLightboxItems] = useState<CanopLightboxItem[]>([]);

  const medias = useMemo(() => (enabled ? items.filter(isGalleryMedia) : []), [items, enabled]);

  const open = useCallback(
    async (node: Node) => {
      if (previewKind(node) === "document") {
        const pages = await getPreviewInfo(node.id)
          .then((info) => info.pages)
          .catch(() => 0);
        if (pages < 1) {
          onUnavailable(t("drive.files.preview.unavailable"));
          return;
        }
        setLightboxItems(
          Array.from({ length: pages }, (_, i) => ({
            src: previewPageUrl(node.id, i + 1),
            kind: "image" as const,
            alt: t("drive.files.preview.pageAlt", {
              name: node.name,
              page: String(i + 1),
            }),
            title: pages > 1 ? `${node.name} — ${i + 1}/${pages}` : node.name,
          })),
        );
        setIndex(0);
        return;
      }

      const position = medias.findIndex((media) => media.id === node.id);
      if (position < 0) return;
      setLightboxItems(
        medias.map((media) => ({
          src: contentUrlFor(media.id),
          kind: previewKind(media) === "video" ? ("video" as const) : ("image" as const),
          alt: media.name,
          title: media.name,
        })),
      );
      setIndex(position);
    },
    [medias, onUnavailable, t],
  );

  const close = useCallback(() => setIndex(null), []);

  return { items: lightboxItems, index, open, setIndex, close };
}
