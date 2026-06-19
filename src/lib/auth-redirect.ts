import { buildLoginUrl } from "@custhome/ui";

const AUTH_PORTAL_URL =
  import.meta.env.VITE_AUTH_PORTAL_URL ?? "http://localhost:3200";

export function loginUrl(): string {
  return buildLoginUrl({ authPortalUrl: AUTH_PORTAL_URL });
}
