type SendTextArgs = {
  to: string;          // E.164 tanpa tanda +
  body: string;
};

function requiredEnvAny(names: string[]) {
  for (const name of names) {
    const v = process.env[name];
    if (v) return v;
  }
  throw new Error(`Missing env: ${names.join(" or ")}`);
}

type WhatsAppErrorResponse = {
  error?: {
    message?: string;
  };
};

function getApiErrorMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object") {
    const error = (data as WhatsAppErrorResponse).error;
    if (error?.message) return error.message;
  }
  return fallback;
}

export async function sendWhatsAppText({ to, body }: SendTextArgs) {
  const token = requiredEnvAny(["WA_ACCESS_TOKEN", "WA_CLOUD_API_TOKEN"]);
  const phoneNumberId = requiredEnvAny(["WA_PHONE_NUMBER_ID"]);
  const version = process.env.WA_GRAPH_VERSION || "v22.0";

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

    const data = (await res.json().catch(() => ({}))) as unknown;
    if (!res.ok) {
      const msg = getApiErrorMessage(data, `WA API failed (${res.status})`);
      throw new Error(msg);
    }

    return { ok: true as const, data };
  } finally {
    clearTimeout(t);
  }
}

export async function fetchWhatsAppMediaUrl(mediaId: string) {
  const token = requiredEnvAny(["WA_ACCESS_TOKEN", "WA_CLOUD_API_TOKEN"]);
  const version = process.env.WA_GRAPH_VERSION || "v22.0";
  const url = `https://graph.facebook.com/${version}/${mediaId}`;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    const data = (await res.json().catch(() => ({}))) as unknown;
    if (!res.ok) {
      const msg = getApiErrorMessage(data, `WA media lookup failed (${res.status})`);
      throw new Error(msg);
    }

    return { ok: true as const, data };
  } finally {
    clearTimeout(t);
  }
}
