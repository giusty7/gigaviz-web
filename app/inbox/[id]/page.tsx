import InboxApp from "@/components/inbox/InboxApp";

export default function InboxDetailPage({ params }: { params: { id: string } }) {
  return <InboxApp selectedId={params.id} />;
}
