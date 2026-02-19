import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const dynamic = "force-dynamic";

/**
 * GET /api/marketplace/items/[itemId]/download
 * Download a purchased marketplace item.
 *
 * SECURITY:
 * - Requires valid license_key query param
 * - Verifies buyer_workspace_id matches auth context
 * - Enforces download_limit
 * - Increments download_count
 */
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) => {
  const { itemId } = await params;

  const supabase = await supabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = request.cookies.get("gv_workspace_id")?.value;
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace selected" }, { status: 400 });
  }

  // Get license key from query params
  const { searchParams } = new URL(request.url);
  const licenseKey = searchParams.get("license");

  if (!licenseKey) {
    return NextResponse.json({ error: "License key required" }, { status: 400 });
  }

  const db = supabaseAdmin();

  // Find the purchase with matching license key and buyer workspace
  const { data: purchase, error: purchaseError } = await db
    .from("marketplace_purchases")
    .select("*, marketplace_items(download_url, title, file_format)")
    .eq("item_id", itemId)
    .eq("buyer_workspace_id", workspaceId)
    .eq("license_key", licenseKey)
    .eq("payment_status", "completed")
    .single();

  if (purchaseError || !purchase) {
    return NextResponse.json({ error: "Purchase not found or invalid license" }, { status: 404 });
  }

  // Check download limit
  if (purchase.download_count >= purchase.download_limit) {
    return NextResponse.json(
      { error: "Download limit reached" },
      { status: 403 }
    );
  }

  // Get the item's download URL
  const item = purchase.marketplace_items as { download_url: string | null; title: string; file_format: string | null };
  if (!item?.download_url) {
    return NextResponse.json(
      { error: "Download not available yet. The creator has not uploaded the file." },
      { status: 404 }
    );
  }

  // Increment download count
  await db
    .from("marketplace_purchases")
    .update({ download_count: purchase.download_count + 1 })
    .eq("id", purchase.id);

  // Increment item download stats (best-effort)
  try {
    await db.rpc("increment_marketplace_download_count", {
      p_item_id: itemId,
    });
  } catch {
    logger.warn("Failed to increment item download count", { itemId });
  }

  logger.info("Marketplace item downloaded", {
    purchaseId: purchase.id,
    itemId,
    buyerWorkspaceId: workspaceId,
    downloadCount: purchase.download_count + 1,
    downloadLimit: purchase.download_limit,
  });

  // Redirect to the download URL (Supabase Storage signed URL or external)
  return NextResponse.redirect(item.download_url);
});
