import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const dynamic = "force-dynamic";

const uploadSchema = z.object({
  type: z.enum(["product", "thumbnail"]),
  filename: z.string().min(1).max(255),
  content_type: z.string().min(1).max(100),
});

const MAX_FILE_SIZE_PRODUCT = 50 * 1024 * 1024; // 50MB
const MAX_FILE_SIZE_THUMBNAIL = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/marketplace/items/[itemId]/upload
 * Get a signed upload URL for Supabase Storage.
 *
 * Flow:
 * 1. Validate ownership
 * 2. Generate signed upload URL for the marketplace bucket
 * 3. Client uploads directly to storage
 * 4. Update item record with the file URL
 *
 * SECURITY: Only the creator workspace can upload files for their items.
 */
export const POST = withErrorHandler(async (
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

  // Validate input
  const body = await request.json().catch(() => null);
  const parsed = uploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "invalid_input" },
      { status: 400 }
    );
  }

  const { type, filename, content_type } = parsed.data;

  // Verify item ownership
  const db = supabaseAdmin();
  const { data: item, error: itemError } = await db
    .from("marketplace_items")
    .select("id, creator_workspace_id")
    .eq("id", itemId)
    .single();

  if (itemError || !item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (item.creator_workspace_id !== workspaceId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Generate storage path
  const ext = filename.split(".").pop() ?? "bin";
  const storagePath = type === "product"
    ? `marketplace/${workspaceId}/${itemId}/product.${ext}`
    : `marketplace/${workspaceId}/${itemId}/thumbnail.${ext}`;

  const maxSize = type === "product" ? MAX_FILE_SIZE_PRODUCT : MAX_FILE_SIZE_THUMBNAIL;

  // Create signed upload URL
  const { data: uploadData, error: uploadError } = await db.storage
    .from("marketplace-files")
    .createSignedUploadUrl(storagePath, {
      upsert: true,
    });

  if (uploadError) {
    logger.error("Failed to create upload URL", { error: uploadError, itemId, type });
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }

  // After upload, the client should call a separate endpoint to confirm
  // For now, we'll also return the public URL pattern
  const { data: publicUrl } = db.storage
    .from("marketplace-files")
    .getPublicUrl(storagePath);

  logger.info("Marketplace upload URL created", { itemId, type, storagePath });

  return NextResponse.json({
    success: true,
    upload_url: uploadData.signedUrl,
    token: uploadData.token,
    storage_path: storagePath,
    public_url: publicUrl.publicUrl,
    max_size: maxSize,
    content_type,
  });
});

/**
 * PATCH /api/marketplace/items/[itemId]/upload
 * Confirm upload and update item record with file URLs.
 */
export const PATCH = withErrorHandler(async (
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

  const confirmSchema = z.object({
    type: z.enum(["product", "thumbnail"]),
    public_url: z.string().url(),
    file_size_bytes: z.number().positive().optional(),
    file_format: z.string().max(20).optional(),
  });

  const body = await request.json().catch(() => null);
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "invalid_input" },
      { status: 400 }
    );
  }

  const db = supabaseAdmin();

  // Verify ownership
  const { data: item } = await db
    .from("marketplace_items")
    .select("creator_workspace_id")
    .eq("id", itemId)
    .single();

  if (!item || item.creator_workspace_id !== workspaceId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Update item with file URL
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.type === "product") {
    updateData.download_url = parsed.data.public_url;
    if (parsed.data.file_size_bytes) updateData.file_size_bytes = parsed.data.file_size_bytes;
    if (parsed.data.file_format) updateData.file_format = parsed.data.file_format;
  } else {
    updateData.thumbnail_url = parsed.data.public_url;
  }

  const { error: updateError } = await db
    .from("marketplace_items")
    .update(updateData)
    .eq("id", itemId);

  if (updateError) {
    logger.error("Failed to confirm upload", { error: updateError, itemId });
    return NextResponse.json({ error: "Failed to confirm upload" }, { status: 500 });
  }

  logger.info("Marketplace upload confirmed", { itemId, type: parsed.data.type });
  return NextResponse.json({ success: true });
});
