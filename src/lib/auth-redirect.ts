import { REDIRECT_INTENT_PARAM } from "canopui";

const AUTH_PORTAL_URL =
  import.meta.env.VITE_AUTH_PORTAL_URL ?? "http://localhost:3200";
// Domaine du cookie de retour SSO. Vide en local (hote partage localhost) ;
// ".qvl-project.com" en prod pour que le portail d'auth (autre sous-domaine) le lise.
const REDIRECT_COOKIE_DOMAIN = import.meta.env.VITE_REDIRECT_COOKIE_DOMAIN ?? "";

const REDIRECT_COOKIE_NAME = "ch_redirect";
const REDIRECT_COOKIE_MAX_AGE = 300;

export function loginUrl(): string {
  const redirect = encodeURIComponent(window.location.href);
  const domainAttr = REDIRECT_COOKIE_DOMAIN
    ? `; domain=${REDIRECT_COOKIE_DOMAIN}`
    : "";
  document.cookie = `${REDIRECT_COOKIE_NAME}=${redirect}; path=/; max-age=${REDIRECT_COOKIE_MAX_AGE}; SameSite=Lax${domainAttr}`;
  const url = new URL("/login", AUTH_PORTAL_URL);
  url.searchParams.set(REDIRECT_INTENT_PARAM, "1");
  return url.toString();
}
