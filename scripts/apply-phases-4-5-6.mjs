#!/usr/bin/env node
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("❌ SUPABASE_DB_URL required");
  process.exit(1);
}

const client = new pg.Client({ connectionString: dbUrl });

const MIGRATIONS = [
  // "20260202130000_helper_collaboration.sql",  // ✅ Already applied
  // "20260202140000_helper_workflows.sql",       // ✅ Already applied
  "20260202150000_helper_analytics.sql",
];

async function main() {
  console.log("🚀 Applying Helper Migrations (Phase 4-6)...\n");

  await client.connect();
  console.log("✅ Connected to database\n");

  const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");

  for (const migrationFile of MIGRATIONS) {
    console.log(`📦 Applying ${migrationFile}...`);

    const migrationPath = path.join(migrationsDir, migrationFile);
    if (!fs.existsSync(migrationPath)) {
      console.error(`  ❌ File not found: ${migrationPath}`);
      continue;
    }

    const sql = fs.readFileSync(migrationPath, "utf8");

    try {
      // Run the whole migration as one transaction
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`  ✅ Applied successfully\n`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`  ❌ Error: ${error.message}`);
      console.error(`  Detail: ${error.detail}`);
      console.error(`  Hint: ${error.hint}\n`);
      throw error;
    }
  }

  // Verify tables exist
  console.log("🔍 Verifying tables...\n");
  const result = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
      'helper_templates', 
      'helper_workflows', 
      'helper_analytics_jobs'
    )
    ORDER BY table_name
  `);

  console.log(`✅ Found ${result.rows.length}/3 seed tables:`);
  result.rows.forEach((row) => console.log(`  ✓ ${row.table_name}`));

  await client.end();
  console.log("\n✨ Migration complete!");
}

main().catch((error) => {
  console.error("❌ Fatal error:", error.message);
  process.exit(1);
});
