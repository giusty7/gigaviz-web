import pg from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Client } = pg;

async function applyMarketplaceMigration() {
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

    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260131170000_marketplace_product.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('📦 Applying Marketplace product migration...');
    await client.query(sql);
    console.log('✅ Migration applied successfully!\n');

    // Verify tables
    console.log('🔍 Verifying tables...');
    const tables = ['marketplace_items', 'marketplace_purchases', 'marketplace_reviews', 'marketplace_creators'];
    
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`✅ ${table}: ${result.rows[0].count} rows`);
    }

    console.log('\n🎉 Marketplace migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

applyMarketplaceMigration();
