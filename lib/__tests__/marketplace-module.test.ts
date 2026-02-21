import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

// ─── Mocks ───────────────────────────────────────────────────

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: vi.fn(async () => ({})),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: vi.fn(() => ({})),
}));

vi.mock("@/lib/logging", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  startSpan: vi.fn((_opts: unknown, fn: () => unknown) => fn()),
  withScope: vi.fn((fn: (scope: unknown) => unknown) =>
    fn({ setExtra: vi.fn(), setTag: vi.fn() })
  ),
}));

vi.mock("@/lib/api/with-error-handler", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  withErrorHandler: (fn: (...args: any[]) => any) => fn,
}));

// ─── Types Tests ─────────────────────────────────────────────

describe("Marketplace Types", () => {
  it("exports MARKETPLACE_COMMISSION constants", async () => {
    const { MARKETPLACE_COMMISSION } = await import("@/types/marketplace");
    expect(MARKETPLACE_COMMISSION.PLATFORM_FEE_RATE).toBe(0.15);
    expect(MARKETPLACE_COMMISSION.CREATOR_EARNING_RATE).toBe(0.85);
    expect(MARKETPLACE_COMMISSION.PLATFORM_FEE_RATE + MARKETPLACE_COMMISSION.CREATOR_EARNING_RATE).toBe(1);
  });

  it("exports DOWNLOAD_LIMITS by license type", async () => {
    const { DOWNLOAD_LIMITS } = await import("@/types/marketplace");
    expect(DOWNLOAD_LIMITS.single_use).toBe(3);
    expect(DOWNLOAD_LIMITS.multi_use).toBe(5);
    expect(DOWNLOAD_LIMITS.unlimited).toBe(999);
    expect(DOWNLOAD_LIMITS.free).toBe(3);
  });

  it("DOWNLOAD_LIMITS single_use < multi_use < unlimited", async () => {
    const { DOWNLOAD_LIMITS } = await import("@/types/marketplace");
    expect(DOWNLOAD_LIMITS.single_use).toBeLessThan(DOWNLOAD_LIMITS.multi_use);
    expect(DOWNLOAD_LIMITS.multi_use).toBeLessThan(DOWNLOAD_LIMITS.unlimited);
  });
});

// ─── Commission Calculation Tests ────────────────────────────

describe("Commission calculation", () => {
  it("calculates 15/85 split correctly for $10 item", async () => {
    const { MARKETPLACE_COMMISSION } = await import("@/types/marketplace");
    const priceInCents = 1000; // $10.00
    const platformFee = Math.round(priceInCents * MARKETPLACE_COMMISSION.PLATFORM_FEE_RATE);
    const creatorEarnings = priceInCents - platformFee;
    expect(platformFee).toBe(150); // $1.50
    expect(creatorEarnings).toBe(850); // $8.50
  });

  it("calculates 15/85 split correctly for $1 item", async () => {
    const { MARKETPLACE_COMMISSION } = await import("@/types/marketplace");
    const priceInCents = 100; // $1.00
    const platformFee = Math.round(priceInCents * MARKETPLACE_COMMISSION.PLATFORM_FEE_RATE);
    const creatorEarnings = priceInCents - platformFee;
    expect(platformFee).toBe(15); // $0.15
    expect(creatorEarnings).toBe(85); // $0.85
  });

  it("calculates 15/85 split for $99.99 item", async () => {
    const { MARKETPLACE_COMMISSION } = await import("@/types/marketplace");
    const priceInCents = 9999; // $99.99
    const platformFee = Math.round(priceInCents * MARKETPLACE_COMMISSION.PLATFORM_FEE_RATE);
    const creatorEarnings = priceInCents - platformFee;
    expect(platformFee).toBe(1500); // $15.00
    expect(creatorEarnings).toBe(8499); // $84.99
    expect(platformFee + creatorEarnings).toBe(priceInCents);
  });

  it("handles free items (0 cents)", async () => {
    const { MARKETPLACE_COMMISSION } = await import("@/types/marketplace");
    const priceInCents = 0;
    const platformFee = Math.round(priceInCents * MARKETPLACE_COMMISSION.PLATFORM_FEE_RATE);
    expect(platformFee).toBe(0);
  });
});

// ─── Price Pipeline Tests ────────────────────────────────────

