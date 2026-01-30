#!/usr/bin/env node
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL });

(async () => {
  await client.connect();
  
  console.log("🧹 Cleaning up partial migration artifacts...\n");
  
  const cleanup = [
    "DROP INDEX IF EXISTS idx_helper_conversations_visibility CASCADE",
    "DROP INDEX IF EXISTS idx_helper_conversations_folder CASCADE",
    "DROP TABLE IF EXISTS helper_conversation_shares CASCADE",
    "DROP TABLE IF EXISTS helper_message_comments CASCADE",
    "DROP TABLE IF EXISTS helper_templates CASCADE",
    "DROP TABLE IF EXISTS helper_folders CASCADE",
    "DROP TABLE IF EXISTS helper_mentions CASCADE",
    "DROP TABLE IF EXISTS helper_bulk_operations CASCADE",
    "DROP FUNCTION IF EXISTS can_access_conversation CASCADE",
    "DROP FUNCTION IF EXISTS get_shared_conversations CASCADE",
  ];
  
  for (const sql of cleanup) {
    try {
      await client.query(sql);
      console.log(`✅ ${sql.split(' ')[3] || sql.substring(0, 50)}`);
    } catch (e) {
      console.log(`⚠️  ${sql.split(' ')[3]}: ${e.message}`);
    }
  }
  
  console.log("\n✨ Cleanup complete");
  await client.end();
})();
