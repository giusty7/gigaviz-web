/**
 * Run beta program migration using direct table operations
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAndSeed() {
  console.log('🚀 Starting beta program data seeding...\n');
  console.log(`📍 Target: ${SUPABASE_URL}\n`);

  try {
    // Check if beta_programs table exists by trying to query it
    console.log('🔍 Checking if beta_programs table exists...\n');
    
    const { data: existingPrograms, error: queryError } = await supabase
      .from('beta_programs')
      .select('module_slug')
      .limit(1);

    if (queryError) {
      console.error('❌ Table does not exist or access denied:', queryError.message);
      console.log('\n📋 MANUAL MIGRATION REQUIRED:\n');
      console.log('Please follow these steps:');
      console.log('\n1. Open Supabase Dashboard SQL Editor:');
      const projectRef = SUPABASE_URL.split('//')[1].split('.')[0];
      console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
      console.log('2. Copy and paste the SQL from:');
      console.log('   supabase/migrations/20260131120000_beta_program.sql\n');
      console.log('3. Click "Run" to execute the migration\n');
      console.log('4. After successful execution, run this script again to seed data\n');
      return;
    }

    console.log('✅ Table exists! Proceeding with data seeding...\n');

    // Seed initial beta programs
    const programs = [
      {
        module_slug: 'studio',
        module_name: 'Gigaviz Studio',
        description: 'Creative suite for content generation and workflow automation',
        status: 'open',
        requirements: '["Active workspace", "At least 10 WhatsApp messages sent"]',
        benefits: '["Early access to AI-powered content tools", "Direct feedback channel", "Influence product development"]'
      },
      {
        module_slug: 'apps',
        module_name: 'Gigaviz Apps',
        description: 'Custom app marketplace and integration platform',
        status: 'open',
        requirements: '["Team plan or higher", "Technical integration experience"]',
        benefits: '["Build custom integrations", "Access beta API documentation", "Priority support"]'
      },
      {
        module_slug: 'marketplace',
        module_name: 'Gigaviz Marketplace',
        description: 'Buy and sell digital products and services',
        status: 'open',
        requirements: '["Verified workspace", "Payment method on file"]',
        benefits: '["Early seller access", "Reduced commission rates", "Beta marketplace badge"]'
      },
      {
        module_slug: 'arena',
        module_name: 'Gigaviz Arena',
        description: 'Competitive insights and benchmarking tools',
        status: 'closed',
        requirements: '["Team plan", "100+ contacts"]',
        benefits: '["Compare performance metrics", "Industry benchmarks", "Competitive analysis tools"]'
      }
    ];

    let seededCount = 0;
    let skippedCount = 0;

    for (const program of programs) {
      // Check if already exists
      const { data: existing } = await supabase
        .from('beta_programs')
        .select('id')
        .eq('module_slug', program.module_slug)
        .single();

      if (existing) {
        console.log(`  ⏭️  Skipped (already exists): ${program.module_name}`);
        skippedCount++;
        continue;
      }

      // Insert new program
      const { error: insertError } = await supabase
        .from('beta_programs')
        .insert(program);

      if (insertError) {
        if (insertError.message.includes('duplicate') || insertError.code === '23505') {
          console.log(`  ⏭️  Skipped (already exists): ${program.module_name}`);
          skippedCount++;
        } else {
          console.error(`  ❌ Failed to seed ${program.module_name}:`, insertError.message);
        }
      } else {
        console.log(`  ✅ Seeded: ${program.module_name}`);
        seededCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Beta Program Seeding Complete!');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`  ✅ New programs seeded: ${seededCount}`);
    console.log(`  ⏭️  Already existing: ${skippedCount}`);
    console.log(`  📦 Total programs: ${programs.length}`);
    console.log('\n🔗 Next steps:');
    console.log('  1. Test beta program endpoints');
    console.log(`  2. Visit: /{workspaceSlug}/beta`);
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

checkAndSeed();
