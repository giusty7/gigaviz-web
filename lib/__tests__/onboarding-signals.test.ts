/**
 * Tests for lib/onboarding/signals.ts
 *
 * Tests the pure functions: buildOnboardingSteps, getOnboardingProgress, getNextIncompleteStep.
 * getOnboardingSignals is DB-dependent and tested separately.
 */
import { describe, it, expect, vi } from "vitest";

// Mock server-only (used transitively via supabaseAdmin)
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: vi.fn(),
}));

import {
  buildOnboardingSteps,
  getOnboardingProgress,
  getNextIncompleteStep,
  type OnboardingSignals,
} from "../onboarding/signals";

// ─── Factory ────────────────────────────────────────────────────────

function createSignals(overrides?: Partial<OnboardingSignals>): OnboardingSignals {
  return {
    workspaceReady: false,
    memberCount: 0,
    membersInvited: false,
    waConnected: false,
    waPhoneNumberId: null,
    templatesSynced: false,
    templatesCount: 0,
    lastSyncAt: null,
    inboxReady: false,
    threadsCount: 0,
    lastEventAt: null,
    ...overrides,
  };
}

// ─── buildOnboardingSteps ───────────────────────────────────────────

describe("buildOnboardingSteps", () => {
  const slug = "test-workspace";

  it("returns 5 steps", () => {
    const signals = createSignals();
    const steps = buildOnboardingSteps(signals, slug);

    expect(steps).toHaveLength(5);
  });

  it("step IDs are workspace, members, connect, templates, inbox", () => {
    const signals = createSignals();
    const steps = buildOnboardingSteps(signals, slug);

    expect(steps.map((s) => s.id)).toEqual([
      "workspace",
      "members",
      "connect",
      "templates",
      "inbox",
    ]);
  });

  it("all steps are not done with zero signals", () => {
    const signals = createSignals();
    const steps = buildOnboardingSteps(signals, slug);

    // Only workspace is always true
    expect(steps[0].done).toBe(false);
    expect(steps[1].done).toBe(false);
    expect(steps[2].done).toBe(false);
    expect(steps[3].done).toBe(false);
    expect(steps[4].done).toBe(false);
  });

  it("workspace step is done when workspaceReady is true", () => {
    const signals = createSignals({ workspaceReady: true });
    const steps = buildOnboardingSteps(signals, slug);

    expect(steps[0].done).toBe(true);
    expect(steps[0].id).toBe("workspace");
  });

  it("members step is done when membersInvited is true", () => {
    const signals = createSignals({ membersInvited: true, memberCount: 3 });
    const steps = buildOnboardingSteps(signals, slug);

    expect(steps[1].done).toBe(true);
    expect(steps[1].helper).toContain("3 members joined");
  });

  it("members step shows invite prompt when not done", () => {
    const signals = createSignals({ membersInvited: false, memberCount: 1 });
    const steps = buildOnboardingSteps(signals, slug);

    expect(steps[1].done).toBe(false);
    expect(steps[1].helper).toContain("Add teammates");
  });

  it("connect step is done when waConnected is true", () => {
    const signals = createSignals({
      waConnected: true,
      waPhoneNumberId: "1234567890",
    });
    const steps = buildOnboardingSteps(signals, slug);

    expect(steps[2].done).toBe(true);
    expect(steps[2].helper).toContain("7890"); // last 4 digits
  });

  it("connect step shows link prompt when not connected", () => {
    const signals = createSignals({ waConnected: false });
    const steps = buildOnboardingSteps(signals, slug);

    expect(steps[2].done).toBe(false);
    expect(steps[2].helper).toContain("Link your WhatsApp");
  });

  it("templates step is done when templatesSynced is true", () => {
    const signals = createSignals({
      templatesSynced: true,
      templatesCount: 15,
    });
    const steps = buildOnboardingSteps(signals, slug);

    expect(steps[3].done).toBe(true);
    expect(steps[3].helper).toContain("15 templates synced");
  });

  it("inbox step is done when inboxReady is true", () => {
    const signals = createSignals({
      inboxReady: true,
      threadsCount: 42,
    });
    const steps = buildOnboardingSteps(signals, slug);

    expect(steps[4].done).toBe(true);
    expect(steps[4].helper).toContain("42 threads ready");
  });

  it("all steps done when all signals are positive", () => {
    const signals = createSignals({
      workspaceReady: true,
      membersInvited: true,
      memberCount: 5,
      waConnected: true,
      waPhoneNumberId: "9876543210",
      templatesSynced: true,
      templatesCount: 10,
      lastSyncAt: "2026-02-01T00:00:00Z",
      inboxReady: true,
      threadsCount: 100,
      lastEventAt: "2026-02-01T00:00:00Z",
    });
    const steps = buildOnboardingSteps(signals, slug);

    expect(steps.every((s) => s.done)).toBe(true);
  });

  it("all step hrefs contain the workspace slug", () => {
    const signals = createSignals();
    const steps = buildOnboardingSteps(signals, slug);

    for (const step of steps) {
      expect(step.href).toContain(`/${slug}/`);
    }
  });

  it("each step has a label and helper", () => {
    const signals = createSignals();
    const steps = buildOnboardingSteps(signals, slug);

    for (const step of steps) {
      expect(step.label).toBeTruthy();
      expect(step.helper).toBeTruthy();
      expect(typeof step.label).toBe("string");
      expect(typeof step.helper).toBe("string");
    }
  });
});

