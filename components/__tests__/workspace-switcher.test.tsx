// @vitest-environment jsdom

/**
 * Component tests for WorkspaceSwitcher.
 *
 * WorkspaceSwitcher lets users switch active workspace via a <select>,
 * and provides a logout button. Tests cover: rendering, switching,
 * error handling, and logout flow.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import React from "react";

/* ── Mocks ── */
const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      switchWorkspace: "Switch workspace",
      signOut: "Sign out",
      signingOut: "Signing out…",
      failedSwitch: "Failed to switch workspace",
    };
    return map[key] ?? key;
  },
}));

const signOutMock = vi.fn().mockResolvedValue({});
vi.mock("@/lib/supabase/client", () => ({
  supabaseClient: () => ({ auth: { signOut: signOutMock } }),
}));

import WorkspaceSwitcher from "@/components/app/WorkspaceSwitcher";

/* ── Fixtures ── */
const workspaces = [
  { id: "ws-1", name: "Acme Corp", slug: "acme", role: "owner" },
  { id: "ws-2", name: "Beta Inc", slug: "beta", role: "member" },
  { id: "ws-3", name: "Gamma Ltd", slug: "gamma", role: "admin" },
];

/* ── Helpers ── */
function renderSwitcher(currentId = "ws-1") {
  return render(
    <WorkspaceSwitcher
      workspaces={workspaces}
      currentWorkspaceId={currentId}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
});

/* ------------------------------------------------------------------ */
/*  Rendering                                                          */
/* ------------------------------------------------------------------ */
describe("WorkspaceSwitcher — rendering", () => {
  it("renders a select with all workspaces", () => {
    renderSwitcher();
    const select = screen.getByTitle("Switch workspace");
    expect(select).toBeInTheDocument();

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("Acme Corp - owner");
    expect(options[1]).toHaveTextContent("Beta Inc - member");
    expect(options[2]).toHaveTextContent("Gamma Ltd - admin");
  });

  it("selects the current workspace by default", () => {
    renderSwitcher("ws-2");
    const select = screen.getByTitle("Switch workspace") as HTMLSelectElement;
    expect(select.value).toBe("ws-2");
  });

  it("renders the sign-out button", () => {
    renderSwitcher();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("does not show error initially", () => {
    renderSwitcher();
    expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Workspace switching                                                */
/* ------------------------------------------------------------------ */
describe("WorkspaceSwitcher — switching", () => {
  it("calls /api/workspaces/current on workspace change", async () => {
    const user = userEvent.setup();
    renderSwitcher("ws-1");

    const select = screen.getByTitle("Switch workspace");
    await user.selectOptions(select, "ws-2");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/workspaces/current",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ workspace_id: "ws-2" }),
      })
    );
  });

  it("navigates to the new workspace dashboard on success", async () => {
    const user = userEvent.setup();
    renderSwitcher("ws-1");

    const select = screen.getByTitle("Switch workspace");
    await user.selectOptions(select, "ws-2");

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/beta/dashboard");
    });
  });

  it("displays error when switch API returns failure", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Workspace not found" }),
    });

    renderSwitcher("ws-1");
    const select = screen.getByTitle("Switch workspace");
    await user.selectOptions(select, "ws-3");

    await waitFor(() => {
      expect(screen.getByText("Workspace not found")).toBeInTheDocument();
    });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows fallback error when API returns no message", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({}),
    });

    renderSwitcher("ws-1");
    const select = screen.getByTitle("Switch workspace");
    await user.selectOptions(select, "ws-2");

    await waitFor(() => {
      expect(screen.getByText("Failed to switch workspace")).toBeInTheDocument();
    });
  });
});

/* ------------------------------------------------------------------ */
/*  Logout                                                             */
/* ------------------------------------------------------------------ */
describe("WorkspaceSwitcher — logout", () => {
  it("calls supabase signOut and redirects on logout", async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalled();
    });
    expect(pushMock).toHaveBeenCalledWith("/");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("fires POST to /api/auth/logout during logout", async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/auth/logout",
        expect.objectContaining({ method: "POST" })
      );
    });
  });
});
