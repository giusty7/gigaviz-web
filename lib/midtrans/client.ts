import "server-only";

/* ------------------------------------------------------------------ */
/* Midtrans API Client                                                 */
/*                                                                     */
/* Uses raw fetch — no extra npm dependency needed.                    */
/* Supports: Snap (checkout popup) and Core API (status checks).      */
/* ------------------------------------------------------------------ */

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? "";
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY ?? "";
const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";

const SNAP_URL = IS_PRODUCTION
  ? "https://app.midtrans.com/snap/v1"
  : "https://app.sandbox.midtrans.com/snap/v1";

const CORE_API_URL = IS_PRODUCTION
  ? "https://api.midtrans.com/v2"
  : "https://api.sandbox.midtrans.com/v2";

/* ── Helpers ──────────────────────────────────────────────────────── */

function authHeader(): string {
  return `Basic ${Buffer.from(MIDTRANS_SERVER_KEY + ":").toString("base64")}`;
}

export function getMidtransConfig() {
  return {
    serverKey: MIDTRANS_SERVER_KEY,
    clientKey: MIDTRANS_CLIENT_KEY,
    isProduction: IS_PRODUCTION,
    isConfigured: Boolean(MIDTRANS_SERVER_KEY),
    snapUrl: SNAP_URL,
    coreApiUrl: CORE_API_URL,
  };
}

/* ── Types ────────────────────────────────────────────────────────── */

export type SnapTransactionParams = {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  item_details?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
  customer_details?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  callbacks?: {
    finish?: string;
    error?: string;
    pending?: string;
  };
  /** Workspace ID */
  custom_field1?: string;
  /** Plan code or "token_topup" */
  custom_field2?: string;
  /** Interval or token amount */
  custom_field3?: string;
  /** payment_intent DB id */
  custom_field4?: string;
  enabled_payments?: string[];
  expiry?: {
    start_time?: string;
    unit: "minutes" | "hours" | "days";
    duration: number;
  };
};

export type SnapResponse = {
  token: string;
  redirect_url: string;
};

export type TransactionStatusResponse = {
  transaction_id: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  currency: string;
  payment_type: string;
  transaction_status:
    | "capture"
    | "settlement"
    | "pending"
    | "deny"
    | "cancel"
    | "expire"
    | "refund"
    | "partial_refund"
    | "authorize";
  fraud_status: "accept" | "deny" | "challenge";
  status_code: string;
  status_message: string;
  transaction_time: string;
  settlement_time?: string;
  signature_key: string;
};

export type MidtransNotificationPayload = {
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_status: string;
  fraud_status: string;
  status_code: string;
  signature_key: string;
  custom_field1?: string;
  custom_field2?: string;
  custom_field3?: string;
  custom_field4?: string;
  transaction_time?: string;
  settlement_time?: string;
};

/* ── Snap API ─────────────────────────────────────────────────────── */

/**
 * Create a Snap transaction token.
 * Returns { token, redirect_url } which the frontend uses to open the Snap popup.
 */
export async function snapCreateTransaction(
  params: SnapTransactionParams
): Promise<SnapResponse> {
  if (!MIDTRANS_SERVER_KEY) {
    throw new Error("Midtrans is not configured (MIDTRANS_SERVER_KEY missing)");
  }

  const res = await fetch(`${SNAP_URL}/transactions`, {
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
    throw new Error(`Midtrans Snap error ${res.status}: ${error}`);
  }

  return res.json();
}

/* ── Core API (Status Check) ─────────────────────────────────────── */

/**
 * Get the transaction status from Midtrans Core API.
 * Used to verify notification authenticity (server-to-server check).
 */
export async function getTransactionStatus(
  orderId: string
): Promise<TransactionStatusResponse> {
  const res = await fetch(`${CORE_API_URL}/${orderId}/status`, {
    headers: {
      Accept: "application/json",
      Authorization: authHeader(),
    },
  });

  if (!res.ok) {
    const error = await res.text().catch(() => "unknown error");
    throw new Error(`Midtrans status error ${res.status}: ${error}`);
  }

  return res.json();
}

/* ── Signature Verification ──────────────────────────────────────── */

/**
 * Verify a Midtrans notification signature.
 * Signature = SHA512(order_id + status_code + gross_amount + server_key)
 */
export function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  // Use dynamic import pattern for crypto to work in Node.js runtime
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("crypto") as typeof import("crypto");
  const payload = orderId + statusCode + grossAmount + MIDTRANS_SERVER_KEY;
  const expected = crypto.createHash("sha512").update(payload).digest("hex");
  return expected === signatureKey;
}
