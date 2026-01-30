#!/usr/bin/env node
/**
 * Apply outbox trigger migration to Supabase database
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const { Client } = pg;

async function applyMigration() {
  console.log('🚀 Applying outbox trigger migration...\n');

  // Read migration file
  const migrationSQL = readFileSync('./supabase/migrations/20260202000000_realtime_outbox_trigger.sql', 'utf8');

  // Get database URL from env
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.log('Please set DATABASE_URL in .env.local');
    process.exit(1);
  }

  // Create PostgreSQL client
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Execute migration
    console.log('📝 Executing migration SQL...');
    await client.query(migrationSQL);
    console.log('✅ Migration applied successfully!\n');

    // Verify triggers
    console.log('🔍 Verifying triggers...');
    const { rows: triggers } = await client.query(`
      SELECT tgname, tgenabled 
      FROM pg_trigger 
      WHERE tgname IN ('outbox_insert_trigger', 'outbox_retry_trigger')
    `);
    
    if (triggers.length === 2) {
      console.log('✅ Both triggers created:');
      triggers.forEach(t => console.log(`   - ${t.tgname} (enabled: ${t.tgenabled === 'O' ? 'Yes' : 'No'})`));
    } else {
      console.log('⚠️  Expected 2 triggers, found:', triggers.length);
    }

    // Verify functions
    console.log('\n🔍 Verifying functions...');
    const { rows: functions } = await client.query(`
      SELECT proname 
      FROM pg_proc 
      WHERE proname IN ('notify_outbox_insert', 'notify_outbox_retry')
    `);
    
    if (functions.length === 2) {
      console.log('✅ Both functions created:');
      functions.forEach(f => console.log(`   - ${f.proname}()`));
    } else {
      console.log('⚠️  Expected 2 functions, found:', functions.length);
    }

    console.log('\n✨ Migration complete! Now setup Supabase webhook in dashboard.');
    console.log('\n📖 Next steps:');
    console.log('1. Go to Supabase Dashboard → Database → Webhooks');
    console.log('2. Create webhook:');
    console.log('   - Table: outbox_messages');
    console.log('   - Events: INSERT, UPDATE');
    console.log('   - URL: https://your-domain.vercel.app/api/webhooks/outbox-trigger');
    console.log('   - Header: Authorization: Bearer YOUR_WEBHOOK_SECRET');
    console.log('\n🎉 Done!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
