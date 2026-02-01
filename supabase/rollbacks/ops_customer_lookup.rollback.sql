-- Rollback migration for Phase 2.1: Customer Lookup

-- Drop RPC function
drop function if exists public.ops_search_customers(text, int);

-- Drop table (cascade will drop policies and indexes)
drop table if exists public.ops_customer_searches cascade;

-- Note: This rollback is safe to run. It will remove all customer search history.
