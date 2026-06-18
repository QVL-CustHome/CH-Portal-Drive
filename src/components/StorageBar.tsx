import { Feedback, Spinner, Stack, useTranslation } from "@custhome/ui";
import { useStorageContext } from "../context/storage";
import { formatBytes } from "../lib/format";

export default function StorageBar() {
  const { t } = useTranslation();
  const { storage, loading, loadError } = useStorageContext();

  if (loading) {
    return <Spinner label={t("drive.storage.loading")} />;
  }
  if (loadError || !storage) {
    return <Feedback severity="error">{t("drive.storage.loadError")}</Feedback>;
  }

  const ratio =
    storage.quota_bytes > 0
      ? Math.min(storage.used_bytes / storage.quota_bytes, 1)
      : 0;
  const percent = Math.round(ratio * 100);

  return (
    <Stack gap="xs">
      <div className="drive-storage-label">
        {t("drive.storage.usage", {
          used: formatBytes(storage.used_bytes),
          quota: formatBytes(storage.quota_bytes),
        })}
      </div>
      <div
        className="drive-storage-track"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("drive.storage.title")}
      >
        <div className="drive-storage-fill" style={{ width: `${percent}%` }} />
      </div>
    </Stack>
  );
}
