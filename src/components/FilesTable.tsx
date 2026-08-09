import {
  DataTable,
  DeleteButton,
  EditButton,
  Icon,
  IconActionButton,
  Stack,
  useTranslation,
  type ChColumn,
} from "canopui";
import type { MouseEvent } from "react";
import InlineNameInput from "./InlineNameInput";
import NameCell from "./NameCell";
import RowActions from "./RowActions";
import type { Node } from "../api/drive";
import { DRAFT_ID } from "../lib/draft";
import { formatBytes, formatDate } from "../lib/format";
import { isPreviewable } from "../lib/preview";

export interface FilesTableProps {
  rows: Node[];
  loading: boolean;
  busy: boolean;
  emptyMessage: string;
  isTrash: boolean;
  isBrowse: boolean;
  isMobile: boolean;
  selected: string[];
  onSelectionChange: (ids: string[]) => void;
  draftName: string;
  onDraftChange: (value: string) => void;
  onCommitDraft: () => void;
  onCancelDraft: () => void;
  onOpenFolder: (id: string) => void;
  onPreview: (node: Node) => void;
  onDownload: (node: Node) => void;
  onRename: (node: Node) => void;
  onTrash: (id: string) => void;
  onRestore: (id: string) => void;
  onPurge: (id: string) => void;
  onContextMenu: (node: Node, position: { x: number; y: number }) => void;
  onDropOn: (targetParentId: string, draggedKey: string) => void;
}

function iconFor(node: Node): string {
  if (node.kind === "folder") return "folder";
  return node.is_media && node.media_type === "image" ? "image" : "file";
}

/** Vue liste : le tableau, ses colonnes et les actions de chaque ligne. */
export default function FilesTable({
  rows,
  loading,
  busy,
  emptyMessage,
  isTrash,
  isBrowse,
  isMobile,
  selected,
  onSelectionChange,
  draftName,
  onDraftChange,
  onCommitDraft,
  onCancelDraft,
  onOpenFolder,
  onPreview,
  onDownload,
  onRename,
  onTrash,
  onRestore,
  onPurge,
  onContextMenu,
  onDropOn,
}: FilesTableProps) {
  const { t, locale } = useTranslation();

  const columns: ChColumn<Node>[] = [
    {
      key: "name",
      header: t("drive.files.col.name"),
      sortable: true,
      sortValue: (n) => `${n.kind === "folder" ? 0 : 1}${n.name.toLowerCase()}`,
      render: (n) => {
        if (n.id === DRAFT_ID) {
          return (
            <Stack direction="row" alignItems="center" gap="xs">
              <Icon name="folder" size="md" color="secondary" />
              <InlineNameInput
                value={draftName}
                placeholder={t("drive.files.newFolder.placeholder")}
                onChange={onDraftChange}
                onCommit={onCommitDraft}
                onCancel={onCancelDraft}
              />
            </Stack>
          );
        }
        return <NameCell icon={iconFor(n)} name={n.name} />;
      },
    },
    {
      key: "size_bytes",
      header: t("drive.files.col.size"),
      width: "16%",
      align: "right",
      hideOnMobile: true,
      sortable: true,
      sortValue: (n) => n.size_bytes,
      render: (n) =>
        n.id === DRAFT_ID ? "" : n.kind === "folder" ? "—" : formatBytes(n.size_bytes),
    },
    {
      key: "updated_at",
      header: t("drive.files.col.modified"),
      width: "22%",
      hideOnMobile: true,
      sortable: true,
      sortValue: (n) => n.updated_at,
      render: (n) => (n.id === DRAFT_ID ? "" : formatDate(n.updated_at, locale)),
    },
  ];

  const openMenu = (node: Node, event: MouseEvent) => {
    onContextMenu(node, { x: event.clientX, y: event.clientY });
  };

  const renderActions = (n: Node) => {
    if (n.id === DRAFT_ID) return <RowActions />;

    // Sur mobile, la largeur ne permet pas d'aligner plusieurs boutons : tout
    // passe par le menu.
    if (isMobile) {
      return (
        <RowActions>
          <IconActionButton
            icon="more"
            variant="secondary"
            aria-label={t("drive.files.action.more")}
            onClick={(e) => {
              e.stopPropagation();
              openMenu(n, e);
            }}
            disabled={busy}
          />
        </RowActions>
      );
    }

    if (isTrash) {
      return (
        <RowActions>
          <IconActionButton
            icon="check"
            aria-label={t("drive.files.action.restore")}
            onClick={() => onRestore(n.id)}
            disabled={busy}
          />
          <DeleteButton
            aria-label={t("drive.files.action.purge")}
            confirmTitle={`${t("drive.files.action.purge")} ?`}
            confirmMessage={t("drive.files.purge.message", { name: n.name })}
            confirmLabel={t("drive.files.action.purge")}
            cancelLabel={t("drive.cancel")}
            disabled={busy}
            onConfirm={() => onPurge(n.id)}
          />
        </RowActions>
      );
    }

    return (
      <RowActions>
        {n.kind === "file" && (
          <IconActionButton
            icon="download"
            variant="secondary"
            aria-label={t("drive.files.action.download")}
            onClick={() => onDownload(n)}
          />
        )}
        {isBrowse && (
          <EditButton
            aria-label={t("drive.files.action.rename")}
            onClick={() => onRename(n)}
            disabled={busy}
          />
        )}
        <IconActionButton
          icon="trash"
          variant="danger"
          aria-label={t("drive.files.action.trash")}
          onClick={() => onTrash(n.id)}
          disabled={busy}
        />
      </RowActions>
    );
  };

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowKey={(n) => n.id}
      loading={loading}
      emptyMessage={emptyMessage}
      fixedLayout
      stickyHeader
      animateRows
      enableKeyboardNav
      actionsWidth="16%"
      selectable
      selectedKeys={selected}
      onSelectionChange={onSelectionChange}
      onRowContextMenu={(n, e) => {
        if (n.id === DRAFT_ID) return;
        openMenu(n, e);
      }}
      draggableRow={isBrowse ? (n) => n.id !== DRAFT_ID : undefined}
      canDropRow={isBrowse ? (n) => n.kind === "folder" && n.id !== DRAFT_ID : undefined}
      onRowDrop={isBrowse ? (target, draggedKey) => onDropOn(target.id, draggedKey) : undefined}
      onRowDoubleClick={
        !isTrash
          ? (n) => {
              if (n.id === DRAFT_ID) return;
              if (n.kind === "folder") {
                onOpenFolder(n.id);
              } else if (isPreviewable(n)) {
                onPreview(n);
              }
            }
          : undefined
      }
      actions={renderActions}
    />
  );
}
