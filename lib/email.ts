import "server-only";

export function getResendFromAuth() {
  const from = process.env.RESEND_FROM_AUTH;
  if (!from) {
    throw new Error("RESEND_FROM_AUTH is missing. Set it in .env.local");
  }
  return from;
}

export function getResendFromContact() {
  const from = process.env.RESEND_FROM_CONTACT;
  if (!from) {
    throw new Error("RESEND_FROM_CONTACT is missing. Set it in .env.local");
  }
  return from;
}
