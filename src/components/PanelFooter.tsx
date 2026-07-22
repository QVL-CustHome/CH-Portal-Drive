import { Stack } from "canopui";
import type { ReactNode } from "react";

interface PanelFooterProps {
  children: ReactNode;
}

export default function PanelFooter({ children }: PanelFooterProps) {
  return (
    <Stack direction="row" justifyContent="end" gap="xs">
      {children}
    </Stack>
  );
}
