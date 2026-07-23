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
      <Typography variant="caption" fontWeight={600} color="primary.contrastText" noWrap>
        {title}
      </Typography>
      <Box flex={1} minWidth={0}>
        <ProgressBar value={percent} />
      </Box>
      <Typography variant="caption" fontWeight={600} color="primary.contrastText">
        {percent}%
      </Typography>
    </Stack>
  );
}
