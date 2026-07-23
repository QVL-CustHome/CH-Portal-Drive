import { useEffect, useRef, useState, type MouseEvent } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  Breadcrumb,
  Button,
  ConfirmDialog,
  DataTable,
  DeleteButton,
  DescriptionList,
  Dropzone,
  EditButton,
  Feedback,
  Icon,
  IconActionButton,
  Input,
  Menu,
  MenuItem,
  PageContent,
  SelectionBar,
  SidePanel,
  Stack,
  Toast,
  Toolbar,
  useTranslation,
  type ChBreadcrumbItem,
  type ChColumn,
  type ChSelectionAction,
  type ChToolbarAction,
  type ChToolbarSearchConfig,
  type ChToolbarViewConfig,
} from "canopui";
import ContextMenu, { type ContextMenuItem } from "../components/ContextMenu";
import FilesGrid from "../components/FilesGrid";
import InlineNameInput from "../components/InlineNameInput";
import MovePanel from "../components/MovePanel";
import NameCell from "../components/NameCell";
import PanelFooter from "../components/PanelFooter";
import RowActions from "../components/RowActions";
import { downloadUrl, type Node } from "../api/drive";
import { useFiles } from "../hooks/useFiles";
import { useIsMobile } from "../hooks/useIsMobile";
import { usePersistentViewMode } from "../hooks/usePersistentViewMode";
import { useTableSelection } from "../hooks/useTableSelection";
import { useFolderDraft } from "../hooks/useFolderDraft";
import { useDebouncedSearch } from "../hooks/useDebouncedSearch";
import { formatBytes, formatDate } from "../lib/format";

const DRAFT_ID = "__draft__";

