// Instagram Thread Update API
// PATCH /api/meta/instagram/threads/[threadId] - Update thread status, assignment

import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseRouteClient } from '@/lib/supabase/app-route';
import { recordAuditEvent } from '@/lib/audit';
import { withErrorHandler } from "@/lib/api/with-error-handler";

const threadUpdateSchema = z.object({
  status: z.enum(["open", "closed", "snoozed", "pending"]).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
});

export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) => {
  try {
    const { supabase, withCookies } = createSupabaseRouteClient(request);
    const { threadId } = await params;

    // Validate body
    const body = await request.json().catch(() => ({}));
    const parsed = threadUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return withCookies(
        NextResponse.json({ error: parsed.error.issues[0]?.message ?? "invalid_input" }, { status: 400 })
      );
    }

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return withCookies(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    // Get thread
    const { data: thread, error: threadError } = await supabase
      .from('instagram_threads')
      .select('*')
      .eq('id', threadId)
      .single();

    if (threadError || !thread) {
      return withCookies(NextResponse.json({ error: 'Thread not found' }, { status: 404 }));
    }

    // Verify workspace membership
    const { data: membership } = await supabase
      .from('workspace_memberships')
      .select('workspace_id')
      .eq('workspace_id', thread.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return withCookies(
        NextResponse.json({ error: 'Access denied to this workspace' }, { status: 403 })
      );
    }

    // Build update object
    const updates: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.status !== undefined) {
      updates.status = parsed.data.status;
    }

    if (parsed.data.assigned_to !== undefined) {
      updates.assigned_to = parsed.data.assigned_to;
    }

    // Update thread
    const { data: updated, error: updateError } = await supabase
      .from('instagram_threads')
      .update(updates)
      .eq('id', threadId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Audit log
    await recordAuditEvent({
      workspaceId: thread.workspace_id,
      actorUserId: user.id,
      action: 'instagram_thread_updated',
      meta: {
        changes: updates,
      },
    });

    return withCookies(
      NextResponse.json({
        success: true,
        thread: updated,
      })
    );
  } catch (error) {
    logger.error('[Instagram] Update thread error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const { withCookies } = createSupabaseRouteClient(request);
    return withCookies(
      NextResponse.json({ error: message }, { status: 500 })
    );
  }
});
