import type { ContextMenuItem } from "../components/ContextMenu";
import type { Node } from "../api/drive";
import { isPreviewable } from "./preview";

interface Params {
  isTrash: boolean;
  t: (key: string) => string;
  openFolder: (id: string) => void;
  preview: (node: Node) => void;
  download: (node: Node) => void;
  rename: (node: Node) => void;
  move: (node: Node) => void;
  showProperties: (node: Node) => void;
  trash: (id: string) => void;
  restore: (id: string) => void;
  purge: (node: Node) => void;
}

/** Entrées du menu contextuel d'un élément, selon sa nature et la vue. */
export function buildNodeMenu(node: Node, p: Params): ContextMenuItem[] {
  if (p.isTrash) {
    return [
      {
        icon: "check",
        label: p.t("drive.files.action.restore"),
        onClick: () => p.restore(node.id),
      },
      {
        icon: "trash",
        label: p.t("drive.files.action.purge"),
        danger: true,
        onClick: () => p.purge(node),
      },
      {
        icon: "eye",
        label: p.t("drive.files.action.properties"),
        onClick: () => p.showProperties(node),
      },
    ];
  }

  const items: ContextMenuItem[] = [];

  if (node.kind === "folder") {
    items.push({
      icon: "folder",
      label: p.t("drive.files.action.open"),
      onClick: () => p.openFolder(node.id),
    });
  }

  if (node.kind === "file") {
    // Sur mobile le double-clic n'existe pas : l'aperçu doit rester atteignable ici.
    if (isPreviewable(node)) {
      items.push({
        icon: "image",
        label: p.t("drive.files.action.preview"),
        onClick: () => p.preview(node),
      });
    }
    items.push({
      icon: "download",
      label: p.t("drive.files.action.download"),
      onClick: () => p.download(node),
    });
  }

  items.push(
    {
      icon: "pencil",
      label: p.t("drive.files.action.rename"),
      onClick: () => p.rename(node),
    },
    {
      icon: "folder",
      label: p.t("drive.files.action.move"),
      onClick: () => p.move(node),
    },
    {
      icon: "eye",
      label: p.t("drive.files.action.properties"),
      onClick: () => p.showProperties(node),
    },
    {
      icon: "trash",
      label: p.t("drive.files.action.trash"),
      danger: true,
      onClick: () => p.trash(node.id),
    },
  );

  return items;
}
