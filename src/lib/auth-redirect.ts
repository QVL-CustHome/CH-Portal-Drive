const AUTH_PORTAL_URL =
  import.meta.env.VITE_AUTH_PORTAL_URL ?? "http://localhost:3200";

export function loginUrl(): string {
  document.cookie = `ch_redirect=${encodeURIComponent(window.location.href)}; path=/; max-age=300; SameSite=Lax`;
  return `${AUTH_PORTAL_URL}/login`;
}
