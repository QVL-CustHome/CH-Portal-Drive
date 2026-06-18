import { useEffect, useRef, useState } from "react";
import {
  AddButton,
  Button,
  ConfirmDialog,
  DataTable,
  DeleteButton,
  DescriptionList,
  EditButton,
  Feedback,
  Icon,
  IconActionButton,
  Input,
  PageContent,
  SidePanel,
  Stack,
  Toast,
  useTranslation,
  type ChColumn,
} from "@custhome/ui";
import Breadcrumb from "../components/Breadcrumb";
import ImportMenu from "../components/ImportMenu";
import ContextMenu, { type ContextMenuItem } from "../components/ContextMenu";
import MovePanel from "../components/MovePanel";
import FilesGrid from "../components/FilesGrid";
import { downloadUrl, type Node } from "../api/drive";
import { useFiles } from "../hooks/useFiles";
import { formatBytes, formatDate } from "../lib/format";

const DRAFT_ID = "__draft__";

function isFileDrag(e: DragEvent): boolean {
  return Array.from(e.dataTransfer?.types ?? []).includes("Files");
}

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width:768px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width:768px)");
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return mobile;
}

export default function Files({ trash = false }: { trash?: boolean }) {
  const { t, locale } = useTranslation();
  const files = useFiles(trash ? "trash" : "files");
  const fileInput = useRef<HTMLInputElement>(null);
  const dirInput = useRef<HTMLInputElement>(null);
  const committingRef = useRef(false);
  const [renaming, setRenaming] = useState<Node | null>(null);
  const [renameName, setRenameName] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [extDrag, setExtDrag] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [menu, setMenu] = useState<{ node: Node; x: number; y: number } | null>(null);
  const [propsNode, setPropsNode] = useState<Node | null>(null);
  const [movingNodes, setMovingNodes] = useState<Node[] | null>(null);
  const [confirmPurgeMany, setConfirmPurgeMany] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">(() =>
    typeof window !== "undefined" && window.localStorage.getItem("drive.viewMode") === "grid"
      ? "grid"
      : "list"
  );

  useEffect(() => {
    window.localStorage.setItem("drive.viewMode", viewMode);
  }, [viewMode]);

  const isTrash = trash;
  const isSearch = files.view === "search";
  const isBrowse = !isTrash && files.view === "files";
  const isMobile = useIsMobile();

  const runSearch = files.runSearch;
  const uploadRef = useRef(files.upload);
  uploadRef.current = files.upload;

  const selectedIds = selected.filter((id) => id !== DRAFT_ID);
  const selectedNodes = files.items.filter((n) => selectedIds.includes(n.id));

  useEffect(() => {
    setSelected([]);
  }, [files.parentId, files.view, isTrash]);

  useEffect(() => {
    if (selectedIds.length === 0) return;
    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (
        target.closest(
          "[data-rowkey], thead, .drive-selbar, .drive-context-menu, .MuiModal-root, .MuiPopover-root"
        )
      )
        return;
      setSelected([]);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [selectedIds.length]);

  useEffect(() => {
    if (dirInput.current) {
      dirInput.current.setAttribute("webkitdirectory", "");
      dirInput.current.setAttribute("directory", "");
    }
  }, []);

  useEffect(() => {
    if (isTrash) return;
    const handle = window.setTimeout(() => runSearch(searchInput), 300);
    return () => window.clearTimeout(handle);
  }, [searchInput, isTrash, runSearch]);

  useEffect(() => {
    if (!isBrowse) return;
    const onOver = (e: DragEvent) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      setExtDrag(true);
    };
    const onDrop = (e: DragEvent) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      setExtDrag(false);
      const dropped = e.dataTransfer?.files;
      if (dropped && dropped.length > 0) void uploadRef.current(dropped);
    };
    const onLeave = (e: DragEvent) => {
      if (e.relatedTarget === null) setExtDrag(false);
    };
    const onEnd = () => setExtDrag(false);
    window.addEventListener("dragover", onOver);
    window.addEventListener("drop", onDrop);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("dragend", onEnd);
    return () => {
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("dragend", onEnd);
    };
  }, [isBrowse]);

  const startAdd = () => {
    setDraftName("");
    setAdding(true);
  };

  const commitDraft = async () => {
    if (committingRef.current) return;
    committingRef.current = true;
    const name = draftName.trim();
    setAdding(false);
    setDraftName("");
    if (name) await files.newFolder(name);
    committingRef.current = false;
  };

  const cancelDraft = () => {
    committingRef.current = true;
    setAdding(false);
    setDraftName("");
    window.setTimeout(() => {
      committingRef.current = false;
    }, 0);
  };

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

  const clearSelection = () => setSelected([]);

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
                value: `${propsNode.width} × ${propsNode.height} px`,
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
            <span className="drive-name-cell">
              <Icon name="folder" size={28} color="var(--ch-palette-secondary-main, #bcc2a8)" />
              <input
                className="drive-inline-input"
                autoFocus
                value={draftName}
                placeholder={t("drive.files.newFolder.placeholder")}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void commitDraft();
                  } else if (e.key === "Escape") {
                    cancelDraft();
                  }
                }}
                onBlur={() => void commitDraft()}
              />
            </span>
          );
        }
        return (
          <span className="drive-name-cell">
            <Icon name={iconFor(n)} size={28} color="var(--ch-palette-secondary-main, #bcc2a8)" />
            <span>{n.name}</span>
          </span>
        );
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

  return (
    <PageContent hideUtilitiesOnMobile fillHeight>
      <Stack gap="lg" fill>
        {!isTrash && (
          <div className="drive-search">
            <Input
              label={t("drive.files.search.label")}
              value={searchInput}
              onChange={setSearchInput}
              icon="search"
              placeholder={t("drive.files.search.placeholder")}
            />
          </div>
        )}

        {files.loadError && <Feedback severity="error">{files.loadError}</Feedback>}

        <div className="drive-toolbar">
          <span className="drive-view-toggle">
            <IconActionButton
              icon="menu"
              variant={viewMode === "list" ? "default" : "secondary"}
              aria-label={t("drive.files.view.list")}
              onClick={() => setViewMode("list")}
            />
            <IconActionButton
              icon="apps"
              variant={viewMode === "grid" ? "default" : "secondary"}
              aria-label={t("drive.files.view.grid")}
              onClick={() => setViewMode("grid")}
            />
          </span>
          <div className="drive-toolbar-actions">
            {isBrowse && (
              <>
                <span className="drive-add-slot">
                  <AddButton
                    aria-label={t("drive.files.action.add")}
                    onClick={startAdd}
                    disabled={files.busy || adding}
                  />
                </span>
                <div className="drive-import-wrap">
                  <Button
                    variant="primary"
                    onClick={() => setImportOpen((o) => !o)}
                    loading={files.busy}
                    startIcon={<Icon name="upload" size={18} />}
                  >
                    {t("drive.files.action.upload")}
                  </Button>
                  <ImportMenu
                    open={importOpen}
                    onClose={() => setImportOpen(false)}
                    onPickFiles={() => {
                      setImportOpen(false);
                      fileInput.current?.click();
                    }}
                    onPickFolder={() => {
                      setImportOpen(false);
                      dirInput.current?.click();
                    }}
                  />
                </div>
              </>
            )}
            {isTrash && (
              <Button
                variant="danger"
                onClick={() => setConfirmEmpty(true)}
                disabled={files.busy || files.items.length === 0}
                startIcon={<Icon name="trash" size={18} />}
              >
                {t("drive.files.action.emptyTrash")}
              </Button>
            )}
            {isSearch && (
              <Button variant="secondary" onClick={() => setSearchInput("")}>
                {t("drive.files.action.backToFiles")}
              </Button>
            )}
          </div>
        </div>

        <div className="drive-breadcrumb-row">
          {isBrowse ? (
            <Breadcrumb
              crumbs={files.ancestors}
              rootLabel={t("drive.files.root")}
              onNavigate={files.openFolder}
              onDropNode={handleDropOn}
            />
          ) : (
            <span className="drive-breadcrumb-current">{viewTitle}</span>
          )}
        </div>

        {selectedIds.length > 0 && (
          <div className="drive-selbar">
            <button
              type="button"
              className="drive-selbar-clear"
              aria-label={t("drive.files.selection.clear")}
              onClick={clearSelection}
            >
              <Icon name="close" size={18} />
            </button>
            <span className="drive-selbar-count">
              {t("drive.files.selection.count", { count: String(selectedIds.length) })}
            </span>
            <span className="drive-selbar-spacer" />
            {isTrash ? (
              <>
                <IconActionButton
                  icon="check"
                  variant="secondary"
                  aria-label={t("drive.files.action.restore")}
                  onClick={() => void bulkRestore()}
                  disabled={files.busy}
                />
                <IconActionButton
                  icon="trash"
                  variant="danger"
                  aria-label={t("drive.files.action.purge")}
                  onClick={() => setConfirmPurgeMany(true)}
                  disabled={files.busy}
                />
              </>
            ) : (
              <>
                <IconActionButton
                  icon="folder"
                  variant="secondary"
                  aria-label={t("drive.files.action.move")}
                  onClick={() => setMovingNodes(selectedNodes)}
                  disabled={files.busy || selectedNodes.length === 0}
                />
                <IconActionButton
                  icon="trash"
                  variant="danger"
                  aria-label={t("drive.files.action.trash")}
                  onClick={() => void bulkTrash()}
                  disabled={files.busy}
                />
              </>
            )}
          </div>
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

        {viewMode === "list" ? (
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(n) => n.id}
          loading={files.loading}
          emptyMessage={emptyMessage}
          fixedLayout
          stickyHeader
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
            if (n.id === DRAFT_ID) return <div className="drive-row-actions" />;
            if (isMobile) {
              return (
                <div className="drive-row-actions">
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
                </div>
              );
            }
            return (
              <div className="drive-row-actions">
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
              </div>
            );
          }}
        />
        ) : (
          <FilesGrid
            items={files.items}
            selectedIds={selectedIds}
            onSelectionChange={setSelected}
            onOpenFolder={files.openFolder}
            onContextMenu={(n, e) => setMenu({ node: n, x: e.clientX, y: e.clientY })}
            iconFor={iconFor}
            enableOpen={!isTrash}
            emptyMessage={emptyMessage}
            adding={adding && isBrowse}
            draftName={draftName}
            draftPlaceholder={t("drive.files.newFolder.placeholder")}
            onDraftChange={setDraftName}
            onCommitDraft={() => void commitDraft()}
            onCancelDraft={cancelDraft}
          />
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

      <SidePanel
        open={renaming !== null}
        onClose={() => setRenaming(null)}
        title={t("drive.files.rename.title")}
        footer={
          <div className="drive-panel-footer">
            <Button variant="secondary" onClick={() => setRenaming(null)} disabled={files.busy}>
              {t("drive.cancel")}
            </Button>
            <Button onClick={() => void submitRename()} loading={files.busy} disabled={!renameName.trim()}>
              {t("drive.save")}
            </Button>
          </div>
        }
      >
        <form
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
        </form>
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

      {extDrag && isBrowse && (
        <div className="drive-dropzone-overlay">
          <div className="drive-dropzone-card">
            <Icon name="upload" size={40} />
            <span>{t("drive.files.import.dropHere")}</span>
          </div>
        </div>
      )}
    </PageContent>
  );
}
