import { useEffect, useState } from "react";

export type ViewMode = "list" | "grid";

const STORAGE_KEY = "drive.viewMode";

function readStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "list";
  return window.localStorage.getItem(STORAGE_KEY) === "grid" ? "grid" : "list";
}

export function usePersistentViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [viewMode, setViewMode] = useState<ViewMode>(readStoredViewMode);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, viewMode);
  }, [viewMode]);

  return [viewMode, setViewMode];
}
