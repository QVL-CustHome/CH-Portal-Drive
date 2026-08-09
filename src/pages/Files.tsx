import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  Breadcrumb,
  ConfirmDialog,
  Dropzone,
  Feedback,
  Icon,
  Lightbox,
  Menu,
  MenuItem,
  PageContent,
  SelectionBar,
  Stack,
  Toast,
  Toolbar,
  useTranslation,
  type ChBreadcrumbItem,
  type ChSelectionAction,
  type ChToolbarAction,
  type ChToolbarSearchConfig,
  type ChToolbarViewConfig,
} from "canopui";
import ContextMenu from "../components/ContextMenu";
import FilesGrid from "../components/FilesGrid";
import FilesTable from "../components/FilesTable";
import MovePanel from "../components/MovePanel";
import PropertiesPanel from "../components/PropertiesPanel";
import RenamePanel from "../components/RenamePanel";
import { downloadUrl, type Node } from "../api/drive";
import { useFiles } from "../hooks/useFiles";
import { useUploadContext } from "../context/upload";
import { useBulkActions } from "../hooks/useBulkActions";
import { useFilePreview } from "../hooks/useFilePreview";
import { useIsMobile } from "../hooks/useIsMobile";
import { useNodeImport } from "../hooks/useNodeImport";
import { usePersistentViewMode } from "../hooks/usePersistentViewMode";
import { useTableSelection } from "../hooks/useTableSelection";
import { useFolderDraft } from "../hooks/useFolderDraft";
import { useDebouncedSearch } from "../hooks/useDebouncedSearch";
import { DRAFT_ID } from "../lib/draft";
import { formatBytes } from "../lib/format";
import { buildNodeMenu } from "../lib/nodeMenu";

