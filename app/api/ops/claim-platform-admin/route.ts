import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUser, isOwnerEmailAllowed } from "@/lib/platform-admin/server";

export const runtime = "nodejs";

export async function POST() {
  const { userId, email } = await getCurrentUser();
  if (!userId || !email) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  if (!isOwnerEmailAllowed(email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const db = supabaseAdmin();
  const { error } = await db
    .from("platform_admins")
    .upsert(
      { user_id: userId, created_by: userId },
      { onConflict: "user_id" }
    );

  if (error) {
    return NextResponse.json(
      { error: error.message || "claim_failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
