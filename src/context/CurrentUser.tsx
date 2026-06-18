import type { ReactNode } from "react";
import type { Me } from "../api/auth";
import { CurrentUserContext } from "./current-user";

export function CurrentUserProvider({
  value,
  children,
}: {
  value: Me;
  children: ReactNode;
}) {
  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}
