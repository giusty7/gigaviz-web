import { logger } from "@/lib/logging";

// NOTE: verify against latest Meta docs for template endpoints/payload.
type MetaTemplateComponent =
  | { type: "BODY"; text: string }
  | { type: "HEADER"; format: "TEXT"; text: string }
  | { type: "FOOTER"; text: string }
  | { type: "BUTTONS"; buttons: Array<{ type: "QUICK_REPLY"; text: string }> };

export type TemplateInput = {
  name: string;
  category: string;
  language: string;
  body: string;
  header?: string | null;
  footer?: string | null;
  buttons?: Array<{ type: "QUICK_REPLY"; text: string }>;
};

type MetaTemplatePayload = {
  name: string;
  category: string;
  language: string;
  components: MetaTemplateComponent[];
};

type MetaApiError = {
  message?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
};

type MetaTemplatesResponse = {
  data?: Array<{
    id?: string;
    name?: string;
    status?: string;
    category?: string;
    language?: string;
  }>;
  paging?: {
    cursors?: {
      after?: string;
    };
    next?: string;
  };
  error?: MetaApiError;
};

type MetaTemplateItem = NonNullable<MetaTemplatesResponse["data"]>[number];

function sanitizeToken(value: string) {
  const trimmed = value.trim();
  const unquoted =
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1).trim()
      : trimmed;
  if (/\s/.test(unquoted)) {
    throw new Error("Invalid WA access token (contains whitespace)");
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

function normalizeGraphVersion(raw?: string) {
  const cleaned = (raw || "").trim();
  if (!cleaned) return "v22.0";
  return cleaned.startsWith("v") ? cleaned : `v${cleaned}`;
}

function buildTemplatesUrl(version: string, wabaId: string, params?: Record<string, string>) {
  const url = new URL(`https://graph.facebook.com/${version}/${wabaId}/message_templates`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
  }
  return url;
}

export function buildTemplatePayload(input: TemplateInput): MetaTemplatePayload {
  const components: MetaTemplateComponent[] = [];
  components.push({ type: "BODY", text: input.body });

  if (input.header) {
    components.push({ type: "HEADER", format: "TEXT", text: input.header });
  }

  if (input.footer) {
    components.push({ type: "FOOTER", text: input.footer });
  }

  if (input.buttons && input.buttons.length > 0) {
    components.push({ type: "BUTTONS", buttons: input.buttons });
  }

  return {
    name: input.name,
    category: input.category,
    language: input.language,
    components,
  };
}

export async function createMetaTemplate(payload: MetaTemplatePayload) {
  const token = requiredEnvAny(["WA_ACCESS_TOKEN", "WA_CLOUD_API_TOKEN"], {
    sanitizeToken: true,
  });
  const wabaId = requiredEnvAny(["WA_WABA_ID"]);
  const version = normalizeGraphVersion(process.env.WA_GRAPH_VERSION);
  const url = buildTemplatesUrl(version, wabaId);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as { error?: MetaApiError };
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
      requestUrl?: string;
    };
    err.code = data?.error?.code;
    err.subcode = data?.error?.error_subcode;
    err.fbtrace_id = data?.error?.fbtrace_id;
    err.status = res.status;
    err.requestUrl = url.toString();
    throw err;
  }

  return data;
}

export async function fetchMetaTemplates() {
  const token = requiredEnvAny(["WA_ACCESS_TOKEN", "WA_CLOUD_API_TOKEN"], {
    sanitizeToken: true,
  });
  const wabaId = requiredEnvAny(["WA_WABA_ID"]);
  const version = normalizeGraphVersion(process.env.WA_GRAPH_VERSION);
  const fields = "name,language,status,category,id";

  const templates: MetaTemplateItem[] = [];
  let after: string | null = null;

  do {
    const url = buildTemplatesUrl(version, wabaId, {
      fields,
      limit: "250",
      after: after ?? "",
    });

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = (await res.json().catch(() => ({}))) as MetaTemplatesResponse;
    if (!res.ok) {
      const message =
        typeof data?.error?.message === "string"
          ? data.error.message
          : `Meta API error (${res.status})`;
      logger.info(
        "WA_TEMPLATES_FETCH_FAILED",
        JSON.stringify({ url: url.toString(), status: res.status, message })
      );
      const err = new Error(message) as Error & {
        code?: number;
        subcode?: number;
        fbtrace_id?: string;
        status?: number;
        requestUrl?: string;
      };
      err.code = data?.error?.code;
      err.subcode = data?.error?.error_subcode;
      err.fbtrace_id = data?.error?.fbtrace_id;
      err.status = res.status;
      err.requestUrl = url.toString();
      throw err;
    }

    if (Array.isArray(data.data)) {
      templates.push(...data.data);
    }

    const nextAfter =
      typeof data?.paging?.cursors?.after === "string"
        ? data.paging.cursors.after
        : null;
    after = nextAfter;
  } while (after);

  return { data: templates };
}
