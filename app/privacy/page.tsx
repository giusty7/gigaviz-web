import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gigaviz Platform – Kebijakan Privasi",
  description:
    "Kebijakan Privasi Gigaviz Platform menjelaskan data yang kami kumpulkan, cara penggunaannya, serta pilihan Anda terkait data pribadi.",
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
  const contactEmail = "admin@gigaviz.com";

  return (
    <main className="min-h-screen bg-[#050816]">
      <div className="mx-auto max-w-3xl px-5 py-14">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur">
          <p className="text-sm text-white/60">Terakhir diperbarui: {lastUpdated}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Kebijakan Privasi</h1>
          <P>
            Kebijakan Privasi ini menjelaskan bagaimana{" "}
            <span className="text-white font-semibold">Gigaviz Platform</span> mengumpulkan,
            menggunakan, menyimpan, dan melindungi data pribadi saat Anda memakai layanan
            kami (WhatsApp Business Platform, shared inbox/CRM, template manager, automation,
            webhook/status, dan fitur terkait).
          </P>

          <SectionTitle>1. Ringkasan</SectionTitle>
          <P>
            Kami hanya mengumpulkan data yang dibutuhkan untuk mengoperasikan layanan, membantu
            tim Anda berinteraksi dengan pelanggan, serta menjaga keamanan dan kualitas layanan.
          </P>

          <SectionTitle>2. Data yang Dikumpulkan</SectionTitle>
          <P>Jenis data yang dapat kami proses (sesuai penggunaan Anda):</P>
          <ul className="mt-3 space-y-2">
            <Li>
              <span className="text-white/90 font-medium">Identitas dan kontak</span>: nama,
              nomor WhatsApp, email kerja, nama bisnis.
            </Li>
            <Li>
              <span className="text-white/90 font-medium">Data percakapan</span>: isi pesan,
              status pesan (sent/delivered/read/failed), dan catatan internal.
            </Li>
            <Li>
              <span className="text-white/90 font-medium">Data operasional</span>: template yang
              Anda buat, konfigurasi tim, assignment, serta aktivitas pengguna.
            </Li>
            <Li>
              <span className="text-white/90 font-medium">Data teknis</span>: alamat IP, perangkat,
              dan log akses (untuk keamanan dan troubleshooting).
            </Li>
          </ul>

          <SectionTitle>3. Cara Penggunaan Data</SectionTitle>
          <P>Data digunakan untuk:</P>
          <ul className="mt-3 space-y-2">
            <Li>Menjalankan fitur shared inbox, CRM, template manager, dan automasi.</Li>
            <Li>Mengirim pesan lewat WhatsApp Business Platform sesuai perintah Anda.</Li>
            <Li>Menjaga keamanan sistem, audit akses, dan pencegahan penyalahgunaan.</Li>
            <Li>Perbaikan produk dan dukungan teknis.</Li>
          </ul>

          <SectionTitle>4. Berbagi Data</SectionTitle>
          <P>Kami tidak menjual data pribadi Anda. Data dapat dibagikan secara terbatas kepada:</P>
          <ul className="mt-3 space-y-2">
            <Li>
              <span className="text-white/90 font-medium">Meta/WhatsApp</span> untuk pengiriman pesan,
              webhook status, dan verifikasi template.
            </Li>
            <Li>
              <span className="text-white/90 font-medium">Vendor infrastruktur</span> (hosting, storage,
              email, monitoring) agar layanan berjalan stabil.
            </Li>
            <Li>Jika diwajibkan oleh hukum/otoritas yang berwenang.</Li>
          </ul>

          <SectionTitle>5. Retensi</SectionTitle>
          <P>
            Data disimpan selama diperlukan untuk pengoperasian layanan, kepatuhan, dan dukungan.
            Anda dapat meminta penghapusan sesuai kebijakan dan batasan teknis.
          </P>

          <SectionTitle>6. Hak Pengguna</SectionTitle>
          <P>Anda berhak untuk:</P>
          <ul className="mt-3 space-y-2">
            <Li>Meminta akses atau perbaikan data.</Li>
            <Li>Meminta penghapusan data tertentu sesuai ketentuan.</Li>
            <Li>Opt-out dari komunikasi tertentu (misalnya broadcast).</Li>
          </ul>

          <SectionTitle>7. Keamanan</SectionTitle>
          <P>
            Kami menerapkan kontrol akses, logging, dan praktik keamanan yang wajar. Meski begitu,
            tidak ada sistem yang sepenuhnya bebas risiko.
          </P>

          <SectionTitle>8. Perubahan Kebijakan</SectionTitle>
          <P>
            Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Versi terbaru akan
            selalu tersedia di halaman ini.
          </P>

          <SectionTitle>9. Kontak</SectionTitle>
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
