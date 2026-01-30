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

async function main() {
  console.log("🚀 Applying 20260202130000_helper_collaboration.sql line by line...\n");

  await client.connect();

  const migrationPath = path.join(
    __dirname,
    "..",
    "supabase",
    "migrations",
    "20260202130000_helper_collaboration.sql"
  );

  const sql = fs.readFileSync(migrationPath, "utf8");

  // Split by statement (naive split by semicolon - may need refinement)
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  console.log(`📊 Found ${statements.length} statements\n`);

  let successCount = 0;
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ";";
    const preview = statement.substring(0, 80).replace(/\s+/g, " ");

    try {
      await client.query(statement);
      successCount++;
      if (statement.trim().startsWith("CREATE") || statement.trim().startsWith("ALTER")) {
        console.log(`✅ ${i + 1}/${statements.length}: ${preview}...`);
      }
    } catch (error) {
      console.error(`\n❌ Failed at statement ${i + 1}/${statements.length}:`);
      console.error(`   ${preview}...`);
      console.error(`   Error: ${error.message}\n`);
      console.error("Full statement:");
      console.error(statement);
      throw error;
    }
  }

  console.log(`\n✅ Successfully applied ${successCount}/${statements.length} statements`);
  await client.end();
}

main().catch((error) => {
  console.error("\n❌ Fatal error:", error.message);
  process.exit(1);
});
