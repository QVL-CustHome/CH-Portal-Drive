import type { ReactNode } from "react";
import { StorageContext } from "./storage";
import { useStorage } from "../hooks/useStorage";

export function StorageProvider({ children }: { children: ReactNode }) {
  const value = useStorage();
  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}
