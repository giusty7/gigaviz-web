#!/usr/bin/env node
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL });

(async () => {
  await client.connect();
  
  console.log("🧹 Cleaning up workflows migration artifacts...\n");
  
  const cleanup = [
    "DROP INDEX IF EXISTS idx_helper_workflows_workspace CASCADE",
    "DROP INDEX IF EXISTS idx_helper_workflows_active CASCADE",
    "DROP TABLE IF EXISTS helper_workflows CASCADE",
    "DROP TABLE IF EXISTS helper_workflow_runs CASCADE",
    "DROP TABLE IF EXISTS helper_workflow_schedules CASCADE",
    "DROP TABLE IF EXISTS helper_workflow_event_triggers CASCADE",
    "DROP TABLE IF EXISTS helper_workflow_webhooks CASCADE",
    "DROP TABLE IF EXISTS helper_workflow_permissions CASCADE",
  ];
  
  for (const sql of cleanup) {
    try {
      await client.query(sql);
      const name = sql.match(/helper_\w+/)?.[0] || sql.substring(0, 40);
      console.log(`✅ ${name}`);
    } catch (e) {
      console.log(`⚠️  ${e.message.substring(0, 60)}`);
    }
  }
  
  console.log("\n✨ Cleanup complete");
  await client.end();
})();
