import { useState } from "react";
import {
  Button,
  DataTable,
  Feedback,
  IconActionButton,
  Input,
  PageContent,
  SidePanel,
  Stack,
  Toast,
  useTranslation,
  type ChColumn,
} from "@custhome/ui";
import { type DriveAdminUser } from "../api/drive";
import { useDriveAdmin } from "../hooks/useDriveAdmin";
import { formatBytes, formatDate } from "../lib/format";

const GIB = 1024 * 1024 * 1024;

export default function Admin() {
  const { t, locale } = useTranslation();
  const admin = useDriveAdmin();
  const [editing, setEditing] = useState<DriveAdminUser | null>(null);
  const [quotaGiB, setQuotaGiB] = useState("");

  const openEdit = (user: DriveAdminUser) => {
    setQuotaGiB((user.quota_bytes / GIB).toFixed(0));
    setEditing(user);
  };

  const submit = async () => {
    if (!editing) return;
    const value = Number(quotaGiB.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) return;
    const ok = await admin.updateQuota(editing.user_id, Math.round(value * GIB));
    if (ok) setEditing(null);
  };

  const columns: ChColumn<DriveAdminUser>[] = [
    {
      key: "name",
      header: t("drive.admin.col.user"),
      sortable: true,
      width: "30%",
      sortValue: (u) => (u.name ?? u.user_id).toLowerCase(),
      render: (u) => (
        <div className="drive-admin-user">
          <span className="drive-admin-user-name">{u.name ?? u.user_id}</span>
          {u.email && <span className="drive-storage-label drive-admin-user-email">{u.email}</span>}
        </div>
      ),
    },
    {
      key: "used_bytes",
      header: t("drive.admin.col.usage"),
      sortable: true,
      sortValue: (u) => (u.quota_bytes > 0 ? u.used_bytes / u.quota_bytes : 0),
      render: (u) => {
        const percent =
          u.quota_bytes > 0 ? Math.round(Math.min(u.used_bytes / u.quota_bytes, 1) * 100) : 0;
        return (
          <Stack gap="xs">
            <span className="drive-storage-label">{percent} %</span>
            <div
              className="drive-storage-track drive-admin-bar"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="drive-storage-fill" style={{ width: `${percent}%` }} />
            </div>
          </Stack>
        );
      },
    },
    {
      key: "created_at",
      header: t("drive.admin.col.created"),
      width: "20%",
      hideOnMobile: true,
      sortable: true,
      render: (u) => formatDate(u.created_at, locale),
    },
  ];

  return (
    <PageContent hideUtilitiesOnMobile fillHeight title={t("drive.admin.title")}>
      <Stack gap="lg" fill>
        {admin.loadError && <Feedback severity="error">{admin.loadError}</Feedback>}

        <DataTable
          columns={columns}
          rows={admin.users}
          getRowKey={(u) => u.user_id}
          loading={admin.loading}
          emptyMessage={t("drive.admin.empty")}
          fixedLayout
          stickyHeader
          actionsWidth="14%"
          actions={(u) => (
            <div className="drive-row-actions">
              <IconActionButton
                icon="refresh"
                variant="secondary"
                aria-label={t("drive.admin.action.recompute")}
                onClick={() => void admin.recompute(u.user_id)}
                disabled={admin.busy}
              />
              <IconActionButton
                icon="pencil"
                aria-label={t("drive.admin.action.editQuota")}
                onClick={() => openEdit(u)}
                disabled={admin.busy}
              />
            </div>
          )}
        />
      </Stack>

      <SidePanel
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={t("drive.admin.editTitle")}
        footer={
          <div className="drive-panel-footer">
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={admin.busy}>
              {t("drive.cancel")}
            </Button>
            <Button onClick={() => void submit()} loading={admin.busy} disabled={!quotaGiB.trim()}>
              {t("drive.save")}
            </Button>
          </div>
        }
      >
        {editing && (
          <Stack gap="md">
            <span className="drive-storage-label">
              {editing.name ?? editing.user_id} — {t("drive.admin.currentUsage")}{" "}
              {formatBytes(editing.used_bytes)}
            </span>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <Input
                label={t("drive.admin.quotaLabel")}
                type="number"
                value={quotaGiB}
                onChange={setQuotaGiB}
                required
                autoFocus
              />
            </form>
          </Stack>
        )}
      </SidePanel>

      <Toast
        open={admin.toast !== null}
        message={admin.toast?.message ?? ""}
        severity={admin.toast?.severity}
        onClose={() => admin.setToast(null)}
      />
    </PageContent>
  );
}
