import { DescriptionList, SidePanel, useTranslation } from "canopui";
import type { Node } from "../api/drive";
import { formatBytes, formatDate } from "../lib/format";

export interface PropertiesPanelProps {
  node: Node | null;
  onClose: () => void;
}

/** Fiche descriptive d'un élément. */
export default function PropertiesPanel({ node, onClose }: PropertiesPanelProps) {
  const { t, locale } = useTranslation();

  const items = node
    ? [
        { label: t("drive.props.name"), value: node.name },
        {
          label: t("drive.props.kind"),
          value:
            node.kind === "folder" ? t("drive.props.folder") : (node.mime ?? t("drive.props.file")),
        },
        ...(node.kind === "file"
          ? [
              {
                label: t("drive.props.size"),
                value: formatBytes(node.size_bytes),
              },
            ]
          : []),
        ...(node.width && node.height
          ? [
              {
                label: t("drive.props.dimensions"),
                value: t("drive.props.dimensions.value", {
                  width: String(node.width),
                  height: String(node.height),
                }),
              },
            ]
          : []),
        {
          label: t("drive.props.created"),
          value: formatDate(node.created_at, locale),
        },
        {
          label: t("drive.props.modified"),
          value: formatDate(node.updated_at, locale),
        },
      ]
    : [];

  return (
    <SidePanel open={node !== null} onClose={onClose} title={t("drive.props.title")}>
      <DescriptionList items={items} />
    </SidePanel>
  );
}
