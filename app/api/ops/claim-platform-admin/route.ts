import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUser, isOwnerEmailAllowed } from "@/lib/platform-admin/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
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

  // Check if this is a form submission (has content-type header)
  const contentType = request.headers.get("content-type");
  const isFormSubmit = contentType?.includes("application/x-www-form-urlencoded") || 
                       contentType === null; // Form submissions without explicit content-type

  if (isFormSubmit) {
    // Redirect to ops page which will then redirect to god-console
    redirect("/ops/god-console");
  }

  return NextResponse.json({ ok: true });
}
