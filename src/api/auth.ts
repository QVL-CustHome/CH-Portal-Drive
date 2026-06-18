import { request } from "./client";

export interface Me {
  user_id: string;
  name: string;
  email: string;
  roles: string[];
  whitelist_only: boolean;
  created_at: string;
}

export function getMe() {
  return request<Me>("/auth/me");
}

export function logout() {
  return request<unknown>("/auth/logout", { method: "POST" });
}
