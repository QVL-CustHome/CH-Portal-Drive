import Box from "@mui/material/Box";
import { Card, CardGrid, EmptyState, Icon, Stack } from "canopui";
import type { Node } from "../api/drive";
import DriveFileCard from "./DriveFileCard";
import InlineNameInput from "./InlineNameInput";
import type { ContextMenuItem } from "./ContextMenu";

interface FilesGridProps {
  items: Node[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onOpenFolder: (id: string) => void;
  buildMenu: (node: Node) => ContextMenuItem[];
  metadataFor: (node: Node) => string | undefined;
  enableOpen: boolean;
  emptyMessage: string;
  menuLabel: string;
  adding?: boolean;
  draftName?: string;
  draftPlaceholder?: string;
  onDraftChange?: (value: string) => void;
  onCommitDraft?: () => void;
  onCancelDraft?: () => void;
}

export default function FilesGrid({
  items,
  selectedIds,
  onSelectionChange,
  onOpenFolder,
  buildMenu,
  metadataFor,
  enableOpen,
  emptyMessage,
  menuLabel,
  adding = false,
  draftName = "",
  draftPlaceholder,
  onDraftChange,
  onCommitDraft,
  onCancelDraft,
}: FilesGridProps) {
  const selectedSet = new Set(selectedIds);

  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange([...next]);
  };

  if (items.length === 0 && !adding) {
    return (
      <EmptyState
        surface="plain"
        title={emptyMessage}
        icon={<Icon name="folder" size="xl" color="secondary" />}
      />
    );
  }

  return (
    <CardGrid minItemWidth="12rem" gap="md">
      {adding && (
        <Card variant="surface" density="comfortable">
          <Stack gap="sm" alignItems="center">
            <Icon name="folder" size="xl" color="secondary" />
            <InlineNameInput
              value={draftName}
              placeholder={draftPlaceholder}
              onChange={(value) => onDraftChange?.(value)}
              onCommit={() => onCommitDraft?.()}
              onCancel={() => onCancelDraft?.()}
            />
          </Stack>
        </Card>
      )}
      {items.map((node) => (
        <Box key={node.id} data-rowkey={node.id} minWidth={0}>
          <DriveFileCard
            node={node}
            selected={selectedSet.has(node.id)}
            onToggleSelect={() => toggle(node.id)}
            onOpen={enableOpen && node.kind === "folder" ? () => onOpenFolder(node.id) : undefined}
            metadata={metadataFor(node)}
            menuItems={buildMenu(node)}
            menuLabel={menuLabel}
          />
        </Box>
      ))}
    </CardGrid>
  );
}
