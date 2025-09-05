import { Resend } from 'resend';

type Params = { name: string; email: string; message: string };

const FROM = process.env.RESEND_FROM || 'Gigaviz <noreply@gigaviz.com>';
const TO = process.env.CONTACT_TO || 'admin@gigaviz.com>';

let client: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  try {
    client = client ?? new Resend(key);
    return client;
  } catch {
    return null;
  }
}

export async function sendContactEmail(
  { name, email, message }: Params
): Promise<{ sent: boolean }> {
  const c = getClient();
  if (!c) {
    console.warn('[email] RESEND_API_KEY missing or client not initialised.');
    return { sent: false };
  }

  try {
    await c.emails.send({
      from: FROM,
      to: TO,
      subject: `New contact from ${name}`,
      text:
        `Name: ${name}\n` +
        `Email: ${email}\n\n` +
        `Message:\n${message}\n`,
      replyTo: email,
    });
    return { sent: true };
  } catch (err) {
    console.error('[email] send failed', err);
    return { sent: false };
  }
}
