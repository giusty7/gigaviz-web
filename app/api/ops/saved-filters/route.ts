import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import { assertOpsEnabled } from "@/lib/ops/guard";
import {
  getSavedFilters,
  createSavedFilter,
  deleteSavedFilter,
  setDefaultFilter,
} from "@/lib/ops/bulk-ops";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request: NextRequest) => {
  try {
    assertOpsEnabled();
    const ctx = await requirePlatformAdmin();
    if (!ctx.ok) {
      return NextResponse.json({ error: ctx.reason }, { status: ctx.reason === "not_authenticated" ? 401 : 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");

    if (!page) {
      return NextResponse.json(
        { error: "page parameter required" },
        { status: 400 }
      );
    }

    const filters = await getSavedFilters({ page, userId: ctx.user.id });
    return NextResponse.json({ filters });
  } catch (error) {
    logger.error("[ops] saved-filters error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  try {
    assertOpsEnabled();
    const ctx = await requirePlatformAdmin();
    if (!ctx.ok) {
      return NextResponse.json({ error: ctx.reason }, { status: ctx.reason === "not_authenticated" ? 401 : 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "create") {
      const { name, description, page, filters, columns, sort_config, is_shared } =
        body;

      const filter = await createSavedFilter({
        name,
        description,
        page,
        filters,
        columns,
        sort_config,
        is_shared: is_shared || false,
        created_by: ctx.user.id,
      });
      return NextResponse.json(filter);
    }

    if (action === "delete") {
      const { filter_id } = body;
      await deleteSavedFilter(filter_id);
      return NextResponse.json({ success: true });
    }

    if (action === "set_default") {
      const { filter_id, page } = body;
      await setDefaultFilter(filter_id, page, ctx.user.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    logger.error("[ops] saved-filters error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
