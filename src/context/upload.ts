import { createContext, useContext } from "react";
import type { UploadQueue } from "../hooks/useUploadQueue";

export interface UploadContextValue extends UploadQueue {
  /**
   * Horodatage du dernier lot terminé. Les vues qui listent des fichiers s'en
   * servent pour se rafraîchir : la file vivant au-dessus des pages, elle ne
   * peut pas appeler leur rechargement directement.
   */
  lastBatchAt: number;
}

export const UploadContext = createContext<UploadContextValue | null>(null);

export function useUploadContext(): UploadContextValue {
  const ctx = useContext(UploadContext);
  if (!ctx) {
    throw new Error("useUploadContext doit être utilisé sous UploadProvider");
  }
  return ctx;
}
