// The primary root domain. Unassigned products belong here by default.
export const MAIN_DOMAIN = "checkouthub.com";

export function getRootDomain(): string {
  if (typeof window === "undefined") return "checkouthub.com";
  const hostname = window.location.hostname.toLowerCase();
  const params = new URLSearchParams(window.location.search);

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.includes(".lovable.app") ||
    hostname.includes(".lovableproject.com") ||
    hostname.endsWith(".vercel.app")
  ) {
    return params.get("domain") || "checkouthub.com";
  }

  const parts = hostname.split(".");
  if (parts.length >= 3) {
    return parts.slice(1).join(".");
  }
  return hostname.replace(/^www\./, "");
}
