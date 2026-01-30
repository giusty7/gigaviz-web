#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
  db: { schema: "public" },
});

async function main() {
  console.log("🚀 Applying Phase 2.2: Expanded Product Integrations...\n");

  try {
    console.log("✅ Connected successfully\n");

    const { count: beforeCount } = await supabase
      .from("helper_functions")
      .select("*", { count: "exact", head: true });

    console.log(`📊 Current functions: ${beforeCount || 0}\n`);

    const newFunctions = [
      {
        function_name: "send_broadcast",
        display_name: "Send Broadcast Message",
        description: "Send a WhatsApp broadcast message to multiple contacts",
        icon: "📢",
        product_slug: "meta-hub",
        category: "messaging",
        parameters_schema: {
          recipientTags: { type: "array", items: { type: "string" } },
          message: { type: "string" },
          templateId: { type: "string" },
        },
        required_params: ["message"],
        requires_confirmation: true,
        required_roles: ["admin"],
        handler_type: "api",
        handler_endpoint: "/api/meta/broadcasts/send",
      },
      {
        function_name: "create_template",
        display_name: "Create Message Template",
        description: "Create a new WhatsApp message template for approval",
        icon: "📝",
        product_slug: "meta-hub",
        category: "messaging",
        parameters_schema: {
          name: { type: "string" },
          category: { type: "string" },
          language: { type: "string" },
          body: { type: "string" },
          header: { type: "string" },
          footer: { type: "string" },
        },
        required_params: ["name", "category", "language", "body"],
        requires_confirmation: true,
        required_roles: ["admin"],
        handler_type: "api",
        handler_endpoint: "/api/meta/templates/create",
      },
      {
        function_name: "get_template_analytics",
        display_name: "Get Template Analytics",
        description: "Retrieve performance analytics for message templates",
        icon: "📊",
        product_slug: "meta-hub",
        category: "analytics",
        parameters_schema: {
          templateId: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string" },
        },
        required_params: ["templateId"],
        requires_confirmation: false,
        handler_type: "api",
        handler_endpoint: "/api/meta/templates/analytics",
      },
      {
        function_name: "merge_contacts",
        display_name: "Merge Duplicate Contacts",
        description: "Merge two or more duplicate contacts into one",
        icon: "🔗",
        product_slug: "meta-hub",
        category: "crm",
        parameters_schema: {
          primaryContactId: { type: "string" },
          duplicateContactIds: { type: "array", items: { type: "string" } },
        },
        required_params: ["primaryContactId", "duplicateContactIds"],
        requires_confirmation: true,
        required_roles: ["admin"],
        handler_type: "api",
        handler_endpoint: "/api/meta/contacts/merge",
      },
      {
        function_name: "export_contacts",
        display_name: "Export Contacts",
        description: "Export contacts to CSV with filters",
        icon: "📤",
        product_slug: "meta-hub",
        category: "crm",
        parameters_schema: {
          filters: { type: "object" },
          format: { type: "string", enum: ["csv", "xlsx"] },
        },
        required_params: [],
        requires_confirmation: false,
        handler_type: "api",
        handler_endpoint: "/api/meta/contacts/export",
      },
      {
        function_name: "import_contacts",
        display_name: "Import Contacts",
        description: "Import contacts from CSV/Excel file",
        icon: "📥",
        product_slug: "meta-hub",
        category: "crm",
        parameters_schema: {
          fileUrl: { type: "string" },
          mapping: { type: "object" },
          skipDuplicates: { type: "boolean" },
        },
        required_params: ["fileUrl"],
        requires_confirmation: true,
        required_roles: ["admin"],
        handler_type: "api",
        handler_endpoint: "/api/meta/contacts/import",
      },
      {
        function_name: "bulk_tag_conversations",
        display_name: "Bulk Tag Conversations",
        description: "Apply tags to multiple conversations at once",
        icon: "🏷️",
        product_slug: "meta-hub",
        category: "messaging",
        parameters_schema: {
          conversationIds: { type: "array", items: { type: "string" } },
          tags: { type: "array", items: { type: "string" } },
          action: { type: "string", enum: ["add", "remove", "replace"] },
        },
        required_params: ["conversationIds", "tags", "action"],
        requires_confirmation: false,
        handler_type: "api",
        handler_endpoint: "/api/meta/conversations/bulk-tag",
      },
      {
        function_name: "get_conversation_analytics",
        display_name: "Get Conversation Analytics",
        description: "Retrieve analytics and insights for conversations",
        icon: "📈",
        product_slug: "meta-hub",
        category: "analytics",
        parameters_schema: {
          startDate: { type: "string" },
          endDate: { type: "string" },
          groupBy: { type: "string", enum: ["day", "week", "month"] },
        },
        required_params: [],
        requires_confirmation: false,
        handler_type: "api",
        handler_endpoint: "/api/meta/analytics/conversations",
      },
      {
        function_name: "search_products",
        display_name: "Search Products",
        description: "Search products in Marketplace catalog",
        icon: "🔍",
        product_slug: "marketplace",
        category: "search",
        parameters_schema: {
          query: { type: "string" },
          category: { type: "string" },
          minPrice: { type: "number" },
          maxPrice: { type: "number" },
          limit: { type: "number" },
        },
        required_params: ["query"],
        requires_confirmation: false,
        handler_type: "direct",
        handler_endpoint: null,
      },
      {
        function_name: "create_product",
        display_name: "Create Product",
        description: "Create a new product in Marketplace",
        icon: "➕",
        product_slug: "marketplace",
        category: "productivity",
        parameters_schema: {
          name: { type: "string" },
          description: { type: "string" },
          price: { type: "number" },
          category: { type: "string" },
          images: { type: "array" },
        },
        required_params: ["name", "description", "price"],
        requires_confirmation: true,
        handler_type: "api",
        handler_endpoint: "/api/marketplace/products/create",
      },
      {
        function_name: "update_product",
        display_name: "Update Product",
        description: "Update an existing product",
        icon: "✏️",
        product_slug: "marketplace",
        category: "productivity",
        parameters_schema: {
          productId: { type: "string" },
          updates: { type: "object" },
        },
        required_params: ["productId", "updates"],
        requires_confirmation: false,
        handler_type: "api",
        handler_endpoint: "/api/marketplace/products/update",
      },
      {
        function_name: "create_funnel",
        display_name: "Create Funnel",
        description: "Create a new conversion funnel in Studio",
        icon: "🎯",
        product_slug: "studio",
        category: "productivity",
        parameters_schema: {
          name: { type: "string" },
          description: { type: "string" },
          stages: { type: "array" },
        },
        required_params: ["name", "stages"],
        requires_confirmation: false,
        handler_type: "api",
        handler_endpoint: "/api/studio/funnels/create",
      },
      {
        function_name: "get_funnel_metrics",
        display_name: "Get Funnel Metrics",
        description: "Retrieve conversion metrics for a funnel",
        icon: "📊",
        product_slug: "studio",
        category: "analytics",
        parameters_schema: {
          funnelId: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string" },
        },
        required_params: ["funnelId"],
        requires_confirmation: false,
        handler_type: "api",
        handler_endpoint: "/api/studio/funnels/metrics",
      },
      {
        function_name: "invite_team_member",
        display_name: "Invite Team Member",
        description: "Invite a new team member to workspace",
        icon: "👥",
        product_slug: "platform",
        category: "productivity",
        parameters_schema: {
          email: { type: "string" },
          role: { type: "string", enum: ["member", "admin"] },
          message: { type: "string" },
        },
        required_params: ["email", "role"],
        requires_confirmation: true,
        required_roles: ["admin"],
        handler_type: "api",
        handler_endpoint: "/api/workspaces/invite",
      },
      {
        function_name: "get_workspace_usage",
        display_name: "Get Workspace Usage",
        description: "Retrieve current workspace usage stats",
        icon: "💎",
        product_slug: "platform",
        category: "analytics",
        parameters_schema: {
          metric: {
            type: "string",
            enum: ["tokens", "messages", "storage", "all"],
          },
        },
        required_params: [],
        requires_confirmation: false,
        handler_type: "api",
        handler_endpoint: "/api/workspaces/usage",
      },
      {
        function_name: "create_workspace_note",
        display_name: "Create Workspace Note",
        description: "Create a shared note for the workspace",
        icon: "📝",
        product_slug: "platform",
        category: "productivity",
        parameters_schema: {
          title: { type: "string" },
          content: { type: "string" },
          tags: { type: "array" },
          pinned: { type: "boolean" },
        },
        required_params: ["title", "content"],
        requires_confirmation: false,
        handler_type: "direct",
        handler_endpoint: null,
      },
      {
        function_name: "generate_report",
        display_name: "Generate Report",
        description: "Generate a comprehensive report for specified metrics",
        icon: "📑",
        product_slug: "helper",
        category: "analytics",
        parameters_schema: {
          reportType: {
            type: "string",
            enum: ["daily", "weekly", "monthly", "custom"],
          },
          metrics: { type: "array" },
          format: { type: "string", enum: ["summary", "detailed"] },
          startDate: { type: "string" },
          endDate: { type: "string" },
        },
        required_params: ["reportType", "metrics"],
        requires_confirmation: false,
        handler_type: "direct",
        handler_endpoint: null,
      },
      {
        function_name: "get_ai_insights",
        display_name: "Get AI Insights",
        description: "Get AI-generated insights from workspace data",
        icon: "🧠",
        product_slug: "helper",
        category: "analytics",
        parameters_schema: {
          dataSource: {
            type: "string",
            enum: ["conversations", "contacts", "sales", "all"],
          },
          period: { type: "string" },
          focusArea: { type: "string" },
        },
        required_params: ["dataSource"],
        requires_confirmation: false,
        handler_type: "direct",
        handler_endpoint: null,
      },
      {
        function_name: "schedule_message",
        display_name: "Schedule Message",
        description: "Schedule a WhatsApp message for later delivery",
        icon: "⏰",
        product_slug: "meta-hub",
        category: "messaging",
        parameters_schema: {
          contactId: { type: "string" },
          message: { type: "string" },
          scheduledFor: { type: "string" },
          timezone: { type: "string" },
        },
        required_params: ["contactId", "message", "scheduledFor"],
        requires_confirmation: false,
        handler_type: "api",
        handler_endpoint: "/api/meta/messages/schedule",
      },
      {
        function_name: "create_reminder",
        display_name: "Create Reminder",
        description: "Create a reminder for follow-up action",
        icon: "⏰",
        product_slug: "helper",
        category: "productivity",
        parameters_schema: {
          title: { type: "string" },
          description: { type: "string" },
          dueAt: { type: "string" },
          relatedTo: { type: "object" },
        },
        required_params: ["title", "dueAt"],
        requires_confirmation: false,
        handler_type: "direct",
        handler_endpoint: null,
      },
    ];

    console.log(`➕ Inserting ${newFunctions.length} new functions...\n`);

    for (const fn of newFunctions) {
      const { error } = await supabase.from("helper_functions").upsert(fn, {
        onConflict: "function_name",
      });

      if (error) {
        console.error(`  ❌ ${fn.function_name}:`, error.message);
      } else {
        console.log(`  ✓ ${fn.function_name}`);
      }
    }

    const { count: afterCount, data: functions } = await supabase
      .from("helper_functions")
      .select("function_name, product_slug, category", { count: "exact" });

    console.log(`\n✅ Total functions: ${afterCount || 0}\n`);

    if (functions) {
      const byProduct = functions.reduce((acc, fn) => {
        acc[fn.product_slug] = (acc[fn.product_slug] || 0) + 1;
        return acc;
      }, {});

      console.log("📦 Functions by product:");
      Object.entries(byProduct)
        .sort(([, a], [, b]) => b - a)
        .forEach(([product, count]) => {
          console.log(`  - ${product}: ${count} functions`);
        });

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
    }

    console.log("\n✅ Phase 2.2 completed successfully!");
  } catch (error) {
    console.error("❌ Failed:", error);
    process.exit(1);
  }
}

main();
