import type { Metadata } from "next";

export type ProductStatus = "available" | "beta" | "coming";

export type Product = {
  slug: string;
  name: string;
  short: string;
  description: string;
  status: ProductStatus;
  icon: ProductIcon;
  categories: string[];
  features: string[];
  whoFor: string[];
  related: string[];
};

export type ProductIcon =
  | "platform"
  | "meta"
  | "helper"
  | "office"
  | "studio"
  | "marketplace"
  | "arena"
  | "apps"
  | "pay"
  | "community";

export const productStatusLabel: Record<ProductStatus, string> = {
  available: "Tersedia",
  beta: "Beta",
  coming: "Segera",
};

export const products: Product[] = [
  {
    slug: "platform",
    name: "Gigaviz Platform",
    short: "Core OS untuk akun, workspace, billing, peran, dan audit.",
    description:
      "Pusat kendali untuk seluruh ekosistem. Mulai dari autentikasi, struktur workspace, pengelolaan peran, sampai audit aktivitas tim.",
    status: "available",
    icon: "platform",
    categories: ["Core", "Security", "Billing"],
    features: [
      "Single sign-on dan pengaturan akun",
      "Workspace dan organisasi multi tim",
      "Role-based access control",
      "Billing, invoice, dan pengaturan subscription",
      "Audit trail untuk aktivitas penting",
    ],
    whoFor: [
      "Owner dan admin bisnis",
      "Tim ops yang butuh kontrol akses",
      "Perusahaan dengan multi unit",
    ],
    related: ["meta-hub", "pay", "apps"],
  },
  {
    slug: "meta-hub",
    name: "Gigaviz Meta Hub",
    short: "WhatsApp Cloud API hub: template, webhook, inbox, scheduler, dan analitik.",
    description:
      "Hub resmi untuk WhatsApp Cloud API. Mengelola template, webhook, inbox, scheduler, opt-in dan opt-out, serta laporan performa.",
    status: "beta",
    icon: "meta",
    categories: ["Messaging", "Automation"],
    features: [
      "Template dan approval flow",
      "Webhook untuk event dan status delivery",
      "Inbox multi agen",
      "Scheduler kampanye dan throttling aman",
      "Analitik dasar dan monitoring",
    ],
    whoFor: [
      "Tim CS dan marketing",
      "Operasional notifikasi dan broadcast",
      "Bisnis dengan kebutuhan compliance",
    ],
    related: ["platform", "helper", "apps"],
  },
  {
    slug: "helper",
    name: "Gigaviz Helper",
    short: "Asisten AI untuk chat, copy, rangkuman, dan riset ringan.",
    description:
      "Asisten AI yang membantu tim menyiapkan copy, merangkum laporan, dan mempercepat riset ringan untuk kebutuhan harian.",
    status: "beta",
    icon: "helper",
    categories: ["AI", "Productivity"],
    features: [
      "Generator copy dan prompt",
      "Rangkuman dokumen dan meeting",
      "Mode chat untuk ide cepat",
      "Integrasi ke workflow internal",
      "Kontrol penggunaan berbasis token",
    ],
    whoFor: [
      "Tim konten dan marketing",
      "Supervisor yang butuh ringkasan cepat",
      "Founder yang ingin brainstorming",
    ],
    related: ["office", "studio", "meta-hub"],
  },
  {
    slug: "office",
    name: "Gigaviz Office",
    short: "Template kerja, formula assistant, automasi workflow, dan generator dokumen.",
    description:
      "Kumpulan template kerja dan automasi sederhana untuk dokumen, dashboard, dan proses administrasi yang konsisten.",
    status: "beta",
    icon: "office",
    categories: ["Productivity", "Operations"],
    features: [
      "Template dokumen dan dashboard",
      "Formula assistant untuk spreadsheet",
      "Workflow automation untuk task rutin",
      "Generator SOP dan laporan",
      "Library template tim",
    ],
    whoFor: [
      "Tim operasional",
      "Admin dan finance",
      "PM yang butuh dokumentasi rapi",
    ],
    related: ["helper", "platform", "pay"],
  },
  {
    slug: "studio",
    name: "Gigaviz Studio",
    short: "Studio kreatif generatif untuk image, video, musik, dan asset library.",
    description:
      "Studio kreatif dengan tools generatif, asset library, prompt library, dan versioning untuk tim kreatif.",
    status: "beta",
    icon: "studio",
    categories: ["Creative", "AI"],
    features: [
      "Generative image, video, dan musik",
      "Asset library dan brand kit",
      "Prompt library dan template",
      "Versioning untuk review internal",
      "Export untuk kanal digital",
    ],
    whoFor: [
      "Tim kreatif dan brand",
      "UMKM yang butuh materi cepat",
      "Agency dan studio kecil",
    ],
    related: ["helper", "office", "marketplace"],
  },
  {
    slug: "marketplace",
    name: "Gigaviz Marketplace",
    short: "Tempat jual beli template, prompt pack, asset, dan mini-app.",
    description:
      "Marketplace untuk menjual dan membeli template Office, prompt pack Studio/Helper, asset kreatif, dan mini-app.",
    status: "beta",
    icon: "marketplace",
    categories: ["Commerce", "Marketplace"],
    features: [
      "Listing produk digital dengan katalog yang rapi",
      "Lisensi personal dan komersial",
      "Bundle dan paket promosi",
      "Discovery dan rekomendasi",
      "Payout dan komisi (bertahap)",
    ],
    whoFor: [
      "Creator dan studio kreatif",
      "Tim yang butuh aset cepat",
      "Bisnis yang ingin monetisasi template",
    ],
    related: ["platform", "studio", "apps"],
  },
  {
    slug: "arena",
    name: "Gigaviz Arena",
    short: "Play, create, dan commission mini-game untuk brand engagement.",
    description:
      "Arena untuk bermain game kurasi, membuat mini-game berbasis template, dan request game khusus untuk brand.",
    status: "beta",
    icon: "arena",
    categories: ["Engagement", "Games"],
    features: [
      "Koleksi game kurasi dari Gigaviz",
      "Builder mini-game berbasis template (bertahap)",
      "Request game custom via Apps",
      "Gamification ringan untuk engagement",
    ],
    whoFor: [
      "Brand marketing dan campaign",
      "Community manager",
      "Tim yang butuh engagement baru",
    ],
    related: ["platform", "studio", "apps"],
  },
  {
    slug: "apps",
    name: "Gigaviz Apps",
    short: "Katalog app, request, ticketing, dan mini roadmap per klien.",
    description:
      "Portal aplikasi internal dan request untuk kebutuhan khusus, dilengkapi ticketing dan mini roadmap per klien.",
    status: "beta",
    icon: "apps",
    categories: ["Operations", "Platform"],
    features: [
      "Katalog aplikasi dan modul",
      "Request dan ticketing terstruktur",
      "Mini roadmap per klien",
      "Status dan prioritas otomatis",
    ],
    whoFor: [
      "Tim ops dan product",
      "Customer success",
      "Klien enterprise",
    ],
    related: ["platform", "community", "pay"],
  },
  {
    slug: "pay",
    name: "Gigaviz Pay",
    short: "Wallet dan billing: invoice, payment link, subscription billing.",
    description:
      "Dompet digital internal untuk invoice, payment link, dan subscription billing dengan tracking transaksi.",
    status: "coming",
    icon: "pay",
    categories: ["Finance", "Billing"],
    features: [
      "Invoice dan payment link",
      "Subscription billing",
      "Wallet internal untuk saldo",
      "Rekonsiliasi pembayaran",
    ],
    whoFor: [
      "Finance dan admin billing",
      "Bisnis dengan recurring revenue",
      "Tim ops yang butuh tracking",
    ],
    related: ["platform", "office"],
  },
  {
    slug: "community",
    name: "Gigaviz Community",
    short: "Forum, feedback, showcase, leaderboard, dan event komunitas.",
    description:
      "Ruang komunitas untuk berbagi insight, feedback produk, showcase karya, dan event bersama.",
    status: "coming",
    icon: "community",
    categories: ["Community", "Engagement"],
    features: [
      "Forum dan feedback terstruktur",
      "Showcase karya dan case study",
      "Leaderboard dan tantangan",
      "Event komunitas dan meetups",
    ],
    whoFor: [
      "Pengguna aktif",
      "Komunitas kreatif",
      "Partner dan kolaborator",
    ],
    related: ["studio", "arena", "apps"],
  },
];

export const productSlugs = products.map((product) => product.slug);

export const productCategories = Array.from(
  new Set(products.flatMap((product) => product.categories))
).sort();

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export const productsMetadata: Metadata = {
  title: "Produk Gigaviz",
  description:
    "Jelajahi seluruh modul ekosistem Gigaviz untuk kebutuhan create, automate, monetize, dan manage.",
};
