import "server-only";
import { readFileSync } from "fs";
import { join } from "path";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Apply Apps product migration manually via Supabase Admin API
 * Run this once to create apps_catalog, apps_requests, apps_roadmap tables
 */
async function applyAppsMigration() {
  const migrationPath = join(process.cwd(), "supabase", "migrations", "20260131160000_apps_product.sql");
  const migrationSQL = readFileSync(migrationPath, "utf-8");
  
  const db = supabaseAdmin();
  
  // Execute migration SQL
  const { error } = await db.rpc('exec_sql', { sql: migrationSQL });
  
  if (error) {
    console.error("Migration failed:", error);
    throw error;
  }
  
  console.log("✅ Apps product migration applied successfully!");
}

// Execute if run directly
if (require.main === module) {
  applyAppsMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { applyAppsMigration };
