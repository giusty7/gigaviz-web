import AcceptInviteClient from "@/components/invite/AcceptInviteClient";

type InvitePageProps =
  | { params: { token: string } }
  | { params: Promise<{ token: string }> };

export default async function InvitePage({ params }: InvitePageProps) {
  const resolved = await Promise.resolve(params);
  const token = resolved?.token ?? "";

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Accept invitation</h1>
        <p className="text-sm text-gigaviz-muted">
          Continue to join the workspace.
        </p>
      </div>
      <AcceptInviteClient token={token} />
    </div>
  );
}
