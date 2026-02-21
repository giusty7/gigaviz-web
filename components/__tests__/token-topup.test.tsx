// @vitest-environment jsdom

/**
 * Component tests for TokenTopupClient.
 *
 * TokenTopupClient shows the workspace token wallet balance, three
 * top-up packages, Midtrans Snap checkout, manual transfer option,
 * and pending payment management. Tests cover: rendering, packages,
 * balance display, top-up actions, and pending intents.
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
      tokenWallet: "Token Wallet",
      tokenWalletDesc: "Purchase tokens for platform services.",
      balance: "Balance",
      loading: "Loading…",
      tokens: `${params?.count ?? 0} tokens`,
      payNow: "Pay Now",
      manualTransfer: "Manual Transfer",
      topUp: "Top Up",
      processing: "Processing…",
      manualActivation: "Manual Activation",
      manualActivationDesc: "Confirm pending transfers below.",
      refresh: "Refresh",
      noPending: "No pending payments.",
      markPaid: "Mark Paid",
      topUpCreated: "Top-up created",
      topUpConfirmed: "Top-up confirmed",
      topUpFailed: "Top-up failed",
      confirmFailed: "Confirmation failed",
      checkoutFailed: "Checkout failed",
      continuePayment: "Continue to payment",
      waitingActivation: "Waiting for activation",
      failedLoadWallet: "Failed to load wallet",
      failedLoadPending: "Failed to load pending",
      tryAgainLater: "Try again later",
      balanceIncreased: `Balance increased by ${params?.count ?? 0}`,
    };
    return map[key] ?? key;
  },
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

import { TokenTopupClient } from "@/components/billing/TokenTopupClient";
import type { BillingSummary } from "@/lib/billing/summary";

/* ── Fixtures ── */
const mockSummary = {
  wallet: { balance: 75000 },
  plan: { name: "Team", code: "team" },
  subscription: { plan_code: "team", status: "active" },
} as unknown as BillingSummary;

const pendingIntents = [
  { id: "pi-1", amount_idr: 100000, created_at: "2026-02-15T10:00:00Z", meta: {} },
  { id: "pi-2", amount_idr: 500000, created_at: "2026-02-16T12:00:00Z", meta: {} },
];

const defaultProps = {
  workspaceId: "ws-123",
  initialSummary: mockSummary,
  canEdit: true,
  midtransEnabled: false,
};

function renderTopup(overrides: Partial<typeof defaultProps> = {}) {
  return render(<TokenTopupClient {...defaultProps} {...overrides} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: summary fetch + pending fetch both succeed
  (global.fetch as ReturnType<typeof vi.fn>) = vi.fn()
    .mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/api/billing/summary")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, summary: mockSummary }),
        });
      }
      if (typeof url === "string" && url.includes("/api/billing/topup/pending")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, intents: [] }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      });
    });
});

