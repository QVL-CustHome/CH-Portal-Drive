import { useCallback, useEffect, useState } from "react";
import { apiErrorMessage, useTranslation, type ChToastSeverity } from "canopui";
import { ApiError } from "../api/client";
import { useStorageContext } from "../context/storage";
import {
  createFolder,
  emptyTrash,
  listNodes,
  listTrash,
  moveNode,
  purgeNode,
  renameNode,
  restoreNode,
  searchNodes,
  trashNode,
  uploadFile,
  type Crumb,
  type Node,
} from "../api/drive";

export interface FilesToast {
  severity: ChToastSeverity;
  message: string;
}

export type FilesView = "files" | "trash" | "search";

export function useFiles(initialView: FilesView = "files") {
  const { t } = useTranslation();
  const storage = useStorageContext();
  const [view, setView] = useState<FilesView>(initialView);
  const [parentId, setParentId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [ancestors, setAncestors] = useState<Crumb[]>([]);
  const [items, setItems] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<FilesToast | null>(null);

  const toastError = useCallback(
    (err: unknown) => {
      const fallback = err instanceof ApiError ? err.message : t("drive.files.actionError");
      const code = err instanceof ApiError ? err.code : undefined;
      setToast({ severity: "error", message: apiErrorMessage(t, code, fallback) });
    },
    [t]
  );

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      if (view === "trash") {
        setItems(await listTrash());
        setAncestors([]);
      } else if (view === "search") {
        setItems(query.trim() ? await searchNodes(query.trim()) : []);
        setAncestors([]);
      } else {
        const res = await listNodes(parentId);
        setItems(res.items);
        setAncestors(res.ancestors);
        if (parentId === null) setParentId(res.parent_id);
      }
      setLoadError(null);
    } catch {
      setLoadError(t("drive.files.loadError"));
    } finally {
      setLoading(false);
    }
  }, [view, parentId, query, t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const run = useCallback(
    async (action: () => Promise<unknown>, successKey: string): Promise<boolean> => {
      setBusy(true);
      try {
        await action();
        setToast({ severity: "success", message: t(successKey) });
        storage.reload();
        await reload();
        return true;
      } catch (err) {
        toastError(err);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [reload, storage, t, toastError]
  );

  const openFolder = useCallback((id: string) => {
    setView("files");
    setParentId(id);
  }, []);

  const backToFiles = useCallback(() => {
    setQuery("");
    setView("files");
  }, []);

  const runSearch = useCallback((q: string) => {
    setQuery(q);
    setView(q.trim() ? "search" : "files");
  }, []);

  const newFolder = useCallback(
    (name: string) => run(() => createFolder(name, parentId), "drive.files.folderCreated"),
    [run, parentId]
  );

  const upload = useCallback(
    async (files: FileList | File[]): Promise<boolean> => {
      const list = Array.from(files);
      if (list.length === 0) return false;
      return run(async () => {
        for (const file of list) {
          await uploadFile(file, parentId);
        }
      }, "drive.files.uploaded");
    },
    [run, parentId]
  );

  const importFolder = useCallback(
    async (files: FileList | File[]): Promise<boolean> => {
      const list = Array.from(files);
      if (list.length === 0) return false;
      return run(async () => {
        const cache = new Map<string, string>();
        const ensureFolder = async (name: string, parent: string): Promise<string> => {
          try {
            const node = await createFolder(name, parent);
            return node.id;
          } catch (err) {
            if (err instanceof ApiError && err.status === 409) {
              const res = await listNodes(parent);
              const existing = res.items.find((n) => n.kind === "folder" && n.name === name);
              if (existing) return existing.id;
            }
            throw err;
          }
        };
        const ensurePath = async (segments: string[]): Promise<string | null> => {
          let path = "";
          let parent = parentId;
          for (const seg of segments) {
            if (parent === null) return null;
            const next = path ? `${path}/${seg}` : seg;
            let id = cache.get(next);
            if (id === undefined) {
              id = await ensureFolder(seg, parent);
              cache.set(next, id);
            }
            parent = id;
            path = next;
          }
          return parent;
        };
        for (const file of list) {
          const rel = file.webkitRelativePath || file.name;
          const segments = rel.split("/").filter(Boolean).slice(0, -1);
          const target = await ensurePath(segments);
          if (target) await uploadFile(file, target);
        }
      }, "drive.files.folderImported");
    },
    [run, parentId]
  );

  const rename = useCallback(
    (id: string, name: string) => run(() => renameNode(id, name), "drive.files.renamed"),
    [run]
  );

  const move = useCallback(
    async (id: string, targetParentId: string): Promise<boolean> => {
      setBusy(true);
      try {
        await moveNode(id, targetParentId);
        storage.reload();
        openFolder(targetParentId);
        return true;
      } catch (err) {
        toastError(err);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [storage, openFolder, toastError]
  );

  const trash = useCallback((id: string) => run(() => trashNode(id), "drive.files.trashed"), [run]);
  const restore = useCallback((id: string) => run(() => restoreNode(id), "drive.files.restored"), [run]);
  const purge = useCallback((id: string) => run(() => purgeNode(id), "drive.files.purged"), [run]);
  const purgeAll = useCallback(() => run(() => emptyTrash(), "drive.files.trashEmptied"), [run]);

  const trashMany = useCallback(
    (ids: string[]) =>
      run(async () => {
        for (const id of ids) await trashNode(id);
      }, "drive.files.trashed"),
    [run]
  );
  const restoreMany = useCallback(
    (ids: string[]) =>
      run(async () => {
        for (const id of ids) await restoreNode(id);
      }, "drive.files.restored"),
    [run]
  );
  const purgeMany = useCallback(
    (ids: string[]) =>
      run(async () => {
        for (const id of ids) await purgeNode(id);
      }, "drive.files.purged"),
    [run]
  );

  const moveMany = useCallback(
    async (ids: string[], targetParentId: string): Promise<boolean> => {
      setBusy(true);
      try {
        for (const id of ids) await moveNode(id, targetParentId);
        storage.reload();
        openFolder(targetParentId);
        return true;
      } catch (err) {
        toastError(err);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [storage, openFolder, toastError]
  );

  return {
    view,
    parentId,
    query,
    ancestors,
    items,
    loading,
    busy,
    loadError,
    toast,
    setToast,
    reload,
    openFolder,
    backToFiles,
    runSearch,
    newFolder,
    upload,
    importFolder,
    rename,
    move,
    trash,
    restore,
    purge,
    purgeAll,
    trashMany,
    restoreMany,
    purgeMany,
    moveMany,
  };
}
