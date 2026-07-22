import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import {
  Breadcrumb,
  Button,
  Icon,
  SidePanel,
  Spinner,
  Stack,
  useTranslation,
  type ChBreadcrumbItem,
} from "canopui";
import { listNodes, type Crumb, type Node } from "../api/drive";
import PanelFooter from "./PanelFooter";

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

  const pathItems: ChBreadcrumbItem[] = [
    { id: "__root__", label: t("drive.files.root"), icon: "home", onClick: () => setCurrentId(null) },
    ...ancestors.slice(1).map((crumb) => ({
      id: crumb.id,
      label: crumb.name,
      onClick: () => setCurrentId(crumb.id),
    })),
  ];

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={t("drive.files.move.title")}
      footer={
        <PanelFooter>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t("drive.cancel")}
          </Button>
          <Button onClick={() => target && onConfirm(target)} loading={busy} disabled={!target}>
            {t("drive.files.move.here")}
          </Button>
        </PanelFooter>
      }
    >
      <Stack gap="md">
        <Breadcrumb items={pathItems} label={t("drive.files.move.title")} />

        {loading ? (
          <Spinner />
        ) : folders.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t("drive.files.move.empty")}
          </Typography>
        ) : (
          <Stack gap="xs">
            {folders.map((folder) => (
              <ButtonBase
                key={folder.id}
                disabled={excluded.has(folder.id)}
                onClick={() => setCurrentId(folder.id)}
                sx={{
                  justifyContent: "flex-start",
                  gap: "0.6rem",
                  width: "100%",
                  paddingX: "0.7rem",
                  paddingY: "0.6rem",
                  borderRadius: "var(--ch-radius-sm)",
                  color: "text.primary",
                  transition:
                    "background-color var(--ch-motion-duration-fast) var(--ch-motion-ease-standard)",
                  "&:hover": { backgroundColor: "surface.sunken" },
                  "&.Mui-disabled": { opacity: 0.45 },
                }}
              >
                <Icon name="folder" size="sm" color="secondary" />
                <Box component="span" minWidth={0} sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {folder.name}
                </Box>
              </ButtonBase>
            ))}
          </Stack>
        )}
      </Stack>
    </SidePanel>
  );
}
