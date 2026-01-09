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

import { Resend } from "resend";

const resendClient = (() => {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
})();

export async function sendWorkspaceInviteEmail(opts: {
  to: string;
  workspaceName: string;
  inviterEmail: string;
  acceptUrl: string;
}) {
  if (!resendClient) {
    console.warn("RESEND_API_KEY not set; skipping invite email");
    return;
  }

  const from = getResendFromAuth();
  const acceptUrl = opts.acceptUrl?.trim();
  if (!acceptUrl) {
    console.warn("sendWorkspaceInviteEmail missing acceptUrl");
    return;
  }

  const subject = `You're invited to join ${opts.workspaceName} on Gigaviz`;
  const html = `<p>Hi,</p>
  <p>${opts.inviterEmail} has invited you to join the workspace <strong>${opts.workspaceName}</strong>.</p>
  <p><a href="${acceptUrl}">Accept invitation</a></p>
  <p>If the link doesn't work, paste this URL into your browser:</p>
  <p>${acceptUrl}</p>
  `;

  try {
    await resendClient.emails.send({
      from,
      to: opts.to,
      subject,
      html,
    });
  } catch (err) {
    console.error("sendWorkspaceInviteEmail failed", err);
  }
}
