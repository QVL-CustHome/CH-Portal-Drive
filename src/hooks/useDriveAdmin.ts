import { useCallback, useEffect, useState } from "react";
import { apiErrorMessage, useTranslation, type ChToastSeverity } from "@custhome/ui";
import { ApiError } from "../api/client";
import { listDriveUsers, recomputeUser, setUserQuota, type DriveAdminUser } from "../api/drive";

export interface AdminToast {
  severity: ChToastSeverity;
  message: string;
}

export function useDriveAdmin() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<DriveAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<AdminToast | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await listDriveUsers());
      setLoadError(null);
    } catch {
      setLoadError(t("drive.admin.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updateQuota = useCallback(
    async (userId: string, quotaBytes: number): Promise<boolean> => {
      setBusy(true);
      try {
        await setUserQuota(userId, quotaBytes);
        setToast({ severity: "success", message: t("drive.admin.quotaUpdated") });
        await reload();
        return true;
      } catch (err) {
        const fallback = err instanceof ApiError ? err.message : t("drive.admin.actionError");
        const code = err instanceof ApiError ? err.code : undefined;
        setToast({ severity: "error", message: apiErrorMessage(t, code, fallback) });
        return false;
      } finally {
        setBusy(false);
      }
    },
    [reload, t]
  );

  const recompute = useCallback(
    async (userId: string): Promise<boolean> => {
      setBusy(true);
      try {
        await recomputeUser(userId);
        setToast({ severity: "success", message: t("drive.admin.recomputed") });
        await reload();
        return true;
      } catch (err) {
        const fallback = err instanceof ApiError ? err.message : t("drive.admin.actionError");
        const code = err instanceof ApiError ? err.code : undefined;
        setToast({ severity: "error", message: apiErrorMessage(t, code, fallback) });
        return false;
      } finally {
        setBusy(false);
      }
    },
    [reload, t]
  );

  return { users, loading, busy, loadError, toast, setToast, reload, updateQuota, recompute };
}
