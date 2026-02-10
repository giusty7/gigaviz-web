/**
 * Sentiment endpoint for Imperial Inbox.
 * POST { workspaceSlug, text } -> { score (0-100), label ("Calm"/"Neutral"/"Alert") }
 * - Auth + workspace membership enforced.
 * - Attempts external NLP via NLP_SENTIMENT_URL/NLP_API_URL + NLP_API_KEY.
 * - Falls back to lightweight heuristic when NLP is unavailable.
 */
import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteClient } from "@/lib/supabase/app-route";
import { forbiddenResponse, requireWorkspaceMember, unauthorizedResponse, workspaceRequiredResponse } from "@/lib/auth/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const SENTIMENT_URL = process.env.NLP_SENTIMENT_URL || process.env.NLP_API_URL;
const SENTIMENT_API_KEY = process.env.NLP_API_KEY || process.env.NLP_SENTIMENT_KEY;

type SentimentPayload = {
  score: number;
  label: string;
};

export async function POST(req: NextRequest) {
  const { supabase, withCookies } = createSupabaseRouteClient(req);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return unauthorizedResponse(withCookies);
  }

  const body = await req.json().catch(() => ({}));
  const parsed = z
    .object({
      workspaceSlug: z.string().min(1),
      text: z.string().min(1),
    })
    .safeParse(body);

  if (!parsed.success) {
    return workspaceRequiredResponse(withCookies);
  }

  const { workspaceSlug, text } = parsed.data;

  const db = supabaseAdmin();
  const { data: workspace, error: workspaceError } = await db
    .from("workspaces")
    .select("id")
    .eq("slug", workspaceSlug)
    .maybeSingle();

  if (workspaceError) {
    return withCookies(NextResponse.json({ ok: false, error: "db_error", reason: "workspace_lookup_failed" }, { status: 500 }));
  }

  if (!workspace?.id) {
    return workspaceRequiredResponse(withCookies);
  }

  const membership = await requireWorkspaceMember(userData.user.id, workspace.id);
  if (!membership.ok) {
    return forbiddenResponse(withCookies);
  }

  const fallback = buildHeuristicSentiment(text);

  if (!SENTIMENT_URL) {
    return withCookies(NextResponse.json({ ok: true, ...fallback, source: "heuristic" }));
  }

  try {
    const res = await fetch(SENTIMENT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(SENTIMENT_API_KEY ? { Authorization: `Bearer ${SENTIMENT_API_KEY}` } : {}),
      },
      body: JSON.stringify({ text, workspaceId: workspace.id }),
    });
    const data = (await res.json().catch(() => ({}))) as Partial<SentimentPayload>;

    if (!res.ok || typeof data.score !== "number") {
      throw new Error(data?.label || "sentiment_failed");
    }

    const clamped = Math.max(0, Math.min(1, data.score));
    const label = data.label || sentimentLabelFromScore(clamped * 100);

    return withCookies(
      NextResponse.json({
        ok: true,
        score: Math.round(clamped * 100),
        label,
        source: "nlp",
      })
    );
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      logger.warn("sentiment_api_fallback", err);
    }
    return withCookies(NextResponse.json({ ok: true, ...fallback, source: "heuristic" }));
  }
}

function buildHeuristicSentiment(text: string) {
  const normalized = text.toLowerCase();
  const positiveWords = ["thank", "great", "good", "love", "appreciate", "yes", "helpful", "nice", "well done"];
  const negativeWords = ["bad", "angry", "upset", "frustrated", "hate", "no", "problem", "issue", "terrible", "worst"];

  let score = 0.5;
  positiveWords.forEach((word) => {
    if (normalized.includes(word)) score += 0.08;
  });
  negativeWords.forEach((word) => {
    if (normalized.includes(word)) score -= 0.1;
  });
  const bounded = Math.max(0.05, Math.min(0.95, score));
  return { score: Math.round(bounded * 100), label: sentimentLabelFromScore(bounded * 100) };
}

function sentimentLabelFromScore(score: number) {
  if (score >= 70) return "Calm";
  if (score >= 45) return "Neutral";
  return "Alert";
}
