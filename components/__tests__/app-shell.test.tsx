// @vitest-environment jsdom

/**
 * Component tests for AppShell.
 *
 * AppShell is the main application layout with sidebar navigation,
 * breadcrumbs, collapse/expand, mobile responsive drawer, and user info.
 * Tests verify: rendering, navigation structure, collapse behavior,
 * mobile menu, admin badge, and breadcrumbs.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import React from "react";

/* ── Mocks ── */
let mockPathname = "/acme/dashboard";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      dashboard: "Dashboard",
      inbox: "Inbox",
      tokens: "Tokens",
      workspace: "Workspace",
      subscription: "Subscription",
      settings: "Settings",
      products: "Products",
      manage: "Manage",
      collapseMenu: "Collapse menu",
      expandMenu: "Expand menu",
      staffMode: "Staff Mode",
      operational: "All systems operational",
      metaHub: "Meta Hub",
      helperAI: "Helper AI",
      links: "Links",
      studio: "Studio",
      marketplace: "Marketplace",
      apps: "Apps",
    };
    return map[key] ?? key;
  },
}));

// Mock next/link to render a simple <a>
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

// Mock child components to keep tests focused on AppShell
vi.mock("@/components/app/WorkspaceSwitcher", () => ({
  __esModule: true,
  default: ({ currentWorkspaceId }: { currentWorkspaceId: string }) => (
    <div data-testid="workspace-switcher">{currentWorkspaceId}</div>
  ),
}));

vi.mock("@/components/app/NotificationBell", () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}));

vi.mock("@/components/app/RoyalAvatar", () => ({
  RoyalAvatar: ({ email }: { email: string }) => (
    <div data-testid="royal-avatar">{email}</div>
  ),
}));

