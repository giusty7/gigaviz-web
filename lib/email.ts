export type ContactEmailParams = { name: string; email: string; message: string };

export async function sendContactEmail({ name, email, message }: ContactEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  // Fallback saat tidak ada API key
  if (!apiKey) {
    return { ok: true as const, sent: false as const };
  }

  const from = process.env.CONTACT_FROM_EMAIL ?? "onboarding@resend.dev";
  const to = process.env.CONTACT_TO_EMAIL ?? process.env.CONTACT_FROM_EMAIL ?? "you@example.com";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `New contact message from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
        reply_to: email,
      }),
    });

    if (!res.ok) {
      return { ok: true as const, sent: false as const };
    }
    return { ok: true as const, sent: true as const };
  } catch {
    return { ok: true as const, sent: false as const };
  }
}

