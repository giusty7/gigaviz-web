import { Resend } from 'resend';

type Params = { name: string; email: string; message: string };

const FROM =
  process.env.CONTACT_FROM_EMAIL ?? 'Gigaviz <noreply@mail.gigaviz.com>';
// trim agar tidak ada spasi/karakter nyasar
const TO =
  (process.env.CONTACT_TO_EMAIL ?? 'admin@gigaviz.com').trim();

let client: Resend | undefined;
function getClient() {
  if (!client && process.env.RESEND_API_KEY) {
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}

export async function sendContactEmail(
  { name, email, message }: Params
): Promise<{ sent: boolean }> {
  const c = getClient();
  if (!c) {
    console.warn('[email] RESEND_API_KEY missing');
    return { sent: false };
  }
  try {
    const { error } = await c.emails.send({
      from: FROM,             // contoh: 'Gigaviz <noreply@mail.gigaviz.com>'
      to: [TO],               // kirim sebagai array
      subject: `New contact from ${name}`,
      text:
        `Name: ${name}\n` +
        `Email: ${email}\n\n` +
        `Message:\n${message}\n`,
      replyTo: email,         // <-- camelCase, bukan reply_to
    });
    if (error) throw error;
    return { sent: true };
  } catch (err) {
    console.error('[email] send failed', err);
    return { sent: false };
  }
}
