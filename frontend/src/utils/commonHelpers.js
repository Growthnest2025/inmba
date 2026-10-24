// Shared helpers - pala files la thirumba thirumba copy-paste aagi irundha functions inga ore idathula.
// Use panna:  import { toText, asObject, toNumber } from "<relative path>/utils/commonHelpers";

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
