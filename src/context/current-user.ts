import { useCurrentUser as useCurrentUserBase } from "@canop/ui";
import type { Me } from "../api/auth";

export function useCurrentUser(): Me {
  return useCurrentUserBase<Me>();
}
