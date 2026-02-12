import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import {
  getCannedResponse,
  updateCannedResponse,
  deleteCannedResponse,
} from "@/lib/ops/canned-responses";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const dynamic = "force-dynamic";

const updateCannedResponseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  shortcut: z.string().max(50).optional(),
  category: z.string().max(100).optional(),
});

export const GET = withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const response = await getCannedResponse(id);

    if (!response) {
      return NextResponse.json({ error: "Canned response not found" }, { status: 404 });
    }

    return NextResponse.json({ response });
  } catch (error) {
    logger.error("Get canned response error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get canned response" },
      { status: 500 }
    );
  }
});

export const PATCH = withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateCannedResponseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const { title, content, shortcut, category } = parsed.data;

    const response = await updateCannedResponse(id, {
      title,
      content,
      shortcut,
      category,
    });

    return NextResponse.json({ response });
  } catch (error) {
    logger.error("Update canned response error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update canned response" },
      { status: 500 }
    );
  }
});

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await deleteCannedResponse(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Delete canned response error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete canned response" },
      { status: 500 }
    );
  }
});
