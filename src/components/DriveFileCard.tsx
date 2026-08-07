import { FileCard, Icon, MenuItem, type ChFileCardKind } from "canopui";
import { thumbnailUrl, type Node } from "../api/drive";
import type { ContextMenuItem } from "./ContextMenu";

interface DriveFileCardProps {
  node: Node;
  selected: boolean;
  onToggleSelect: () => void;
  onOpen?: () => void;
  metadata?: string;
  menuItems: ContextMenuItem[];
  menuLabel: string;
}

function kindFor(node: Node): ChFileCardKind {
  if (node.kind === "folder") return "folder";
  if (node.is_media && node.media_type === "image") return "image";
  return "file";
}

export default function DriveFileCard({
  node,
  selected,
  onToggleSelect,
  onOpen,
  metadata,
  menuItems,
  menuLabel,
}: DriveFileCardProps) {
  const kind = kindFor(node);
  // Dès qu'une miniature existe on montre le contenu plutôt que l'icône de
  // type, quel que soit le format : l'API en produit pour les images comme
  // pour les PDF.
  const previewUrl = node.has_thumbnail ? thumbnailUrl(node.id) : undefined;

  return (
    <FileCard
      name={node.name}
      kind={kind}
      previewUrl={previewUrl}
      metadata={metadata}
      selectable
      selected={selected}
      onSelectedChange={onToggleSelect}
      onOpen={onOpen}
      menuLabel={menuLabel}
      menu={menuItems.map((item) => (
        <MenuItem
          key={item.label}
          label={item.label}
          danger={item.danger}
          icon={<Icon name={item.icon} size="sm" />}
          onClick={item.onClick}
        />
      ))}
    />
  );
}
