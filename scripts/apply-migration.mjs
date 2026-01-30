import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Apply Apps product migration directly via Supabase client
 * This executes the SQL file against the database
 */
async function applyAppsMigration() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const migrationPath = join(process.cwd(), "supabase", "migrations", "20260131160000_apps_product.sql");
  const migrationSQL = readFileSync(migrationPath, "utf-8");

  console.log("📦 Applying Apps product migration...");
  console.log("📄 File:", migrationPath);
  console.log("\n⚠️  Note: Supabase JS client doesn't support direct SQL execution.");
  console.log("Please apply this migration manually:\n");
  console.log("Option 1: Via Supabase Dashboard");
  console.log("  - Go to https://supabase.com/dashboard/project/[your-project]/sql");
  console.log("  - Paste the contents of supabase/migrations/20260131160000_apps_product.sql");
  console.log("  - Click 'Run'\n");
  console.log("Option 2: Via CLI");
  console.log('  - Run: npx supabase db push --db-url "your-connection-string" --include-all\n');
  console.log("Option 3: Via psql");
  console.log('  - Run: psql "your-connection-string" < supabase/migrations/20260131160000_apps_product.sql\n');

  // Check if tables already exist
  console.log("🔍 Checking if migration already applied...\n");
  
  const { data: catalogExists } = await supabase
    .from("apps_catalog")
    .select("id")
    .limit(1);
  
  const { data: requestsExists } = await supabase
    .from("apps_requests")
    .select("id")
    .limit(1);
  
  const { data: roadmapExists } = await supabase
    .from("apps_roadmap")
    .select("id")
    .limit(1);

  if (catalogExists !== null && requestsExists !== null && roadmapExists !== null) {
    console.log("✅ Migration appears to be already applied!");
    console.log("   - apps_catalog table exists");
    console.log("   - apps_requests table exists");
    console.log("   - apps_roadmap table exists");
  } else {
    console.log("❌ Migration NOT yet applied. Tables missing:");
    if (catalogExists === null) console.log("   - apps_catalog");
    if (requestsExists === null) console.log("   - apps_requests");
    if (roadmapExists === null) console.log("   - apps_roadmap");
    console.log("\nPlease apply manually using one of the options above.");
  }

  let successCount = 0;
  let errorCount = 0;

  console.log("\n📊 Summary:");
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);

  if (errorCount === 0) {
    console.log("\n🎉 Migration applied successfully!");
  } else {
    console.log("\n⚠️  Migration completed with some errors. Check output above.");
  }
}

// Execute
applyAppsMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
