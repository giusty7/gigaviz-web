import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import {
  listCannedResponses,
  createCannedResponse,
  searchCannedResponses,
} from "@/lib/ops/canned-responses";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const dynamic = "force-dynamic";

const createCannedResponseSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  shortcut: z.string().max(50).optional(),
  category: z.string().max(100).optional(),
  workspaceId: z.string().uuid().nullable().optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const workspaceId = searchParams.get("workspaceId") || undefined;

    let responses;
    if (query) {
      responses = await searchCannedResponses(query, workspaceId);
    } else {
      responses = await listCannedResponses(workspaceId);
    }

    return NextResponse.json({ responses });
  } catch (error) {
    logger.error("List canned responses error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list canned responses" },
      { status: 500 }
    );
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createCannedResponseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const { title, content, shortcut, category, workspaceId } = parsed.data;

    const response = await createCannedResponse(
      {
        title,
        content,
        shortcut,
        category,
        workspaceId: workspaceId || null,
      },
      admin.user.id
    );

    return NextResponse.json({ response }, { status: 201 });
  } catch (error) {
    logger.error("Create canned response error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create canned response" },
      { status: 500 }
    );
  }
});
