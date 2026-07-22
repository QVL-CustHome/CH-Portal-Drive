import Typography from "@mui/material/Typography";
import { Icon, Stack, type ChIconName } from "canopui";

interface NameCellProps {
  icon: ChIconName;
  name: string;
}

export default function NameCell({ icon, name }: NameCellProps) {
  return (
    <Stack direction="row" alignItems="center" gap="xs">
      <Icon name={icon} size="md" color="secondary" />
      <Typography variant="body2" color="text.primary" noWrap title={name} sx={{ minWidth: 0 }}>
        {name}
      </Typography>
    </Stack>
  );
}
