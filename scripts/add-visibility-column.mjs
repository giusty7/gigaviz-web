#!/usr/bin/env node
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL });

(async () => {
  await client.connect();
  
  try {
    await client.query(`
      ALTER TABLE public.helper_conversations 
      ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'private' 
      CHECK (visibility IN ('private', 'team', 'workspace'))
    `);
    console.log('✅ Added visibility column');
  } catch(e) {
    console.error('❌', e.message);
  }
  
  await client.end();
})();
