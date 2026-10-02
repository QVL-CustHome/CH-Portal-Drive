import { Stack } from "@canop/ui";
import type { ReactNode } from "react";

interface RowActionsProps {
  children?: ReactNode;
}

export default function RowActions({ children }: RowActionsProps) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="end" gap="xs">
      {children}
    </Stack>
  );
}
