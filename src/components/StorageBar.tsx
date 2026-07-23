import { Feedback, Spinner, useTranslation } from "canopui";
import { useStorageBar } from "../hooks/useStorageBar";
import { formatBytes } from "../lib/format";
import StorageBarCompact from "./StorageBarCompact";
import StorageBarFull from "./StorageBarFull";

export default function StorageBar() {
  const { t } = useTranslation();
  const { loading, hasError, percent, usedBytes, quotaBytes, isCompact } = useStorageBar();

  if (loading) {
    return <Spinner label={t("drive.storage.loading")} />;
  }
  if (hasError) {
    return <Feedback severity="error">{t("drive.storage.loadError")}</Feedback>;
  }

  if (isCompact) {
    return <StorageBarCompact title={t("drive.storage.title")} percent={percent} />;
  }

  return (
    <StorageBarFull
      usageLabel={t("drive.storage.usage", {
        used: formatBytes(usedBytes),
        quota: formatBytes(quotaBytes),
      })}
      percent={percent}
    />
  );
}
