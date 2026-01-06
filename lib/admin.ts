export function parseAdminEmails() {
  const raw =
    process.env.ADMIN_EMAILS ||
    process.env.ADMIN_EMAIL ||
    "";

  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const adminEmails = parseAdminEmails();
  if (adminEmails.length === 0) return false;
  return adminEmails.includes(email.toLowerCase());
}
