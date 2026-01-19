import "server-only";

const CONNECTION_TEST_ENVS = ["META_APP_ID", "META_APP_SECRET"] as const;
const WEBHOOK_VERIFY_ENVS = [
  "META_WEBHOOK_VERIFY_TOKEN",
  "WA_WEBHOOK_VERIFY_TOKEN",
  "WEBHOOK_VERIFY_TOKEN",
] as const;

export type MetaHubTestEnvStatus = {
  connectionTestMissing: string[];
  webhookPingMissing: string[];
};

export function getWebhookVerifyToken() {
  return (
    process.env.META_WEBHOOK_VERIFY_TOKEN ||
    process.env.WA_WEBHOOK_VERIFY_TOKEN ||
    process.env.WEBHOOK_VERIFY_TOKEN ||
    ""
  );
}

export function getMetaHubTestEnvStatus(): MetaHubTestEnvStatus {
  const connectionTestMissing = CONNECTION_TEST_ENVS.filter((name) => !process.env[name]);
  const webhookPingMissing = getWebhookVerifyToken() ? [] : [...WEBHOOK_VERIFY_ENVS];
  return { connectionTestMissing, webhookPingMissing };
}
