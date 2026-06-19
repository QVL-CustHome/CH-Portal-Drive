import { useCurrentUser as useCurrentUserBase } from "@custhome/ui";
import type { Me } from "../api/auth";

export function useCurrentUser(): Me {
  return useCurrentUserBase<Me>();
}
