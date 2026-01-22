import { graphUrl, getGraphApiVersion } from "@/lib/meta/graph";

type GraphRequestOpts = {
  version?: string;
  method?: "GET" | "POST";
  body?: unknown;
  timeoutMs?: number;
};

type GraphRequestResult = {
  ok: boolean;
  status: number;
  response: Record<string, unknown>;
  errorMessage?: string;
};

async function graphRequest(path: string, token: string, opts?: GraphRequestOpts): Promise<GraphRequestResult> {
  const version = opts?.version ?? getGraphApiVersion();
  const url = graphUrl(path, version);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 12000);

  try {
    const res = await fetch(url, {
      method: opts?.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: opts?.body ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });

    const response = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const errorMessage = (response as { error?: { message?: string } })?.error?.message;

    return {
      ok: res.ok,
      status: res.status,
      response,
      errorMessage: res.ok ? undefined : errorMessage ?? `Graph API error (${res.status})`,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendWhatsappMessage({
  phoneNumberId,
  token,
  payload,
  version,
}: {
  phoneNumberId: string;
  token: string;
  payload: unknown;
  version?: string;
}) {
  const result = await graphRequest(`${encodeURIComponent(phoneNumberId)}/messages`, token, {
    method: "POST",
    body: payload,
    version,
  });

  const messageId = result.ok
    ? ((result.response as { messages?: Array<{ id?: string }> })?.messages?.[0]?.id ?? null)
    : null;

  return { ...result, messageId };
}

export async function fetchWhatsappResource({
  path,
  token,
  version,
}: {
  path: string;
  token: string;
  version?: string;
}) {
  return graphRequest(path, token, { version });
}
