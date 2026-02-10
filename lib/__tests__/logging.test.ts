import { describe, it, expect } from "vitest";
import { logger } from "@/lib/logging";
import { setCorrelationId, getCorrelationId } from "@/lib/logging";

describe("logger", () => {
  it("exports all required log methods", () => {
    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.dev).toBe("function");
  });

  it("does not throw when called with message only", () => {
    expect(() => logger.info("test message")).not.toThrow();
    expect(() => logger.warn("test warning")).not.toThrow();
    expect(() => logger.error("test error")).not.toThrow();
    expect(() => logger.debug("test debug")).not.toThrow();
    expect(() => logger.dev("test dev")).not.toThrow();
  });

  it("does not throw when called with metadata", () => {
    expect(() =>
      logger.info("test message", { key: "value", count: 42 })
    ).not.toThrow();
  });

  it("handles empty metadata object", () => {
    expect(() => logger.info("test", {})).not.toThrow();
  });
});

describe("correlationId", () => {
  it("sets and gets correlation ID", () => {
    setCorrelationId("req_abc123");
    expect(getCorrelationId()).toBe("req_abc123");
  });

  it("overwrites previous correlation ID", () => {
    setCorrelationId("req_first");
    setCorrelationId("req_second");
    expect(getCorrelationId()).toBe("req_second");
  });
});
