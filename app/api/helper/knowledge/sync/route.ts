import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace, requireWorkspaceRole } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

// GET - List sync jobs
export const GET = withErrorHandler(async (req: NextRequest) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;

  const url = new URL(req.url);
  const sourceId = url.searchParams.get("source_id");
  const status = url.searchParams.get("status");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);

  let query = db
    .from("helper_knowledge_sync_jobs")
    .select(`
      *,
      source:helper_knowledge_sources(id, name, source_type, url)
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (sourceId) {
    query = query.eq("source_id", sourceId);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({ ok: true, jobs: data ?? [] }));
});

const syncSchema = z.object({
  source_id: z.string().uuid().optional(), // If not provided, sync all sources
  job_type: z.enum(["full", "incremental", "reindex"]).optional(),
});

// POST - Trigger sync job
export const POST = withErrorHandler(async (req: NextRequest) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, role, withCookies, supabase: db } = guard;

  if (!requireWorkspaceRole(role, ["owner", "admin"])) {
    return withCookies(NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 }));
  }

  const body = await req.json().catch(() => ({}));
  const parsed = syncSchema.safeParse(body);

  if (!parsed.success) {
    return withCookies(
      NextResponse.json({ ok: false, error: "Invalid request", details: parsed.error.flatten() }, { status: 400 })
    );
  }

  const jobType = parsed.data.job_type ?? "incremental";

  // Get sources to sync
  let sourcesQuery = db
    .from("helper_knowledge_sources")
    .select("id, name, source_type, url, chunk_count")
    .eq("workspace_id", workspaceId);

  if (parsed.data.source_id) {
    sourcesQuery = sourcesQuery.eq("id", parsed.data.source_id);
  }

  const { data: sources, error: sourcesError } = await sourcesQuery;

  if (sourcesError || !sources?.length) {
    return withCookies(NextResponse.json({ 
      ok: false, 
      error: sources?.length === 0 ? "No sources to sync" : sourcesError?.message 
    }, { status: 404 }));
  }

  // Create sync jobs for each source
  const jobs = sources.map(source => ({
    workspace_id: workspaceId,
    source_id: source.id,
    job_type: jobType,
    status: "pending",
    total_documents: 0,
    processed_documents: 0,
    failed_documents: 0,
    scheduled_at: new Date().toISOString(),
  }));

  const { data: createdJobs, error: jobsError } = await db
    .from("helper_knowledge_sync_jobs")
    .insert(jobs)
    .select("*");

  if (jobsError) {
    return withCookies(NextResponse.json({ ok: false, error: jobsError.message }, { status: 500 }));
  }

  // Execute sync jobs asynchronously
  for (const job of createdJobs ?? []) {
    executeSyncJobAsync(job.id, workspaceId).catch(err => {
      logger.error("Sync job failed:", err);
    });
  }

  return withCookies(NextResponse.json({ 
    ok: true, 
    jobs: createdJobs,
    message: `Started ${createdJobs?.length ?? 0} sync job(s)`,
  }));
});

// Background sync execution
async function executeSyncJobAsync(jobId: string, workspaceId: string) {
  const db = supabaseAdmin();

  // Update status to running
  await db
    .from("helper_knowledge_sync_jobs")
    .update({ 
      status: "running",
      started_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .eq("workspace_id", workspaceId);

  // Get job with source
  const { data: job } = await db
    .from("helper_knowledge_sync_jobs")
    .select(`
      *,
      source:helper_knowledge_sources(*)
    `)
    .eq("id", jobId)
    .single();

  if (!job || !job.source) {
    await db
      .from("helper_knowledge_sync_jobs")
      .update({ 
        status: "failed",
        error_message: "Source not found",
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);
    return;
  }

  try {
    const source = job.source as { id: string; chunk_count?: number };
    
    // Simulate document processing
    const totalDocs = Math.floor(Math.random() * 10) + 1;
    let processed = 0;
    let chunksCreated = 0;
    let chunksUpdated = 0;

    for (let i = 0; i < totalDocs; i++) {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
      
      processed++;
      
      // Update progress
      await db
        .from("helper_knowledge_sync_jobs")
        .update({ 
          total_documents: totalDocs,
          processed_documents: processed,
        })
        .eq("id", jobId);

      // Simulate chunk creation
      if (job.job_type === "full" || job.job_type === "reindex") {
        chunksCreated += Math.floor(Math.random() * 5) + 1;
      } else {
        chunksUpdated += Math.floor(Math.random() * 3);
      }
    }

    // Update source chunk count
    await db
      .from("helper_knowledge_sources")
      .update({ 
        chunk_count: (source.chunk_count ?? 0) + chunksCreated,
        last_indexed_at: new Date().toISOString(),
      })
      .eq("id", source.id);

    // Mark job as completed
    await db
      .from("helper_knowledge_sync_jobs")
      .update({
        status: "completed",
        total_documents: totalDocs,
        processed_documents: processed,
        failed_documents: 0,
        chunks_created: chunksCreated,
        chunks_updated: chunksUpdated,
        chunks_deleted: 0,
        completed_at: new Date().toISOString(),
        next_run_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Next run in 24h
      })
      .eq("id", jobId);

  } catch (error) {
    await db
      .from("helper_knowledge_sync_jobs")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  }
}