// ─── getOnboardingProgress ──────────────────────────────────────────

describe("getOnboardingProgress", () => {
  const slug = "ws";

  it("returns 0 when no steps are done", () => {
    const signals = createSignals();
    const steps = buildOnboardingSteps(signals, slug);
    const progress = getOnboardingProgress(steps);

    expect(progress).toBe(0);
  });

  it("returns 100 when all steps are done", () => {
    const signals = createSignals({
      workspaceReady: true,
      membersInvited: true,
      memberCount: 5,
      waConnected: true,
      waPhoneNumberId: "123",
      templatesSynced: true,
      templatesCount: 5,
      lastSyncAt: "2026-01-01",
      inboxReady: true,
      threadsCount: 10,
      lastEventAt: "2026-01-01",
    });
    const steps = buildOnboardingSteps(signals, slug);
    const progress = getOnboardingProgress(steps);

    expect(progress).toBe(100);
  });

  it("returns 20 when 1 of 5 steps is done", () => {
    const signals = createSignals({ workspaceReady: true });
    const steps = buildOnboardingSteps(signals, slug);
    const progress = getOnboardingProgress(steps);

    expect(progress).toBe(20);
  });

  it("returns 60 when 3 of 5 steps are done", () => {
    const signals = createSignals({
      workspaceReady: true,
      membersInvited: true,
      memberCount: 2,
      waConnected: true,
      waPhoneNumberId: "123",
    });
    const steps = buildOnboardingSteps(signals, slug);
    const progress = getOnboardingProgress(steps);

    expect(progress).toBe(60);
  });

  it("rounds to nearest integer", () => {
    // 2/5 = 40%
    const signals = createSignals({
      workspaceReady: true,
      membersInvited: true,
      memberCount: 3,
    });
    const steps = buildOnboardingSteps(signals, slug);
    const progress = getOnboardingProgress(steps);

    expect(progress).toBe(40);
    expect(Number.isInteger(progress)).toBe(true);
  });
});

// ─── getNextIncompleteStep ──────────────────────────────────────────

describe("getNextIncompleteStep", () => {
  const slug = "ws";

  it("returns first step when none are done", () => {
    const signals = createSignals();
    const steps = buildOnboardingSteps(signals, slug);
    const next = getNextIncompleteStep(steps);

    expect(next).not.toBeNull();
    expect(next!.id).toBe("workspace");
  });

  it("returns second step when first is done", () => {
    const signals = createSignals({ workspaceReady: true });
    const steps = buildOnboardingSteps(signals, slug);
    const next = getNextIncompleteStep(steps);

    expect(next).not.toBeNull();
    expect(next!.id).toBe("members");
  });

  it("returns null when all steps are done", () => {
    const signals = createSignals({
      workspaceReady: true,
      membersInvited: true,
      memberCount: 5,
      waConnected: true,
      waPhoneNumberId: "123",
      templatesSynced: true,
      templatesCount: 5,
      lastSyncAt: "2026-01-01",
      inboxReady: true,
      threadsCount: 10,
      lastEventAt: "2026-01-01",
    });
    const steps = buildOnboardingSteps(signals, slug);
    const next = getNextIncompleteStep(steps);

    expect(next).toBeNull();
  });

  it("skips completed steps and returns next incomplete", () => {
    const signals = createSignals({
      workspaceReady: true,
      membersInvited: true,
      memberCount: 3,
      // connect NOT done
      waConnected: false,
    });
    const steps = buildOnboardingSteps(signals, slug);
    const next = getNextIncompleteStep(steps);

    expect(next).not.toBeNull();
    expect(next!.id).toBe("connect");
  });

  it("returns inbox step when only it is incomplete", () => {
    const signals = createSignals({
      workspaceReady: true,
      membersInvited: true,
      memberCount: 3,
      waConnected: true,
      waPhoneNumberId: "123",
      templatesSynced: true,
      templatesCount: 5,
      lastSyncAt: "2026-01-01",
      inboxReady: false, // only inbox incomplete
    });
    const steps = buildOnboardingSteps(signals, slug);
    const next = getNextIncompleteStep(steps);

    expect(next).not.toBeNull();
    expect(next!.id).toBe("inbox");
  });
});
