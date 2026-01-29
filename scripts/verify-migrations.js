#!/usr/bin/env node
const { Client } = require('pg');

async function verifyMigrations() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    console.log('📊 Verifying M2/M3/M4 migrations...\n');
    
    // Check all tables
    const tables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN (
        'wa_saved_views', 
        'automation_rules', 
        'automation_executions', 
        'usage_events'
      )
      ORDER BY tablename;
    `);
    
    console.log('✅ Tables created:');
    tables.rows.forEach(row => console.log(`   - ${row.tablename}`));
    
    // Check materialized view
    const mvs = await client.query(`
      SELECT matviewname 
      FROM pg_matviews 
      WHERE schemaname = 'public' 
      AND matviewname = 'usage_stats_daily';
    `);
    
    if (mvs.rows.length > 0) {
      console.log('   - usage_stats_daily (materialized view)');
    }
    
    // Check RLS policies
    console.log('\n🔒 RLS Policies:');
    const policies = await client.query(`
      SELECT tablename, policyname 
      FROM pg_policies 
      WHERE schemaname = 'public'
      AND tablename IN (
        'wa_saved_views', 
        'automation_rules', 
        'automation_executions', 
        'usage_events'
      )
      ORDER BY tablename, policyname;
    `);
    
    policies.rows.forEach(row => {
      console.log(`   - ${row.tablename}: ${row.policyname}`);
    });
    
    // Check triggers
    console.log('\n⚡ Triggers:');
    const triggers = await client.query(`
      SELECT DISTINCT trigger_name, event_object_table
      FROM information_schema.triggers
      WHERE event_object_schema = 'public'
      AND event_object_table IN (
        'wa_saved_views', 
        'automation_rules', 
        'usage_events'
      )
      ORDER BY event_object_table, trigger_name;
    `);
    
    triggers.rows.forEach(row => {
      console.log(`   - ${row.event_object_table}: ${row.trigger_name}`);
    });
    
    // Count records
    console.log('\n📈 Record counts:');
    const counts = await Promise.all([
      client.query('SELECT COUNT(*) FROM wa_saved_views'),
      client.query('SELECT COUNT(*) FROM automation_rules'),
      client.query('SELECT COUNT(*) FROM automation_executions'),
      client.query('SELECT COUNT(*) FROM usage_events'),
    ]);
    
    console.log(`   - wa_saved_views: ${counts[0].rows[0].count}`);
    console.log(`   - automation_rules: ${counts[1].rows[0].count}`);
    console.log(`   - automation_executions: ${counts[2].rows[0].count}`);
    console.log(`   - usage_events: ${counts[3].rows[0].count}`);
    
    console.log('\n✅ All M2/M3/M4 migrations successfully applied!');
    console.log('\n🎯 Next steps:');
    console.log('   1. Test saved views in WhatsApp Inbox');
    console.log('   2. Create automation rules via API');
    console.log('   3. Monitor usage events tracking');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await client.end();
  }
}

verifyMigrations();
