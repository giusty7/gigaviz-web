type SendTextArgs = {
  to: string;          // E.164 tanpa tanda +
  body: string;
};

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function sendWhatsAppText({ to, body }: SendTextArgs) {
  const token = requiredEnv("WA_CLOUD_API_TOKEN");
  const phoneNumberId = requiredEnv("WA_PHONE_NUMBER_ID");
  const version = process.env.WA_GRAPH_VERSION || "v21.0";

  const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body, preview_url: false },
      }),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = (data as any)?.error?.message || `WA API failed (${res.status})`;
      throw new Error(msg);
    }

    return { ok: true as const, data };
  } finally {
    clearTimeout(t);
  }
}
