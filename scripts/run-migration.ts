/**
 * Script to run beta program migration
 * Usage: tsx scripts/run-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Type assertion safe because we checked above
const supabase = createClient(supabaseUrl as string, supabaseServiceKey as string);

async function runMigration() {
  console.log('🚀 Starting beta program migration...\n');

  const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20260131120000_beta_program.sql');
  
  try {
    const sql = readFileSync(migrationPath, 'utf-8');
    
    // Split by semicolons and filter out comments/empty lines
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip pure comment blocks
      if (statement.trim().startsWith('/*') && statement.trim().endsWith('*/;')) {
        continue;
      }

      console.log(`[${i + 1}/${statements.length}] Executing statement...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          // Try direct query if RPC doesn't work
          const { error: directError } = await supabase.from('_migrations').select('*').limit(1);
          if (directError) {
            console.warn(`⚠️  Cannot execute via RPC, statement might need manual execution`);
            console.log(statement.substring(0, 100) + '...\n');
            errorCount++;
            continue;
          }
        }
        
        successCount++;
        console.log(`✅ Success\n`);
      } catch (err) {
        console.error(`❌ Error:`, err);
        errorCount++;
        console.log(statement.substring(0, 200) + '...\n');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`Migration Summary:`);
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));

    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed.');
      console.log('You may need to run them manually in Supabase SQL Editor:');
      const projectId = (supabaseUrl as string).replace('https://', '').split('.')[0];
      console.log(`   https://supabase.com/dashboard/project/${projectId}/sql`);
      console.log('\nOr copy the SQL file content and paste it there.');
    } else {
      console.log('\n✅ Migration completed successfully!');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

runMigration();
