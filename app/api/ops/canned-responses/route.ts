import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform-admin/require";
import {
  listCannedResponses,
  createCannedResponse,
  searchCannedResponses,
} from "@/lib/ops/canned-responses";
import { logger } from "@/lib/logging";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const dynamic = "force-dynamic";

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
    const { title, content, shortcut, category, workspaceId } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

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
