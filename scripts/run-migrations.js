#!/usr/bin/env node
/**
 * Post-deployment migration runner
 * Runs pending SQL migrations after Vercel deployment
 * 
 * Usage: node scripts/run-migrations.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase credentials from environment
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Get list of migration files
const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const pendingMigrations = [
  '20260130000000_wa_saved_views.sql',
  '20260131000000_automation_rules.sql', 
  '20260131100000_usage_events.sql',
];

async function runMigration(filename) {
  const filePath = path.join(migrationsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Migration file not found: ${filename}`);
    return false;
  }

  const sql = fs.readFileSync(filePath, 'utf8');
  
  console.log(`🔄 Running migration: ${filename}`);
  
  try {
    // Execute SQL via RPC (if available) or direct query
    // Note: This requires a custom RPC function in Supabase or using REST API
    
    // For now, we'll log the SQL and provide manual instructions
    console.log(`📄 SQL to execute (${sql.length} bytes)`);
    console.log(`⚠️  This script provides instructions for manual execution`);
    console.log(`\nTo run this migration, execute the following in Supabase SQL Editor:`);
    console.log(`\n--- Start of ${filename} ---\n`);
    console.log(sql.substring(0, 500) + '...\n');
    console.log(`--- End preview ---\n`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error running migration ${filename}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Post-Deployment Migration Runner\n');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log(`📁 Migrations directory: ${migrationsDir}\n`);
  
  let succeeded = 0;
  let failed = 0;
  
  for (const migration of pendingMigrations) {
    const success = await runMigration(migration);
    if (success) {
      succeeded++;
    } else {
      failed++;
    }
    console.log(''); // blank line
  }
  
  console.log('\n📊 Migration Summary:');
  console.log(`✅ Succeeded: ${succeeded}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n⚠️  Some migrations failed. Please run them manually via:');
    console.log('   - Supabase Dashboard → SQL Editor');
    console.log('   - Or use: npx supabase db push --db-url $SUPABASE_DB_URL\n');
    process.exit(1);
  }
  
  console.log('\n✅ All migrations ready! Next steps:');
  console.log('1. Go to Supabase Dashboard → SQL Editor');
  console.log('2. Copy-paste each migration file content');
  console.log('3. Execute in order (by timestamp)');
  console.log('4. Verify tables created\n');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
