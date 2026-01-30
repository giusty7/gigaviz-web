#!/usr/bin/env node
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = process.env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.error("❌ SUPABASE_DB_URL is required");
  process.exit(1);
}

const client = new pg.Client({ connectionString: dbUrl });

async function main() {
  console.log("🌱 Applying direct SQL seed...\n");

  try {
    await client.connect();
    console.log("✅ Connected to database\n");

    const sqlPath = path.join(__dirname, "seed-helper-direct.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log("📦 Executing seed SQL...");
    const result = await client.query(sql);

    // Get the verification result (last query)
    const counts = result[result.length - 1]?.rows[0];
    if (counts) {
      console.log("\n✅ Seed completed!\n");
      console.log("📊 Results:");
      console.log(`  ✓ AI Modes: ${counts.modes_count}`);
      console.log(`  ✓ Templates: ${counts.templates_count}`);
      console.log(`  ✓ Workflows: ${counts.workflows_count}`);
      console.log(`  ✓ Analytics Jobs: ${counts.jobs_count}`);
    }

    console.log("\n✨ Helper data seeded successfully!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
