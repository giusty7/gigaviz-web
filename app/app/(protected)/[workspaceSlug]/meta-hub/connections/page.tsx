export default function MetaHubConnectionsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Connections</h2>
        <p className="text-sm text-muted-foreground">
          Kelola koneksi Meta. Integrasi akan tersedia bertahap.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Daftar koneksi</p>
          <button
            type="button"
            disabled
            className="rounded-lg border border-border bg-gigaviz-surface px-4 py-2 text-sm font-semibold text-muted-foreground disabled:opacity-60"
          >
            Connect (coming soon)
          </button>
        </div>
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background px-6 py-10 text-center">
          <p className="text-sm font-semibold text-foreground">Belum ada koneksi</p>
          <p className="text-sm text-muted-foreground mt-1">
            WhatsApp dan kanal lain akan muncul di sini setelah konfigurasi.
          </p>
        </div>
      </div>
    </div>
  );
}