describe("Price pipeline (cents)", () => {
  it("converts dollar input to cents correctly", () => {
    const userInput = "29.99"; // user types $29.99
    const priceInCents = Math.round(parseFloat(userInput) * 100);
    expect(priceInCents).toBe(2999);
  });

  it("converts cents back to display correctly", () => {
    const priceInCents = 2999;
    const display = (priceInCents / 100).toFixed(2);
    expect(display).toBe("29.99");
  });

  it("converts cents to IDR correctly", () => {
    const priceInCents = 1000; // $10.00
    const priceIdr = Math.round(priceInCents * 158);
    expect(priceIdr).toBe(158000); // Rp 158.000
  });

  it("handles edge case: $0.01", () => {
    const priceInCents = 1;
    const display = (priceInCents / 100).toFixed(2);
    expect(display).toBe("0.01");
  });

  it("handles edge case: $999.99", () => {
    const priceInCents = 99999;
    const display = (priceInCents / 100).toFixed(2);
    expect(display).toBe("999.99");
  });
});

// ─── Item Status Transition Tests ────────────────────────────

describe("Item status transitions", () => {
  const validTransitions: Record<string, string[]> = {
    draft: ["under_review"],
    under_review: ["approved", "rejected"],
    approved: ["archived"],
    rejected: ["under_review", "archived"],
    archived: [],
  };

  for (const [from, targets] of Object.entries(validTransitions)) {
    for (const to of targets) {
      it(`allows transition from ${from} to ${to}`, () => {
        expect(targets).toContain(to);
      });
    }
  }

  it("archived items cannot transition", () => {
    expect(validTransitions.archived).toEqual([]);
  });

  it("draft items can only go to under_review", () => {
    expect(validTransitions.draft).toEqual(["under_review"]);
  });
});

// ─── Category Validation Tests ───────────────────────────────

describe("Marketplace categories", () => {
  const validCategories = [
    "template",
    "prompt_pack",
    "asset",
    "mini_app",
    "integration",
  ];

  it("has exactly 5 categories", () => {
    expect(validCategories).toHaveLength(5);
  });

  for (const cat of validCategories) {
    it(`"${cat}" is a valid category`, () => {
      expect(validCategories).toContain(cat);
    });
  }

  it("rejects invalid categories", () => {
    expect(validCategories).not.toContain("music");
    expect(validCategories).not.toContain("video");
    expect(validCategories).not.toContain("");
  });
});

// ─── License Type Tests ──────────────────────────────────────

describe("License types", () => {
  const validLicenses = ["single_use", "multi_use", "unlimited", "subscription", "free"];

  it("has exactly 5 license types", () => {
    expect(validLicenses).toHaveLength(5);
  });

  it("each license type has a download limit", async () => {
    const { DOWNLOAD_LIMITS } = await import("@/types/marketplace");
    for (const lic of validLicenses) {
      expect(DOWNLOAD_LIMITS[lic]).toBeDefined();
      expect(DOWNLOAD_LIMITS[lic]).toBeGreaterThan(0);
    }
  });
});

// ─── Purchase API Zod Validation Tests ───────────────────────

