import { describe, it, expect } from "vitest";
import type {
  RouteContext,
  ApiResponse,
  PaginatedResponse,
  MessageRow,
  ContactRow,
  ThreadRow,
  FieldType,
} from "@/types/api-common";

describe("API Common Types", () => {
  describe("RouteContext", () => {
    it("type works with default id param", () => {
      const ctx: RouteContext = {
        params: Promise.resolve({ id: "abc123" }),
      };
      expect(ctx.params).toBeInstanceOf(Promise);
    });

    it("type works with custom param name", () => {
      const ctx: RouteContext<"workspaceId"> = {
        params: Promise.resolve({ workspaceId: "ws_123" }),
      };
      expect(ctx.params).toBeInstanceOf(Promise);
    });
  });

  describe("ApiResponse", () => {
    it("supports success response", () => {
      const res: ApiResponse<{ name: string }> = {
        ok: true,
        data: { name: "test" },
      };
      expect(res.ok).toBe(true);
      expect(res.data?.name).toBe("test");
    });

    it("supports error response", () => {
      const res: ApiResponse = {
        ok: false,
        error: "Something went wrong",
        requestId: "req_123",
      };
      expect(res.ok).toBe(false);
      expect(res.error).toBeDefined();
    });
  });

  describe("PaginatedResponse", () => {
    it("includes pagination metadata", () => {
      const res: PaginatedResponse<{ id: string }> = {
        ok: true,
        data: [{ id: "1" }, { id: "2" }],
        pagination: {
          page: 1,
          limit: 20,
          total: 100,
          hasMore: true,
        },
      };
      expect(res.pagination.total).toBe(100);
      expect(res.data?.length).toBe(2);
    });
  });

  describe("Entity types have correct shape", () => {
    it("MessageRow has all required fields", () => {
      const msg: MessageRow = {
        id: "msg_1",
        workspace_id: "ws_1",
        thread_id: "t_1",
        contact_id: "c_1",
        direction: "inbound",
        channel: "whatsapp",
        content: "hello",
        content_type: "text",
        media_url: null,
        media_type: null,
        wa_message_id: null,
        status: "delivered",
        metadata: null,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      };
      expect(msg.direction).toBe("inbound");
    });

    it("ContactRow has all required fields", () => {
      const contact: ContactRow = {
        id: "c_1",
        workspace_id: "ws_1",
        normalized_phone: "+628123",
        wa_id: null,
        display_name: "Test",
        phone: "+628123",
        profile_name: null,
        email: null,
        tags: ["vip"],
        custom_fields: {},
        opt_in_status: "opted_in",
        source: "import",
        last_seen_at: null,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      };
      expect(contact.opt_in_status).toBe("opted_in");
    });

    it("ThreadRow has all required fields", () => {
      const thread: ThreadRow = {
        id: "t_1",
        workspace_id: "ws_1",
        contact_id: "c_1",
        channel: "whatsapp",
        status: "open",
        priority: "high",
        assignee_id: null,
        tags: [],
        subject: null,
        last_message_at: null,
        first_response_at: null,
        resolved_at: null,
        metadata: null,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      };
      expect(thread.status).toBe("open");
    });

    it("FieldType is union of valid types", () => {
      const types: FieldType[] = [
        "text",
        "number",
        "date",
        "boolean",
        "select",
        "multiselect",
        "url",
        "email",
        "phone",
      ];
      expect(types).toHaveLength(9);
    });
  });
});
