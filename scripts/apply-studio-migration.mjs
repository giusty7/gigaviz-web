import pg from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Client } = pg;

async function applyStudioMigration() {
  console.log('🔌 Connecting to database...');
  
  const client = new Client({
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.szzqjwqpzboaofygnebn',
    password: 'Eryanfarida7',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    console.log('✅ Connected!\n');

    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260131180000_studio_children.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('📦 Applying Studio children migration (Office, Graph, Tracks)...');
    await client.query(sql);
    console.log('✅ Migration applied successfully!\n');

    // Verify tables
    console.log('🔍 Verifying tables...');
    const tables = [
      'office_templates',
      'office_documents',
      'graph_charts',
      'graph_dashboards',
      'tracks_workflows',
      'tracks_runs'
    ];
    
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`✅ ${table}: ${result.rows[0].count} rows`);
    }

    console.log('\n🎉 Studio children migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

applyStudioMigration();
