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

  console.log("🔍 Checking workspace_memberships structure:\n");
  
  const result = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workspace_memberships'
    ORDER BY ordinal_position
  `);

  if (result.rows.length === 0) {
    console.log("❌ workspace_memberships table not found");
  } else {
    result.rows.forEach((row) => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
  }

  await client.end();
}

main().catch(console.error);
