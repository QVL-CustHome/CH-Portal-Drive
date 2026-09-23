import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ProgressBar, Stack } from "canopui";

interface StorageBarCompactProps {
  title: string;
  percent: number;
}

export default function StorageBarCompact({ title, percent }: StorageBarCompactProps) {
  return (
    <Stack direction="row" alignItems="center" gap="sm">
      <Typography
        variant="caption"
        color="primary.contrastText"
        noWrap
        sx={{ fontWeight: 600 }}
      >
        {title}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <ProgressBar value={percent} />
      </Box>
      <Typography variant="caption" color="primary.contrastText" sx={{ fontWeight: 600 }}>
        {percent}%
      </Typography>
    </Stack>
  );
}
