import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Client } = pg;

async function checkMigrations() {
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
    console.log('✅ Connected\n');

    const migrations = [
      '20260131120000_beta_program',
      '20260131150000_fix_refresh_function_name',
      '20260131160000_apps_product',
      '20260131170000_marketplace_product',
      '20260131180000_studio_children',
      '20260131190000_meta_hub_polish',
    ];

    console.log('📊 Checking migration status:\n');

    for (const migration of migrations) {
      // Check if tables exist
      const parts = migration.split('_');
      const name = parts.slice(1).join('_');
      
      let status = '❓';
      let detail = '';

      try {
        if (name === 'beta_program') {
          const result = await client.query(`SELECT COUNT(*) FROM beta_programs`);
          status = '✅';
          detail = `${result.rows[0].count} programs`;
        } else if (name === 'fix_refresh_function_name') {
          const result = await client.query(`SELECT proname FROM pg_proc WHERE proname = 'refresh_usage_stats_daily'`);
          status = result.rows.length > 0 ? '✅' : '❌';
          detail = result.rows.length > 0 ? 'function exists' : 'NOT FOUND';
        } else if (name === 'apps_product') {
          const result = await client.query(`SELECT COUNT(*) FROM apps_catalog`);
          status = '✅';
          detail = `${result.rows[0].count} apps`;
        } else if (name === 'marketplace_product') {
          const result = await client.query(`SELECT COUNT(*) FROM marketplace_items`);
          status = '✅';
          detail = `${result.rows[0].count} items`;
        } else if (name === 'studio_children') {
          const result = await client.query(`SELECT COUNT(*) FROM office_templates`);
          status = '✅';
          detail = `${result.rows[0].count} templates`;
        } else if (name === 'meta_hub_polish') {
          const result = await client.query(`SELECT COUNT(*) FROM ig_accounts`);
          status = '✅';
          detail = `${result.rows[0].count} IG accounts`;
        }
      } catch (error) {
        status = '❌';
        detail = 'NOT APPLIED';
      }

      console.log(`${status} ${migration} - ${detail}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed');
  }
}

checkMigrations();
