import { createHmac, timingSafeEqual } from "node:crypto";

type SignedRequestResult = {
  ok: boolean;
  payload?: Record<string, unknown>;
  error?: string;
};

function base64UrlToBuffer(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64");
}

function decodePayload(input: string) {
  return JSON.parse(base64UrlToBuffer(input).toString("utf8")) as Record<string, unknown>;
}

export function verifySignedRequest(
  signedRequest: string,
  appSecret: string
): SignedRequestResult {
  const parts = signedRequest.split(".", 2);
  if (parts.length !== 2) {
    return { ok: false, error: "signed_request_malformed" };
  }

  const [encodedSig, encodedPayload] = parts;
  const expected = createHmac("sha256", appSecret)
    .update(encodedPayload)
    .digest();
  const provided = base64UrlToBuffer(encodedSig);

  if (provided.length !== expected.length) {
    return { ok: false, error: "signed_request_invalid_signature" };
  }

  if (!timingSafeEqual(provided, expected)) {
    return { ok: false, error: "signed_request_invalid_signature" };
  }

  try {
    const payload = decodePayload(encodedPayload);
    return { ok: true, payload };
  } catch {
    return { ok: false, error: "signed_request_invalid_payload" };
  }
}
