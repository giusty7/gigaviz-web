import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAppContext } from "@/lib/app-context";
import { canAccess, getPlanMeta } from "@/lib/entitlements";
import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { consumeTokens } from "@/lib/tokens";
import { tokenRates } from "@/lib/tokenRates";
import {
  generateDocumentContent,
  generateImage,
  generateChartFromPrompt,
  generateVideoStoryboard,
  generateMusicComposition,
  generateDashboardLayout,
} from "@/lib/studio/ai-generate";
import { persistImage } from "@/lib/studio/persist-image";

/* ------------------------------------------------------------------ */
/*  Schema                                                              */
/* ------------------------------------------------------------------ */

const generateSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("document"),
    document_id: z.string().uuid(),
    prompt: z.string().min(1).max(4096),
    category: z.string(),
    title: z.string(),
  }),
  z.object({
    type: z.literal("image"),
    image_id: z.string().uuid(),
    prompt: z.string().min(1).max(4000),
    style: z.string(),
    width: z.number().int().min(256).max(4096).default(1024),
    height: z.number().int().min(256).max(4096).default(1024),
  }),
  z.object({
    type: z.literal("chart"),
    chart_id: z.string().uuid(),
    prompt: z.string().min(1).max(4000),
    chart_type: z.string().optional(),
  }),
  z.object({
    type: z.literal("video"),
    video_id: z.string().uuid(),
    prompt: z.string().min(1).max(4000),
    style: z.string(),
    duration_seconds: z.number().int().min(5).max(300).default(30),
  }),
  z.object({
    type: z.literal("music"),
    music_id: z.string().uuid(),
    prompt: z.string().min(1).max(4000),
    genre: z.string(),
    bpm: z.number().int().min(40).max(300).default(120),
    key_signature: z.string().default("C"),
    duration_seconds: z.number().int().min(5).max(600).default(30),
  }),
  z.object({
    type: z.literal("dashboard"),
    dashboard_id: z.string().uuid(),
    prompt: z.string().min(1).max(4000),
    title: z.string(),
  }),
]);

/* ------------------------------------------------------------------ */
/*  Feature map                                                         */
/* ------------------------------------------------------------------ */

const typeToFeature: Record<string, string> = {
  document: "office",
  image: "graph",
  chart: "graph",
  video: "graph",
  music: "tracks",
  dashboard: "graph",
};

const typeToTokenAction: Record<string, keyof typeof tokenRates> = {
  document: "office_export",
  image: "graph_generate_image",
  chart: "graph_generate_image",
  video: "graph_generate_image",
  music: "tracks_generate",
  dashboard: "graph_generate_image",
};

/* ------------------------------------------------------------------ */
/*  Entity table + ID mapping                                           */
/* ------------------------------------------------------------------ */

const typeToTable: Record<string, string> = {
  document: "office_documents",
  image: "graph_images",
  chart: "graph_charts",
  video: "graph_videos",
  music: "tracks_music",
  dashboard: "graph_dashboards",
};

function getEntityId(validated: z.infer<typeof generateSchema>): string {
  if ("document_id" in validated) return validated.document_id;
  if ("image_id" in validated) return validated.image_id;
  if ("chart_id" in validated) return validated.chart_id;
  if ("video_id" in validated) return validated.video_id;
  if ("music_id" in validated) return validated.music_id;
  if ("dashboard_id" in validated) return validated.dashboard_id;
  throw new Error("Unknown entity type");
}

