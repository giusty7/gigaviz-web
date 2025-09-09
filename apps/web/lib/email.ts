import { Resend } from 'resend';

type Params = { name: string; email: string; message: string };

const FROM =
  process.env.CONTACT_FROM_EMAIL ?? 'Gigaviz <noreply@mail.gigaviz.com>';
const TO =
  process.env.CONTACT_TO_EMAIL ?? 'admin@gigaviz.com';

let client: Resend | null = null;
function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  client = client ?? new Resend(key);
  return client;
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
      to: TO, // pastikan TANPA karakter '>' di akhir
      subject: `New contact from ${name}`,
      text:
        `Name: ${name}\n` +
        `Email: ${email}\n\n` +
        `Message:\n${message}\n`,
      // Resend SDK v6 tipe-nya camelCase
      replyTo: email,
    });
    return { sent: true };
  } catch (err) {
    console.error('[email] send failed', err);
    return { sent: false };
  }
}
