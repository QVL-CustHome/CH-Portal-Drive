import { useCurrentUser as useCurrentUserBase } from "canopui";
import type { Me } from "../api/auth";

export function useCurrentUser(): Me {
  return useCurrentUserBase<Me>();
}
