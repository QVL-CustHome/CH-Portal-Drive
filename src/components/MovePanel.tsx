import { useEffect, useState } from "react";
import { Button, Icon, SidePanel, Spinner, Stack, useTranslation } from "canopui";
import { listNodes, type Crumb, type Node } from "../api/drive";

interface MovePanelProps {
  open: boolean;
  moving: Node[];
  busy: boolean;
  onClose: () => void;
  onConfirm: (targetId: string) => void;
}

export default function MovePanel({ open, moving, busy, onClose, onConfirm }: MovePanelProps) {
  const { t } = useTranslation();
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [rootId, setRootId] = useState<string | null>(null);
  const [ancestors, setAncestors] = useState<Crumb[]>([]);
  const [folders, setFolders] = useState<Node[]>([]);
  const [loading, setLoading] = useState(false);

  const excluded = new Set(moving.map((n) => n.id));

  useEffect(() => {
    if (!open) return;
    setCurrentId(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    listNodes(currentId)
      .then((res) => {
        if (cancelled) return;
        setRootId(res.parent_id);
        setAncestors(res.ancestors);
        setFolders(res.items.filter((n) => n.kind === "folder"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, currentId]);

  const target = currentId ?? rootId;

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={t("drive.files.move.title")}
      footer={
        <div className="drive-panel-footer">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t("drive.cancel")}
          </Button>
          <Button
            onClick={() => target && onConfirm(target)}
            loading={busy}
            disabled={!target}
          >
            {t("drive.files.move.here")}
          </Button>
        </div>
      }
    >
      <Stack gap="md">
        <div className="drive-breadcrumb">
          <button
            type="button"
            className="drive-breadcrumb-link"
            onClick={() => setCurrentId(null)}
          >
            {t("drive.files.root")}
          </button>
          {ancestors.map((crumb) => (
            <Stack key={crumb.id} direction="row" gap="xs" alignItems="center">
              <span className="drive-breadcrumb-sep">/</span>
              <button
                type="button"
                className="drive-breadcrumb-link"
                onClick={() => setCurrentId(crumb.id)}
              >
                {crumb.name}
              </button>
            </Stack>
          ))}
        </div>

        {loading ? (
          <Spinner />
        ) : folders.length === 0 ? (
          <span className="drive-storage-label">{t("drive.files.move.empty")}</span>
        ) : (
          <div className="drive-move-list">
            {folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                className="drive-move-item"
                disabled={excluded.has(folder.id)}
                onClick={() => setCurrentId(folder.id)}
              >
                <Icon name="folder" size="sm" />
                <span>{folder.name}</span>
              </button>
            ))}
          </div>
        )}
      </Stack>
    </SidePanel>
  );
}
