// Instagram Thread Update API
// PATCH /api/meta/instagram/threads/[threadId] - Update thread status, assignment

import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/app-route';
import { recordAuditEvent } from '@/lib/audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { supabase, withCookies } = createSupabaseRouteClient(request);
    const { threadId } = await params;
    const body = await request.json();
    const { status, assigned_to } = body;

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

    // Build update object
    const updates: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) {
      updates.status = status;
    }

    if (assigned_to !== undefined) {
      updates.assigned_to = assigned_to;
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
}
