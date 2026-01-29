#!/usr/bin/env node
const { readFileSync } = require('fs');
const { join } = require('path');
const { Client } = require('pg');

async function applyMigration() {
  console.log('🔄 Applying fix migration via direct PostgreSQL connection...\n');
  
  const dbUrl = process.env.SUPABASE_DB_URL;
  
  if (!dbUrl) {
    console.error('❌ Missing SUPABASE_DB_URL environment variable');
    process.exit(1);
  }
  
  console.log('📄 Loading migration file...');
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260131100001_fix_usage_events.sql');
  const sql = readFileSync(migrationPath, 'utf8');
  
  console.log('🔗 Connecting to database...');
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected!\n');
    
    console.log('🔧 Executing migration SQL...\n');
    
    // Execute the entire migration as one transaction
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log('✅ Migration applied successfully!\n');
    
    // Verify
    console.log('📊 Verifying table structure...');
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'usage_events'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nColumns in usage_events:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    // Check materialized view
    const mvResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM pg_matviews 
      WHERE schemaname = 'public' 
      AND matviewname = 'usage_stats_daily';
    `);
    
    if (mvResult.rows[0].count > 0) {
      console.log('\n✅ Materialized view usage_stats_daily created');
    }
    
    console.log('\n🎉 All migrations completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('\n❌ Migration failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
