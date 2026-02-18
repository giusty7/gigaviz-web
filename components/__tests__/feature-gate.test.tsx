// @vitest-environment jsdom

/**
 * Component tests for FeatureGate.
 *
 * FeatureGate is a critical UI gate that controls feature access per workspace.
 * Tests verify: allowed → children, denied → fallback or default locked UI.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { NextIntlClientProvider } from "next-intl";

import { FeatureGate } from "@/components/gates/feature-gate";

const messages = {
  featureGateUI: {
    locked: "Feature locked for this workspace.",
    contactSupport:
      "Contact support if you believe this should be enabled.",
  },
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

/* ------------------------------------------------------------------ */
/*  FeatureGate — allowed state                                        */
/* ------------------------------------------------------------------ */
describe("FeatureGate — allowed", () => {
  it("renders children when allowed is true", () => {
    render(
      <FeatureGate allowed={true}>
        <p>Feature content</p>
      </FeatureGate>,
      { wrapper: Wrapper }
    );
    expect(screen.getByText("Feature content")).toBeInTheDocument();
  });

  it("renders children by default (allowed defaults to true)", () => {
    render(
      <FeatureGate>
        <p>Default allowed</p>
      </FeatureGate>,
      { wrapper: Wrapper }
    );
    expect(screen.getByText("Default allowed")).toBeInTheDocument();
  });

  it("does not render lock UI when allowed", () => {
    render(
      <FeatureGate allowed={true}>
        <p>Visible</p>
      </FeatureGate>,
      { wrapper: Wrapper }
    );
    expect(screen.queryByText(/Feature locked/)).not.toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  FeatureGate — denied state (default fallback)                      */
/* ------------------------------------------------------------------ */
describe("FeatureGate — denied (default fallback)", () => {
  it("renders default locked message when denied", () => {
    render(
      <FeatureGate allowed={false}>
        <p>Secret feature</p>
      </FeatureGate>,
      { wrapper: Wrapper }
    );
    expect(
      screen.getByText("Feature locked for this workspace.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Secret feature")).not.toBeInTheDocument();
  });

  it("renders contact support text", () => {
    render(
      <FeatureGate allowed={false}>
        <p>Hidden</p>
      </FeatureGate>,
      { wrapper: Wrapper }
    );
    expect(
      screen.getByText(/Contact support if you believe this should be enabled/)
    ).toBeInTheDocument();
  });

  it("applies custom className to the wrapper when denied", () => {
    const { container } = render(
      <FeatureGate allowed={false} className="my-gate-class">
        <p>Hidden</p>
      </FeatureGate>,
      { wrapper: Wrapper }
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass("my-gate-class");
  });
});

/* ------------------------------------------------------------------ */
/*  FeatureGate — denied state (custom fallback)                       */
/* ------------------------------------------------------------------ */
describe("FeatureGate — denied (custom fallback)", () => {
  it("renders custom fallback when provided and denied", () => {
    render(
      <FeatureGate allowed={false} fallback={<p>Upgrade to Pro</p>}>
        <p>Pro feature</p>
      </FeatureGate>,
      { wrapper: Wrapper }
    );
    expect(screen.getByText("Upgrade to Pro")).toBeInTheDocument();
    expect(screen.queryByText("Pro feature")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Feature locked for this workspace.")
    ).not.toBeInTheDocument();
  });

  it("applies className to wrapper around custom fallback", () => {
    const { container } = render(
      <FeatureGate
        allowed={false}
        fallback={<span>Custom locked</span>}
        className="custom-class"
      >
        <p>Hidden</p>
      </FeatureGate>,
      { wrapper: Wrapper }
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass("custom-class");
    expect(screen.getByText("Custom locked")).toBeInTheDocument();
  });

  it("renders complex JSX fallback correctly", () => {
    render(
      <FeatureGate
        allowed={false}
        fallback={
          <div data-testid="complex-fallback">
            <h3>Locked</h3>
            <button>Upgrade Now</button>
          </div>
        }
      >
        <p>Secret</p>
      </FeatureGate>,
      { wrapper: Wrapper }
    );
    expect(screen.getByTestId("complex-fallback")).toBeInTheDocument();
    expect(screen.getByText("Locked")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upgrade Now" })
    ).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  FeatureGate — edge cases                                           */
/* ------------------------------------------------------------------ */
describe("FeatureGate — edge cases", () => {
  it("handles undefined allowed (defaults to true)", () => {
    render(
      <FeatureGate allowed={undefined}>
        <p>Should be visible</p>
      </FeatureGate>,
      { wrapper: Wrapper }
    );
    expect(screen.getByText("Should be visible")).toBeInTheDocument();
  });

  it("renders multiple children when allowed", () => {
    render(
      <FeatureGate allowed={true}>
        <p>Child 1</p>
        <p>Child 2</p>
        <p>Child 3</p>
      </FeatureGate>,
      { wrapper: Wrapper }
    );
    expect(screen.getByText("Child 1")).toBeInTheDocument();
    expect(screen.getByText("Child 2")).toBeInTheDocument();
    expect(screen.getByText("Child 3")).toBeInTheDocument();
  });
});
