import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ParamDefsClient } from "@/components/meta-hub/ParamDefsClient";
import { getAppContext } from "@/lib/app-context";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metaHub");
  return {
    title: `${t("paramDefsTitle")} | Meta Hub`,
    description: t("paramDefsDesc"),
  };
}

type Props = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ templateId?: string }>;
};

export const dynamic = "force-dynamic";

export default async function ParamDefsPage({ params, searchParams }: Props) {
  const { workspaceSlug } = await params;
  const { templateId } = await searchParams;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspaceId = ctx.currentWorkspace.id;

  if (!templateId) {
    // Show template selector
    const { data: templates } = await supabaseAdmin()
      .from("wa_templates")
      .select("id, name, language, category, variable_count, status")
      .eq("workspace_id", workspaceId)
      .gt("variable_count", 0)
      .eq("status", "APPROVED")
      .order("name");

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card/80 p-6 shadow-sm">
          <div className="mb-6 space-y-2">
            <h2 className="text-2xl font-semibold">Parameter Mapping Definitions</h2>
            <p className="text-sm text-muted-foreground">
              Define how template parameters should be populated from contact data or global values.
            </p>
          </div>

          {!templates || templates.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No templates with parameters found. Sync templates first.
              </p>
              <Link
                href={`/${workspaceSlug}/meta-hub/messaging/whatsapp`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gigaviz-gold hover:underline"
              >
                Back to Templates
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select a template to configure parameter mappings:
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <Link
                    key={template.id}
                    href={`/${workspaceSlug}/meta-hub/messaging/whatsapp/param-defs?templateId=${template.id}`}
                    className="rounded-lg border border-border bg-background p-4 transition hover:border-gigaviz-gold hover:shadow-md"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground">{template.name}</h3>
                        <span className="shrink-0 rounded-full bg-gigaviz-gold/10 px-2 py-0.5 text-xs font-semibold text-gigaviz-gold">
                          {template.variable_count} params
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">{template.category?.toLowerCase()}</span>
                        <span>•</span>
                        <span className="uppercase">{template.language}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fetch template and its param defs
  const { data: template } = await supabaseAdmin()
    .from("wa_templates")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", templateId)
    .single();

  if (!template) {
    redirect(`/${workspaceSlug}/meta-hub/messaging/whatsapp/param-defs`);
  }

  const { data: paramDefs } = await supabaseAdmin()
    .from("wa_template_param_defs")
    .select("*")
    .eq("template_id", templateId)
    .order("param_index");

  return <ParamDefsClient workspaceSlug={workspaceSlug} template={template} paramDefs={paramDefs ?? []} />;
}
