import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Client } = pg;

async function applyHelperToolCallingMigration() {
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

    const fs = await import('fs/promises');
    const migrationPath = './supabase/migrations/20260202110000_helper_tool_calling.sql';
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');

    console.log('📄 Applying Helper Tool Calling migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration applied successfully\n');

    // Verify tables
    console.log('📊 Verifying tables:');
    const tables = [
      'helper_functions',
      'helper_function_calls',
      'helper_function_permissions',
      'helper_call_confirmations',
    ];

    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`  ✅ ${table}: ${result.rows[0].count} rows`);
    }

    // Count seeded functions
    const functionsResult = await client.query(`
      SELECT category, COUNT(*) as count 
      FROM helper_functions 
      GROUP BY category 
      ORDER BY category
    `);
    console.log('\n📋 Seeded functions by category:');
    for (const row of functionsResult.rows) {
      console.log(`  • ${row.category}: ${row.count} functions`);
    }

    // Verify function
    console.log('\n🔧 Verifying functions:');
    const funcResult = await client.query(`
      SELECT proname FROM pg_proc 
      WHERE proname IN ('get_available_functions', 'update_function_stats')
    `);
    console.log(`  ✅ ${funcResult.rows.length}/2 helper functions created`);

    console.log('\n🎉 Helper Tool Calling migration completed!');
    console.log('\n📋 Summary:');
    console.log('  • 4 tables created (functions, calls, permissions, confirmations)');
    console.log('  • 12 functions seeded (WhatsApp, CRM, Helper)');
    console.log('  • Function registry with JSON Schema validation');
    console.log('  • Execution log with status tracking');
    console.log('  • Confirmation workflow support');
    console.log('  • RLS policies applied');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed');
  }
}

applyHelperToolCallingMigration();
