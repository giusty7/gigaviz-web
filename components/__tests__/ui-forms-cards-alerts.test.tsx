// @vitest-environment jsdom

/**
 * Component tests for Input, Textarea, Card, and Alert UI primitives.
 *
 * Covers: rendering, props, variants, accessibility, ref forwarding,
 * className merging, disabled states, and compositional patterns.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import React from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

/* ================================================================== */
/*  Input                                                              */
/* ================================================================== */
describe("Input", () => {
  it("renders with type text by default", () => {
    render(<Input data-testid="input" />);
    const input = screen.getByTestId("input");
    expect(input.tagName).toBe("INPUT");
  });

  it("renders with specified type", () => {
    render(<Input type="email" data-testid="input" />);
    expect(screen.getByTestId("input")).toHaveAttribute("type", "email");
  });

  it("renders placeholder text", () => {
    render(<Input placeholder="Enter name" />);
    expect(screen.getByPlaceholderText("Enter name")).toBeInTheDocument();
  });

  it("applies disabled state", () => {
    render(<Input disabled data-testid="input" />);
    expect(screen.getByTestId("input")).toBeDisabled();
  });

  it("merges custom className", () => {
    render(<Input className="my-custom" data-testid="input" />);
    expect(screen.getByTestId("input")).toHaveClass("my-custom");
  });

  it("forwards ref", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("handles onChange events", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} data-testid="input" />);
    await user.type(screen.getByTestId("input"), "hello");
    expect(handleChange).toHaveBeenCalledTimes(5); // h-e-l-l-o
  });

  it("has correct base classes", () => {
    render(<Input data-testid="input" />);
    const input = screen.getByTestId("input");
    expect(input).toHaveClass("flex", "h-10", "w-full", "rounded-md");
  });
});

/* ================================================================== */
/*  Textarea                                                           */
/* ================================================================== */
describe("Textarea", () => {
  it("renders a textarea element", () => {
    render(<Textarea data-testid="ta" />);
    expect(screen.getByTestId("ta").tagName).toBe("TEXTAREA");
  });

  it("renders placeholder text", () => {
    render(<Textarea placeholder="Write here" />);
    expect(screen.getByPlaceholderText("Write here")).toBeInTheDocument();
  });

  it("applies disabled state", () => {
    render(<Textarea disabled data-testid="ta" />);
    expect(screen.getByTestId("ta")).toBeDisabled();
  });

  it("merges custom className", () => {
    render(<Textarea className="extra-class" data-testid="ta" />);
    expect(screen.getByTestId("ta")).toHaveClass("extra-class");
  });

  it("forwards ref", () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("handles user input", async () => {
    const user = userEvent.setup();
    render(<Textarea data-testid="ta" />);
    await user.type(screen.getByTestId("ta"), "test message");
    expect(screen.getByTestId("ta")).toHaveValue("test message");
  });

  it("has min-height class", () => {
    render(<Textarea data-testid="ta" />);
    expect(screen.getByTestId("ta")).toHaveClass("min-h-[80px]");
  });
});

/* ================================================================== */
/*  Card (compositional)                                               */
/* ================================================================== */
describe("Card", () => {
  it("renders children", () => {
    render(<Card>Card body</Card>);
    expect(screen.getByText("Card body")).toBeInTheDocument();
  });

  it("renders full card composition", () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>My Title</CardTitle>
          <CardDescription>My Description</CardDescription>
        </CardHeader>
        <CardContent>Content here</CardContent>
        <CardFooter>Footer here</CardFooter>
      </Card>
    );

    expect(screen.getByTestId("card")).toBeInTheDocument();
    expect(screen.getByText("My Title")).toBeInTheDocument();
    expect(screen.getByText("My Description")).toBeInTheDocument();
    expect(screen.getByText("Content here")).toBeInTheDocument();
    expect(screen.getByText("Footer here")).toBeInTheDocument();
  });

  it("CardTitle renders as h3", () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByText("Title").tagName).toBe("H3");
  });

  it("CardDescription renders as p", () => {
    render(<CardDescription>Desc</CardDescription>);
    expect(screen.getByText("Desc").tagName).toBe("P");
  });

  it("Card applies border and shadow classes", () => {
    render(<Card data-testid="card">Test</Card>);
    const card = screen.getByTestId("card");
    expect(card).toHaveClass("rounded-xl", "border", "shadow-sm");
  });

  it("merges custom className on Card", () => {
    render(
      <Card className="custom-card" data-testid="card">
        Test
      </Card>
    );
    expect(screen.getByTestId("card")).toHaveClass("custom-card");
  });

  it("merges custom className on CardHeader", () => {
    render(
      <CardHeader className="custom-header" data-testid="header">
        Header
      </CardHeader>
    );
    expect(screen.getByTestId("header")).toHaveClass("custom-header");
  });

  it("forwards ref on Card", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Card ref={ref}>Test</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("forwards ref on CardContent", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<CardContent ref={ref}>Content</CardContent>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

/* ================================================================== */
/*  Alert (variant + accessibility)                                    */
/* ================================================================== */
describe("Alert", () => {
  it("renders with role='alert' for accessibility", () => {
    render(<Alert>Warning message</Alert>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("applies default variant classes", () => {
    render(<Alert data-testid="alert">Default</Alert>);
    const alert = screen.getByTestId("alert");
    expect(alert).toHaveClass("bg-gigaviz-card", "text-gigaviz-cream");
  });

  it("applies destructive variant classes", () => {
    render(
      <Alert variant="destructive" data-testid="alert">
        Error
      </Alert>
    );
    const alert = screen.getByTestId("alert");
    expect(alert).toHaveClass("border-rose-500/40", "text-rose-100");
  });

  it("renders AlertTitle as h5", () => {
    render(<AlertTitle>Title</AlertTitle>);
    expect(screen.getByText("Title").tagName).toBe("H5");
  });

  it("renders AlertDescription as div", () => {
    render(<AlertDescription>Description text</AlertDescription>);
    expect(screen.getByText("Description text").tagName).toBe("DIV");
  });

  it("renders full alert composition", () => {
    render(
      <Alert data-testid="alert">
        <AlertTitle>Error Occurred</AlertTitle>
        <AlertDescription>Something went wrong.</AlertDescription>
      </Alert>
    );

    expect(screen.getByTestId("alert")).toBeInTheDocument();
    expect(screen.getByText("Error Occurred")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
  });

  it("merges custom className", () => {
    render(
      <Alert className="custom-alert" data-testid="alert">
        Test
      </Alert>
    );
    expect(screen.getByTestId("alert")).toHaveClass("custom-alert");
  });

  it("forwards ref", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Alert ref={ref}>Test</Alert>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("passes through HTML attributes", () => {
    render(
      <Alert id="my-alert" data-testid="alert">
        Test
      </Alert>
    );
    expect(screen.getByTestId("alert")).toHaveAttribute("id", "my-alert");
  });
});
