#!/usr/bin/env node
import pg from "pg";

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("❌ SUPABASE_DB_URL required");
  process.exit(1);
}

const client = new pg.Client({ connectionString: dbUrl });

async function main() {
  await client.connect();

  console.log("🔍 Checking all helper tables:\n");
  
  const result = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name LIKE 'helper_%'
    ORDER BY table_name
  `);

  if (result.rows.length === 0) {
    console.log("❌ No helper tables found\n");
  } else {
    console.log(`✅ Found ${result.rows.length} helper tables:\n`);
    result.rows.forEach((row) => {
      console.log(`  ✓ ${row.table_name}`);
    });
  }

  await client.end();
}

main().catch(console.error);
