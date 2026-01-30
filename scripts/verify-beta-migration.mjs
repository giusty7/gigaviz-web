/**
 * Verify beta program migration was successful
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verify() {
  console.log('🔍 Verifying beta program migration...\n');

  try {
    // Check beta_programs table
    const { data: programs, error: programsError } = await supabase
      .from('beta_programs')
      .select('*');

    if (programsError) {
      console.error('❌ beta_programs table error:', programsError.message);
      return false;
    }

    console.log(`✅ beta_programs table exists`);
    console.log(`   📊 Programs count: ${programs.length}`);
    programs.forEach(p => {
      console.log(`      - ${p.module_name} (${p.status})`);
    });
    console.log('');

    // Check beta_participants table
    const { error: participantsError } = await supabase
      .from('beta_participants')
      .select('count')
      .limit(1);

    if (participantsError) {
      console.error('❌ beta_participants table error:', participantsError.message);
      return false;
    }

    console.log(`✅ beta_participants table exists\n`);

    // Check beta_feedback table
    const { error: feedbackError } = await supabase
      .from('beta_feedback')
      .select('count')
      .limit(1);

    if (feedbackError) {
      console.error('❌ beta_feedback table error:', feedbackError.message);
      return false;
    }

    console.log(`✅ beta_feedback table exists\n`);

    console.log('='.repeat(60));
    console.log('✅ MIGRATION VERIFIED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n🎉 All tables are working correctly!');
    console.log('\n📍 Next steps:');
    console.log('   1. Test API endpoint: GET /api/beta/apply?workspaceId={id}');
    console.log('   2. Test UI page: /{workspaceSlug}/beta');
    console.log('   3. Apply to beta program and verify workflow');
    console.log('\n');

    return true;

  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    return false;
  }
}

verify();
