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
  // "20260202120000_helper_multimodal.sql", // Already partially applied
  "20260202130000_helper_collaboration.sql",
  "20260202140000_helper_workflows.sql",
  "20260202150000_helper_analytics.sql",
];

async function main() {
  console.log("🚀 Applying Helper Migrations (Phase 3-6)...\n");

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
      await client.query(sql);
      console.log(`  ✅ Applied successfully\n`);
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      console.error(`  Position: ${error.position}`);
      console.error(`  Detail: ${error.detail}\n`);
      // Show the problematic SQL line if position is available
      if (error.position) {
        const lines = sql.split('\n');
        let charCount = 0;
        for (let i = 0; i < lines.length; i++) {
          charCount += lines[i].length + 1;
          if (charCount >= error.position) {
            console.error(`  Problematic line ~${i + 1}: ${lines[i].trim()}\n`);
            break;
          }
        }
      }
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
      'helper_modes', 'helper_templates', 
      'helper_workflows', 'helper_analytics_jobs'
    )
    ORDER BY table_name
  `);

  if (result.rows.length === 4) {
    console.log("✅ All seed tables created:");
    result.rows.forEach((row) => console.log(`  ✓ ${row.table_name}`));
  } else {
    console.log("⚠️  Expected 4 tables, found:", result.rows.length);
    result.rows.forEach((row) => console.log(`  ✓ ${row.table_name}`));
  }

  await client.end();
  console.log("\n✨ Migration complete!");
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
