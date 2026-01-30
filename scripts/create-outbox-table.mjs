#!/usr/bin/env node
import { readFileSync } from 'fs';
import pg from 'pg';
const { Client } = pg;

async function createOutboxTable() {
  console.log('🚀 Creating outbox_messages table...\n');

  const sql = readFileSync('./supabase/migrations/20260202010000_create_outbox_messages.sql', 'utf8');
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    await client.query(sql);
    console.log('✅ Migration executed successfully!\n');

    // Verify table exists
    const { rows: tables } = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname='public' AND tablename='outbox_messages'
    `);

    if (tables.length > 0) {
      console.log('✅ Table outbox_messages created\n');

      // Check columns
      const { rows: columns } = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema='public' AND table_name='outbox_messages'
        ORDER BY ordinal_position
      `);

      console.log('📋 Table structure:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });

      // Check function
      const { rows: funcs } = await client.query(`
        SELECT proname 
        FROM pg_proc 
        WHERE proname = 'claim_outbox'
      `);

      if (funcs.length > 0) {
        console.log('\n✅ Function claim_outbox() created');
      }

      console.log('\n✨ Setup complete! Table is ready for webhook configuration.');
      console.log('\n📖 Next: Go to Supabase Dashboard → Database → Webhooks');
      console.log('   Table "outbox_messages" should now appear in dropdown!');
    } else {
      console.log('⚠️  Table not found after migration');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createOutboxTable();
