#!/usr/bin/env node
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL });

(async () => {
  await client.connect();
  
  const r = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name='helper_conversations' 
    ORDER BY ordinal_position
  `);
  
  console.log(`helper_conversations columns (${r.rows.length}):`);
  r.rows.forEach(row => console.log(`  - ${row.column_name}`));
  
  await client.end();
})();
