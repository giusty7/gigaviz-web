import { computeFirstResponseAt, shouldSetFirstResponseAt } from "@/lib/inbox/first-response";

function assertEqual<T>(label: string, actual: T, expected: T) {
  if (actual !== expected) {
    throw new Error(`${label} expected=${String(expected)} actual=${String(actual)}`);
  }
}

const ts = "2026-01-02T10:00:00.000Z";

assertEqual(
  "should set first response when missing",
  shouldSetFirstResponseAt({
    firstResponseAt: null,
    lastCustomerMessageAt: "2026-01-02T09:00:00.000Z",
  }),
  true
);

assertEqual(
  "compute first response",
  computeFirstResponseAt({
    firstResponseAt: null,
    lastCustomerMessageAt: "2026-01-02T09:00:00.000Z",
    messageTs: ts,
  }),
  ts
);

assertEqual(
  "do not overwrite first response",
  computeFirstResponseAt({
    firstResponseAt: "2026-01-02T08:00:00.000Z",
    lastCustomerMessageAt: "2026-01-02T09:00:00.000Z",
    messageTs: ts,
  }),
  "2026-01-02T08:00:00.000Z"
);

assertEqual(
  "no customer message",
  computeFirstResponseAt({
    firstResponseAt: null,
    lastCustomerMessageAt: null,
    messageTs: ts,
  }),
  null
);
