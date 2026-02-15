/**
 * CSS-only product preview mockups for product marketing pages.
 * Renders a stylized browser frame with a simplified UI representation
 * of each product — no external images needed.
 */

type ProductKey =
  | "meta_hub"
  | "platform"
  | "helper"
  | "studio"
  | "office"
  | "apps"
  | "marketplace";

type ProductPreviewProps = {
  product: ProductKey;
  className?: string;
};

/* ── Browser Frame Shell ─────────────────────────────────────── */
function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[color:var(--gv-border)] bg-[#0c1424] shadow-2xl">
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-[color:var(--gv-border)] bg-[#0a1020] px-3 py-2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
        </div>
        <div className="ml-2 flex-1 rounded-md bg-[#151e30] px-3 py-1 text-[10px] text-[#f5f5dc]/30">
          app.gigaviz.com
        </div>
      </div>
      {/* Content area */}
      <div className="relative min-h-[220px] p-3">{children}</div>
    </div>
  );
}

/* ── Shared small primitives ────────────────────────────────── */
function Pill({ children, color = "gold" }: { children: React.ReactNode; color?: "gold" | "green" | "blue" | "pink" | "purple" }) {
  const colorMap = {
    gold: "border-[#d4af37]/30 bg-[#d4af37]/10 text-[#d4af37]",
    green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    blue: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
    pink: "border-pink-500/30 bg-pink-500/10 text-pink-400",
    purple: "border-violet-500/30 bg-violet-500/10 text-violet-400",
  };
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-medium ${colorMap[color]}`}>
      {children}
    </span>
  );
}

function Bar({ width, color = "#d4af37" }: { width: string; color?: string }) {
  return (
    <div className="h-1.5 rounded-full bg-[#1a2540]">
      <div className="h-full rounded-full" style={{ width, backgroundColor: color, opacity: 0.7 }} />
    </div>
  );
}

/* ── Product-Specific Mockups ───────────────────────────────── */

function MetaHubPreview() {
  return (
    <div className="flex gap-2 text-[10px]">
      {/* Sidebar - Threads */}
      <div className="w-[35%] space-y-1.5 rounded-lg bg-[#111b2e] p-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[#f5f5dc]/80">Inbox</span>
          <Pill color="green">3 new</Pill>
        </div>
        {[
          { name: "Ahmad R.", msg: "Terima kasih sudah...", time: "2m" },
          { name: "Sarah L.", msg: "Kapan ya jadwal...", time: "15m" },
          { name: "Budi P.", msg: "Oke saya konfirmasi", time: "1h" },
        ].map((t) => (
          <div key={t.name} className="rounded-md bg-[#0c1424] p-1.5">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#f5f5dc]/70">{t.name}</span>
              <span className="text-[8px] text-[#f5f5dc]/30">{t.time}</span>
            </div>
            <span className="text-[8px] text-[#f5f5dc]/40 line-clamp-1">{t.msg}</span>
          </div>
        ))}
      </div>
      {/* Chat area */}
      <div className="flex-1 space-y-1.5 rounded-lg bg-[#111b2e] p-2">
        <div className="flex items-center justify-between border-b border-[#1a2540] pb-1">
          <span className="font-semibold text-[#f5f5dc]/80">Ahmad R.</span>
          <div className="flex gap-1">
            <Pill color="green">WhatsApp</Pill>
            <Pill color="gold">Assigned</Pill>
          </div>
        </div>
        {/* Messages */}
        <div className="space-y-1">
          <div className="ml-auto max-w-[75%] rounded-lg bg-[#d4af37]/15 p-1.5 text-[#f5f5dc]/60">
            Selamat siang, ada yang bisa dibantu?
          </div>
          <div className="max-w-[75%] rounded-lg bg-[#1a2540] p-1.5 text-[#f5f5dc]/60">
            Terima kasih sudah menghubungi! 🙏
          </div>
          <div className="ml-auto max-w-[75%] rounded-lg bg-[#d4af37]/15 p-1.5 text-[#f5f5dc]/60">
            Baik, saya bantu proseskan ya
          </div>
        </div>
        {/* Input */}
        <div className="flex gap-1 rounded-md bg-[#0c1424] p-1">
          <div className="flex-1 rounded bg-[#1a2540] px-2 py-1 text-[8px] text-[#f5f5dc]/30">
            Type a message...
          </div>
          <div className="grid h-5 w-5 place-items-center rounded bg-[#d4af37]/20 text-[8px] text-[#d4af37]">
            ▶
          </div>
        </div>
      </div>
    </div>
  );
}

function PlatformPreview() {
  return (
    <div className="space-y-2 text-[10px]">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-[#f5f5dc]/80">Workspace Dashboard</span>
        <div className="flex gap-1.5">
          <Pill color="gold">Owner</Pill>
          <Pill color="green">Active</Pill>
        </div>
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: "Members", value: "12", color: "#d4af37" },
          { label: "Modules", value: "6", color: "#10b981" },
          { label: "Tokens", value: "48.2K", color: "#06b6d4" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-[#111b2e] p-2 text-center">
            <div className="text-sm font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[8px] text-[#f5f5dc]/40">{s.label}</div>
          </div>
        ))}
      </div>
      {/* Team members */}
      <div className="rounded-lg bg-[#111b2e] p-2">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="font-medium text-[#f5f5dc]/70">Team Members</span>
          <span className="text-[8px] text-[#d4af37]">Manage →</span>
        </div>
        {[
          { name: "You", role: "Owner", active: true },
          { name: "Sarah L.", role: "Admin", active: true },
          { name: "Budi P.", role: "Member", active: false },
        ].map((m) => (
          <div key={m.name} className="flex items-center justify-between border-t border-[#1a2540] py-1">
            <div className="flex items-center gap-1.5">
              <div className={`h-4 w-4 rounded-full ${m.active ? "bg-emerald-500/30" : "bg-[#1a2540]"}`}>
                <div className={`m-auto mt-0.5 h-3 w-3 rounded-full ${m.active ? "bg-emerald-500/50" : "bg-[#1a2540]"}`} />
              </div>
              <span className="text-[#f5f5dc]/60">{m.name}</span>
            </div>
            <Pill color={m.role === "Owner" ? "gold" : m.role === "Admin" ? "blue" : "purple"}>{m.role}</Pill>
          </div>
        ))}
      </div>
      {/* Audit log */}
      <div className="rounded-lg bg-[#111b2e] p-2">
        <span className="font-medium text-[#f5f5dc]/70">Recent Audit</span>
        <div className="mt-1 space-y-0.5 text-[8px] text-[#f5f5dc]/40">
          <div>✓ workspace.settings.update — 2m ago</div>
          <div>✓ member.invite.sent — 15m ago</div>
          <div>✓ subscription.upgraded — 1h ago</div>
        </div>
      </div>
    </div>
  );
}

function HelperPreview() {
  return (
    <div className="space-y-2 text-[10px]">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-[#f5f5dc]/80">AI Assistant</span>
        <Pill color="pink">Helper AI</Pill>
      </div>
      {/* Chat area */}
      <div className="space-y-1.5 rounded-lg bg-[#111b2e] p-2">
        <div className="max-w-[80%] rounded-lg bg-[#1a2540] p-1.5 text-[#f5f5dc]/60">
          <div className="mb-0.5 text-[8px] font-medium text-cyan-400">You</div>
          Buatkan reply untuk customer yang tanya soal harga
        </div>
        <div className="ml-auto max-w-[85%] rounded-lg bg-[#e11d48]/10 border border-[#e11d48]/20 p-1.5 text-[#f5f5dc]/60">
          <div className="mb-0.5 text-[8px] font-medium text-[#e11d48]">Helper AI</div>
          <div>Berikut draft reply-nya:</div>
          <div className="mt-1 rounded bg-[#0c1424] p-1 text-[8px] text-[#f5f5dc]/50 italic">
            &ldquo;Terima kasih sudah menghubungi! 😊 Untuk info harga lengkap, silakan kunjungi gigaviz.com/pricing atau saya bisa jelaskan langsung. Mau yang mana?&rdquo;
          </div>
        </div>
        <div className="flex gap-1">
          <button className="rounded bg-emerald-500/15 px-2 py-0.5 text-[8px] text-emerald-400">✓ Use this</button>
          <button className="rounded bg-[#1a2540] px-2 py-0.5 text-[8px] text-[#f5f5dc]/40">↻ Regenerate</button>
          <button className="rounded bg-[#1a2540] px-2 py-0.5 text-[8px] text-[#f5f5dc]/40">✎ Edit</button>
        </div>
      </div>
      {/* Knowledge base */}
      <div className="rounded-lg bg-[#111b2e] p-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-[#f5f5dc]/70">Knowledge Base</span>
          <Pill color="blue">3 sources</Pill>
        </div>
        <div className="mt-1 space-y-0.5 text-[8px] text-[#f5f5dc]/40">
          <div>📄 product-catalog.pdf — indexed</div>
          <div>🌐 gigaviz.com/pricing — indexed</div>
          <div>📝 FAQ-responses.docx — indexed</div>
        </div>
      </div>
    </div>
  );
}

function StudioPreview() {
  return (
    <div className="space-y-2 text-[10px]">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-[#f5f5dc]/80">Creative Studio</span>
        <div className="flex gap-1">
          <Pill color="purple">Office</Pill>
          <Pill color="blue">Graph</Pill>
          <Pill color="gold">Tracks</Pill>
        </div>
      </div>
      {/* Module cards */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded-lg bg-[#111b2e] p-2 text-center">
          <div className="text-lg">📄</div>
          <div className="text-[8px] font-medium text-violet-400">Office</div>
          <div className="text-[8px] text-[#f5f5dc]/40">Docs & Templates</div>
        </div>
        <div className="rounded-lg bg-[#111b2e] p-2 text-center">
          <div className="text-lg">📊</div>
          <div className="text-[8px] font-medium text-cyan-400">Graph</div>
          <div className="text-[8px] text-[#f5f5dc]/40">Data Viz</div>
        </div>
        <div className="rounded-lg bg-[#111b2e] p-2 text-center">
          <div className="text-lg">🗂️</div>
          <div className="text-[8px] font-medium text-[#d4af37]">Tracks</div>
          <div className="text-[8px] text-[#f5f5dc]/40">Projects</div>
        </div>
      </div>
      {/* Recent activity */}
      <div className="rounded-lg bg-[#111b2e] p-2">
        <span className="font-medium text-[#f5f5dc]/70">Recent Projects</span>
        <div className="mt-1 space-y-1">
          {[
            { name: "Campaign Brief Q1", type: "Office", progress: "85%" },
            { name: "Revenue Dashboard", type: "Graph", progress: "100%" },
            { name: "Product Launch", type: "Tracks", progress: "42%" },
          ].map((p) => (
            <div key={p.name} className="flex items-center justify-between">
              <span className="text-[#f5f5dc]/60">{p.name}</span>
              <span className="text-[8px] text-[#f5f5dc]/40">{p.progress}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Bar chart mockup */}
      <div className="rounded-lg bg-[#111b2e] p-2">
        <span className="font-medium text-[#f5f5dc]/70">Performance</span>
        <div className="mt-1.5 space-y-1">
          <Bar width="85%" color="#8b5cf6" />
          <Bar width="100%" color="#06b6d4" />
          <Bar width="42%" color="#d4af37" />
        </div>
      </div>
    </div>
  );
}

function OfficePreview() {
  return (
    <div className="space-y-2 text-[10px]">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-[#f5f5dc]/80">Office Suite</span>
        <Pill color="purple">Templates</Pill>
      </div>
      <div className="rounded-lg bg-[#111b2e] p-2">
        <div className="mb-1 text-[8px] font-medium text-violet-400">Document Editor</div>
        <div className="space-y-1 rounded bg-[#0c1424] p-2">
          <div className="h-2 w-3/4 rounded bg-[#f5f5dc]/10" />
          <div className="h-2 w-full rounded bg-[#f5f5dc]/5" />
          <div className="h-2 w-5/6 rounded bg-[#f5f5dc]/5" />
          <div className="h-2 w-2/3 rounded bg-[#f5f5dc]/5" />
          <div className="mt-2 h-2 w-1/2 rounded bg-[#f5f5dc]/10" />
          <div className="h-2 w-full rounded bg-[#f5f5dc]/5" />
          <div className="h-2 w-3/4 rounded bg-[#f5f5dc]/5" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="rounded-lg bg-[#111b2e] p-2 text-center">
          <div className="text-sm font-bold text-violet-400">12</div>
          <div className="text-[8px] text-[#f5f5dc]/40">Templates</div>
        </div>
        <div className="rounded-lg bg-[#111b2e] p-2 text-center">
          <div className="text-sm font-bold text-[#d4af37]">8</div>
          <div className="text-[8px] text-[#f5f5dc]/40">Documents</div>
        </div>
      </div>
    </div>
  );
}

function AppsPreview() {
  return (
    <div className="space-y-2 text-[10px]">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-[#f5f5dc]/80">App Catalog</span>
        <Pill color="blue">12 apps</Pill>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { name: "Slack", icon: "💬", status: "Connected" },
          { name: "Sheets", icon: "📊", status: "Connected" },
          { name: "Zapier", icon: "⚡", status: "Available" },
          { name: "HubSpot", icon: "🎯", status: "Available" },
        ].map((a) => (
          <div key={a.name} className="flex items-center gap-1.5 rounded-lg bg-[#111b2e] p-2">
            <span className="text-sm">{a.icon}</span>
            <div>
              <div className="font-medium text-[#f5f5dc]/70">{a.name}</div>
              <Pill color={a.status === "Connected" ? "green" : "gold"}>{a.status}</Pill>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-[#111b2e] p-2">
        <span className="font-medium text-[#f5f5dc]/70">App Requests</span>
        <div className="mt-1 space-y-0.5 text-[8px] text-[#f5f5dc]/40">
          <div>📌 Notion integration — 24 votes</div>
          <div>📌 Calendly sync — 18 votes</div>
          <div>📌 Mailchimp — 12 votes</div>
        </div>
      </div>
    </div>
  );
}

function MarketplacePreview() {
  return (
    <div className="space-y-2 text-[10px]">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-[#f5f5dc]/80">Marketplace</span>
        <Pill color="gold">Featured</Pill>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { name: "WA E-commerce Kit", price: "Rp 49K", sales: "230+" },
          { name: "AI Reply Templates", price: "Free", sales: "1.2K+" },
          { name: "CRM Workflow Pack", price: "Rp 99K", sales: "89" },
          { name: "Broadcast Bundle", price: "Rp 29K", sales: "456" },
        ].map((item) => (
          <div key={item.name} className="rounded-lg bg-[#111b2e] p-2">
            <div className="mb-1 h-8 rounded bg-gradient-to-br from-[#d4af37]/10 to-[#e11d48]/10" />
            <div className="font-medium text-[#f5f5dc]/70 text-[9px]">{item.name}</div>
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-bold text-[#d4af37]">{item.price}</span>
              <span className="text-[8px] text-[#f5f5dc]/30">{item.sales} sold</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Exported Preview Map ───────────────────────────────────── */

const previewMap: Record<ProductKey, () => React.JSX.Element> = {
  meta_hub: MetaHubPreview,
  platform: PlatformPreview,
  helper: HelperPreview,
  studio: StudioPreview,
  office: OfficePreview,
  apps: AppsPreview,
  marketplace: MarketplacePreview,
};

export function ProductPreview({ product, className = "" }: ProductPreviewProps) {
  const PreviewContent = previewMap[product];
  if (!PreviewContent) return null;

  return (
    <div className={className}>
      <BrowserFrame>
        <PreviewContent />
      </BrowserFrame>
    </div>
  );
}
