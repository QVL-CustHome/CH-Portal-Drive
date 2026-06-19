import { Feedback, ProgressBar, Spinner, Stack, useTranslation } from "@custhome/ui";
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
    storage.quota_bytes > 0 ? Math.min(storage.used_bytes / storage.quota_bytes, 1) : 0;
  const percent = Math.round(ratio * 100);

  return (
    <Stack gap="xs">
      <div className="drive-storage-label">
        {t("drive.storage.usage", {
          used: formatBytes(storage.used_bytes),
          quota: formatBytes(storage.quota_bytes),
        })}
      </div>
      <ProgressBar value={percent} />
    </Stack>
  );
}