/* ------------------------------------------------------------------ */
/*  Handler                                                             */
/* ------------------------------------------------------------------ */

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await getAppContext();
  if (!ctx.user || !ctx.currentWorkspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = ctx.currentWorkspace.id;
  const userId = ctx.user.id;

  // Validate body
  const body = await req.json();
  const validated = generateSchema.parse(body);

  // Check entitlement
  const db = await supabaseServer();
  const { data: sub } = await db
    .from("subscriptions")
    .select("plan_id")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  const plan = getPlanMeta(sub?.plan_id || "free_locked");
  const ents = ctx.effectiveEntitlements ?? [];
  const feature = typeToFeature[validated.type];
  const hasAccess = canAccess(
    { plan_id: plan.plan_id, is_admin: Boolean(ctx.profile?.is_admin), effectiveEntitlements: ents },
    feature as Parameters<typeof canAccess>[1]
  );

  if (!hasAccess) {
    return NextResponse.json({ error: "Feature not available" }, { status: 403 });
  }

  // Verify entity exists and belongs to workspace BEFORE consuming tokens
  const table = typeToTable[validated.type];
  const entityId = getEntityId(validated);
  const { data: entity, error: entityErr } = await db
    .from(table)
    .select("id")
    .eq("id", entityId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (entityErr || !entity) {
    logger.warn("Generate called for non-existent entity", {
      type: validated.type,
      entityId,
      workspace: workspaceId,
    });
    return NextResponse.json({ error: "Entity not found" }, { status: 404 });
  }

  // Deduct tokens
  const tokenAction = typeToTokenAction[validated.type];
  const cost = tokenRates[tokenAction].tokens;

  try {
    await consumeTokens(workspaceId, cost, {
      feature_key: feature,
      ref_type: `studio_${validated.type}`,
      ref_id: entityId,
      note: `AI generation: ${validated.type}`,
      created_by: userId,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "insufficient_tokens") {
      return NextResponse.json(
        { error: "Insufficient tokens", required: cost },
        { status: 402 }
      );
    }
    throw err;
  }

  // Generate based on type
  try {
    switch (validated.type) {
      case "document": {
        const result = await generateDocumentContent(
          validated.prompt,
          validated.category,
          validated.title
        );

        // Update the document with generated content
        const { error: updateErr } = await db
          .from("office_documents")
          .update({
            content_json: result,
            last_edited_by: userId,
          })
          .eq("id", validated.document_id)
          .eq("workspace_id", workspaceId);

        if (updateErr) {
          logger.error("Failed to update document with AI content", { error: updateErr });
          return NextResponse.json({ error: "Failed to save" }, { status: 500 });
        }

        logger.info("AI document generated", { docId: validated.document_id, workspace: workspaceId });
        return NextResponse.json({ data: result });
      }

      case "image": {
        // Set status to "generating"
        await db
          .from("graph_images")
          .update({ status: "generating" })
          .eq("id", validated.image_id)
          .eq("workspace_id", workspaceId);

        const result = await generateImage(
          validated.prompt,
          validated.style,
          validated.width,
          validated.height
        );

        // Persist image to Supabase Storage (DALL-E URLs expire)
        const permanentUrl = await persistImage(
          result.image_url,
          workspaceId,
          validated.image_id
        );

        // Update with persisted image URL
        const { error: updateErr } = await db
          .from("graph_images")
          .update({
            status: "completed",
            image_url: permanentUrl,
            metadata_json: { revised_prompt: result.revised_prompt, original_url: result.image_url },
          })
          .eq("id", validated.image_id)
          .eq("workspace_id", workspaceId);

        if (updateErr) {
          await db
            .from("graph_images")
            .update({ status: "failed" })
            .eq("id", validated.image_id)
            .eq("workspace_id", workspaceId);
          logger.error("Failed to update image", { error: updateErr });
          return NextResponse.json({ error: "Failed to save" }, { status: 500 });
        }

        logger.info("AI image generated", { imageId: validated.image_id, workspace: workspaceId });
        return NextResponse.json({ data: { image_url: result.image_url, revised_prompt: result.revised_prompt } });
      }

      case "chart": {
        const result = await generateChartFromPrompt(
          validated.prompt,
          validated.chart_type
        );

        const { error: updateErr } = await db
          .from("graph_charts")
          .update({
            chart_type: result.chart_type,
            config_json: result.config_json,
            data_json: result.data_json,
          })
          .eq("id", validated.chart_id)
          .eq("workspace_id", workspaceId);

        if (updateErr) {
          logger.error("Failed to update chart", { error: updateErr });
          return NextResponse.json({ error: "Failed to save" }, { status: 500 });
        }

        logger.info("AI chart generated", { chartId: validated.chart_id, workspace: workspaceId });
        return NextResponse.json({ data: result });
      }

      case "video": {
        // Set status to "generating"
        await db
          .from("graph_videos")
          .update({ status: "generating" })
          .eq("id", validated.video_id)
          .eq("workspace_id", workspaceId);

        const result = await generateVideoStoryboard(
          validated.prompt,
          validated.style,
          validated.duration_seconds
        );

        const { error: updateErr } = await db
          .from("graph_videos")
          .update({
            status: "completed",
            metadata_json: result,
          })
          .eq("id", validated.video_id)
          .eq("workspace_id", workspaceId);

        if (updateErr) {
          await db
            .from("graph_videos")
            .update({ status: "failed" })
            .eq("id", validated.video_id)
            .eq("workspace_id", workspaceId);
          logger.error("Failed to update video", { error: updateErr });
          return NextResponse.json({ error: "Failed to save" }, { status: 500 });
        }

        logger.info("AI video storyboard generated", { videoId: validated.video_id, workspace: workspaceId });
        return NextResponse.json({ data: result });
      }

      case "music": {
        // Set status to "generating"
        await db
          .from("tracks_music")
          .update({ status: "generating" })
          .eq("id", validated.music_id)
          .eq("workspace_id", workspaceId);

        const result = await generateMusicComposition(
          validated.prompt,
          validated.genre,
          validated.bpm,
          validated.key_signature,
          validated.duration_seconds
        );

        const { error: updateErr } = await db
          .from("tracks_music")
          .update({
            status: "completed",
            waveform_json: result.waveform_json,
            metadata_json: result.composition,
          })
          .eq("id", validated.music_id)
          .eq("workspace_id", workspaceId);

        if (updateErr) {
          await db
            .from("tracks_music")
            .update({ status: "failed" })
            .eq("id", validated.music_id)
            .eq("workspace_id", workspaceId);
          logger.error("Failed to update music", { error: updateErr });
          return NextResponse.json({ error: "Failed to save" }, { status: 500 });
        }

        logger.info("AI music composition generated", { musicId: validated.music_id, workspace: workspaceId });
        return NextResponse.json({ data: result });
      }

      case "dashboard": {
        const result = await generateDashboardLayout(
          validated.prompt,
          validated.title
        );

        const { error: updateErr } = await db
          .from("graph_dashboards")
          .update({ layout_json: result.widgets })
          .eq("id", validated.dashboard_id)
          .eq("workspace_id", workspaceId);

        if (updateErr) {
          logger.error("Failed to update dashboard", { error: updateErr });
          return NextResponse.json({ error: "Failed to save" }, { status: 500 });
        }

        logger.info("AI dashboard layout generated", { dashboardId: validated.dashboard_id, workspace: workspaceId });
        return NextResponse.json({ data: result });
      }
    }
  } catch (err) {
    logger.error("AI generation failed", { type: validated.type, error: err, workspace: workspaceId });

    // Mark as failed if applicable
    if ("image_id" in validated) {
      await db.from("graph_images").update({ status: "failed" }).eq("id", validated.image_id).eq("workspace_id", workspaceId);
    }
    if ("video_id" in validated) {
      await db.from("graph_videos").update({ status: "failed" }).eq("id", validated.video_id).eq("workspace_id", workspaceId);
    }
    if ("music_id" in validated) {
      await db.from("tracks_music").update({ status: "failed" }).eq("id", validated.music_id).eq("workspace_id", workspaceId);
    }

    // Determine user-friendly error message
    const errMsg = err instanceof Error ? err.message : String(err);
    const isConfigError = errMsg.includes("OPENAI_API_KEY") || errMsg.includes("API key");
    const isRateLimit = errMsg.includes("rate_limit") || errMsg.includes("429");

    const userMessage = isConfigError
      ? "AI generation is temporarily unavailable. Our team has been notified."
      : isRateLimit
        ? "AI service is busy. Please try again in a moment."
        : "AI generation failed. Please try again or contact support.";

    return NextResponse.json(
      { error: userMessage },
      { status: isRateLimit ? 429 : 500 }
    );
  }
});
