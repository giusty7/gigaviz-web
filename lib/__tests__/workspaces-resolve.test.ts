/**
 * Tests for lib/workspaces/resolve.ts
 *
 * Tests workspace resolution from slug/UUID.
 */
import { describe, it, expect, vi } from "vitest";
import { resolveWorkspaceId } from "../workspaces/resolve";

describe("resolveWorkspaceId", () => {
  const validUuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

  it("returns UUID as-is when input is already a UUID", async () => {
    const mockSupabase = {} as Parameters<typeof resolveWorkspaceId>[0];
    const result = await resolveWorkspaceId(mockSupabase, validUuid);
    expect(result).toBe(validUuid);
  });

  it("returns UUID in uppercase (case-insensitive)", async () => {
    const mockSupabase = {} as Parameters<typeof resolveWorkspaceId>[0];
    const result = await resolveWorkspaceId(mockSupabase, validUuid.toUpperCase());
    expect(result).toBe(validUuid.toUpperCase());
  });

  it("resolves slug to workspace UUID", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: validUuid },
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof resolveWorkspaceId>[0];

    const result = await resolveWorkspaceId(mockSupabase, "my-workspace");
    expect(result).toBe(validUuid);
    expect(mockSupabase.from).toHaveBeenCalledWith("workspaces");
  });

  it("returns null when slug not found", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116", message: "not found" },
            }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof resolveWorkspaceId>[0];

    const result = await resolveWorkspaceId(mockSupabase, "nonexistent-slug");
    expect(result).toBeNull();
  });

  it("returns null when workspace has empty id (falsy)", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "" },
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof resolveWorkspaceId>[0];

    const result = await resolveWorkspaceId(mockSupabase, "some-slug");
    // Empty string is falsy, so `workspace?.id || null` returns null
    expect(result).toBeNull();
  });

  it("does NOT query database for UUID-formatted input", async () => {
    const mockFrom = vi.fn();
    const mockSupabase = {
      from: mockFrom,
    } as unknown as Parameters<typeof resolveWorkspaceId>[0];

    await resolveWorkspaceId(mockSupabase, validUuid);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
