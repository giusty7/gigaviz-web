import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kebijakan Privasi | Gigaviz Services",
  description:
    "Kebijakan Privasi Gigaviz Services menjelaskan data apa yang kami kumpulkan, bagaimana digunakan, dan pilihan Anda terkait data pribadi.",
  alternates: { canonical: "/privacy" },
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-8 text-xl font-semibold text-white">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 leading-relaxed text-white/80">{children}</p>;
}

function Li({ children }: { children: React.ReactNode }) {
  return <li className="ml-5 list-disc text-white/80">{children}</li>;
}

export default function PrivacyPage() {
  const lastUpdated = "28 Desember 2025";
  const contactEmail = "vg.gigaviz@gmail.com";

  return (
    <main className="min-h-screen bg-[#050816]">
      <div className="mx-auto max-w-3xl px-5 py-14">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur">
          <p className="text-sm text-white/60">Terakhir diperbarui: {lastUpdated}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Kebijakan Privasi</h1>
          <P>
            Kebijakan Privasi ini menjelaskan bagaimana <span className="text-white font-semibold">Gigaviz Services</span>{" "}
            (“Gigaviz”, “kami”) mengumpulkan, menggunakan, menyimpan, dan melindungi data pribadi saat Anda mengakses situs
            kami dan/atau mengisi formulir (misalnya “Minta Demo/Konsultasi”) terkait layanan WhatsApp Business Platform,
            inbox CS, chatbot, campaign/broadcast, dan integrasi lainnya.
          </P>

          <SectionTitle>1. Data yang Kami Kumpulkan</SectionTitle>
          <P>Kami dapat mengumpulkan data berikut (tergantung interaksi Anda):</P>
          <ul className="mt-3 space-y-2">
            <Li>
              <span className="text-white/90 font-medium">Data identitas & kontak</span>: nama, nomor WhatsApp, nama bisnis (opsional).
            </Li>
            <Li>
              <span className="text-white/90 font-medium">Kebutuhan & catatan</span>: kebutuhan utama (mis. inbox CS, chatbot, campaign) dan catatan tambahan.
            </Li>
            <Li>
              <span className="text-white/90 font-medium">Data teknis</span>: alamat IP, user-agent/perangkat (untuk keamanan, anti-spam, dan troubleshooting).
            </Li>
            <Li>
              <span className="text-white/90 font-medium">Riwayat komunikasi</span>: jika Anda menghubungi kami melalui WhatsApp/email, kami dapat menyimpan isi komunikasi untuk layanan pelanggan.
            </Li>
          </ul>

          <SectionTitle>2. Cara Kami Menggunakan Data</SectionTitle>
          <P>Kami menggunakan data untuk:</P>
          <ul className="mt-3 space-y-2">
            <Li>Menindaklanjuti permintaan demo/konsultasi dan menghubungi Anda melalui WhatsApp.</Li>
            <Li>Memahami kebutuhan Anda agar kami bisa menyiapkan solusi yang relevan.</Li>
            <Li>Keamanan sistem (pencegahan spam/penyalahgunaan), logging, dan audit teknis.</Li>
            <Li>Peningkatan layanan dan pengalaman pengguna.</Li>
          </ul>

          <SectionTitle>3. Dasar Pemrosesan</SectionTitle>
          <P>
            Pemrosesan data dilakukan berdasarkan persetujuan Anda (misalnya ketika mengisi formulir), kepentingan yang sah
            (keamanan & pencegahan penyalahgunaan), dan/atau kebutuhan untuk menanggapi permintaan layanan.
          </P>

          <SectionTitle>4. Berbagi Data</SectionTitle>
          <P>Kami tidak menjual data pribadi Anda. Data dapat dibagikan secara terbatas kepada:</P>
          <ul className="mt-3 space-y-2">
            <Li>
              Penyedia infrastruktur/hosting dan database (mis. penyimpanan data formulir) untuk menjalankan layanan.
            </Li>
            <Li>
              Penyedia layanan komunikasi (mis. WhatsApp/Meta) saat kami mengirim pesan tindak lanjut kepada Anda.
            </Li>
            <Li>Jika diwajibkan oleh hukum/otoritas yang berwenang.</Li>
          </ul>

          <SectionTitle>5. Penyimpanan & Keamanan</SectionTitle>
          <P>
            Kami menerapkan langkah-langkah keamanan yang wajar untuk melindungi data dari akses tidak sah, perubahan, atau
            pengungkapan. Namun, tidak ada sistem yang 100% aman.
          </P>

          <SectionTitle>6. Retensi Data</SectionTitle>
          <P>
            Kami menyimpan data selama diperlukan untuk tujuan yang dijelaskan di atas, termasuk tindak lanjut dan
            pencatatan internal. Data dapat dihapus lebih cepat atas permintaan Anda (lihat halaman Penghapusan Data).
          </P>

          <SectionTitle>7. Hak Anda</SectionTitle>
          <P>Anda dapat:</P>
          <ul className="mt-3 space-y-2">
            <Li>Meminta akses atau pembaruan data Anda.</Li>
            <Li>Meminta penghapusan data (lihat halaman Penghapusan Data).</Li>
            <Li>Menolak komunikasi lanjutan (opt-out) kapan saja.</Li>
          </ul>

          <SectionTitle>8. Privasi Anak</SectionTitle>
          <P>
            Layanan kami tidak ditujukan untuk anak di bawah umur. Jika Anda yakin kami mengumpulkan data anak di bawah umur,
            hubungi kami untuk penghapusan.
          </P>

          <SectionTitle>9. Perubahan Kebijakan</SectionTitle>
          <P>
            Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Versi terbaru akan selalu tersedia di halaman ini.
          </P>

          <SectionTitle>10. Kontak</SectionTitle>
          <P>
            Jika ada pertanyaan terkait privasi, hubungi:{" "}
            <a className="text-cyan-300 hover:underline" href={`mailto:${contactEmail}`}>
              {contactEmail}
            </a>
          </P>
        </div>
      </div>
    </main>
  );
}
