import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Penghapusan Data | Gigaviz Services",
  description:
    "Panduan permintaan penghapusan data pribadi yang tersimpan di Gigaviz Services (mis. data lead formulir demo/konsultasi).",
  alternates: { canonical: "/data-deletion" },
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

export default function DataDeletionPage() {
  const contactEmail = "vg.gigaviz@gmail.com";
  const lastUpdated = "28 Desember 2025";

  return (
    <main className="min-h-screen bg-[#050816]">
      <div className="mx-auto max-w-3xl px-5 py-14">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur">
          <p className="text-sm text-white/60">Terakhir diperbarui: {lastUpdated}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Penghapusan Data</h1>

          <P>
            Halaman ini menjelaskan cara meminta penghapusan data pribadi yang mungkin tersimpan di sistem{" "}
            <span className="text-white font-semibold">Gigaviz Services</span>, misalnya data yang Anda kirim melalui formulir demo/konsultasi.
          </P>

          <SectionTitle>Data Apa yang Bisa Dihapus</SectionTitle>
          <P>Kami biasanya menyimpan data seperti:</P>
          <ul className="mt-3 space-y-2">
            <Li>Nama</Li>
            <Li>Nomor WhatsApp</Li>
            <Li>Nama bisnis (opsional)</Li>
            <Li>Kebutuhan & catatan yang Anda isi</Li>
            <Li>Data teknis dasar (misalnya user-agent dan IP untuk keamanan)</Li>
          </ul>

          <SectionTitle>Cara Mengajukan Penghapusan</SectionTitle>
          <P>
            Kirim email ke{" "}
            <a className="text-cyan-300 hover:underline" href={`mailto:${contactEmail}`}>
              {contactEmail}
            </a>{" "}
            dengan format berikut:
          </P>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-white/80">
            <p className="font-semibold text-white">Subjek:</p>
            <p className="mt-1">Permintaan Penghapusan Data – Gigaviz</p>

            <p className="mt-4 font-semibold text-white">Isi email:</p>
            <ul className="mt-2 space-y-1">
              <Li>Nama</Li>
              <Li>Nomor WhatsApp yang pernah Anda gunakan saat mengisi form / berkomunikasi</Li>
              <Li>Nama bisnis (opsional)</Li>
              <Li>Permintaan: “Mohon hapus seluruh data saya dari sistem Gigaviz Services.”</Li>
            </ul>
          </div>

          <SectionTitle>Verifikasi</SectionTitle>
          <P>
            Demi keamanan, kami dapat meminta verifikasi kepemilikan nomor (misalnya konfirmasi via WhatsApp)
            sebelum penghapusan diproses.
          </P>

          <SectionTitle>Waktu Pemrosesan</SectionTitle>
          <P>
            Kami akan memproses permintaan penghapusan dalam waktu wajar (umumnya 7–14 hari kerja), tergantung kompleksitas dan kebutuhan verifikasi.
            Dalam beberapa kondisi, sebagian data dapat dipertahankan jika diwajibkan oleh hukum atau untuk kebutuhan keamanan/audit.
          </P>

          <SectionTitle>Catatan tentang WhatsApp/Meta</SectionTitle>
          <P>
            Jika Anda berkomunikasi melalui WhatsApp, sebagian data/riwayat percakapan juga berada di platform WhatsApp/Meta.
            Pengelolaan data pada platform tersebut tunduk pada kebijakan mereka.
          </P>
        </div>
      </div>
    </main>
  );
}
