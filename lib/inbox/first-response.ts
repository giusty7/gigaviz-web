export function shouldSetFirstResponseAt(params: {
  firstResponseAt?: string | null;
  lastCustomerMessageAt?: string | null;
}) {
  const { firstResponseAt, lastCustomerMessageAt } = params;
  if (firstResponseAt) return false;
  return Boolean(lastCustomerMessageAt);
}

export function computeFirstResponseAt(params: {
  firstResponseAt?: string | null;
  lastCustomerMessageAt?: string | null;
  messageTs: string;
}) {
  if (shouldSetFirstResponseAt(params)) return params.messageTs;
  return params.firstResponseAt ?? null;
}
