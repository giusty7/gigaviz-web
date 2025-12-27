import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ketentuan Layanan | Gigaviz Services",
  description:
    "Ketentuan Layanan Gigaviz Services mengatur penggunaan situs dan layanan kami termasuk WhatsApp Business Platform, inbox CS, chatbot, dan campaign.",
  alternates: { canonical: "/terms" },
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

export default function TermsPage() {
  const lastUpdated = "28 Desember 2025";
  const contactEmail = "vg.gigaviz@gmail.com";

  return (
    <main className="min-h-screen bg-[#050816]">
      <div className="mx-auto max-w-3xl px-5 py-14">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur">
          <p className="text-sm text-white/60">Terakhir diperbarui: {lastUpdated}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Ketentuan Layanan</h1>

          <P>
            Dengan mengakses atau menggunakan situs dan layanan <span className="text-white font-semibold">Gigaviz Services</span>
            (“Gigaviz”, “kami”), Anda setuju untuk terikat oleh Ketentuan Layanan ini.
            Jika Anda tidak setuju, mohon untuk tidak menggunakan layanan kami.
          </P>

          <SectionTitle>1. Ruang Lingkup Layanan</SectionTitle>
          <P>
            Gigaviz menyediakan informasi, konsultasi, dan/atau platform terkait WhatsApp Business Platform
            (misalnya inbox CS multi-agent, chatbot, campaign/broadcast, template pesan, analitik, integrasi, dan fitur terkait).
            Detail layanan dapat berubah sesuai pengembangan produk.
          </P>

          <SectionTitle>2. Penggunaan yang Dilarang</SectionTitle>
          <P>Anda setuju untuk tidak menggunakan layanan kami untuk:</P>
          <ul className="mt-3 space-y-2">
            <Li>Aktivitas ilegal, penipuan, spam, atau pelanggaran kebijakan platform pihak ketiga.</Li>
            <Li>Mengirim konten berbahaya, menyesatkan, mengandung malware, atau melanggar hak pihak lain.</Li>
            <Li>Upaya mengganggu keamanan, menguji kerentanan, atau akses tidak sah ke sistem.</Li>
          </ul>

          <SectionTitle>3. Layanan Pihak Ketiga</SectionTitle>
          <P>
            Sebagian layanan dapat bergantung pada pihak ketiga (misalnya Meta/WhatsApp, penyedia hosting, database).
            Anda juga terikat pada ketentuan dan kebijakan pihak ketiga tersebut saat menggunakan layanan mereka.
          </P>

          <SectionTitle>4. Ketersediaan & Perubahan</SectionTitle>
          <P>
            Kami berusaha menjaga layanan tetap tersedia, namun layanan dapat mengalami gangguan, pemeliharaan, atau perubahan.
            Kami dapat memperbarui, menambah, atau menghentikan fitur kapan saja.
          </P>

          <SectionTitle>5. Konten & Hak Kekayaan Intelektual</SectionTitle>
          <P>
            Seluruh materi di situs (brand, logo, desain, teks, komponen UI) adalah milik Gigaviz atau pemberi lisensi kami,
            dan dilindungi hukum yang berlaku. Anda tidak diperkenankan menyalin/menyebarluaskan tanpa izin tertulis.
          </P>

          <SectionTitle>6. Disclaimer</SectionTitle>
          <P>
            Layanan disediakan “sebagaimana adanya” dan “sebagaimana tersedia”. Kami tidak menjamin layanan bebas gangguan,
            bebas kesalahan, atau selalu memenuhi kebutuhan spesifik Anda.
          </P>

          <SectionTitle>7. Batasan Tanggung Jawab</SectionTitle>
          <P>
            Sejauh diizinkan oleh hukum, Gigaviz tidak bertanggung jawab atas kerugian tidak langsung/insidental,
            kehilangan data, kehilangan keuntungan, atau dampak bisnis lain akibat penggunaan layanan.
          </P>

          <SectionTitle>8. Penghentian</SectionTitle>
          <P>
            Kami dapat membatasi atau menghentikan akses Anda jika terdapat dugaan pelanggaran ketentuan ini
            atau penyalahgunaan layanan.
          </P>

          <SectionTitle>9. Hukum yang Berlaku</SectionTitle>
          <P>
            Ketentuan ini diatur oleh hukum yang berlaku di Indonesia. Sengketa akan diupayakan melalui musyawarah terlebih dahulu.
          </P>

          <SectionTitle>10. Kontak</SectionTitle>
          <P>
            Pertanyaan terkait Ketentuan Layanan dapat dikirim ke:{" "}
            <a className="text-cyan-300 hover:underline" href={`mailto:${contactEmail}`}>
              {contactEmail}
            </a>
          </P>
        </div>
      </div>
    </main>
  );
}
