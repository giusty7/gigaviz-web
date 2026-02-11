import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardWorkspace } from "@/lib/auth/guard";

export const runtime = "nodejs";

const scoreSchema = z.object({
  lead_id: z.string().uuid(),
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// AI-powered lead analysis using fetch API
async function analyzeLeadWithAI(lead: Record<string, unknown>, interactions: unknown[]): Promise<{
  summary: string;
  recommendations: string[];
  temperature: "hot" | "warm" | "cold";
  confidence: number;
}> {
  const estimatedValueStr = lead.estimated_value 
    ? `${lead.currency} ${lead.estimated_value}` 
    : "Unknown";
  const tagsStr = (lead.tags as string[])?.join(", ") || "None";
  
  const prompt = `Analyze this sales lead and provide insights:

Lead Information:
- Name: ${lead.name}
- Company: ${lead.company || "Unknown"}
- Title: ${lead.title || "Unknown"}
- Email: ${lead.email || "Not provided"}
- Phone: ${lead.phone || "Not provided"}
- Source: ${lead.source}
- Current Score: ${lead.score}
- Total Interactions: ${lead.total_interactions}
- Last Activity: ${lead.last_activity_at || "Never"}
- Estimated Value: ${estimatedValueStr}
- Tags: ${tagsStr}

Recent Interactions (last 10):
${JSON.stringify(interactions.slice(0, 10), null, 2)}

Provide:
1. A brief summary (2-3 sentences) of this lead's potential
2. 3 actionable recommendations for the sales team
3. Temperature assessment: "hot" (ready to buy), "warm" (interested), or "cold" (needs nurturing)
4. Confidence score 0-1

Respond in JSON format:
{
  "summary": "...",
  "recommendations": ["...", "...", "..."],
  "temperature": "hot|warm|cold",
  "confidence": 0.85
}`;

  const fallbackSummary = `${lead.name} from ${lead.company || "unknown company"} with ${lead.total_interactions || 0} interactions.`;

  if (!OPENAI_API_KEY) {
    // Fallback if no API key
    return {
      summary: fallbackSummary,
      recommendations: [
        "Follow up within 24 hours",
        "Send relevant case studies",
        "Schedule a discovery call",
      ],
      temperature: (lead.score as number) >= 70 ? "hot" : (lead.score as number) >= 40 ? "warm" : "cold",
      confidence: 0.5,
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a sales intelligence AI. Analyze leads and provide actionable insights. Always respond in valid JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No response from AI");

    const result = JSON.parse(content);
    return {
      summary: result.summary || "No summary available",
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
      temperature: ["hot", "warm", "cold"].includes(result.temperature) ? result.temperature : "cold",
      confidence: typeof result.confidence === "number" ? Math.min(1, Math.max(0, result.confidence)) : 0.5,
    };
  } catch (error) {
    logger.error("AI analysis failed:", error);
    // Fallback to rule-based
    return {
      summary: fallbackSummary,
      recommendations: [
        "Follow up within 24 hours",
        "Send relevant case studies",
        "Schedule a discovery call",
      ],
      temperature: (lead.score as number) >= 70 ? "hot" : (lead.score as number) >= 40 ? "warm" : "cold",
      confidence: 0.5,
    };
  }
}

// POST - Score/analyze a single lead
export async function POST(req: NextRequest) {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, withCookies, supabase: db } = guard;

  const body = await req.json().catch(() => ({}));
  const parsed = scoreSchema.safeParse(body);

  if (!parsed.success) {
    return withCookies(
      NextResponse.json({ ok: false, error: "Invalid request", details: parsed.error.flatten() }, { status: 400 })
    );
  }

  // Get lead
  const { data: lead, error: leadError } = await db
    .from("helper_leads")
    .select("*")
    .eq("id", parsed.data.lead_id)
    .eq("workspace_id", workspaceId)
    .single();

  if (leadError || !lead) {
    return withCookies(NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 }));
  }

  // Get interactions from messages if contact linked
  let interactions: unknown[] = [];
  if (lead.contact_id) {
    const { data: messages } = await db
      .from("inbox_messages")
      .select("direction, text_body, created_at")
      .eq("contact_id", lead.contact_id)
      .order("created_at", { ascending: false })
      .limit(20);
    interactions = messages ?? [];
  }

  // Run AI analysis
  const analysis = await analyzeLeadWithAI(lead, interactions);

  // Calculate updated score
  let score = lead.score || 0;
  
  // Boost score based on AI confidence
  if (analysis.temperature === "hot" && analysis.confidence > 0.7) {
    score = Math.max(score, 75);
  } else if (analysis.temperature === "warm" && analysis.confidence > 0.6) {
    score = Math.max(score, 50);
  }

  // Update lead with AI insights
  const { data: updatedLead, error: updateError } = await db
    .from("helper_leads")
    .update({
      score,
      temperature: analysis.temperature,
      ai_summary: analysis.summary,
      ai_recommendations: analysis.recommendations,
      last_ai_analysis_at: new Date().toISOString(),
    })
    .eq("id", lead.id)
    .eq("workspace_id", workspaceId)
    .select("*")
    .single();

  if (updateError) {
    return withCookies(NextResponse.json({ ok: false, error: updateError.message }, { status: 500 }));
  }

  return withCookies(NextResponse.json({
    ok: true,
    lead: updatedLead,
    analysis: {
      summary: analysis.summary,
      recommendations: analysis.recommendations,
      temperature: analysis.temperature,
      confidence: analysis.confidence,
    },
  }));
}
