import "server-only";
import { logger } from "@/lib/logging";
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
  sourceLevel?: "workspace" | "platform"; // NEW: track if from workspace or platform KB
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
    logger.error("Knowledge search failed:", error);
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
    sourceLevel: "workspace" as const,
  }));
}

/**
 * Search BOTH workspace knowledge and platform knowledge (hybrid)
 * Platform knowledge = Gigaviz docs managed by admin
 * Workspace knowledge = User's own business docs
 */
export async function searchHybridKnowledge(
  workspaceId: string,
  query: string,
  options: {
    maxResults?: number;
    similarityThreshold?: number;
  } = {}
): Promise<SearchResult[]> {
  const { maxResults = 5, similarityThreshold = 0.7 } = options;

  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query);
  const embeddingString = `[${queryEmbedding.join(",")}]`;

  const db = supabaseAdmin();

  // Try hybrid search RPC first
  const { data: hybridData, error: hybridError } = await db.rpc("search_hybrid_knowledge", {
    p_workspace_id: workspaceId,
    query_embedding: embeddingString,
    match_threshold: similarityThreshold,
    match_count: maxResults,
  });

  if (!hybridError && hybridData && hybridData.length > 0) {
    return hybridData.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      sourceType: "kb_article" as KnowledgeSourceType,
      sourceId: row.source_id as string,
      title: row.title as string | null,
      contentText: row.content as string,
      similarity: row.similarity as number,
      metadata: {},
      sourceLevel: row.source_level as "workspace" | "platform",
    }));
  }

  // Fallback: search both separately and merge
  const [workspaceResults, platformResults] = await Promise.all([
    searchWorkspaceKnowledge(workspaceId, queryEmbedding, similarityThreshold, maxResults),
    searchPlatformKnowledge(queryEmbedding, similarityThreshold, maxResults),
  ]);

  // Merge and sort by similarity
  const combined = [...workspaceResults, ...platformResults]
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults);

  return combined;
}

/**
 * Search workspace-specific knowledge
 */
async function searchWorkspaceKnowledge(
  workspaceId: string,
  queryEmbedding: number[],
  threshold: number,
  limit: number
): Promise<SearchResult[]> {
  const db = supabaseAdmin();

  const { data, error } = await db.rpc("search_workspace_knowledge", {
    p_workspace_id: workspaceId,
    query_embedding: `[${queryEmbedding.join(",")}]`,
    match_threshold: threshold,
    match_count: limit,
  });

  if (error) {
    logger.error("Workspace knowledge search failed:", error);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    sourceType: "kb_article" as KnowledgeSourceType,
    sourceId: row.source_id as string,
    title: row.title as string | null,
    contentText: row.content as string,
    similarity: row.similarity as number,
    metadata: {},
    sourceLevel: "workspace" as const,
  }));
}

/**
 * Search platform-wide Gigaviz documentation
 */
async function searchPlatformKnowledge(
  queryEmbedding: number[],
  threshold: number,
  limit: number
): Promise<SearchResult[]> {
  const db = supabaseAdmin();

  const { data, error } = await db.rpc("search_platform_knowledge", {
    query_embedding: `[${queryEmbedding.join(",")}]`,
    match_threshold: threshold,
    match_count: limit,
  });

  if (error) {
    logger.error("Platform knowledge search failed:", error);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    sourceType: "kb_article" as KnowledgeSourceType,
    sourceId: row.source_id as string,
    title: row.title as string | null,
    contentText: row.content as string,
    similarity: row.similarity as number,
    metadata: {},
    sourceLevel: "platform" as const,
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
    const levelLabel = result.sourceLevel === "platform" ? "Gigaviz Docs" : "Business Knowledge";
    return `[Source ${index + 1}: ${levelLabel}${result.title ? ` - ${result.title}` : ""}]\n${result.contentText}\n`;
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