vi.mock("@/components/billing/upgrade-modal-provider", () => ({
  UpgradeModalProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import AppShell from "@/components/app/AppShell";

/* ── Fixtures ── */
const defaultProps = {
  userEmail: "john@example.com",
  workspaces: [
    { id: "ws-1", name: "Acme Corp", slug: "acme", role: "owner" },
    { id: "ws-2", name: "Beta Inc", slug: "beta", role: "member" },
  ],
  currentWorkspaceId: "ws-1",
  currentWorkspaceSlug: "acme",
  isAdmin: false,
  children: <div data-testid="page-content">Page Content</div>,
};

function renderShell(overrides: Partial<typeof defaultProps> = {}) {
  return render(<AppShell {...defaultProps} {...overrides} />);
}

beforeEach(() => {
  mockPathname = "/acme/dashboard";
  vi.clearAllMocks();
  // Reset localStorage
  try { localStorage.removeItem("gv_sidebar_collapsed"); } catch { /* noop */ }
});

/* ------------------------------------------------------------------ */
/*  Basic rendering                                                    */
/* ------------------------------------------------------------------ */
describe("AppShell — rendering", () => {
  it("renders page content (children)", () => {
    renderShell();
    expect(screen.getByTestId("page-content")).toBeInTheDocument();
  });

  it("renders the Gigaviz brand", () => {
    renderShell();
    const brands = screen.getAllByText("Gigaviz");
    expect(brands.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the NotificationBell", () => {
    renderShell();
    expect(screen.getByTestId("notification-bell")).toBeInTheDocument();
  });

  it("renders the RoyalAvatar with user email", () => {
    renderShell();
    expect(screen.getByTestId("royal-avatar")).toHaveTextContent("john@example.com");
  });

  it("renders WorkspaceSwitcher with correct workspace ID", () => {
    renderShell();
    const switchers = screen.getAllByTestId("workspace-switcher");
    expect(switchers.length).toBeGreaterThanOrEqual(1);
    expect(switchers[0]).toHaveTextContent("ws-1");
  });

  it("displays user email in sidebar user card", () => {
    renderShell();
    // Both mobile and desktop sidebars render user info
    const names = screen.getAllByText("john");
    expect(names.length).toBeGreaterThanOrEqual(1);
    const emails = screen.getAllByText("john@example.com");
    expect(emails.length).toBeGreaterThanOrEqual(1);
  });
});

/* ------------------------------------------------------------------ */
/*  Navigation items                                                   */
/* ------------------------------------------------------------------ */
describe("AppShell — navigation", () => {
  it("renders all main navigation links", () => {
    renderShell();
    // Each link appears twice (mobile + desktop sidebar)
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Inbox").length).toBeGreaterThanOrEqual(1);
  });

  it("renders product links", () => {
    renderShell();
    expect(screen.getAllByText("Meta Hub").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Helper AI").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Studio").length).toBeGreaterThanOrEqual(1);
  });

  it("renders manage links", () => {
    renderShell();
    expect(screen.getAllByText("Tokens").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Settings").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Subscription").length).toBeGreaterThanOrEqual(1);
  });

  it("links point to correct workspace-scoped paths", () => {
    renderShell();
    const dashboardLinks = screen.getAllByText("Dashboard");
    const link = dashboardLinks[0].closest("a");
    expect(link).toHaveAttribute("href", "/acme/dashboard");
  });

  it("marks current page as active with aria-current", () => {
    mockPathname = "/acme/dashboard";
    renderShell();
    const dashboardLinks = screen.getAllByText("Dashboard");
    const link = dashboardLinks[0].closest("a");
    expect(link).toHaveAttribute("aria-current", "page");
  });
});

/* ------------------------------------------------------------------ */
/*  Admin badge                                                        */
/* ------------------------------------------------------------------ */
describe("AppShell — admin mode", () => {
  it("does not show staff badge for non-admins", () => {
    renderShell({ isAdmin: false });
    expect(screen.queryByText(/Staff Mode/i)).not.toBeInTheDocument();
  });

  it("shows staff badge for admins", () => {
    renderShell({ isAdmin: true });
    expect(screen.getByText(/Staff Mode/i)).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Sidebar collapse/expand                                            */
/* ------------------------------------------------------------------ */
describe("AppShell — sidebar collapse", () => {
  it("renders collapse button in desktop sidebar", () => {
    renderShell();
    const buttons = screen.getAllByLabelText("Collapse menu");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("collapses sidebar and shows 'G' instead of 'Gigaviz'", async () => {
    const user = userEvent.setup();
    renderShell();

    // Last collapse button is the desktop sidebar one (mobile close button renders first)
    const buttons = screen.getAllByLabelText("Collapse menu");
    const desktopBtn = buttons[buttons.length - 1];
    await user.click(desktopBtn);

    // After collapse, the desktop sidebar shows "G"
    expect(screen.getByText("G")).toBeInTheDocument();
  });

  it("persists collapse state to localStorage", async () => {
    const user = userEvent.setup();
    renderShell();

    const buttons = screen.getAllByLabelText("Collapse menu");
    const desktopBtn = buttons[buttons.length - 1];
    await user.click(desktopBtn);

    expect(localStorage.getItem("gv_sidebar_collapsed")).toBe("true");
  });

  it("shows expand button when collapsed", async () => {
    const user = userEvent.setup();
    renderShell();

    const buttons = screen.getAllByLabelText("Collapse menu");
    const desktopBtn = buttons[buttons.length - 1];
    await user.click(desktopBtn);

    expect(screen.getByLabelText("Expand menu")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Mobile menu                                                        */
/* ------------------------------------------------------------------ */
describe("AppShell — mobile menu", () => {
  it("renders the hamburger menu button", () => {
    renderShell();
    const menuBtn = screen.getByLabelText("Open menu");
    expect(menuBtn).toBeInTheDocument();
  });

  it("opens mobile drawer when hamburger is clicked", async () => {
    const user = userEvent.setup();
    renderShell();

    const menuBtn = screen.getByLabelText("Open menu");
    await user.click(menuBtn);

    // The mobile sidebar should be visible (translate-x-0)
    const mobileSidebars = screen.getAllByRole("navigation");
    expect(mobileSidebars.length).toBeGreaterThanOrEqual(2);
  });
});

/* ------------------------------------------------------------------ */
/*  Operational status                                                 */
/* ------------------------------------------------------------------ */
describe("AppShell — system status", () => {
  it("displays operational status indicator", () => {
    renderShell();
    expect(screen.getAllByText("All systems operational").length).toBeGreaterThanOrEqual(1);
  });
});
