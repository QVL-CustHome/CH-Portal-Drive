import { useCallback, useMemo, useState, type ReactNode } from "react";
import { apiErrorMessage, useTranslation } from "canopui";
import { ApiError } from "../api/client";
import { UploadContext } from "./upload";
import { useStorageContext } from "./storage";
import { useUploadQueue } from "../hooks/useUploadQueue";

/**
 * Porte la file d'envoi **au-dessus des pages**.
 *
 * Tant qu'elle vivait dans la page Fichiers, changer d'écran démontait le hook :
 * le suivi disparaissait et l'état du lot était perdu alors que les envois
 * continuaient en silence. Montée au niveau du layout, la file survit à la
 * navigation.
 */
export function UploadProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const storage = useStorageContext();
  const [lastBatchAt, setLastBatchAt] = useState(0);

  const onBatchFinished = useCallback(() => {
    storage.reload();
    setLastBatchAt(Date.now());
  }, [storage]);

  const describeError = useCallback(
    (error: unknown) =>
      apiErrorMessage(
        t,
        error instanceof ApiError ? error.code : undefined,
        error instanceof ApiError ? error.message : t("drive.files.actionError")
      ),
    [t]
  );

  const queue = useUploadQueue({ onBatchFinished, describeError });
  const value = useMemo(() => ({ ...queue, lastBatchAt }), [queue, lastBatchAt]);

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
}
