/**
 * Beta Program API - Apply to join beta testing
 * POST /api/beta/apply
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/app-route';
import { z } from 'zod';

const ApplySchema = z.object({
  workspaceId: z.string().uuid(),
  moduleSlug: z.string().min(1),
  reason: z.string().min(10).max(1000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ApplySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { workspaceId, moduleSlug, reason } = parsed.data;

    const { supabase } = createSupabaseRouteClient(request);

    // Auth check
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify workspace membership
    const { data: membership } = await supabase
      .from('workspace_memberships')
      .select('workspace_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userData.user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      );
    }

    // Check if beta program exists and is open
    const { data: program } = await supabase
      .from('beta_programs')
      .select('*')
      .eq('module_slug', moduleSlug)
      .single();

    if (!program) {
      return NextResponse.json(
        { error: 'Beta program not found' },
        { status: 404 }
      );
    }

    if (program.status === 'closed') {
      return NextResponse.json(
        { error: 'Beta program is closed' },
        { status: 400 }
      );
    }

    if (program.status === 'full') {
      return NextResponse.json(
        { error: 'Beta program is full' },
        { status: 400 }
      );
    }

    // Check if already applied
    const { data: existing } = await supabase
      .from('beta_participants')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('module_slug', moduleSlug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Already applied to this beta program', participant: existing },
        { status: 400 }
      );
    }

    // Create application
    const { data: participant, error } = await supabase
      .from('beta_participants')
      .insert({
        workspace_id: workspaceId,
        user_id: userData.user.id,
        module_slug: moduleSlug,
        program_id: program.id,
        application_reason: reason,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('[Beta API] Failed to create application:', error);
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      );
    }

    return NextResponse.json({ participant }, { status: 201 });

  } catch (err) {
    console.error('[Beta API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/beta/apply - Get beta programs and user's applications
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const { supabase } = createSupabaseRouteClient(request);

    // Auth check
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify workspace membership
    const { data: membership } = await supabase
      .from('workspace_memberships')
      .select('workspace_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userData.user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      );
    }

    // Get all beta programs
    const { data: programs } = await supabase
      .from('beta_programs')
      .select('*')
      .order('created_at', { ascending: true });

    // Get user's applications
    const { data: applications } = await supabase
      .from('beta_participants')
      .select('*')
      .eq('workspace_id', workspaceId);

    return NextResponse.json({
      programs: programs || [],
      applications: applications || [],
    });

  } catch (err) {
    console.error('[Beta API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
