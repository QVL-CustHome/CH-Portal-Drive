import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  Button,
  Card,
  IconActionButton,
  ProgressBar,
  Stack,
  useTranslation,
} from "canopui";
import { useUploadContext } from "../context/upload";

/**
 * Suivi compact de l'envoi : le fichier en cours et un compteur, pas la liste
 * entière. Sur un import de plusieurs centaines de fichiers, la liste défilante
 * n'apprenait rien et mangeait l'écran.
 *
 * Rendu par le layout et non par une page : le suivi doit rester visible quand
 * on navigue pendant un import.
 */
export default function UploadPanel() {
  const { t } = useTranslation();
  const queue = useUploadContext();

  if (queue.total === 0) {
    return null;
  }

  const traites = queue.done + queue.failed;
  const pourcentage = Math.round((traites / queue.total) * 100);
  const courant = queue.items.find((item) => item.status === "uploading");

  const sousTitre = queue.finished
    ? null
    : queue.paused
      ? t("drive.upload.pausedHint")
      : (courant?.label ?? t("drive.upload.preparing"));

  return (
    <Box
      sx={{
        // Placé comme un toast, en haut au centre : le bas de l'écran est déjà
        // pris sur mobile par la barre de navigation et la jauge de stockage,
        // toutes deux flottantes.
        position: "fixed",
        top: { xs: "calc(0.75rem + env(safe-area-inset-top))", sm: "1.5rem" },
        left: "50%",
        transform: "translateX(-50%)",
        width: { xs: "calc(100% - 1.5rem)", sm: "24rem" },
        maxWidth: "100%",
        // Sous les toasts : un message transitoire doit rester lisible par-dessus.
        zIndex: (theme) => theme.zIndex.snackbar - 1,
      }}
    >
      <Card elevation="lg" fill>
        <Stack gap="sm">
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap="sm">
            <Typography color="text.primary" sx={{ fontWeight: 600 }} noWrap>
              {queue.finished
                ? t("drive.upload.finished", {
                    done: String(queue.done),
                    total: String(queue.total),
                  })
                : t("drive.upload.progress", {
                    done: String(traites),
                    total: String(queue.total),
                  })}
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
            value={pourcentage}
            color={queue.failed > 0 ? "warning" : "primary"}
          />

          {sousTitre && (
            <Typography variant="body2" color="text.secondary" noWrap title={sousTitre}>
              {sousTitre}
            </Typography>
          )}

          {queue.skipped > 0 && (
            <Typography variant="body2" color="text.secondary">
              {t("drive.upload.skipped", { count: String(queue.skipped) })}
            </Typography>
          )}

          {queue.failed > 0 && (
            <Stack direction="row" justifyContent="space-between" alignItems="center" gap="sm">
              <Typography variant="body2" color="error.main">
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
