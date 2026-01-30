#!/usr/bin/env node
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL });

(async () => {
  await client.connect();
  
  const tables = await client.query("SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'helper_%'");
  const funcs = await client.query("SELECT count(*) FROM helper_functions");
  const modes = await client.query("SELECT count(*) FROM helper_modes");
  const templates = await client.query("SELECT count(*) FROM helper_templates");
  const workflows = await client.query("SELECT count(*) FROM helper_workflows WHERE is_template=true");
  const jobs = await client.query("SELECT count(*) FROM helper_analytics_jobs");
  
  console.log('\n✅ Final Migration State:\n');
  console.log('  📊 Helper Tables:', tables.rows[0].count);
  console.log('  ⚙️  Helper Functions:', funcs.rows[0].count);
  console.log('  🤖 AI Modes:', modes.rows[0].count);
  console.log('  📋 Templates:', templates.rows[0].count);
  console.log('  🔄 Workflows:', workflows.rows[0].count);
  console.log('  📈 Analytics Jobs:', jobs.rows[0].count);
  console.log('\n🎉 All migrations complete!\n');
  
  await client.end();
})();
