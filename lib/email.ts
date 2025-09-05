import { Resend } from "resend";

type Params = { name: string; email: string; message: string };

const clean = (s: string) => s.replace(/[<>]/g, "").trim();

// ENV harus sama dengan yang kamu set di Vercel
const FROM_EMAIL = clean(process.env.CONTACT_FROM_EMAIL ?? "noreply@mail.gigaviz.com");
const TO_EMAIL   = clean(process.env.CONTACT_TO_EMAIL   ?? "admin@gigaviz.com");
const FROM       = `Gigaviz <${FROM_EMAIL}>`;

let resend: Resend | null = null;
function client(): Resend | null {
  if (resend) return resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  resend = new Resend(key);
  return resend;
}

export async function sendContactEmail(
  { name, email, message }: Params
): Promise<{ sent: boolean }> {
  const c = client();
  if (!c) {
    console.warn("[email] RESEND_API_KEY missing or client not initialised.");
    return { sent: false };
  }

  try {
    await c.emails.send({
      from: FROM,          // "Gigaviz <noreply@mail.gigaviz.com>"
      to: TO_EMAIL,        // string, bukan objek
      replyTo: email,      // <-- gunakan camelCase
      subject: `New contact from ${name}`,
      text:
        `Name: ${name}\n` +
        `Email: ${email}\n\n` +
        `Message:\n${message}\n`,
    });
    return { sent: true };
  } catch (err) {
    console.error("[email] send failed", err);
    return { sent: false };
  }
}
