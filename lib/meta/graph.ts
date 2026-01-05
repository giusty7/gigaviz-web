export type MetaGraphError = {
  message?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
};

function sanitizeToken(value: string) {
  const trimmed = value.trim();
  const unquoted =
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1).trim()
      : trimmed;
  if (/\s/.test(unquoted)) {
    throw new Error("Invalid access token (contains whitespace)");
  }
  return unquoted;
}

function requiredEnvAny(names: string[], opts?: { sanitizeToken?: boolean }) {
  for (const name of names) {
    const value = process.env[name];
    if (value) {
      return opts?.sanitizeToken ? sanitizeToken(value) : value;
    }
  }
  throw new Error(`Missing env: ${names.join(" or ")}`);
}

export function getMetaAccessToken() {
  return requiredEnvAny(
    ["WA_ACCESS_TOKEN", "WA_CLOUD_API_TOKEN", "WA_CLOUD_API_SYSTEM_USER_TOKEN"],
    { sanitizeToken: true }
  );
}

export function normalizeGraphVersion(raw?: string) {
  const cleaned = (raw || "").trim();
  if (!cleaned) return "v22.0";
  return cleaned.startsWith("v") ? cleaned : `v${cleaned}`;
}

export async function fetchGraph<T>(url: string, token: string, opts?: { method?: string; body?: unknown }) {
  const res = await fetch(url, {
    method: opts?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });

  const data = (await res.json().catch(() => ({}))) as { error?: MetaGraphError };
  if (!res.ok) {
    const message =
      typeof data?.error?.message === "string"
        ? data.error.message
        : `Meta API error (${res.status})`;
    const err = new Error(message) as Error & {
      code?: number;
      subcode?: number;
      fbtrace_id?: string;
      status?: number;
    };
    err.code = data?.error?.code;
    err.subcode = data?.error?.error_subcode;
    err.fbtrace_id = data?.error?.fbtrace_id;
    err.status = res.status;
    throw err;
  }

  return data as T;
}
