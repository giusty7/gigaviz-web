import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getSavedFilters,
  createSavedFilter,
  deleteSavedFilter,
  setDefaultFilter,
} from "@/lib/ops/bulk-ops";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check platform admin
    const { data: adminCheck } = await supabaseAdmin()
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");

    if (!page) {
      return NextResponse.json(
        { error: "page parameter required" },
        { status: 400 }
      );
    }

    const filters = await getSavedFilters({ page, userId: user.id });
    return NextResponse.json({ filters });
  } catch (error) {
    console.error("[ops] saved-filters error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check platform admin
    const { data: adminCheck } = await supabaseAdmin()
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
        created_by: user.id,
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
      await setDefaultFilter(filter_id, page, user.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[ops] saved-filters error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
