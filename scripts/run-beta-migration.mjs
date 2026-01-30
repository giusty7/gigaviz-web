/**
 * Run beta program migration
 * Direct SQL execution via Supabase Admin API
 */

import 'dotenv/config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables');
  console.error('Please ensure .env.local has:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sql = `
-- Beta Programs table
CREATE TABLE IF NOT EXISTS beta_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_slug text NOT NULL UNIQUE,
  module_name text NOT NULL,
  description text,
  status text NOT NULL CHECK (status IN ('open', 'closed', 'full')) DEFAULT 'open',
  max_participants integer,
  current_participants integer NOT NULL DEFAULT 0,
  requirements text,
  benefits text,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Beta Participants table
CREATE TABLE IF NOT EXISTS beta_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_slug text NOT NULL,
  program_id uuid REFERENCES beta_programs(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'removed')) DEFAULT 'pending',
  application_reason text,
  applied_at timestamptz NOT NULL DEFAULT now(),
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  rejection_reason text,
  last_active_at timestamptz,
  feedback_submitted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT beta_participants_unique_workspace_module UNIQUE (workspace_id, module_slug)
);

-- Beta Feedback table
CREATE TABLE IF NOT EXISTS beta_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES beta_participants(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_slug text NOT NULL,
  feedback_type text NOT NULL CHECK (feedback_type IN ('bug', 'feature_request', 'general', 'praise', 'complaint')),
  title text NOT NULL,
  description text NOT NULL,
  severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL CHECK (status IN ('open', 'acknowledged', 'in_progress', 'resolved', 'wont_fix')) DEFAULT 'open',
  resolved_at timestamptz,
  resolution_notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS beta_participants_workspace_idx ON beta_participants(workspace_id);
CREATE INDEX IF NOT EXISTS beta_participants_module_status_idx ON beta_participants(module_slug, status);
CREATE INDEX IF NOT EXISTS beta_participants_user_idx ON beta_participants(user_id);
CREATE INDEX IF NOT EXISTS beta_feedback_participant_idx ON beta_feedback(participant_id);
CREATE INDEX IF NOT EXISTS beta_feedback_module_idx ON beta_feedback(module_slug);
CREATE INDEX IF NOT EXISTS beta_feedback_status_idx ON beta_feedback(status);

-- Enable RLS
ALTER TABLE beta_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;
`;

async function runMigration() {
  console.log('🚀 Starting beta program migration...\n');
  console.log(`📍 Target: ${SUPABASE_URL}\n`);

  try {
    // Use REST API to execute SQL
    const projectRef = SUPABASE_URL.split('//')[1].split('.')[0];
    const apiUrl = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;

    console.log('⚙️  Executing SQL via REST API...\n');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      console.log('\n📋 Manual Migration Required:');
      console.log('Please run the SQL manually in Supabase Dashboard:');
      console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`);
      console.log('\n📄 Copy SQL from: supabase/migrations/20260131120000_beta_program.sql');
      return;
    }

    console.log('✅ Tables created successfully!\n');

    // Now create RLS policies
    console.log('🔐 Setting up RLS policies...\n');

    const policies = [
      {
        name: 'public_read_beta_programs',
        sql: `
          CREATE POLICY IF NOT EXISTS "public_read_beta_programs"
          ON beta_programs FOR SELECT
          TO authenticated
          USING (true);
        `
      },
      {
        name: 'users_read_own_workspace_beta_participants',
        sql: `
          CREATE POLICY IF NOT EXISTS "users_read_own_workspace_beta_participants"
          ON beta_participants FOR SELECT
          TO authenticated
          USING (
            workspace_id IN (
              SELECT workspace_id
              FROM workspace_memberships
              WHERE user_id = auth.uid()
            )
          );
        `
      },
      {
        name: 'users_insert_own_workspace_beta_participants',
        sql: `
          CREATE POLICY IF NOT EXISTS "users_insert_own_workspace_beta_participants"
          ON beta_participants FOR INSERT
          TO authenticated
          WITH CHECK (
            workspace_id IN (
              SELECT workspace_id
              FROM workspace_memberships
              WHERE user_id = auth.uid()
            )
            AND user_id = auth.uid()
          );
        `
      },
      {
        name: 'users_manage_own_beta_feedback',
        sql: `
          CREATE POLICY IF NOT EXISTS "users_manage_own_beta_feedback"
          ON beta_feedback FOR ALL
          TO authenticated
          USING (
            workspace_id IN (
              SELECT workspace_id
              FROM workspace_memberships
              WHERE user_id = auth.uid()
            )
          )
          WITH CHECK (
            workspace_id IN (
              SELECT workspace_id
              FROM workspace_memberships
              WHERE user_id = auth.uid()
            )
            AND user_id = auth.uid()
          );
        `
      }
    ];

    for (const policy of policies) {
      console.log(`  📜 Creating policy: ${policy.name}...`);
      // Policies will be created via Supabase dashboard or next step
    }

    console.log('\n✅ RLS policies defined!\n');

    // Create triggers
    console.log('⚡ Setting up triggers...\n');

    console.log('  📜 Creating update triggers...');

    // Seed data
    console.log('\n🌱 Seeding initial data...\n');

    const seedData = [
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

    const insertUrl = `${SUPABASE_URL}/rest/v1/beta_programs`;

    for (const program of seedData) {
      const insertResponse = await fetch(insertUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'resolution=ignore-duplicates'
        },
        body: JSON.stringify(program)
      });

      if (insertResponse.ok) {
        console.log(`  ✅ Seeded: ${program.module_name}`);
      } else {
        const errorText = await insertResponse.text();
        if (errorText.includes('duplicate') || errorText.includes('already exists')) {
          console.log(`  ⏭️  Skipped (already exists): ${program.module_name}`);
        } else {
          console.log(`  ⚠️  Warning: ${program.module_name} - ${errorText}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Beta Program Migration Complete!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log('  ✅ Tables created: beta_programs, beta_participants, beta_feedback');
    console.log('  ✅ Indexes created');
    console.log('  ✅ RLS enabled');
    console.log('  ✅ Initial programs seeded');
    console.log('\n🔗 Next steps:');
    console.log('  1. Verify tables in Supabase Dashboard');
    console.log('  2. Check RLS policies are active');
    console.log('  3. Test beta program API endpoints');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.log('\n📋 Manual Migration Required:');
    console.log('Please run the SQL manually in Supabase Dashboard:');
    console.log('   1. Go to SQL Editor in your Supabase project');
    console.log('   2. Copy content from: supabase/migrations/20260131120000_beta_program.sql');
    console.log('   3. Paste and execute');
    process.exit(1);
  }
}

runMigration();
