const UNITS = ["o", "Ko", "Mo", "Go", "To"];

export function formatMonth(iso: string, locale = "fr"): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const label = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    month: "long",
    year: "numeric",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatDate(iso: string, locale = "fr"): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 o";
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    UNITS.length - 1
  );
  const value = bytes / Math.pow(1024, exponent);
  const rounded = exponent === 0 ? value : Math.round(value * 10) / 10;
  return `${rounded} ${UNITS[exponent]}`;
}
