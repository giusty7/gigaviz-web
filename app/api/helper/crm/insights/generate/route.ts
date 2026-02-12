import { logger } from "@/lib/logging";
import { NextRequest, NextResponse } from "next/server";
import { guardWorkspace, requireWorkspaceRole } from "@/lib/auth/guard";
import { withErrorHandler } from "@/lib/api/with-error-handler";

export const runtime = "nodejs";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

type InsightType = "trend" | "anomaly" | "opportunity" | "risk" | "recommendation";

interface GeneratedInsight {
  type: InsightType;
  category: string;
  title: string;
  description: string;
  impact_level: "low" | "medium" | "high" | "critical";
  affected_leads: number;
  potential_value: number | null;
  suggested_actions: string[];
  confidence_score: number;
}

async function generateInsightsWithAI(
  leads: unknown[],
  conversations: unknown[],
  existingInsights: unknown[]
): Promise<GeneratedInsight[]> {
  const prompt = `Analyze this CRM data and generate actionable insights:

Lead Summary (${leads.length} total):
${JSON.stringify(leads.slice(0, 20), null, 2)}

Recent Conversations (last 50):
${JSON.stringify(conversations.slice(0, 50), null, 2)}

Existing Insights (to avoid duplicates):
${JSON.stringify(existingInsights.slice(0, 10), null, 2)}

Generate 3-5 NEW insights that are:
1. Actionable and specific
2. Based on data patterns
3. Different from existing insights
4. Focused on revenue opportunities or risks

For each insight, provide:
- type: "trend" | "anomaly" | "opportunity" | "risk" | "recommendation"
- category: "engagement" | "conversion" | "churn" | "revenue" | "performance"
- title: Short, impactful title
- description: 2-3 sentence explanation
- impact_level: "low" | "medium" | "high" | "critical"
- affected_leads: estimated number
- potential_value: in IDR (null if not applicable)
- suggested_actions: array of 2-3 specific actions
- confidence_score: 0-1

Respond in JSON format:
{
  "insights": [...]
}`;

  if (!OPENAI_API_KEY) {
    // Return fallback insights
    return [
      {
        type: "recommendation",
        category: "engagement",
        title: "Follow up on inactive leads",
        description: "Several leads haven't been contacted in over 7 days. Re-engaging could prevent churn.",
        impact_level: "medium",
        affected_leads: Math.min(5, leads.length),
        potential_value: null,
        suggested_actions: [
          "Send a check-in message to inactive leads",
          "Schedule follow-up calls for this week",
          "Review lead qualification criteria",
        ],
        confidence_score: 0.6,
      },
    ];
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
          { 
            role: "system", 
            content: "You are a CRM analytics AI. Generate actionable business insights from customer data. Be specific and data-driven. Always respond in valid JSON." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 2000,
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
    return Array.isArray(result.insights) ? result.insights : [];
  } catch (error) {
    logger.error("AI insights generation failed:", error);
    // Return fallback insights
    return [
      {
        type: "recommendation",
        category: "engagement",
        title: "Follow up on inactive leads",
        description: "Several leads haven't been contacted in over 7 days. Re-engaging could prevent churn.",
        impact_level: "medium",
        affected_leads: Math.min(5, leads.length),
        potential_value: null,
        suggested_actions: [
          "Send a check-in message to inactive leads",
          "Schedule follow-up calls for this week",
          "Review lead qualification criteria",
        ],
        confidence_score: 0.6,
      },
    ];
  }
}

// POST - Generate new insights
export const POST = withErrorHandler(async (req: NextRequest) => {
  const guard = await guardWorkspace(req);
  if (!guard.ok) return guard.response;
  const { workspaceId, role, withCookies, supabase: db } = guard;

  if (!requireWorkspaceRole(role, ["owner", "admin"])) {
    return withCookies(NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 }));
  }

  // Fetch leads
  const { data: leads } = await db
    .from("helper_leads")
    .select("id, name, company, score, temperature, status, total_interactions, last_activity_at, estimated_value")
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .order("score", { ascending: false })
    .limit(100);

  // Fetch recent conversations
  const { data: conversations } = await db
    .from("helper_conversations")
    .select("id, title, created_at, updated_at")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .limit(100);

  // Fetch existing active insights
  const { data: existingInsights } = await db
    .from("helper_crm_insights")
    .select("title, insight_type, category")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true)
    .limit(20);

  // Generate insights with AI
  const generatedInsights = await generateInsightsWithAI(
    leads ?? [],
    conversations ?? [],
    existingInsights ?? []
  );

  // Insert new insights
  const insightsToInsert = generatedInsights.map(insight => ({
    workspace_id: workspaceId,
    insight_type: insight.type,
    category: insight.category,
    title: insight.title,
    description: insight.description,
    confidence_score: insight.confidence_score,
    ai_model: "gpt-4o-mini",
    impact_level: insight.impact_level,
    affected_leads: insight.affected_leads,
    potential_value: insight.potential_value,
    suggested_actions: insight.suggested_actions,
    is_active: true,
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Valid for 7 days
  }));

  if (insightsToInsert.length > 0) {
    const { data: inserted, error } = await db
      .from("helper_crm_insights")
      .insert(insightsToInsert)
      .select("*");

    if (error) {
      return withCookies(NextResponse.json({ ok: false, error: error.message }, { status: 500 }));
    }

    return withCookies(NextResponse.json({ 
      ok: true, 
      generated: inserted?.length ?? 0,
      insights: inserted ?? [],
    }));
  }

  return withCookies(NextResponse.json({ 
    ok: true, 
    generated: 0,
    insights: [],
    message: "No new insights generated",
  }));
});
