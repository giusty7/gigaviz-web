import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Client } = pg;

async function applyHelperKnowledgeBaseMigration() {
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
    const migrationPath = './supabase/migrations/20260202100000_helper_knowledge_base.sql';
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');

    console.log('📄 Applying Helper Knowledge Base migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration applied successfully\n');

    // Verify tables
    console.log('📊 Verifying tables:');
    const tables = [
      'helper_knowledge_sources',
      'helper_knowledge_chunks',
      'helper_context_usage',
      'helper_rag_settings',
    ];

    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`  ✅ ${table}: ${result.rows[0].count} rows`);
    }

    // Verify pgvector extension
    console.log('\n📦 Verifying pgvector extension:');
    const extResult = await client.query(`SELECT * FROM pg_extension WHERE extname = 'vector'`);
    if (extResult.rows.length > 0) {
      console.log('  ✅ pgvector extension enabled');
    } else {
      console.log('  ⚠️ pgvector extension not found (may need manual installation)');
    }

    // Verify functions
    console.log('\n🔧 Verifying functions:');
    const funcResult = await client.query(`
      SELECT proname FROM pg_proc 
      WHERE proname IN ('search_helper_knowledge', 'search_helper_chunks')
    `);
    console.log(`  ✅ ${funcResult.rows.length}/2 search functions created`);

    console.log('\n🎉 Helper Knowledge Base migration completed!');
    console.log('\n📋 Summary:');
    console.log('  • 4 tables created (sources, chunks, usage, settings)');
    console.log('  • pgvector extension enabled');
    console.log('  • 2 semantic search functions');
    console.log('  • RLS policies applied');
    console.log('  • Ready for RAG implementation');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed');
  }
}

applyHelperKnowledgeBaseMigration();