export default function Files({ trash = false }: { trash?: boolean }) {
  const { t } = useTranslation();
  const files = useFiles(trash ? "trash" : "files");
  const [renaming, setRenaming] = useState<Node | null>(null);
  const [renameName, setRenameName] = useState("");
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [menu, setMenu] = useState<{ node: Node; x: number; y: number } | null>(null);
  const [propsNode, setPropsNode] = useState<Node | null>(null);
  const [viewMode, setViewMode] = usePersistentViewMode();

  const isTrash = trash;
  const isSearch = files.view === "search";
  const isBrowse = !isTrash && files.view === "files";
  const isMobile = useIsMobile();

  const { selected, setSelected, selectedIds, clearSelection } = useTableSelection({
    resetKey: `${files.parentId}|${files.view}|${isTrash}`,
    excludeId: DRAFT_ID,
  });
  const selectedNodes = files.items.filter((n) => selectedIds.includes(n.id));

  const { adding, draftName, setDraftName, startAdd, commitDraft, cancelDraft } = useFolderDraft({
    onCreate: files.newFolder,
  });

  const { searchInput, setSearchInput } = useDebouncedSearch({
    enabled: !isTrash,
    onSearch: files.runSearch,
  });

  // La file vit au niveau du layout : elle survit ainsi au changement de page.
  const uploads = useUploadContext();
  const nodeImport = useNodeImport({
    enqueue: uploads.enqueue,
    parentId: files.parentId,
  });

  const preview = useFilePreview({
    items: files.items,
    enabled: !isTrash,
    t,
    onUnavailable: (message) => files.setToast({ message, severity: "error" }),
  });

  const bulk = useBulkActions({
    files,
    selectedIds,
    selectedNodes,
    clearSelection,
  });

  // Un lot terminé ailleurs dans l'app doit se refléter ici.
  const { lastBatchAt } = uploads;
  const reload = files.reload;
  useEffect(() => {
    if (lastBatchAt > 0) void reload();
  }, [lastBatchAt, reload]);

  const openRename = (node: Node) => {
    setRenameName(node.name);
    setRenaming(node);
  };

  const submitRename = async () => {
    const name = renameName.trim();
    if (!name || !renaming) return;
    if (await files.rename(renaming.id, name)) setRenaming(null);
  };

  const download = (node: Node) => {
    const a = document.createElement("a");
    a.href = downloadUrl(node.id);
    a.download = node.name;
    a.click();
  };

  const handleDropOn = (targetParentId: string, draggedKey: string) => {
    const dragged = files.items.find((n) => n.id === draggedKey);
    if (dragged && dragged.parent_id !== targetParentId) {
      void files.move(draggedKey, targetParentId);
    }
  };

  const menuItems = (node: Node) =>
    buildNodeMenu(node, {
      isTrash,
      t,
      openFolder: files.openFolder,
      preview: (n) => void preview.open(n),
      download,
      rename: openRename,
      move: bulk.openMove,
      showProperties: setPropsNode,
      trash: (id) => void files.trash(id),
      restore: (id) => void files.restore(id),
      purge: (n) => {
        setSelected([n.id]);
        bulk.setConfirmPurge(true);
      },
    });

  const viewTitle = isTrash
    ? t("drive.files.trash.title")
    : isSearch
      ? t("drive.files.search.resultsFor", { query: files.query })
      : "";

  const emptyMessage = isTrash
    ? t("drive.files.trash.empty")
    : isSearch
      ? t("drive.files.search.empty")
      : t("drive.files.empty");

  const draftNode: Node = {
    id: DRAFT_ID,
    parent_id: files.parentId,
    kind: "folder",
    name: "",
    mime: null,
    size_bytes: 0,
    is_media: false,
    media_type: null,
    width: null,
    height: null,
    duration_ms: null,
    has_thumbnail: false,
    taken_at: null,
    trashed: false,
    created_at: "",
    updated_at: "",
  };
  const rows = adding && isBrowse ? [draftNode, ...files.items] : files.items;

  const search: ChToolbarSearchConfig | undefined = !isTrash
    ? {
        value: searchInput,
        onChange: setSearchInput,
        // Le libellé complet est tronqué dans le champ étroit du mobile.
        placeholder: t(
          isMobile ? "drive.files.search.placeholderShort" : "drive.files.search.placeholder",
        ),
      }
    : undefined;

  const view: ChToolbarViewConfig = { value: viewMode, onChange: setViewMode };

  const toolbarActions: ChToolbarAction[] = isBrowse
    ? [
        {
          id: "add",
          label: t("drive.files.action.add"),
          icon: "plus",
          onClick: startAdd,
          disabled: files.busy || adding,
          pinned: true,
        },
        {
          id: "import",
          label: t("drive.files.action.upload"),
          icon: "upload",
          variant: "primary",
          onClick: nodeImport.openMenu,
          disabled: files.busy,
          pinned: true,
        },
      ]
    : isTrash
      ? [
          {
            id: "empty",
            label: t("drive.files.action.emptyTrash"),
            icon: "trash",
            danger: true,
            onClick: () => setConfirmEmpty(true),
            disabled: files.busy || files.items.length === 0,
            pinned: true,
          },
        ]
      : [
          {
            id: "back",
            label: t("drive.files.action.backToFiles"),
            icon: "close",
            variant: "secondary",
            onClick: () => setSearchInput(""),
            pinned: true,
          },
        ];

  // Tous les éléments listés, hors brouillon de dossier en cours de saisie.
  const selectableIds = files.items.map((n) => n.id).filter((id) => id !== DRAFT_ID);
  const allSelected = selectableIds.length > 0 && selectedIds.length === selectableIds.length;

  const selectAllAction: ChSelectionAction = {
    id: "select-all",
    label: allSelected ? t("drive.files.action.selectNone") : t("drive.files.action.selectAll"),
    icon: "check",
    onClick: () => setSelected(allSelected ? [] : selectableIds),
    disabled: selectableIds.length === 0,
  };

  const selectionActions: ChSelectionAction[] = isTrash
    ? [
        selectAllAction,
        {
          id: "restore",
          label: t("drive.files.action.restore"),
          icon: "check",
          onClick: () => void bulk.restoreSelection(),
          disabled: files.busy,
        },
        {
          id: "purge",
          label: t("drive.files.action.purge"),
          icon: "trash",
          danger: true,
          onClick: () => bulk.setConfirmPurge(true),
          disabled: files.busy,
        },
      ]
    : [
        selectAllAction,
        {
          id: "move",
          label: t("drive.files.action.move"),
          icon: "folder",
          onClick: bulk.moveSelection,
          disabled: files.busy || selectedNodes.length === 0,
        },
        {
          id: "trash",
          label: t("drive.files.action.trash"),
          icon: "trash",
          danger: true,
          onClick: () => void bulk.trashSelection(),
          disabled: files.busy,
        },
      ];

  const breadcrumbItems: ChBreadcrumbItem[] = files.ancestors.map((crumb, index) => ({
    id: crumb.id,
    label: index === 0 ? t("drive.files.root") : crumb.name,
    icon: index === 0 ? "home" : undefined,
    onClick: () => files.openFolder(crumb.id),
  }));

  const content =
    viewMode === "list" ? (
      <FilesTable
        rows={rows}
        loading={files.loading}
        busy={files.busy}
        emptyMessage={emptyMessage}
        isTrash={isTrash}
        isBrowse={isBrowse}
        isMobile={isMobile}
        selected={selected}
        onSelectionChange={setSelected}
        draftName={draftName}
        onDraftChange={setDraftName}
        onCommitDraft={() => void commitDraft()}
        onCancelDraft={cancelDraft}
        onOpenFolder={files.openFolder}
        onPreview={(n) => void preview.open(n)}
        onDownload={download}
        onRename={openRename}
        onTrash={(id) => void files.trash(id)}
        onRestore={(id) => void files.restore(id)}
        onPurge={(id) => void files.purge(id)}
        onContextMenu={(node, position) => setMenu({ node, ...position })}
        onDropOn={handleDropOn}
      />
    ) : (
      <FilesGrid
        items={files.items}
        selectedIds={selectedIds}
        onSelectionChange={setSelected}
        onOpenFolder={files.openFolder}
        onOpenFile={(node) => void preview.open(node)}
        buildMenu={menuItems}
        metadataFor={(node) => (node.kind === "file" ? formatBytes(node.size_bytes) : undefined)}
        enableOpen={!isTrash}
        emptyMessage={emptyMessage}
        menuLabel={t("drive.files.action.more")}
        adding={adding && isBrowse}
        draftName={draftName}
        draftPlaceholder={t("drive.files.newFolder.placeholder")}
        onDraftChange={setDraftName}
        onCommitDraft={() => void commitDraft()}
        onCancelDraft={cancelDraft}
      />
    );

  return (
    <PageContent>
      <Stack gap="lg">
        {files.loadError && <Feedback severity="error">{files.loadError}</Feedback>}

        <Toolbar search={search} view={view} actions={toolbarActions} />

        {isBrowse ? (
          breadcrumbItems.length > 0 && <Breadcrumb items={breadcrumbItems} />
        ) : (
          <Typography variant="subtitle1" fontWeight={600} color="text.primary">
            {viewTitle}
          </Typography>
        )}

        {selectedIds.length > 0 && (
          <Box data-selection-bar>
            <SelectionBar
              count={selectedIds.length}
              actions={selectionActions}
              onClear={clearSelection}
              countLabel={(count) => t("drive.files.selection.count", { count: String(count) })}
            />
          </Box>
        )}

        <input
          ref={nodeImport.fileInput}
          type="file"
          multiple
          hidden
          onChange={(e) => nodeImport.acceptFiles(e.target.files)}
        />
        <input
          ref={nodeImport.dirInput}
          type="file"
          multiple
          hidden
          onChange={(e) => nodeImport.acceptFolder(e.target.files)}
        />

        {isBrowse ? (
          <Dropzone
            onFiles={(list) => uploads.enqueue(list, files.parentId)}
            title={t("drive.files.import.dropHere")}
          >
            {content}
          </Dropzone>
        ) : (
          content
        )}
      </Stack>

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menuItems(menu.node)}
          onClose={() => setMenu(null)}
        />
      )}

      <Menu
        open={nodeImport.anchor !== null}
        anchorEl={nodeImport.anchor}
        onClose={nodeImport.closeMenu}
        label={t("drive.files.action.upload")}
      >
        <MenuItem
          label={t("drive.files.import.files")}
          icon={<Icon name="upload" variant="outline" size="sm" color="inherit" />}
          onClick={nodeImport.pickFiles}
        />
        <MenuItem
          label={t("drive.files.import.folder")}
          icon={<Icon name="folder" variant="outline" size="sm" color="inherit" />}
          onClick={nodeImport.pickFolder}
        />
      </Menu>

      <RenamePanel
        open={renaming !== null}
        value={renameName}
        busy={files.busy}
        onChange={setRenameName}
        onSubmit={() => void submitRename()}
        onClose={() => setRenaming(null)}
      />

      <PropertiesPanel node={propsNode} onClose={() => setPropsNode(null)} />

      <MovePanel
        open={bulk.moving !== null}
        moving={bulk.moving ?? []}
        busy={files.busy}
        onClose={bulk.closeMove}
        onConfirm={(target) => void bulk.confirmMove(target)}
      />

      <ConfirmDialog
        open={confirmEmpty}
        title={t("drive.files.emptyTrash.title")}
        message={t("drive.files.emptyTrash.message")}
        confirmLabel={t("drive.files.action.emptyTrash")}
        cancelLabel={t("drive.cancel")}
        destructive
        loading={files.busy}
        onConfirm={async () => {
          await files.purgeAll();
          setConfirmEmpty(false);
        }}
        onCancel={() => setConfirmEmpty(false)}
      />

      <ConfirmDialog
        open={bulk.confirmPurge}
        title={t("drive.files.purgeMany.title")}
        message={t("drive.files.purgeMany.message", {
          count: String(selectedIds.length),
        })}
        confirmLabel={t("drive.files.action.purge")}
        cancelLabel={t("drive.cancel")}
        destructive
        loading={files.busy}
        onConfirm={() => void bulk.purgeSelection()}
        onCancel={() => bulk.setConfirmPurge(false)}
      />

      <Toast
        open={files.toast !== null}
        message={files.toast?.message ?? ""}
        severity={files.toast?.severity}
        onClose={() => files.setToast(null)}
      />

      <Lightbox
        open={preview.index !== null}
        onClose={preview.close}
        items={preview.items}
        index={preview.index ?? 0}
        onIndexChange={preview.setIndex}
      />
    </PageContent>
  );
}