export default function Files({ trash = false }: { trash?: boolean }) {
  const { t, locale } = useTranslation();
  const files = useFiles(trash ? "trash" : "files");
  const fileInput = useRef<HTMLInputElement>(null);
  const dirInput = useRef<HTMLInputElement>(null);
  const [renaming, setRenaming] = useState<Node | null>(null);
  const [renameName, setRenameName] = useState("");
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [menu, setMenu] = useState<{ node: Node; x: number; y: number } | null>(null);
  const [propsNode, setPropsNode] = useState<Node | null>(null);
  const [movingNodes, setMovingNodes] = useState<Node[] | null>(null);
  const [confirmPurgeMany, setConfirmPurgeMany] = useState(false);
  const [importAnchor, setImportAnchor] = useState<HTMLElement | null>(null);
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

  useEffect(() => {
    if (dirInput.current) {
      dirInput.current.setAttribute("webkitdirectory", "");
      dirInput.current.setAttribute("directory", "");
    }
  }, []);

  const openRename = (node: Node) => {
    setRenameName(node.name);
    setRenaming(node);
  };

  const submitRename = async () => {
    const name = renameName.trim();
    if (!name || !renaming) return;
    const ok = await files.rename(renaming.id, name);
    if (ok) setRenaming(null);
  };

  const handleUpload = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    await files.upload(list);
    if (fileInput.current) fileInput.current.value = "";
  };

  const handleDirImport = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    await files.importFolder(list);
    if (dirInput.current) dirInput.current.value = "";
  };

  const openImportMenu = (event?: MouseEvent<HTMLElement>) => {
    setImportAnchor(event?.currentTarget ?? null);
  };

  const closeImportMenu = () => setImportAnchor(null);

  const pickFiles = () => {
    closeImportMenu();
    fileInput.current?.click();
  };

  const pickFolder = () => {
    closeImportMenu();
    dirInput.current?.click();
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

  const bulkTrash = async () => {
    const ok = await files.trashMany(selectedIds);
    if (ok) clearSelection();
  };

  const bulkRestore = async () => {
    const ok = await files.restoreMany(selectedIds);
    if (ok) clearSelection();
  };

  const bulkPurge = async () => {
    const ok = await files.purgeMany(selectedIds);
    if (ok) clearSelection();
    setConfirmPurgeMany(false);
  };

  const confirmMove = async (target: string) => {
    const ids = (movingNodes ?? []).map((n) => n.id);
    const ok = await files.moveMany(ids, target);
    if (ok) {
      setMovingNodes(null);
      clearSelection();
    }
  };

  const openMove = (node: Node) => {
    const inSelection = selectedIds.includes(node.id) && selectedNodes.length > 0;
    setMovingNodes(inSelection ? selectedNodes : [node]);
  };

  const menuItems = (node: Node): ContextMenuItem[] => {
    if (isTrash) {
      return [
        {
          icon: "check",
          label: t("drive.files.action.restore"),
          onClick: () => void files.restore(node.id),
        },
        {
          icon: "trash",
          label: t("drive.files.action.purge"),
          danger: true,
          onClick: () => {
            setSelected([node.id]);
            setConfirmPurgeMany(true);
          },
        },
        {
          icon: "eye",
          label: t("drive.files.action.properties"),
          onClick: () => setPropsNode(node),
        },
      ];
    }
    const items: ContextMenuItem[] = [];
    if (node.kind === "folder") {
      items.push({
        icon: "folder",
        label: t("drive.files.action.open"),
        onClick: () => files.openFolder(node.id),
      });
    }
    if (node.kind === "file") {
      items.push({
        icon: "download",
        label: t("drive.files.action.download"),
        onClick: () => download(node),
      });
    }
    items.push({
      icon: "pencil",
      label: t("drive.files.action.rename"),
      onClick: () => openRename(node),
    });
    items.push({
      icon: "folder",
      label: t("drive.files.action.move"),
      onClick: () => openMove(node),
    });
    items.push({
      icon: "eye",
      label: t("drive.files.action.properties"),
      onClick: () => setPropsNode(node),
    });
    items.push({
      icon: "trash",
      label: t("drive.files.action.trash"),
      danger: true,
      onClick: () => void files.trash(node.id),
    });
    return items;
  };

  const iconFor = (node: Node) => {
    if (node.kind === "folder") return "folder";
    return node.is_media && node.media_type === "image" ? "image" : "file";
  };

  const metadataFor = (node: Node) =>
    node.kind === "file" ? formatBytes(node.size_bytes) : undefined;

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

  const propItems = propsNode
    ? [
        { label: t("drive.props.name"), value: propsNode.name },
        {
          label: t("drive.props.kind"),
          value:
            propsNode.kind === "folder"
              ? t("drive.props.folder")
              : (propsNode.mime ?? t("drive.props.file")),
        },
        ...(propsNode.kind === "file"
          ? [{ label: t("drive.props.size"), value: formatBytes(propsNode.size_bytes) }]
          : []),
        ...(propsNode.width && propsNode.height
          ? [
              {
                label: t("drive.props.dimensions"),
                value: t("drive.props.dimensions.value", {
                  width: String(propsNode.width),
                  height: String(propsNode.height),
                }),
              },
            ]
          : []),
        { label: t("drive.props.created"), value: formatDate(propsNode.created_at, locale) },
        { label: t("drive.props.modified"), value: formatDate(propsNode.updated_at, locale) },
      ]
    : [];

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
                onChange={setDraftName}
                onCommit={() => void commitDraft()}
                onCancel={cancelDraft}
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

  const search: ChToolbarSearchConfig | undefined = !isTrash
    ? {
        value: searchInput,
        onChange: setSearchInput,
        placeholder: t("drive.files.search.placeholder"),
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
        },
        {
          id: "import",
          label: t("drive.files.action.upload"),
          icon: "upload",
          variant: "primary",
          onClick: openImportMenu,
          disabled: files.busy,
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
          },
        ]
      : [
          {
            id: "back",
            label: t("drive.files.action.backToFiles"),
            icon: "close",
            variant: "secondary",
            onClick: () => setSearchInput(""),
          },
        ];

  const selectionActions: ChSelectionAction[] = isTrash
    ? [
        {
          id: "restore",
          label: t("drive.files.action.restore"),
          icon: "check",
          onClick: () => void bulkRestore(),
          disabled: files.busy,
        },
        {
          id: "purge",
          label: t("drive.files.action.purge"),
          icon: "trash",
          danger: true,
          onClick: () => setConfirmPurgeMany(true),
          disabled: files.busy,
        },
      ]
    : [
        {
          id: "move",
          label: t("drive.files.action.move"),
          icon: "folder",
          onClick: () => setMovingNodes(selectedNodes),
          disabled: files.busy || selectedNodes.length === 0,
        },
        {
          id: "trash",
          label: t("drive.files.action.trash"),
          icon: "trash",
          danger: true,
          onClick: () => void bulkTrash(),
          disabled: files.busy,
        },
      ];

  const breadcrumbItems: ChBreadcrumbItem[] = files.ancestors.map((crumb, index) => ({
    id: crumb.id,
    label: index === 0 ? t("drive.files.root") : crumb.name,
    icon: index === 0 ? "home" : undefined,
    onClick: () => files.openFolder(crumb.id),
  }));

  const listView = (
    <DataTable
      columns={columns}
      rows={rows}
      getRowKey={(n) => n.id}
      loading={files.loading}
      emptyMessage={emptyMessage}
      fixedLayout
      stickyHeader
      animateRows
      enableKeyboardNav
      actionsWidth="16%"
      selectable
      selectedKeys={selected}
      onSelectionChange={setSelected}
      onRowContextMenu={(n, e) => {
        if (n.id === DRAFT_ID) return;
        setMenu({ node: n, x: e.clientX, y: e.clientY });
      }}
      draggableRow={isBrowse ? (n) => n.id !== DRAFT_ID : undefined}
      canDropRow={isBrowse ? (n) => n.kind === "folder" && n.id !== DRAFT_ID : undefined}
      onRowDrop={isBrowse ? (target, draggedKey) => handleDropOn(target.id, draggedKey) : undefined}
      onRowDoubleClick={
        !isTrash
          ? (n) => n.kind === "folder" && n.id !== DRAFT_ID && files.openFolder(n.id)
          : undefined
      }
      actions={(n) => {
        if (n.id === DRAFT_ID) return <RowActions />;
        if (isMobile) {
          return (
            <RowActions>
              <IconActionButton
                icon="more"
                variant="secondary"
                aria-label={t("drive.files.action.more")}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenu({ node: n, x: e.clientX, y: e.clientY });
                }}
                disabled={files.busy}
              />
            </RowActions>
          );
        }
        return (
          <RowActions>
            {isTrash ? (
              <>
                <IconActionButton
                  icon="check"
                  aria-label={t("drive.files.action.restore")}
                  onClick={() => void files.restore(n.id)}
                  disabled={files.busy}
                />
                <DeleteButton
                  aria-label={t("drive.files.action.purge")}
                  confirmTitle={`${t("drive.files.action.purge")} ?`}
                  confirmMessage={t("drive.files.purge.message", { name: n.name })}
                  confirmLabel={t("drive.files.action.purge")}
                  cancelLabel={t("drive.cancel")}
                  disabled={files.busy}
                  onConfirm={() => void files.purge(n.id)}
                />
              </>
            ) : (
              <>
                {n.kind === "file" && (
                  <IconActionButton
                    icon="download"
                    variant="secondary"
                    aria-label={t("drive.files.action.download")}
                    onClick={() => download(n)}
                  />
                )}
                {isBrowse && (
                  <EditButton
                    aria-label={t("drive.files.action.rename")}
                    onClick={() => openRename(n)}
                    disabled={files.busy}
                  />
                )}
                <IconActionButton
                  icon="trash"
                  variant="danger"
                  aria-label={t("drive.files.action.trash")}
                  onClick={() => void files.trash(n.id)}
                  disabled={files.busy}
                />
              </>
            )}
          </RowActions>
        );
      }}
    />
  );

  const gridView = (
    <FilesGrid
      items={files.items}
      selectedIds={selectedIds}
      onSelectionChange={setSelected}
      onOpenFolder={files.openFolder}
      buildMenu={menuItems}
      metadataFor={metadataFor}
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

  const content = viewMode === "list" ? listView : gridView;

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
              countLabel={(count) =>
                t("drive.files.selection.count", { count: String(count) })
              }
            />
          </Box>
        )}

        <input
          ref={fileInput}
          type="file"
          multiple
          hidden
          onChange={(e) => void handleUpload(e.target.files)}
        />
        <input
          ref={dirInput}
          type="file"
          multiple
          hidden
          onChange={(e) => void handleDirImport(e.target.files)}
        />

        {isBrowse ? (
          <Dropzone
            onFiles={(list) => void files.upload(list)}
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
        open={importAnchor !== null}
        anchorEl={importAnchor}
        onClose={closeImportMenu}
        label={t("drive.files.action.upload")}
      >
        <MenuItem
          label={t("drive.files.import.files")}
          icon={<Icon name="upload" variant="outline" size="sm" color="inherit" />}
          onClick={pickFiles}
        />
        <MenuItem
          label={t("drive.files.import.folder")}
          icon={<Icon name="folder" variant="outline" size="sm" color="inherit" />}
          onClick={pickFolder}
        />
      </Menu>

      <SidePanel
        open={renaming !== null}
        onClose={() => setRenaming(null)}
        title={t("drive.files.rename.title")}
        footer={
          <PanelFooter>
            <Button variant="secondary" onClick={() => setRenaming(null)} disabled={files.busy}>
              {t("drive.cancel")}
            </Button>
            <Button
              onClick={() => void submitRename()}
              loading={files.busy}
              disabled={!renameName.trim()}
            >
              {t("drive.save")}
            </Button>
          </PanelFooter>
        }
      >
        <Stack
          as="form"
          onSubmit={(e) => {
            e.preventDefault();
            void submitRename();
          }}
        >
          <Input
            label={t("drive.files.nameLabel")}
            value={renameName}
            onChange={setRenameName}
            required
            autoFocus
          />
        </Stack>
      </SidePanel>

      <SidePanel
        open={propsNode !== null}
        onClose={() => setPropsNode(null)}
        title={t("drive.props.title")}
      >
        <DescriptionList items={propItems} />
      </SidePanel>

      <MovePanel
        open={movingNodes !== null}
        moving={movingNodes ?? []}
        busy={files.busy}
        onClose={() => setMovingNodes(null)}
        onConfirm={(target) => void confirmMove(target)}
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
        open={confirmPurgeMany}
        title={t("drive.files.purgeMany.title")}
        message={t("drive.files.purgeMany.message", { count: String(selectedIds.length) })}
        confirmLabel={t("drive.files.action.purge")}
        cancelLabel={t("drive.cancel")}
        destructive
        loading={files.busy}
        onConfirm={() => void bulkPurge()}
        onCancel={() => setConfirmPurgeMany(false)}
      />

      <Toast
        open={files.toast !== null}
        message={files.toast?.message ?? ""}
        severity={files.toast?.severity}
        onClose={() => files.setToast(null)}
      />
    </PageContent>
  );
}
