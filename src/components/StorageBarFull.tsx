import Typography from "@mui/material/Typography";
import { ProgressBar, Stack } from "canopui";

interface StorageBarFullProps {
  usageLabel: string;
  percent: number;
}

export default function StorageBarFull({ usageLabel, percent }: StorageBarFullProps) {
  return (
    <Stack gap="xs">
      <Typography variant="caption" color="primary.contrastText">
        {usageLabel}
      </Typography>
      <ProgressBar value={percent} />
    </Stack>
  );
}
