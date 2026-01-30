import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateEmbedding } from "./embeddings";

export type KnowledgeSourceType =
  | "kb_article"
  | "wa_conversation"
  | "uploaded_document"
  | "helper_conversation"
  | "contact"
  | "product_data";

export type SearchResult = {
  id: string;
  sourceType: KnowledgeSourceType;
  sourceId: string;
  title: string | null;
  contentText: string;
  similarity: number;
  metadata: Record<string, unknown>;
};

/**
 * Search knowledge base using semantic similarity
 */
export async function searchKnowledge(
  workspaceId: string,
  query: string,
  options: {
    maxResults?: number;
    similarityThreshold?: number;
    sourceTypes?: KnowledgeSourceType[];
  } = {}
): Promise<SearchResult[]> {
  const { maxResults = 5, similarityThreshold = 0.7, sourceTypes } = options;

  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query);

  // Search using RPC function
  const db = supabaseAdmin();
  const { data, error } = await db.rpc("search_helper_knowledge", {
    p_workspace_id: workspaceId,
    p_query_embedding: `[${queryEmbedding.join(",")}]`,
    p_max_results: maxResults,
    p_similarity_threshold: similarityThreshold,
    p_source_types: sourceTypes ?? null,
  });

  if (error) {
    console.error("Knowledge search failed:", error);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    title: row.title,
    contentText: row.content_text,
    similarity: row.similarity,
    metadata: row.metadata ?? {},
  }));
}

/**
 * Get RAG settings for workspace
 */
export async function getRagSettings(workspaceId: string) {
  const db = supabaseAdmin();
  const { data } = await db
    .from("helper_rag_settings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  // Return defaults if not found
  return (
    data ?? {
      enabled: true,
      max_results: 5,
      similarity_threshold: 0.7,
      enabled_sources: [
        "kb_article",
        "wa_conversation",
        "uploaded_document",
        "helper_conversation",
      ],
      auto_index_conversations: true,
      auto_index_knowledge_base: true,
    }
  );
}

/**
 * Build context from search results
 */
export function buildRagContext(results: SearchResult[]): string {
  if (results.length === 0) return "";

  const contextParts = results.map((result, index) => {
    return `[Source ${index + 1}: ${result.sourceType}]\n${result.contentText}\n`;
  });

  return `\n\n--- Relevant Context from Knowledge Base ---\n${contextParts.join("\n")}\n--- End Context ---\n\n`;
}

/**
 * Track context usage for analytics
 */
export async function trackContextUsage(
  workspaceId: string,
  messageId: string,
  results: SearchResult[]
) {
  if (results.length === 0) return;

  const db = supabaseAdmin();
  const records = results.map((result, index) => ({
    workspace_id: workspaceId,
    message_id: messageId,
    source_id: result.id,
    similarity_score: result.similarity,
    ranking_position: index + 1,
    was_used: true,
  }));

  await db.from("helper_context_usage").insert(records);
}
