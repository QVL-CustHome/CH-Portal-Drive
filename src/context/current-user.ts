import { createContext, useContext } from "react";
import type { Me } from "../api/auth";

export const CurrentUserContext = createContext<Me | null>(null);

export function useCurrentUser(): Me {
  const me = useContext(CurrentUserContext);
  if (!me) {
    throw new Error("useCurrentUser doit etre utilise sous CurrentUserProvider");
  }
  return me;
}
