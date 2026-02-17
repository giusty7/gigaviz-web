import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging";

const BUCKET = "studio-images";

/**
 * Download an image from a URL and persist it in Supabase Storage.
 * Returns the public URL of the stored image, or null on failure.
 * Falls back to the original URL if storage fails.
 */
export async function persistImage(
  imageUrl: string,
  workspaceId: string,
  entityId: string
): Promise<string> {
  try {
    // Download image from DALL-E temporary URL
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) {
      logger.warn("Failed to download image for persistence", {
        status: res.status,
        imageUrl: imageUrl.slice(0, 100),
      });
      return imageUrl;
    }

    const contentType = res.headers.get("content-type") || "image/png";
    const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png";
    const blob = await res.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    // Upload to Supabase Storage
    const path = `${workspaceId}/${entityId}.${ext}`;
    const db = supabaseAdmin();

    // Ensure bucket exists (idempotent)
    await db.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 10_485_760, // 10MB
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
    }).catch(() => {
      // Bucket already exists — ignore
    });

    const { error: uploadErr } = await db.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadErr) {
      logger.error("Failed to upload image to storage", {
        error: uploadErr,
        path,
        workspaceId,
      });
      return imageUrl;
    }

    // Get public URL
    const { data: publicUrlData } = db.storage.from(BUCKET).getPublicUrl(path);

    logger.info("Image persisted to storage", {
      path,
      workspaceId,
      entityId,
    });

    return publicUrlData.publicUrl;
  } catch (err) {
    logger.error("Image persistence failed", {
      error: err,
      workspaceId,
      entityId,
    });
    return imageUrl; // Fall back to original URL
  }
}
