import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Client } = pg;

async function applyMetaHubPolishMigration() {
  const client = new Client({
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.szzqjwqpzboaofygnebn',
    password: process.env.SUPABASE_DB_PASSWORD,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    // Read migration file
    const fs = await import('fs/promises');
    const migrationPath = './supabase/migrations/20260131190000_meta_hub_polish.sql';
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');

    console.log('📄 Applying Meta Hub Polish migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration applied successfully\n');

    // Verify Instagram tables
    console.log('📊 Verifying Instagram tables:');
    const igAccountsResult = await client.query('SELECT COUNT(*) FROM ig_accounts');
    const igThreadsResult = await client.query('SELECT COUNT(*) FROM ig_threads');
    const igMessagesResult = await client.query('SELECT COUNT(*) FROM ig_messages');
    
    console.log(`  ✅ ig_accounts: ${igAccountsResult.rows[0].count} rows`);
    console.log(`  ✅ ig_threads: ${igThreadsResult.rows[0].count} rows`);
    console.log(`  ✅ ig_messages: ${igMessagesResult.rows[0].count} rows`);

    // Verify Messenger tables
    console.log('\n📊 Verifying Messenger tables:');
    const messengerPagesResult = await client.query('SELECT COUNT(*) FROM messenger_pages');
    const messengerThreadsResult = await client.query('SELECT COUNT(*) FROM messenger_threads');
    const messengerMessagesResult = await client.query('SELECT COUNT(*) FROM messenger_messages');
    
    console.log(`  ✅ messenger_pages: ${messengerPagesResult.rows[0].count} rows`);
    console.log(`  ✅ messenger_threads: ${messengerThreadsResult.rows[0].count} rows`);
    console.log(`  ✅ messenger_messages: ${messengerMessagesResult.rows[0].count} rows`);

    // Verify Bulk Actions
    console.log('\n📊 Verifying Bulk Actions:');
    const bulkActionsResult = await client.query('SELECT COUNT(*) FROM messaging_bulk_actions');
    console.log(`  ✅ messaging_bulk_actions: ${bulkActionsResult.rows[0].count} rows`);

    console.log('\n🎉 Meta Hub Polish migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  • Instagram DM support (3 tables)');
    console.log('  • Messenger support (3 tables)');
    console.log('  • Bulk actions infrastructure (1 table)');
    console.log('  • All RLS policies applied');
    console.log('  • Ready for Meta API integration');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed');
  }
}

applyMetaHubPolishMigration();
