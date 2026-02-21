/**
 * Sprint 14-15: i18n meta-hub and helper namespace completeness tests
 * Ensures all new translation keys exist in both en.json and id.json
 */
import { describe, it, expect } from "vitest";
import en from "@/messages/en.json";
import id from "@/messages/id.json";

describe("metaHub i18n namespace", () => {
  const requiredKeys = [
    "title",
    "subtitle",
    "connections",
    "templates",
    "inbox",
    "webhooks",
    "delivery",
    "analytics",
    "testConnection",
    "testWebhook",
    "noConnections",
    "connectWhatsApp",
  ];

  const channelKeys = [
    "channelWhatsApp",
    "channelWhatsAppDesc",
    "channelInstagram",
    "channelInstagramDesc",
    "channelMessenger",
    "channelMessengerDesc",
    "channelAds",
    "channelAdsDesc",
    "channelInsights",
    "channelInsightsDesc",
  ];

  const statusKeys = [
    "statusConnected",
    "statusNotConnected",
    "statusComingSoon",
    "statusNotifyMe",
  ];

  const pageKeys = [
    "devFullAccess",
    "approvedTemplates",
    "noTemplatesYet",
    "messengerTitle",
    "messengerDesc",
    "instagramTitle",
    "instagramDesc",
    "aiReplyTitle",
    "aiReplyDesc",
    "adsTitle",
    "adsDesc",
    "settingsTitle",
  ];

  it.each(requiredKeys)("en.json has metaHub.%s", (key) => {
    expect(en.metaHub).toHaveProperty(key);
  });

  it.each(requiredKeys)("id.json has metaHub.%s", (key) => {
    expect(id.metaHub).toHaveProperty(key);
  });

  it.each(channelKeys)("en.json has metaHub.%s", (key) => {
    expect(en.metaHub).toHaveProperty(key);
  });

  it.each(channelKeys)("id.json has metaHub.%s", (key) => {
    expect(id.metaHub).toHaveProperty(key);
  });

  it.each(statusKeys)("en.json has metaHub.%s", (key) => {
    expect(en.metaHub).toHaveProperty(key);
  });

  it.each(statusKeys)("id.json has metaHub.%s", (key) => {
    expect(id.metaHub).toHaveProperty(key);
  });

  it.each(pageKeys)("en.json has metaHub.%s", (key) => {
    expect(en.metaHub).toHaveProperty(key);
  });

  it.each(pageKeys)("id.json has metaHub.%s", (key) => {
    expect(id.metaHub).toHaveProperty(key);
  });

  it("all metaHub values are non-empty strings or nested objects in en.json", () => {
    for (const [key, value] of Object.entries(en.metaHub)) {
      expect(value, `metaHub.${key} should not be empty`).toBeTruthy();
      const t = typeof value;
      expect(
        t === "string" || t === "object",
        `metaHub.${key} should be string or object, got ${t}`
      ).toBe(true);
    }
  });

  it("all metaHub values are non-empty strings or nested objects in id.json", () => {
    for (const [key, value] of Object.entries(id.metaHub)) {
      expect(value, `metaHub.${key} should not be empty`).toBeTruthy();
      const t = typeof value;
      expect(
        t === "string" || t === "object",
        `metaHub.${key} should be string or object, got ${t}`
      ).toBe(true);
    }
  });

  it("en.json and id.json have same metaHub keys", () => {
    const enKeys = Object.keys(en.metaHub).sort();
    const idKeys = Object.keys(id.metaHub).sort();
    expect(enKeys).toEqual(idKeys);
  });

  it("approvedTemplates has ICU placeholder in both locales", () => {
    expect(en.metaHub.approvedTemplates).toContain("{count}");
    expect(id.metaHub.approvedTemplates).toContain("{count}");
  });
});

