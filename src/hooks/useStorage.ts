import { useCallback, useEffect, useState } from "react";
import { getStorage, type Storage } from "../api/drive";

interface StorageState {
  storage: Storage | null;
  loading: boolean;
  loadError: boolean;
  reload: () => void;
}

export function useStorage(refreshSignal = 0): StorageState {
  const [storage, setStorage] = useState<Storage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const reload = useCallback(() => {
    let active = true;
    getStorage()
      .then((s) => {
        if (!active) return;
        setStorage(s);
        setLoadError(false);
      })
      .catch(() => {
        if (!active) return;
        setLoadError(true);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const cleanup = reload();
    return cleanup;
  }, [reload, refreshSignal]);

  return { storage, loading, loadError, reload };
}
