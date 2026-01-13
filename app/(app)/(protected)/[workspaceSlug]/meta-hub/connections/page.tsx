import { redirect } from "next/navigation";
import { WhatsappConnectionForm } from "@/components/meta-hub/WhatsappConnectionForm";
import { WhatsappEmbeddedSignup } from "@/components/meta-hub/WhatsappEmbeddedSignup";
import { getAppContext } from "@/lib/app-context";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Props = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function MetaHubConnectionsPage({ params }: Props) {
  const { workspaceSlug } = await params;
  const ctx = await getAppContext(workspaceSlug);
  if (!ctx.user) redirect("/login");
  if (!ctx.currentWorkspace) redirect("/onboarding");

  const workspaceId = ctx.currentWorkspace.id;
  const canEdit = ["owner", "admin"].includes(ctx.currentRole ?? "");

  const db = supabaseAdmin();
  const { data: phone } = await db
    .from("wa_phone_numbers")
    .select("phone_number_id, waba_id, display_name, status, last_tested_at, last_test_result")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .maybeSingle();

  const { data: tokenRow } = await db
    .from("meta_tokens")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("provider", "meta_whatsapp")
    .maybeSingle();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Connections</h2>
        <p className="text-sm text-muted-foreground">
          Simpan kredensial WhatsApp dengan aman. Token tidak akan pernah ditampilkan kembali di
          browser.
        </p>
      </div>

      <WhatsappEmbeddedSignup workspaceSlug={workspaceSlug} canEdit={canEdit} />

      <div className="rounded-2xl border border-border bg-card p-6">
        <WhatsappConnectionForm
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
          canEdit={canEdit}
          initialPhoneNumberId={phone?.phone_number_id ?? null}
          initialWabaId={phone?.waba_id ?? null}
          initialDisplayName={phone?.display_name ?? null}
          status={phone?.status ?? null}
          lastTestedAt={phone?.last_tested_at ?? null}
          lastTestResult={phone?.last_test_result ?? null}
          tokenSet={Boolean(tokenRow)}
        />
        {!canEdit ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Hanya owner atau admin yang dapat memperbarui koneksi. Anda tetap dapat melihat status.
          </p>
        ) : null}
      </div>
    </div>
  );
}

