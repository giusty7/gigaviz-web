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
});

async function main() {
  console.log("🌱 Seeding Helper data...\n");

  try {
    // Seed AI Modes
    console.log("📦 Seeding AI modes...");
    const modes = [
      {
        mode_slug: "chat",
        display_name: "Chat",
        description: "General conversation and assistance",
        icon: "💬",
        system_prompt_template:
          "You are a helpful AI assistant. Provide clear, concise, and accurate responses.",
        capabilities: [],
        is_active: true,
      },
      {
        mode_slug: "copy",
        display_name: "Copywriting",
        description: "Generate marketing copy and content",
        icon: "✍️",
        system_prompt_template:
          "You are an expert copywriter. Create compelling, engaging content that drives action.",
        capabilities: [],
        is_active: true,
      },
      {
        mode_slug: "summary",
        display_name: "Summarize",
        description: "Summarize long content into key points",
        icon: "📝",
        system_prompt_template:
          "You are a summarization expert. Extract key points and present them clearly and concisely.",
        capabilities: [],
        is_active: true,
      },
      {
        mode_slug: "vision",
        display_name: "Image Analysis",
        description: "Analyze and describe images in detail",
        icon: "👁️",
        system_prompt_template:
          "You are an expert in visual analysis. Describe images accurately and extract relevant information.",
        capabilities: ["vision"],
        is_active: true,
      },
      {
        mode_slug: "document",
        display_name: "Document Analysis",
        description: "Extract and analyze information from documents",
        icon: "📄",
        system_prompt_template:
          "You are a document analysis expert. Extract structured information and provide insights.",
        capabilities: ["document"],
        is_active: true,
      },
      {
        mode_slug: "code",
        display_name: "Code Assistant",
        description: "Help with programming and technical tasks",
        icon: "💻",
        system_prompt_template:
          "You are an expert programmer. Provide clean, efficient code with clear explanations.",
        capabilities: ["code"],
        is_active: true,
      },
      {
        mode_slug: "research",
        display_name: "Research Mode",
        description: "Multi-step research with comprehensive analysis",
        icon: "🔬",
        system_prompt_template:
          "You are a research assistant. Conduct thorough analysis and provide well-researched answers with sources.",
        capabilities: ["research"],
        is_active: true,
      },
      {
        mode_slug: "analyst",
        display_name: "Data Analysis",
        description: "Analyze data and generate insights",
        icon: "📊",
        system_prompt_template:
          "You are a data analyst. Identify patterns, trends, and actionable insights from data.",
        capabilities: ["analysis"],
        is_active: true,
      },
    ];

    for (const mode of modes) {
      const { error } = await supabase
        .from("helper_modes")
        .upsert(mode, { onConflict: "mode_slug" });

      if (error) {
        console.log(`  ❌ ${mode.mode_slug}: ${error.message}`);
      } else {
        console.log(`  ✓ ${mode.mode_slug}`);
      }
    }

    const { count: modesCount } = await supabase
      .from("helper_modes")
      .select("*", { count: "exact", head: true });

    console.log(`\n✅ ${modesCount} AI modes seeded\n`);

    // Seed Templates (workspace-independent, public templates)
    console.log("📦 Seeding conversation templates...");
    
    // Get first workspace for templates
    const { data: workspaces } = await supabase
      .from("workspaces")
      .select("id")
      .limit(1);

    if (workspaces && workspaces.length > 0) {
      const workspaceId = workspaces[0].id;
      
      const templates = [
        {
          workspace_id: workspaceId,
          name: "Sales Outreach",
          description: "Generate personalized sales messages",
          icon: "💼",
          category: "sales",
          initial_messages: [
            {
              role: "user",
              content:
                "Help me create a personalized outreach message for a potential client in the {industry} industry. Their pain points are: {pain_points}",
            },
          ],
          suggested_mode: "copy",
          visibility: "public",
        },
        {
          workspace_id: workspaceId,
          name: "Customer Support",
          description: "Draft helpful support responses",
          icon: "🎧",
          category: "support",
          initial_messages: [
            {
              role: "user",
              content:
                "A customer is asking about: {issue}. Help me draft a helpful and empathetic response.",
            },
          ],
          suggested_mode: "chat",
          visibility: "public",
        },
        {
          workspace_id: workspaceId,
          name: "Content Research",
          description: "Research topics and generate insights",
          icon: "🔍",
          category: "research",
          initial_messages: [
            {
              role: "user",
              content:
                "I need to research {topic}. Please provide key insights, statistics, and actionable information.",
            },
          ],
          suggested_mode: "research",
          visibility: "public",
        },
        {
          workspace_id: workspaceId,
          name: "Data Analysis",
          description: "Analyze data and generate reports",
          icon: "📊",
          category: "analytics",
          initial_messages: [
            {
              role: "user",
              content: "Analyze this data and provide insights: {data_description}",
            },
          ],
          suggested_mode: "analyst",
          visibility: "public",
        },
        {
          workspace_id: workspaceId,
          name: "Meeting Summary",
          description: "Summarize meeting notes",
          icon: "📝",
          category: "productivity",
          initial_messages: [
            {
              role: "user",
              content:
                "Summarize these meeting notes into key points, action items, and decisions: {notes}",
            },
          ],
          suggested_mode: "summary",
          visibility: "public",
        },
      ];

      for (const template of templates) {
        const { error } = await supabase.from("helper_templates").insert(template);

        if (error && !error.message.includes("duplicate")) {
          console.log(`  ❌ ${template.name}: ${error.message}`);
        } else {
          console.log(`  ✓ ${template.name}`);
        }
      }
    }

    const { count: templatesCount } = await supabase
      .from("helper_templates")
      .select("*", { count: "exact", head: true });

    console.log(`\n✅ ${templatesCount || 0} templates seeded\n`);

    // Seed Workflow Templates
    console.log("📦 Seeding workflow templates...");

    if (workspaces && workspaces.length > 0) {
      const workspaceId = workspaces[0].id;

      const workflows = [
        {
          workspace_id: workspaceId,
          name: "Daily Engagement Report",
          description: "Get daily WhatsApp engagement metrics every morning",
          icon: "📊",
          category: "reporting",
          trigger_type: "schedule",
          trigger_config: {
            cron: "0 9 * * *",
            timezone: "Asia/Jakarta",
          },
          steps: [
            {
              step: 1,
              function: "get_conversation_analytics",
              params: { startDate: "yesterday", endDate: "today" },
              output_var: "analytics",
            },
            {
              step: 2,
              function: "generate_report",
              params: {
                reportType: "daily",
                metrics: ["conversations", "messages", "response_time"],
              },
              output_var: "report",
            },
            {
              step: 3,
              function: "create_workspace_note",
              params: {
                title: "Daily Engagement Report",
                content: "{{report}}",
                pinned: true,
              },
            },
          ],
          is_template: true,
          is_enabled: false,
        },
        {
          workspace_id: workspaceId,
          name: "Auto-tag New Messages",
          description: "Automatically tag incoming WhatsApp messages based on content",
          icon: "🏷️",
          category: "automation",
          trigger_type: "event",
          trigger_config: {
            event_type: "wa_message_received",
          },
          steps: [
            {
              step: 1,
              function: "get_ai_insights",
              params: {
                dataSource: "conversations",
                focusArea: "sentiment",
              },
              output_var: "analysis",
            },
            {
              step: 2,
              function: "tag_conversation",
              params: {
                conversationId: "{{event.conversation_id}}",
                tags: "{{analysis.suggested_tags}}",
              },
            },
          ],
          is_template: true,
          is_enabled: false,
        },
        {
          workspace_id: workspaceId,
          name: "Weekly Team Summary",
          description: "Send weekly performance summary to team every Monday",
          icon: "📧",
          category: "reporting",
          trigger_type: "schedule",
          trigger_config: {
            cron: "0 9 * * 1",
            timezone: "Asia/Jakarta",
          },
          steps: [
            {
              step: 1,
              function: "get_conversation_analytics",
              params: {
                startDate: "last_week",
                endDate: "today",
                groupBy: "week",
              },
              output_var: "week_analytics",
            },
            {
              step: 2,
              function: "get_workspace_usage",
              params: { metric: "all" },
              output_var: "usage",
            },
            {
              step: 3,
              function: "generate_report",
              params: {
                reportType: "weekly",
                metrics: ["{{week_analytics}}", "{{usage}}"],
                format: "detailed",
              },
              output_var: "summary",
            },
            {
              step: 4,
              function: "create_workspace_note",
              params: {
                title: "Weekly Team Summary",
                content: "{{summary}}",
                tags: ["weekly", "report"],
                pinned: true,
              },
            },
          ],
          is_template: true,
          is_enabled: false,
        },
      ];

      for (const workflow of workflows) {
        const { error } = await supabase.from("helper_workflows").insert(workflow);

        if (error && !error.message.includes("duplicate")) {
          console.log(`  ❌ ${workflow.name}: ${error.message}`);
        } else {
          console.log(`  ✓ ${workflow.name}`);
        }
      }
    }

    const { count: workflowsCount } = await supabase
      .from("helper_workflows")
      .select("*", { count: "exact", head: true });

    console.log(`\n✅ ${workflowsCount || 0} workflow templates seeded\n`);

    // Seed Analytics Jobs
    console.log("📦 Seeding analytics jobs...");

    const jobs = [
      {
        job_name: "refresh_analytics_views",
        job_type: "refresh_materialized_views",
        schedule_cron: "0 */6 * * *",
        next_run_at: new Date().toISOString(),
      },
      {
        job_name: "calculate_daily_costs",
        job_type: "cost_calculation",
        schedule_cron: "0 1 * * *",
        next_run_at: new Date(Date.now() + 86400000).toISOString(),
      },
      {
        job_name: "cleanup_old_events",
        job_type: "cleanup",
        schedule_cron: "0 2 * * 0",
        next_run_at: new Date(Date.now() + 604800000).toISOString(),
      },
    ];

    for (const job of jobs) {
      const { error } = await supabase
        .from("helper_analytics_jobs")
        .upsert(job, { onConflict: "job_name" });

      if (error) {
        console.log(`  ❌ ${job.job_name}: ${error.message}`);
      } else {
        console.log(`  ✓ ${job.job_name}`);
      }
    }

    const { count: jobsCount } = await supabase
      .from("helper_analytics_jobs")
      .select("*", { count: "exact", head: true });

    console.log(`\n✅ ${jobsCount} analytics jobs seeded\n`);

    console.log("🎉 All data seeded successfully!\n");
    console.log("📊 Final Summary:");
    console.log(`  ✓ ${modesCount} AI modes`);
    console.log(`  ✓ ${templatesCount || 0} conversation templates`);
    console.log(`  ✓ ${workflowsCount || 0} workflow templates`);
    console.log(`  ✓ ${jobsCount} analytics jobs`);
    console.log("\n✨ Helper is ready to use!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

main();
