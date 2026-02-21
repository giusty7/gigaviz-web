// @vitest-environment jsdom

/**
 * Component tests for BillingSummaryClient.
 *
 * BillingSummaryClient displays the current billing plan, status, period,
 * and upgrade button (with optional Midtrans Snap integration).
 * Tests cover: loading state, plan rendering, upgrade click, error display.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import React from "react";

/* ── Mocks ── */
const toastMock = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    const map: Record<string, string> = {
      treasury: "Treasury",
      loading: "Loading…",
      active: "Active",
      planCode: "Plan Code",
      billingPeriod: "Billing Period",
      periodNotAvailable: "N/A",
      seatLimit: "Seat Limit",
      seats: `${params?.count ?? 0} seats`,
      enterpriseSecurity: "Enterprise Security",
      upgradePlan: "Upgrade Plan",
      processing: "Processing…",
      upgradeEmpire: "Upgrade Your Empire",
      contactSalesDesc: "Contact our team to discuss enterprise features.",
      contactSales: "Contact Sales",
      refresh: "Refresh",
      failedLoadBilling: "Failed to load billing",
      tryAgainLater: "Try again later",
      upgradeFailed: "Upgrade failed",
      subscriptionActivated: "Subscription activated",
      planActivated: `${params?.plan ?? ""} activated`,
      waitingActivation: "Waiting for activation",
    };
    return map[key] ?? key;
  },
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

// Mock next/link
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

// Mock framer-motion to render plain divs (all mock helpers inline to survive vi.mock hoisting)
vi.mock("framer-motion", async () => {
  const React = await import("react");
  const MOTION_KEYS = new Set(["initial", "animate", "transition", "whileHover", "whileTap", "whileInView", "exit", "variants", "layout"]);
  function filterMotionProps(props: Record<string, unknown>) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(props)) {
      if (!MOTION_KEYS.has(k)) out[k] = v;
    }
    return out;
  }
  const MockSection = React.forwardRef(
    function MockSection({ children, ...rest }: React.PropsWithChildren<Record<string, unknown>>, ref: React.Ref<HTMLElement>) {
      return React.createElement("section", { ref, ...filterMotionProps(rest) }, children);
    }
  );
  const MockDiv = React.forwardRef(
    function MockDiv({ children, ...rest }: React.PropsWithChildren<Record<string, unknown>>, ref: React.Ref<HTMLDivElement>) {
      return React.createElement("div", { ref, ...filterMotionProps(rest) }, children);
    }
  );
  return {
    motion: { section: MockSection, div: MockDiv },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  };
});

import { BillingSummaryClient } from "@/components/billing/BillingSummaryClient";
import type { BillingSummary } from "@/lib/billing/summary";

/* ── Fixtures ── */
const mockSummary: BillingSummary = {
  plan: { name: "Team Plan", code: "team", price_idr: 150000, seat_limit: 10 },
  subscription: {
    id: "sub-1",
    plan_code: "team",
    status: "active",
    current_period_start: "2026-02-01",
    current_period_end: "2026-03-01",
  },
  statusLabel: "Active",
  periodLabel: "Feb 1 – Mar 1, 2026",
  plans: [
    { code: "free", name: "Free", price_idr: 0 },
    { code: "team", name: "Team Plan", price_idr: 150000 },
    { code: "enterprise", name: "Enterprise", price_idr: 500000 },
  ],
  wallet: { balance: 25000 },
} as unknown as BillingSummary;

const defaultProps = {
  workspaceId: "ws-123",
  workspaceSlug: "acme",
  initialSummary: mockSummary,
  midtransEnabled: false,
};

function renderBilling(overrides: Partial<typeof defaultProps> = {}) {
  return render(<BillingSummaryClient {...defaultProps} {...overrides} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ ok: true, summary: mockSummary }),
  });
});

/* ------------------------------------------------------------------ */
/*  Rendering with initial data                                        */
/* ------------------------------------------------------------------ */
describe("BillingSummaryClient — with initial summary", () => {
  it("renders the plan name after data loads", async () => {
    renderBilling();
    await waitFor(() => {
      expect(screen.getByText("Team Plan")).toBeInTheDocument();
    });
  });

  it("renders the plan code", async () => {
    renderBilling();
    await waitFor(() => {
      // Plan code appears in the mono-spaced code display
      const codeEl = screen.getByText((_, el) =>
        el?.tagName === "SPAN" && el.className.includes("font-mono") && el.textContent === "team"
      );
      expect(codeEl).toBeInTheDocument();
    });
  });

  it("renders the status badge", async () => {
    renderBilling();
    await waitFor(() => {
      expect(screen.getByText("Active")).toBeInTheDocument();
    });
  });

  it("renders the billing period", async () => {
    renderBilling();
    await waitFor(() => {
      expect(screen.getByText("Feb 1 – Mar 1, 2026")).toBeInTheDocument();
    });
  });

  it("renders the seat limit when present", async () => {
    renderBilling();
    await waitFor(() => {
      expect(screen.getByText("10 seats")).toBeInTheDocument();
    });
  });

  it("renders the enterprise security badge", () => {
    renderBilling();
    expect(screen.getByText("Enterprise Security")).toBeInTheDocument();
  });

  it("renders the treasury label", () => {
    renderBilling();
    expect(screen.getByText("Treasury")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Loading state                                                      */
/* ------------------------------------------------------------------ */
describe("BillingSummaryClient — loading", () => {
  it("shows 'Loading…' when no initial summary provided", () => {
    renderBilling({ initialSummary: undefined });
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Upgrade button                                                     */
/* ------------------------------------------------------------------ */
describe("BillingSummaryClient — upgrade", () => {
  it("renders the upgrade button", () => {
    renderBilling();
    const buttons = screen.getAllByRole("button");
    const upgradeBtn = buttons.find((b) => b.textContent?.includes("Upgrade Plan"));
    expect(upgradeBtn).toBeTruthy();
  });

  it("calls subscription/set API when Midtrans is disabled", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, summary: mockSummary }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, summary: mockSummary }),
      });

    renderBilling({ midtransEnabled: false });

    const buttons = screen.getAllByRole("button");
    const upgradeBtn = buttons.find((b) => b.textContent?.includes("Upgrade Plan"));
    expect(upgradeBtn).toBeTruthy();
    await user.click(upgradeBtn!);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/billing/subscription/set",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("team"),
        })
      );
    });
  });

  it("shows toast on upgrade failure", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, summary: mockSummary }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: "Plan limit exceeded" }),
      });

    renderBilling({ midtransEnabled: false });

    const buttons = screen.getAllByRole("button");
    const upgradeBtn = buttons.find((b) => b.textContent?.includes("Upgrade Plan"));
    await user.click(upgradeBtn!);

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Upgrade failed",
          variant: "destructive",
        })
      );
    });
  });
});

/* ------------------------------------------------------------------ */
/*  Upgrade section                                                    */
/* ------------------------------------------------------------------ */
describe("BillingSummaryClient — upgrade section", () => {
  it("renders the upgrade empire heading", () => {
    renderBilling();
    expect(screen.getByText("Upgrade Your Empire")).toBeInTheDocument();
  });

  it("renders the contact sales button", () => {
    renderBilling();
    expect(screen.getByText("Contact Sales")).toBeInTheDocument();
  });

  it("renders refresh link to billing page", () => {
    renderBilling();
    const link = screen.getByText("Refresh");
    expect(link).toHaveAttribute("href", "/acme/billing");
  });
});
