import { createContext, useContext } from "react";
import type { Storage } from "../api/drive";

export interface StorageContextValue {
  storage: Storage | null;
  loading: boolean;
  loadError: boolean;
  reload: () => void;
}

export const StorageContext = createContext<StorageContextValue | null>(null);

export function useStorageContext(): StorageContextValue {
  const ctx = useContext(StorageContext);
  if (!ctx) {
    throw new Error("useStorageContext doit etre utilise sous StorageProvider");
  }
  return ctx;
}
