-- Rollback for 20260201231000_ops_canned_responses.sql

DROP TRIGGER IF EXISTS ops_canned_responses_updated_at ON ops_canned_responses;
DROP POLICY IF EXISTS ops_canned_responses_workspace_policy ON ops_canned_responses;
DROP POLICY IF EXISTS ops_canned_responses_admin_policy ON ops_canned_responses;
DROP POLICY IF EXISTS ops_canned_responses_read_policy ON ops_canned_responses;

DROP INDEX IF EXISTS ops_canned_responses_global_idx;
DROP INDEX IF EXISTS ops_canned_responses_workspace_idx;

DROP TABLE IF EXISTS ops_canned_responses CASCADE;