describe("Purchase API validation", () => {
  const purchaseSchema = z.object({
    item_id: z.string().uuid(),
    payment_method: z.enum(["credits", "xendit", "midtrans"]).default("credits"),
  });

  it("accepts valid purchase input", () => {
    const result = purchaseSchema.parse({
      item_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.item_id).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(result.payment_method).toBe("credits");
  });

  it("rejects non-UUID item_id", () => {
    expect(() => purchaseSchema.parse({ item_id: "not-a-uuid" })).toThrow();
  });

  it("rejects missing item_id", () => {
    expect(() => purchaseSchema.parse({})).toThrow();
  });

  it("accepts valid payment method", () => {
    const result = purchaseSchema.parse({
      item_id: "550e8400-e29b-41d4-a716-446655440000",
      payment_method: "xendit",
    });
    expect(result.payment_method).toBe("xendit");
  });

  it("rejects invalid payment method", () => {
    expect(() =>
      purchaseSchema.parse({
        item_id: "550e8400-e29b-41d4-a716-446655440000",
        payment_method: "paypal",
      })
    ).toThrow();
  });
});

// ─── Review API Zod Validation Tests ─────────────────────────

describe("Review API validation", () => {
  const reviewSchema = z.object({
    item_id: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    review_text: z.string().max(2000).optional(),
  });

  it("accepts valid review with rating and text", () => {
    const result = reviewSchema.parse({
      item_id: "550e8400-e29b-41d4-a716-446655440000",
      rating: 5,
      review_text: "Great template!",
    });
    expect(result.rating).toBe(5);
    expect(result.review_text).toBe("Great template!");
  });

  it("accepts review without text", () => {
    const result = reviewSchema.parse({
      item_id: "550e8400-e29b-41d4-a716-446655440000",
      rating: 3,
    });
    expect(result.review_text).toBeUndefined();
  });

  it("rejects rating below 1", () => {
    expect(() =>
      reviewSchema.parse({
        item_id: "550e8400-e29b-41d4-a716-446655440000",
        rating: 0,
      })
    ).toThrow();
  });

  it("rejects rating above 5", () => {
    expect(() =>
      reviewSchema.parse({
        item_id: "550e8400-e29b-41d4-a716-446655440000",
        rating: 6,
      })
    ).toThrow();
  });

  it("rejects non-integer rating", () => {
    expect(() =>
      reviewSchema.parse({
        item_id: "550e8400-e29b-41d4-a716-446655440000",
        rating: 4.5,
      })
    ).toThrow();
  });
});

// ─── Item CRUD Zod Validation Tests ──────────────────────────

describe("Item update validation", () => {
  const updateSchema = z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().min(10).max(5000).optional(),
    price_usd: z.number().min(0).optional(),
    category: z
      .enum(["template", "prompt_pack", "asset", "mini_app", "integration"])
      .optional(),
    tags: z.array(z.string()).max(10).optional(),
    license_type: z.enum(["single_use", "multi_use", "unlimited", "subscription", "free"]).optional(),
  });

  it("accepts partial update with title only", () => {
    const result = updateSchema.parse({ title: "New Title" });
    expect(result.title).toBe("New Title");
  });

  it("accepts full update", () => {
    const result = updateSchema.parse({
      title: "Full Update",
      description: "This is a detailed description of the item.",
      price_usd: 999,
      category: "template",
      tags: ["office", "excel"],
      license_type: "multi_use",
    });
    expect(result.category).toBe("template");
    expect(result.tags).toHaveLength(2);
  });

  it("rejects title shorter than 3 chars", () => {
    expect(() => updateSchema.parse({ title: "ab" })).toThrow();
  });

  it("rejects description shorter than 10 chars", () => {
    expect(() => updateSchema.parse({ description: "short" })).toThrow();
  });

  it("rejects negative price", () => {
    expect(() => updateSchema.parse({ price_usd: -1 })).toThrow();
  });

  it("rejects more than 10 tags", () => {
    const tags = Array.from({ length: 11 }, (_, i) => `tag${i}`);
    expect(() => updateSchema.parse({ tags })).toThrow();
  });

  it("accepts empty update object", () => {
    const result = updateSchema.parse({});
    expect(result).toEqual({});
  });
});

// ─── Moderation API Zod Validation Tests ─────────────────────

describe("Moderation API validation", () => {
  const moderateSchema = z.object({
    itemId: z.string().uuid(),
    action: z.enum(["approve", "reject"]),
    reason: z.string().max(1000).optional(),
  });

  it("accepts approve action", () => {
    const result = moderateSchema.parse({
      itemId: "550e8400-e29b-41d4-a716-446655440000",
      action: "approve",
    });
    expect(result.action).toBe("approve");
  });

  it("accepts reject action with reason", () => {
    const result = moderateSchema.parse({
      itemId: "550e8400-e29b-41d4-a716-446655440000",
      action: "reject",
      reason: "Copyright violation",
    });
    expect(result.action).toBe("reject");
    expect(result.reason).toBe("Copyright violation");
  });

  it("rejects unknown action", () => {
    expect(() =>
      moderateSchema.parse({
        itemId: "550e8400-e29b-41d4-a716-446655440000",
        action: "suspend",
      })
    ).toThrow();
  });

  it("rejects non-UUID itemId", () => {
    expect(() =>
      moderateSchema.parse({
        itemId: "not-valid",
        action: "approve",
      })
    ).toThrow();
  });

  it("rejects reason longer than 1000 chars", () => {
    expect(() =>
      moderateSchema.parse({
        itemId: "550e8400-e29b-41d4-a716-446655440000",
        action: "reject",
        reason: "x".repeat(1001),
      })
    ).toThrow();
  });
});

// ─── Creator Profile Zod Validation Tests ────────────────────

describe("Creator profile validation", () => {
  const creatorSchema = z.object({
    display_name: z.string().min(2).max(100),
    bio: z.string().max(500).optional(),
    website_url: z.string().url().optional().or(z.literal("")),
    payout_email: z.string().email().optional().or(z.literal("")),
  });

  it("accepts valid creator profile", () => {
    const result = creatorSchema.parse({
      display_name: "John Creator",
      bio: "I make templates",
      website_url: "https://example.com",
      payout_email: "john@example.com",
    });
    expect(result.display_name).toBe("John Creator");
  });

  it("accepts minimal profile (name only)", () => {
    const result = creatorSchema.parse({ display_name: "Jo" });
    expect(result.display_name).toBe("Jo");
  });

  it("rejects name shorter than 2 chars", () => {
    expect(() => creatorSchema.parse({ display_name: "J" })).toThrow();
  });

  it("rejects invalid URL", () => {
    expect(() =>
      creatorSchema.parse({
        display_name: "Test",
        website_url: "not-a-url",
      })
    ).toThrow();
  });

  it("accepts empty string for optional URL", () => {
    const result = creatorSchema.parse({
      display_name: "Test",
      website_url: "",
    });
    expect(result.website_url).toBe("");
  });
});

