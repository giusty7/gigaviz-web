import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { supabaseServer } from "@/lib/supabase/server";
import { FileText, Plus, Folder } from "lucide-react";
import Link from "next/link";

type Template = {
  id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  usage_count: number;
};

type Document = {
  id: string;
  title: string;
  category: string;
  updated_at: string;
};

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export const dynamic = "force-dynamic";

export default async function OfficePage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const supabase = await supabaseServer();

  // Fetch templates
  const { data: templates } = await supabase
    .from("office_templates")
    .select("*")
    .eq("workspace_id", ctx.currentWorkspace.id)
    .order("usage_count", { ascending: false })
    .limit(10);

  // Fetch recent documents
  const { data: documents } = await supabase
    .from("office_documents")
    .select("id, title, category, updated_at")
    .eq("workspace_id", ctx.currentWorkspace.id)
    .order("updated_at", { ascending: false })
    .limit(10);

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gigaviz Office</h1>
          <p className="mt-2 text-muted-foreground">
            Document templates, formula assistant, and workflow automation
          </p>
        </div>
        <Link
          href={`/${workspaceSlug}/modules/office/new`}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Document
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <FileText className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{documents?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">Documents</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <Folder className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{templates?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">Templates</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <Plus className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">Beta</p>
              <p className="text-sm text-muted-foreground">Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Section */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Templates</h2>
        {templates && templates.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(templates as Template[]).map((template) => (
              <div
                key={template.id}
                className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-2 flex items-start justify-between">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {template.usage_count} uses
                  </span>
                </div>
                <h3 className="mb-2 font-semibold">{template.title}</h3>
                <div className="flex flex-wrap gap-1">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-muted px-2 py-0.5 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-12 text-center">
            <Folder className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No templates yet. Create your first template!
            </p>
          </div>
        )}
      </div>

      {/* Recent Documents */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Recent Documents</h2>
        {documents && documents.length > 0 ? (
          <div className="space-y-2">
            {(documents as Document[]).map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border bg-card p-4 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(doc.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs">
                  {doc.category}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No documents yet. Start creating!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
