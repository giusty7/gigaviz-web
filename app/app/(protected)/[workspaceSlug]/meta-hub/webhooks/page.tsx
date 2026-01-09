export default function MetaHubWebhooksPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Webhooks</h2>
        <p className="text-sm text-muted-foreground">
          Event log akan muncul di sini setelah koneksi aktif.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background px-6 py-10 text-center">
          <p className="text-sm font-semibold text-foreground">Belum ada event</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tambah koneksi terlebih dahulu untuk mulai menerima webhook.
          </p>
        </div>
      </div>
    </div>
  );
}