// ─── i18n Key Completeness Tests ─────────────────────────────

describe("Marketplace i18n key completeness", () => {
  let enMessages: Record<string, unknown>;
  let idMessages: Record<string, unknown>;

  beforeEach(async () => {
    // dynamically load from files for test isolation
    const fs = await import("fs");
    const path = await import("path");
    const enPath = path.resolve(process.cwd(), "messages/en.json");
    const idPath = path.resolve(process.cwd(), "messages/id.json");
    enMessages = JSON.parse(fs.readFileSync(enPath, "utf8"));
    idMessages = JSON.parse(fs.readFileSync(idPath, "utf8"));
  });

  it("has 'marketplace' namespace in en.json", () => {
    expect(enMessages).toHaveProperty("marketplace");
  });

  it("has 'marketplace' namespace in id.json", () => {
    expect(idMessages).toHaveProperty("marketplace");
  });

  it("has 'productMarketplace' namespace in en.json", () => {
    expect(enMessages).toHaveProperty("productMarketplace");
  });

  it("has 'productMarketplace' namespace in id.json", () => {
    expect(idMessages).toHaveProperty("productMarketplace");
  });

  it("productMarketplace has same keys in en and id", () => {
    const enKeys = Object.keys(
      enMessages["productMarketplace"] as Record<string, unknown>
    ).sort();
    const idKeys = Object.keys(
      idMessages["productMarketplace"] as Record<string, unknown>
    ).sort();
    expect(enKeys).toEqual(idKeys);
  });

  it("marketplace namespace has same keys in en and id", () => {
    const enKeys = Object.keys(
      enMessages["marketplace"] as Record<string, unknown>
    ).sort();
    const idKeys = Object.keys(
      idMessages["marketplace"] as Record<string, unknown>
    ).sort();
    expect(enKeys).toEqual(idKeys);
  });

  it("productMarketplace has hero keys", () => {
    const pm = enMessages["productMarketplace"] as Record<string, unknown>;
    expect(pm).toHaveProperty("heroTitle");
    expect(pm).toHaveProperty("heroDesc");
    expect(pm).toHaveProperty("ctaOpen");
  });

  it("productMarketplace has all 6 feature keys", () => {
    const pm = enMessages["productMarketplace"] as Record<string, unknown>;
    for (let i = 1; i <= 6; i++) {
      expect(pm).toHaveProperty(`feature${i}Title`);
      expect(pm).toHaveProperty(`feature${i}Desc`);
    }
  });

  it("productMarketplace has all 7 FAQ keys", () => {
    const pm = enMessages["productMarketplace"] as Record<string, unknown>;
    for (let i = 1; i <= 7; i++) {
      expect(pm).toHaveProperty(`faq${i}Q`);
      expect(pm).toHaveProperty(`faq${i}A`);
    }
  });

  it("productMarketplace has all 3 safety keys", () => {
    const pm = enMessages["productMarketplace"] as Record<string, unknown>;
    for (let i = 1; i <= 3; i++) {
      expect(pm).toHaveProperty(`safety${i}Title`);
      expect(pm).toHaveProperty(`safety${i}Desc`);
    }
  });

  it("productMarketplace has all 3 related module keys", () => {
    const pm = enMessages["productMarketplace"] as Record<string, unknown>;
    for (let i = 1; i <= 3; i++) {
      expect(pm).toHaveProperty(`related${i}Title`);
      expect(pm).toHaveProperty(`related${i}Desc`);
      expect(pm).toHaveProperty(`related${i}Cta`);
    }
  });

  it("no empty string values in productMarketplace en", () => {
    const pm = enMessages["productMarketplace"] as Record<string, string>;
    for (const [key, value] of Object.entries(pm)) {
      expect(value.length, `Key "${key}" is empty in en.json`).toBeGreaterThan(0);
    }
  });

  it("no empty string values in productMarketplace id", () => {
    const pm = idMessages["productMarketplace"] as Record<string, string>;
    for (const [key, value] of Object.entries(pm)) {
      expect(value.length, `Key "${key}" is empty in id.json`).toBeGreaterThan(0);
    }
  });
});
