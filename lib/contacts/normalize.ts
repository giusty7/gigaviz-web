export function normalizePhone(raw: string) {
  return String(raw || "").replace(/\D+/g, "");
}
