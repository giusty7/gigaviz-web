/**
 * Vitest global setup — runs before all test files.
 *
 * Sets up:
 * - Environment variable stubs
 * - Global mocks for Supabase
 * - Common test utilities
 */

// Stub environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.SKIP_ENV_VALIDATION = "1";
// NODE_ENV is read-only in TypeScript; it's already set by vitest to "test"
