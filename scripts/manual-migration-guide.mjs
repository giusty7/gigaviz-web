#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

async function executeRawSQL(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }

  return response.json();
}

async function main() {
  console.log("🚀 Applying Helper Migrations via Direct SQL...\n");

  try {
    const migrations = [
      {
        name: "Phase 3: Multi-modal AI",
        file: "20260202120000_helper_multimodal.sql",
      },
      {
        name: "Phase 4: Team Collaboration",
        file: "20260202130000_helper_collaboration.sql",
      },
      {
        name: "Phase 5: Automation & Workflows",
        file: "20260202140000_helper_workflows.sql",
      },
      {
        name: "Phase 6: Analytics & Insights",
        file: "20260202150000_helper_analytics.sql",
      },
    ];

    for (const migration of migrations) {
      console.log(`📦 ${migration.name}`);
      
      const filePath = join(
        __dirname,
        "..",
        "supabase",
        "migrations",
        migration.file
      );
      
      const sql = readFileSync(filePath, "utf8");
      
      console.log(`  Executing ${migration.file}...`);
      console.log(`  SQL size: ${(sql.length / 1024).toFixed(2)} KB`);
      
      try {
        // Split by statements and execute one by one
        const statements = sql
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.startsWith("--"));

        console.log(`  Found ${statements.length} SQL statements`);
        console.log(`  ⚠️  Direct SQL execution may not work - use Supabase Dashboard SQL Editor`);
        console.log(`  ✓ Migration file ready at: supabase/migrations/${migration.file}\n`);
        
      } catch (error) {
        console.log(`  ⚠️  Error: ${error.message}\n`);
      }
    }

    console.log("\n📋 Manual Steps Required:");
    console.log("\n1. Open Supabase Dashboard: https://supabase.com/dashboard");
    console.log("2. Go to: SQL Editor");
    console.log("3. Execute these migrations in order:\n");
    
    migrations.forEach((m, i) => {
      console.log(`   ${i + 1}. supabase/migrations/${m.file}`);
    });

    console.log("\n4. Or use Supabase CLI:");
    console.log("   supabase db push\n");

    console.log("✨ Migration files are ready!");
    console.log("📁 Location: supabase/migrations/\n");
    
  } catch (error) {
    console.error("❌ Failed:", error);
    process.exit(1);
  }
}

main();
