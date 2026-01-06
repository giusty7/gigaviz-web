export type RoadmapItem = {
  title: string;
  description: string;
};

export type RoadmapStage = "now" | "next" | "later";

export const roadmap: Record<RoadmapStage, RoadmapItem[]> = {
  now: [
    {
      title: "Core OS untuk akun dan workspace",
      description: "Single sign-on, billing dasar, role, dan audit log untuk tim.",
    },
    {
      title: "Meta Hub basics",
      description: "Webhook, inbox, template, dan workflow opt-in untuk WhatsApp.",
    },
    {
      title: "Studio library",
      description: "Asset library, prompt management, dan output kreatif awal.",
    },
    {
      title: "Office templates",
      description: "Template dokumen, dashboard, dan automasi sederhana.",
    },
    {
      title: "Pay UI",
      description: "Invoice dan subscription billing dengan tampilan awal.",
    },
  ],
  next: [
    {
      title: "Analytics lintas modul",
      description: "Insight terintegrasi untuk performa bisnis dan kreatif.",
    },
    {
      title: "Campaign scheduler v2",
      description: "Jadwal kampanye yang lebih presisi dan mudah diaudit.",
    },
    {
      title: "Marketplace hooks",
      description: "Integrasi ringan ke ekosistem marketplace dan CRM.",
    },
    {
      title: "Roles dan audit tingkat lanjut",
      description: "Pengaturan akses granular dan histori aktivitas detail.",
    },
  ],
  later: [
    {
      title: "PPOB dan pembayaran rutin",
      description: "Ekstensi pembayaran dan layanan tagihan.",
    },
    {
      title: "BSP upgrades",
      description: "Peningkatan jalur resmi untuk WhatsApp BSP.",
    },
    {
      title: "Community events",
      description: "Meetup, showcase, dan program komunitas resmi.",
    },
    {
      title: "Advanced automations",
      description: "Otomasi lintas modul dengan aturan yang lebih kompleks.",
    },
  ],
};