describe("helper i18n namespace", () => {
  const baseKeys = [
    "title",
    "subtitle",
    "newChat",
    "placeholder",
    "thinking",
    "noConversations",
    "knowledgeBase",
    "workflows",
  ];

  const subPageKeys = [
    "disabledMessage",
    "leadsTitle",
    "leadsDesc",
    "workflowsTitle",
    "workflowsDesc",
    "knowledgeTitle",
    "knowledgeDesc",
    "crmTitle",
    "crmDesc",
    "historyTitle",
    "historyDesc",
    "analyticsTitle",
    "analyticsDesc",
    "aiStudioTitle",
    "aiStudioDesc",
    "unknownWorkflow",
  ];

  it.each(baseKeys)("en.json has helper.%s", (key) => {
    expect(en.helper).toHaveProperty(key);
  });

  it.each(baseKeys)("id.json has helper.%s", (key) => {
    expect(id.helper).toHaveProperty(key);
  });

  it.each(subPageKeys)("en.json has helper.%s", (key) => {
    expect(en.helper).toHaveProperty(key);
  });

  it.each(subPageKeys)("id.json has helper.%s", (key) => {
    expect(id.helper).toHaveProperty(key);
  });

  it("all helper values are non-empty strings or objects in en.json", () => {
    for (const [key, value] of Object.entries(en.helper)) {
      expect(value, `helper.${key} should not be empty`).toBeTruthy();
      if (typeof value === "object" && value !== null) {
        // Nested namespace (e.g. crm, leads) — verify all nested values are strings
        for (const [subKey, subValue] of Object.entries(value as Record<string, unknown>)) {
          expect(typeof subValue, `helper.${key}.${subKey} should be string`).toBe("string");
          expect(subValue, `helper.${key}.${subKey} should not be empty`).toBeTruthy();
        }
      } else {
        expect(typeof value, `helper.${key} should be string`).toBe("string");
      }
    }
  });

  it("all helper values are non-empty strings or objects in id.json", () => {
    for (const [key, value] of Object.entries(id.helper)) {
      expect(value, `helper.${key} should not be empty`).toBeTruthy();
      if (typeof value === "object" && value !== null) {
        for (const [subKey, subValue] of Object.entries(value as Record<string, unknown>)) {
          expect(typeof subValue, `helper.${key}.${subKey} should be string`).toBe("string");
          expect(subValue, `helper.${key}.${subKey} should not be empty`).toBeTruthy();
        }
      } else {
        expect(typeof value, `helper.${key} should be string`).toBe("string");
      }
    }
  });

  it("en.json and id.json have same helper keys", () => {
    const enKeys = Object.keys(en.helper).sort();
    const idKeys = Object.keys(id.helper).sort();
    expect(enKeys).toEqual(idKeys);
  });
});

describe("inbox i18n namespace", () => {
  const requiredKeys = [
    "title",
    "allConversations",
    "unread",
    "assigned",
    "unassigned",
    "resolved",
    "noMessages",
    "typeMessage",
    "send",
    "assign",
    "resolve",
    "reopen",
  ];

  it.each(requiredKeys)("en.json has inbox.%s", (key) => {
    expect(en.inbox).toHaveProperty(key);
  });

  it.each(requiredKeys)("id.json has inbox.%s", (key) => {
    expect(id.inbox).toHaveProperty(key);
  });

  it("en.json and id.json have same inbox keys", () => {
    const enKeys = Object.keys(en.inbox).sort();
    const idKeys = Object.keys(id.inbox).sort();
    expect(enKeys).toEqual(idKeys);
  });
});

describe("billing i18n namespace", () => {
  const paymentKeys = [
    "treasury",
    "tokenWallet",
    "balance",
    "topUp",
    "payWithCard",
    "manualTransfer",
    "topUpCreated",
    "topUpConfirmed",
    "checkoutFailed",
    "featureAccess",
    "available",
    "locked",
  ];

  it.each(paymentKeys)("en.json has billing.%s", (key) => {
    expect(en.billing).toHaveProperty(key);
  });

  it.each(paymentKeys)("id.json has billing.%s", (key) => {
    expect(id.billing).toHaveProperty(key);
  });

  it("billing namespace has ICU count placeholder for tokens", () => {
    expect(en.billing.tokens).toContain("{count}");
    expect(id.billing.tokens).toContain("{count}");
  });

  it("billing namespace has ICU count placeholder for seats", () => {
    expect(en.billing.seats).toContain("{count}");
    expect(id.billing.seats).toContain("{count}");
  });

  it("billing namespace has ICU plan placeholder", () => {
    expect(en.billing.planActivated).toContain("{plan}");
    expect(id.billing.planActivated).toContain("{plan}");
  });
});