/* ------------------------------------------------------------------ */
/*  Basic rendering                                                    */
/* ------------------------------------------------------------------ */
describe("TokenTopupClient — rendering", () => {
  it("renders the token wallet title", () => {
    renderTopup();
    expect(screen.getByText("Token Wallet")).toBeInTheDocument();
  });

  it("renders the wallet balance", async () => {
    renderTopup();
    // After fetch completes, balance renders with id-ID formatter
    await waitFor(() => {
      expect(screen.getByText(/75[.,]000/)).toBeInTheDocument();
    });
  });

  it("shows loading text when no initial summary", () => {
    renderTopup({ initialSummary: undefined });
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders the balance label", () => {
    renderTopup();
    expect(screen.getByText("Balance")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Token packages                                                     */
/* ------------------------------------------------------------------ */
describe("TokenTopupClient — packages", () => {
  it("renders all 3 packages", () => {
    renderTopup();
    expect(screen.getByText("50.000")).toBeInTheDocument();
    expect(screen.getByText("100.000 + bonus")).toBeInTheDocument();
    expect(screen.getByText("500.000 + bonus")).toBeInTheDocument();
  });

  it("shows IDR prices for each package", () => {
    renderTopup();
    expect(screen.getByText("Rp 50.000")).toBeInTheDocument();
    expect(screen.getByText("Rp 100.000")).toBeInTheDocument();
    expect(screen.getByText("Rp 500.000")).toBeInTheDocument();
  });

  it("renders Top Up buttons when Midtrans is disabled", () => {
    renderTopup({ midtransEnabled: false });
    const buttons = screen.getAllByRole("button", { name: "Top Up" });
    expect(buttons).toHaveLength(3);
  });

  it("renders Pay Now buttons when Midtrans is enabled", () => {
    renderTopup({ midtransEnabled: true });
    const payButtons = screen.getAllByRole("button", { name: "Pay Now" });
    expect(payButtons).toHaveLength(3);
  });

  it("renders Manual Transfer buttons alongside Pay Now when Midtrans enabled", () => {
    renderTopup({ midtransEnabled: true });
    const transferBtns = screen.getAllByRole("button", { name: "Manual Transfer" });
    expect(transferBtns).toHaveLength(3);
  });
});

/* ------------------------------------------------------------------ */
/*  Top-up action (non-Midtrans)                                       */
/* ------------------------------------------------------------------ */
describe("TokenTopupClient — manual top-up", () => {
  it("calls /api/billing/topup/create when top-up is clicked", async () => {
    const user = userEvent.setup();
    renderTopup({ midtransEnabled: false });

    const buttons = screen.getAllByRole("button", { name: "Top Up" });
    await user.click(buttons[0]); // First package (50k)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/billing/topup/create",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("pkg_50k"),
        })
      );
    });
  });

  it("shows toast on top-up success", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/api/billing/topup/create")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, summary: mockSummary, intents: [] }),
      });
    });

    renderTopup({ midtransEnabled: false });
    const buttons = screen.getAllByRole("button", { name: "Top Up" });
    await user.click(buttons[0]);

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Top-up created" })
      );
    });
  });

  it("shows error toast on top-up failure", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/api/billing/topup/create")) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: "Insufficient balance" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, summary: mockSummary, intents: [] }),
      });
    });

    renderTopup({ midtransEnabled: false });
    const buttons = screen.getAllByRole("button", { name: "Top Up" });
    await user.click(buttons[0]);

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Top-up failed",
          variant: "destructive",
        })
      );
    });
  });
});

/* ------------------------------------------------------------------ */
/*  Manual activation (pending intents)                                */
/* ------------------------------------------------------------------ */
describe("TokenTopupClient — pending intents", () => {
  it("shows manual activation section when canEdit is true", () => {
    renderTopup({ canEdit: true });
    expect(screen.getByText("Manual Activation")).toBeInTheDocument();
  });

  it("hides manual activation section when canEdit is false", () => {
    renderTopup({ canEdit: false });
    expect(screen.queryByText("Manual Activation")).not.toBeInTheDocument();
  });

  it("shows 'No pending payments' when list is empty", () => {
    renderTopup({ canEdit: true });
    expect(screen.getByText("No pending payments.")).toBeInTheDocument();
  });

  it("shows refresh button in manual activation section", () => {
    renderTopup({ canEdit: true });
    expect(screen.getByText("Refresh")).toBeInTheDocument();
  });

  it("renders pending intents when fetched", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/api/billing/topup/pending")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, intents: pendingIntents }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, summary: mockSummary }),
      });
    });

    renderTopup({ canEdit: true });

    await waitFor(() => {
      expect(screen.getByText("Rp 100.000")).toBeInTheDocument();
      expect(screen.getByText("Rp 500.000")).toBeInTheDocument();
    });

    const markPaidBtns = screen.getAllByRole("button", { name: "Mark Paid" });
    expect(markPaidBtns).toHaveLength(2);
  });

  it("calls mark-paid API when Mark Paid is clicked", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/api/billing/topup/pending")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, intents: pendingIntents }),
        });
      }
      if (typeof url === "string" && url.includes("/api/billing/topup/mark-paid")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, tokens: 105000 }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, summary: mockSummary, intents: [] }),
      });
    });

    renderTopup({ canEdit: true });

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "Mark Paid" })).toHaveLength(2);
    });

    const markPaidBtns = screen.getAllByRole("button", { name: "Mark Paid" });
    await user.click(markPaidBtns[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/billing/topup/mark-paid",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("pi-1"),
        })
      );
    });
  });
});
