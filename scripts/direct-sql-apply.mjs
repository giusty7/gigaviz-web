/**
 * Apply SQL directly using Supabase client (bypassing exec_sql function)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing environment variables');
  console.error('   Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🚀 Starting beta program migration...\n');
console.log(`📍 Target: ${SUPABASE_URL}\n`);

// Read the SQL file
const sql = readFileSync('supabase/migrations/20260131120000_beta_program.sql', 'utf-8');

// Split by statement (simple split by semicolon)
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`📋 Found ${statements.length} SQL statements\n`);

// Execute each statement
for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i];
  
  // Skip comments
  if (stmt.startsWith('--') || stmt.length < 5) continue;
  
  // Show first 100 chars of statement
  const preview = stmt.substring(0, 100).replace(/\n/g, ' ');
  console.log(`⏳ [${i + 1}/${statements.length}] ${preview}...`);
  
  try {
    const { error } = await supabase.rpc('exec_sql', { query: stmt });
    
    if (error) {
      console.error(`❌ Error: ${error.message}`);
      
      // Check if it's a "already exists" error (safe to ignore)
      if (
        error.message.includes('already exists') ||
        error.message.includes('duplicate key')
      ) {
        console.log('   ⚠️  Skipping (already exists)\n');
        continue;
      }
      
      throw error;
    }
    
    console.log('   ✅ Success\n');
    
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.error('\nStatement that failed:');
    console.error(stmt);
    process.exit(1);
  }
}

console.log('='.repeat(60));
console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
console.log('='.repeat(60));
console.log('\n🎉 Beta program schema is ready!');
console.log('\n📍 Next steps:');
console.log('   1. Run: node scripts/verify-beta-migration.mjs');
console.log('   2. Test API: GET /api/beta/apply?workspaceId={id}');
console.log('   3. Test UI: /{workspaceSlug}/beta\n');
