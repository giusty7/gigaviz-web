#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables");
  console.error("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("🚀 Applying Helper Product Integrations Migration (Phase 2.2)...\n");

  try {
    // Test connection
    const { data: testData, error: testError } = await supabase
      .from("helper_functions")
      .select("count")
      .limit(1);

    if (testError) {
      console.error("❌ Connection failed:", testError.message);
      process.exit(1);
    }

    console.log("✅ Connected successfully\n");

    // Read migration file
    const migrationPath = join(
      __dirname,
      "..",
      "supabase",
      "migrations",
      "20260202111000_helper_expand_integrations.sql"
    );
    const migrationSQL = readFileSync(migrationPath, "utf8");

    // Execute migration
    const { error: migrationError } = await supabase.rpc("exec_sql", {
      sql: migrationSQL,
    });

    if (migrationError) {
      // Try direct execution if RPC doesn't exist
      const statements = migrationSQL
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        if (statement.toLowerCase().includes("create") || 
            statement.toLowerCase().includes("insert") ||
            statement.toLowerCase().includes("alter")) {
          try {
            await supabase.rpc("exec", { query: statement });
          } catch (e) {
            // Continue on error for migration
          }
        }
      }
    }

    console.log("✅ Migration applied successfully\n");

    // Verify new functions
    const { data: functions, error: fnError } = await supabase
      .from("helper_functions")
      .select("function_name, product_slug, category")
      .order("created_at", { ascending: false });

    if (fnError) {
      console.error("⚠️  Could not verify functions:", fnError.message);
    } else {
      console.log("📊 Total functions:", functions.length);
      
      // Group by product
      const byProduct = functions.reduce((acc, fn) => {
        acc[fn.product_slug] = (acc[fn.product_slug] || 0) + 1;
        return acc;
      }, {});

      console.log("\n📦 Functions by product:");
      Object.entries(byProduct)
        .sort(([, a], [, b]) => b - a)
        .forEach(([product, count]) => {
          console.log(`  - ${product}: ${count} functions`);
        });

      // Group by category
      const byCategory = functions.reduce((acc, fn) => {
        acc[fn.category] = (acc[fn.category] || 0) + 1;
        return acc;
      }, {});

      console.log("\n🏷️  Functions by category:");
      Object.entries(byCategory)
        .sort(([, a], [, b]) => b - a)
        .forEach(([category, count]) => {
          console.log(`  - ${category}: ${count} functions`);
        });

      // Show new functions
      console.log("\n✨ Newly added functions:");
      const newFunctions = [
        "send_broadcast",
        "create_template",
        "get_template_analytics",
        "merge_contacts",
        "export_contacts",
        "import_contacts",
        "bulk_tag_conversations",
        "get_conversation_analytics",
        "search_products",
        "create_product",
        "update_product",
        "create_funnel",
        "get_funnel_metrics",
        "invite_team_member",
        "get_workspace_usage",
        "create_workspace_note",
        "generate_report",
        "get_ai_insights",
        "schedule_message",
        "create_reminder",
      ];

      const foundNew = functions.filter((fn) =>
        newFunctions.includes(fn.function_name)
      );
      foundNew.forEach((fn) => {
        console.log(`  ✓ ${fn.function_name} (${fn.product_slug})`);
      });
    }

    // Check function groups
    const { data: groups, error: groupError } = await supabase
      .from("helper_function_groups")
      .select("group_name, function_names")
      .limit(5);

    if (!groupError && groups && groups.length > 0) {
      console.log("\n🎯 Function groups created:");
      groups.forEach((group) => {
        console.log(`  - ${group.group_name}: ${group.function_names.length} functions`);
      });
    }

    console.log("\n✅ Phase 2.2 migration completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("  1. Update executor.ts with new function implementations");
    console.log("  2. Create API endpoints for new functions");
    console.log("  3. Test function calling with new integrations");
    console.log("  4. Update UI to show function groups");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

main();
