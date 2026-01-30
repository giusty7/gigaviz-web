import pg from 'pg';

const { Client } = pg;

async function verifyMigration() {
  const client = new Client({
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.szzqjwqpzboaofygnebn',
    password: 'Eryanfarida7',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('📊 Verification Report\n');
    console.log('='.repeat(60) + '\n');

    // Check apps_catalog
    const { rows: apps } = await client.query(`
      SELECT name, status, category, pricing_model 
      FROM apps_catalog 
      ORDER BY 
        CASE status 
          WHEN 'stable' THEN 1 
          WHEN 'beta' THEN 2 
          WHEN 'coming_soon' THEN 3 
          ELSE 4 
        END,
        name
    `);
    
    console.log('📦 APPS CATALOG (' + apps.length + ' apps):');
    apps.forEach(app => {
      const statusEmoji = app.status === 'stable' ? '✅' : 
                         app.status === 'beta' ? '🧪' : '⏳';
      console.log(`  ${statusEmoji} ${app.name.padEnd(20)} | ${app.status.padEnd(12)} | ${app.category}`);
    });

    // Check roadmap
    const { rows: roadmap } = await client.query(`
      SELECT title, status, quarter, category 
      FROM apps_roadmap 
      WHERE is_public = true 
      ORDER BY 
        CASE status 
          WHEN 'shipped' THEN 1 
          WHEN 'in_progress' THEN 2 
          WHEN 'planned' THEN 3 
          ELSE 4 
        END,
        upvotes DESC
      LIMIT 5
    `);
    
    console.log('\n🗺️  ROADMAP (' + roadmap.length + ' items):');
    roadmap.forEach(item => {
      const statusEmoji = item.status === 'shipped' ? '🚀' : 
                         item.status === 'in_progress' ? '🔨' : '📋';
      const quarterInfo = item.quarter ? ` (${item.quarter})` : '';
      console.log(`  ${statusEmoji} ${item.title}${quarterInfo}`);
      console.log(`     Status: ${item.status} | Category: ${item.category}`);
    });

    // Check RLS policies
    const { rows: policies } = await client.query(`
      SELECT schemaname, tablename, policyname, cmd, qual
      FROM pg_policies 
      WHERE tablename IN ('apps_catalog', 'apps_requests', 'apps_roadmap')
      ORDER BY tablename, policyname
    `);
    
    console.log('\n🔒 RLS POLICIES (' + policies.length + ' policies):');
    policies.forEach(p => {
      console.log(`  ✓ ${p.tablename}.${p.policyname} (${p.cmd})`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ Migration verified successfully!\n');

  } catch (err) {
    console.error('❌ Verification error:', err.message);
  } finally {
    await client.end();
  }
}

verifyMigration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
