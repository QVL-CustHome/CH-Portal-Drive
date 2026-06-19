import type { ReactNode } from "react";
import { CurrentUserProvider as CurrentUserProviderBase } from "@custhome/ui";
import type { Me } from "../api/auth";

export function CurrentUserProvider({
  value,
  children,
}: {
  value: Me;
  children: ReactNode;
}) {
  return (
    <CurrentUserProviderBase<Me> value={value}>
      {children}
    </CurrentUserProviderBase>
  );
}
