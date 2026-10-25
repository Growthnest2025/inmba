// Shared helpers - pala files la thirumba thirumba copy-paste aagi irundha functions inga ore idathula.
// Use panna:  import { toText, asObject, toNumber, getPublicBaseUrl } from "<relative path>/utils/commonHelpers";

// Value ah trimmed string ah maathum. Empty na `fallback` return aagum.
export const toText = (value, fallback = "") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

// Plain object na adhe return pannum, illa na {} return pannum (array/null ku {}).
export const asObject = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }
  return {};
};

// Valid number na number, illa na `fallback` (default 0).
export const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

// Official public frontend domain for QR codes and public links.
// Vercel preview domains (*.vercel.app) have deployment protection / SSO login redirects.
// In such environments and mobile scans, always point QR codes to the official public production domain https://inmba.org.
export const getPublicBaseUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname || "";
    if (
      !hostname.includes("vercel.app") &&
      !hostname.includes("localhost") &&
      !hostname.includes("127.0.0.1")
    ) {
      return window.location.origin;
    }
  }
  return "https://inmba.org";
};
