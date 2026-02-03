-- Migration: Performance Indexes for Meta Hub & Inbox
-- Created: 2026-02-03
-- Purpose: Add composite indexes to improve query performance on high-traffic tables

-- =============================================
-- OUTBOX MESSAGES INDEXES
-- =============================================

-- Composite index for worker queue queries (critical for claim_outbox RPC)
-- Covers: SELECT * FROM outbox_messages WHERE workspace_id = X AND status = 'queued' AND next_run_at <= NOW()
CREATE INDEX IF NOT EXISTS idx_outbox_messages_workspace_status_next_run 
ON outbox_messages (workspace_id, status, next_run_at) 
WHERE status IN ('queued', 'processing');

-- Index for thread queries (showing sent messages in thread view)
-- Covers: SELECT * FROM outbox_messages WHERE workspace_id = X AND thread_id = Y
CREATE INDEX IF NOT EXISTS idx_outbox_messages_workspace_thread 
ON outbox_messages (workspace_id, thread_id, created_at DESC) 
WHERE thread_id IS NOT NULL;

-- Index for status + attempts (monitoring failed messages)
-- Covers: SELECT * FROM outbox_messages WHERE status = 'failed' AND attempts < X
CREATE INDEX IF NOT EXISTS idx_outbox_messages_status_attempts 
ON outbox_messages (status, attempts, created_at DESC) 
WHERE status IN ('failed', 'queued');

-- =============================================
-- WA_CONTACTS INDEXES
-- =============================================

-- Composite index for workspace + wa_id lookups (webhook processing)
-- Covers: SELECT * FROM wa_contacts WHERE workspace_id = X AND wa_id = '1234567890'
CREATE INDEX IF NOT EXISTS idx_wa_contacts_workspace_wa_id 
ON wa_contacts (workspace_id, wa_id);

-- Index for search queries (contact name search)
-- Covers: SELECT * FROM wa_contacts WHERE workspace_id = X AND name ILIKE '%query%'
CREATE INDEX IF NOT EXISTS idx_wa_contacts_workspace_name 
ON wa_contacts (workspace_id, name) 
WHERE name IS NOT NULL;

-- =============================================
-- META EVENTS LOG INDEX
-- =============================================

-- Composite index for workspace + event type queries
-- Covers: SELECT * FROM meta_events_log WHERE workspace_id = X AND event_type = 'message'
CREATE INDEX IF NOT EXISTS idx_meta_events_log_workspace_type 
ON meta_events_log (workspace_id, event_type, received_at DESC)
WHERE workspace_id IS NOT NULL;

-- =============================================
-- HELPER_KNOWLEDGE_CHUNKS INDEXES (RAG Performance)
-- =============================================

-- Index for source_id queries (deleting chunks when source is removed)
-- Covers: DELETE FROM helper_knowledge_chunks WHERE source_id = X
CREATE INDEX IF NOT EXISTS idx_helper_knowledge_chunks_source 
ON helper_knowledge_chunks (source_id);

-- Note: Vector similarity search uses IVFFlat index on embedding column (already exists)

-- =============================================
-- PLATFORM_KNOWLEDGE_CHUNKS INDEXES (RAG Performance)
-- =============================================

-- Index for source_id queries (deleting chunks when source is removed)
-- Covers: DELETE FROM platform_knowledge_chunks WHERE source_id = X
CREATE INDEX IF NOT EXISTS idx_platform_knowledge_chunks_source 
ON platform_knowledge_chunks (source_id);

-- Note: Vector similarity search uses IVFFlat index on embedding column (already exists)

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Run these queries to verify index usage:
-- EXPLAIN ANALYZE SELECT * FROM outbox_messages WHERE workspace_id = 'xxx' AND status = 'queued' AND next_run_at <= NOW() LIMIT 20;
-- EXPLAIN ANALYZE SELECT * FROM wa_contacts WHERE workspace_id = 'xxx' AND wa_id = '1234567890';
-- EXPLAIN ANALYZE SELECT * FROM meta_events_log WHERE workspace_id = 'xxx' AND event_type = 'message' ORDER BY received_at DESC LIMIT 50;

-- Expected result: Should show "Index Scan" or "Bitmap Index Scan" instead of "Seq Scan"
