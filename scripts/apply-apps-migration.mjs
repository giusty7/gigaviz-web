import pg from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Client } = pg;

async function applyMigration() {
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

    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260131160000_apps_product.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('📦 Applying Apps product migration...');
    console.log('📄 File:', migrationPath);
    console.log('');

    // Execute the entire SQL file
    await client.query(sql);

    console.log('✅ Migration applied successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    
    const { rows: catalogRows } = await client.query('SELECT COUNT(*) FROM apps_catalog');
    console.log(`✅ apps_catalog: ${catalogRows[0].count} rows`);

    const { rows: requestsRows } = await client.query('SELECT COUNT(*) FROM apps_requests');
    console.log(`✅ apps_requests: ${requestsRows[0].count} rows`);

    const { rows: roadmapRows } = await client.query('SELECT COUNT(*) FROM apps_roadmap');
    console.log(`✅ apps_roadmap: ${roadmapRows[0].count} rows`);

    console.log('\n🎉 Migration completed successfully!');
    
  } catch (err) {
    console.error('❌ Error applying migration:', err.message);
    if (err.message.includes('already exists')) {
      console.log('\n⚠️  Tables already exist. Checking current state...\n');
      
      try {
        const { rows: catalogRows } = await client.query('SELECT COUNT(*) FROM apps_catalog');
        console.log(`✅ apps_catalog: ${catalogRows[0].count} rows`);

        const { rows: requestsRows } = await client.query('SELECT COUNT(*) FROM apps_requests');
        console.log(`✅ apps_requests: ${requestsRows[0].count} rows`);

        const { rows: roadmapRows } = await client.query('SELECT COUNT(*) FROM apps_roadmap');
        console.log(`✅ apps_roadmap: ${roadmapRows[0].count} rows`);

        console.log('\n✅ Migration was already applied previously.');
      } catch (verifyErr) {
        console.error('Error verifying tables:', verifyErr.message);
      }
    } else {
      throw err;
    }
  } finally {
    await client.end();
    console.log('🔌 Disconnected from database.');
  }
}

applyMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
