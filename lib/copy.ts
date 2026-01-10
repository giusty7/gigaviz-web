export const copy = {
  upgradeModal: {
    title: "Upgrade untuk mengaktifkan fitur ini",
    description:
      "Kamu bisa melihat tampilan di Mode Preview. Untuk menjalankan aksi dan menyimpan perubahan, upgrade diperlukan.",
    bullets: [
      "Akses aksi penuh tanpa batasan",
      "Workspace & kolaborasi tim",
      "RBAC lanjutan (peran & izin)",
      "Audit log untuk jejak aktivitas",
      "Billing terpusat & kontrol langganan",
    ],
    ctaPrimary: "Lihat Paket",
    ctaSecondary: "Nanti dulu",
    footerNote: "Kamu tetap bisa eksplor tampilan tanpa risiko perubahan data.",
  },
  previewBanner: {
    title: "Mode Preview",
    text: "Kamu bisa melihat tampilan dan contoh data. Aksi dan penyimpanan perubahan terkunci.",
    action: "Upgrade",
  },
  tooltips: {
    upgrade: "Butuh upgrade untuk memakai fitur ini.",
  },
  messages: {
    gated: "Fitur ini tersedia setelah upgrade.",
  },
  emptyStates: {
    workspace: {
      title: "Belum ada workspace.",
      helper: "Buat workspace pertama untuk mulai mengatur tim dan akses.",
    },
    members: {
      title: "Belum ada anggota.",
      helper: "Undang anggota agar kolaborasi lebih cepat.",
    },
    roles: {
      title: "Belum ada pengaturan peran lanjutan.",
      helper: "Aktifkan RBAC untuk mengatur izin per fitur.",
    },
    audit: {
      title: "Belum ada aktivitas tercatat.",
      helper: "Saat audit log aktif, semua aksi penting akan muncul di sini.",
    },
    billing: {
      title: "Belum ada paket aktif.",
      helper: "Pilih paket untuk membuka fitur premium dan batasan lebih tinggi.",
    },
  },
};

export type Copy = typeof copy;
