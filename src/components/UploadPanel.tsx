import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  Button,
  Card,
  Icon,
  IconActionButton,
  ProgressBar,
  Stack,
  useTranslation,
  type ChIconName,
} from "canopui";
import type { UploadItem, UploadQueue } from "../hooks/useUploadQueue";

const STATUS_ICON: Record<UploadItem["status"], ChIconName> = {
  queued: "clock",
  uploading: "upload",
  done: "check",
  error: "close",
};

const STATUS_COLOR: Record<UploadItem["status"], string> = {
  queued: "text.secondary",
  uploading: "primary.main",
  done: "success.main",
  error: "error.main",
};

export interface UploadPanelProps {
  queue: UploadQueue;
}

export default function UploadPanel({ queue }: UploadPanelProps) {
  const { t } = useTranslation();

  if (queue.total === 0) {
    return null;
  }

  const traites = queue.done + queue.failed;
  const titre = queue.finished
    ? t("drive.upload.finished", {
        done: String(queue.done),
        total: String(queue.total),
      })
    : t("drive.upload.progress", {
        done: String(traites),
        total: String(queue.total),
      });

  return (
    <Box
      sx={{
        position: "fixed",
        right: { xs: "0.75rem", sm: "1.5rem" },
        bottom: { xs: "0.75rem", sm: "1.5rem" },
        width: { xs: "calc(100% - 1.5rem)", sm: "24rem" },
        maxWidth: "100%",
        zIndex: 1300,
      }}
    >
      <Card elevation="lg" fill>
        <Stack gap="sm">
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap="sm">
            <Typography color="text.primary" sx={{ fontWeight: 600 }} noWrap>
              {titre}
            </Typography>
            <Stack direction="row" alignItems="center" gap="xs">
              {!queue.finished && (
                <IconActionButton
                  icon={queue.paused ? "play" : "pause"}
                  aria-label={t(queue.paused ? "drive.upload.resume" : "drive.upload.pause")}
                  onClick={queue.paused ? queue.resume : queue.pause}
                />
              )}
              {queue.finished && (
                <IconActionButton
                  icon="close"
                  aria-label={t("drive.upload.close")}
                  onClick={queue.dismiss}
                />
              )}
            </Stack>
          </Stack>

          <ProgressBar
            value={queue.total === 0 ? 0 : Math.round((traites / queue.total) * 100)}
            color={queue.failed > 0 ? "warning" : "primary"}
          />

          {queue.paused && !queue.finished && (
            <Typography variant="body2" color="text.secondary">
              {t("drive.upload.pausedHint")}
            </Typography>
          )}

          <Box
            component="ul"
            sx={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              maxHeight: "12rem",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
            }}
          >
            {queue.items.map((item) => (
              <Box
                key={item.id}
                component="li"
                sx={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  alignItems: "center",
                  gap: "0.5rem",
                  minWidth: 0,
                }}
              >
                <Icon
                  name={STATUS_ICON[item.status]}
                  size="sm"
                  color={item.status === "error" ? "error" : "inherit"}
                />
                <Box minWidth={0}>
                  <Typography variant="body2" color="text.primary" noWrap title={item.label}>
                    {item.label}
                  </Typography>
                  {item.error && (
                    <Typography
                      variant="caption"
                      sx={{ color: STATUS_COLOR.error, display: "block" }}
                    >
                      {item.error}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Box>

          {queue.failed > 0 && (
            <Stack direction="row" justifyContent="space-between" alignItems="center" gap="sm">
              <Typography variant="body2" sx={{ color: STATUS_COLOR.error }}>
                {t("drive.upload.failed", { count: String(queue.failed) })}
              </Typography>
              <Button variant="secondary" onClick={queue.retryFailed} disabled={queue.running}>
                {t("drive.upload.retry")}
              </Button>
            </Stack>
          )}
        </Stack>
      </Card>
    </Box>
  );
}
