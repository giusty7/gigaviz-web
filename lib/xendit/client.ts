import "server-only";

/* ------------------------------------------------------------------ */
/* Xendit API Client                                                   */
/*                                                                     */
/* Uses raw fetch — no extra npm dependency needed.                    */
/* Supports: Invoices (checkout) and Webhook verification.            */
/*                                                                     */
/* Xendit is Indonesia-based (HQ Jakarta) and supports:               */
/* - International cards (Visa, Mastercard, Amex, JCB)                */
/* - E-wallets (OVO, DANA, ShopeePay, LinkAja, GoPay)                */
/* - Bank transfer / VA (BCA, BNI, BRI, Mandiri, Permata, CIMB)      */
/* - QRIS                                                             */
/* - Retail outlets (Alfamart, Indomaret)                             */
/* - Multi-currency: IDR, USD, PHP, SGD, MYR, THB, VND               */
/* ------------------------------------------------------------------ */

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY ?? "";
const XENDIT_WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN ?? "";

const API_BASE = "https://api.xendit.co";

/* ── Helpers ──────────────────────────────────────────────────────── */

function authHeader(): string {
  return `Basic ${Buffer.from(XENDIT_SECRET_KEY + ":").toString("base64")}`;
}

export function getXenditConfig() {
  return {
    secretKey: XENDIT_SECRET_KEY,
    webhookToken: XENDIT_WEBHOOK_TOKEN,
    isConfigured: Boolean(XENDIT_SECRET_KEY),
    isEnabled: process.env.NEXT_PUBLIC_XENDIT_ENABLED === "1",
  };
}

/* ── Types ────────────────────────────────────────────────────────── */

export type XenditInvoiceParams = {
  external_id: string;
  amount: number;
  currency?: "IDR" | "USD" | "PHP" | "SGD" | "MYR" | "THB" | "VND";
  payer_email?: string;
  description?: string;
  invoice_duration?: number; // seconds (default 86400 = 24h)
  success_redirect_url?: string;
  failure_redirect_url?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    category?: string;
  }>;
  customer?: {
    given_names?: string;
    surname?: string;
    email?: string;
    mobile_number?: string;
  };
  /** Free-form metadata (up to 50 keys) */
  metadata?: Record<string, string>;
};

export type XenditInvoiceResponse = {
  id: string;
  external_id: string;
  user_id: string;
  status: "PENDING" | "PAID" | "SETTLED" | "EXPIRED";
  merchant_name: string;
  merchant_profile_picture_url: string;
  amount: number;
  currency: string;
  payer_email: string;
  description: string;
  invoice_url: string;
  expiry_date: string;
  created: string;
  updated: string;
};

export type XenditWebhookPayload = {
  id: string;
  external_id: string;
  user_id: string;
  is_high: boolean;
  status: "PAID" | "EXPIRED";
  merchant_name: string;
  amount: number;
  currency: string;
  paid_amount: number;
  bank_code: string;
  paid_at: string;
  payer_email: string;
  description: string;
  adjusted_received_amount: number;
  fees_paid_amount: number;
  payment_method: string;
  payment_channel: string;
  payment_destination: string;
  metadata?: Record<string, string>;
  created: string;
  updated: string;
};

/* ── Invoice API ──────────────────────────────────────────────────── */

/**
 * Create a Xendit Invoice (hosted checkout page).
 * Returns { id, invoice_url, ... } for redirecting the user.
 */
export async function createInvoice(
  params: XenditInvoiceParams
): Promise<XenditInvoiceResponse> {
  if (!XENDIT_SECRET_KEY) {
    throw new Error("Xendit is not configured (XENDIT_SECRET_KEY missing)");
  }

  const res = await fetch(`${API_BASE}/v2/invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const error = await res.text().catch(() => "unknown error");
    throw new Error(`Xendit Invoice error ${res.status}: ${error}`);
  }

  return res.json();
}

/* ── Get Invoice Status ───────────────────────────────────────────── */

/**
 * Get the current status of a Xendit Invoice.
 * Used for server-to-server verification.
 */
export async function getInvoiceStatus(
  invoiceId: string
): Promise<XenditInvoiceResponse> {
  const res = await fetch(`${API_BASE}/v2/invoices/${invoiceId}`, {
    headers: {
      Accept: "application/json",
      Authorization: authHeader(),
    },
  });

  if (!res.ok) {
    const error = await res.text().catch(() => "unknown error");
    throw new Error(`Xendit status error ${res.status}: ${error}`);
  }

  return res.json();
}

/* ── Webhook Verification ─────────────────────────────────────────── */

/**
 * Verify a Xendit webhook callback.
 * Xendit sends a x-callback-token header that must match
 * the XENDIT_WEBHOOK_TOKEN configured in the dashboard.
 */
export function verifyWebhookToken(callbackToken: string): boolean {
  if (!XENDIT_WEBHOOK_TOKEN) {
    throw new Error("Xendit webhook token not configured");
  }
  return callbackToken === XENDIT_WEBHOOK_TOKEN;
}
