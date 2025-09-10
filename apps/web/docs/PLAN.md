# gigaviz.com — Sitemap, Product Portfolio & User Stories (v1.1, Rapi)

> Tujuan: situs cepat, rapi, aman, SEO‑ready untuk mempromosikan dan menjual ekosistem **Gigaviz** (produk digital + micro‑SaaS + API) dengan alur konversi yang jelas.

---

## 1) Target & Nilai Utama
- **Target**: UMKM, tim operasional/koordinator, creator/agency, developer.
- **Nilai**: Hemat waktu, patuh kebijakan platform, hasil terukur, mudah diintegrasikan.

---

## 2) Sitemap (IA) — final
**Nav utama**
- **Home** `/`
- **Produk** `/products`
  - **Core**: 
    - **WA Blast** `/products/wa-blast`
    - **Gigaviz Office (Dashboard)** `/products/office`
    - **APK (New Biller Patriot)** `/products/apk`
    - **Bot & Voice** `/products/assistant`
    - **Tracks (Music)** `/products/tracks`
    - **Graph (Design)** `/products/graph`
  - **Digital Packs (Non‑Jasa)**: `/products/packs` (lihat §3.2)
  - **API Micro‑SaaS**: `/products/ai` (lihat §3.3)
- **Harga** `/pricing`
- **Sumber Daya** `/resources` → Docs, Templates, Case Studies, Changelog, Roadmap
- **Blog** `/blog`
- **Perusahaan** `/company` → About, Brand/Press, Careers (opsional), **Contact** `/company/contact`
- **Dukungan** `/support` → FAQ, Help, Status (opsional)
- **Legal** `/terms` `/privacy` `/cookies` `/license`
- **SEO teknis** `/sitemap.xml` `/robots.txt`

---

## 3) Product Portfolio

### 3.1 Core (sudah disepakati)
- **WA Blast**: kampanye aman & terukur. CTA: Dapatkan Kredit/Demo.
- **Gigaviz Office**: dashboard KPI Sheets/Looker. CTA: Konsultasi.
- **APK (New Biller Patriot)**: WO/RBM/PPOB. CTA: Pilot.
- **Bot & Voice**: otomasi tugas & reminder. CTA: Aktifkan.
- **Tracks / Graph**: rilisan & aset desain. CTA: Dengarkan/Beli Paket.

### 3.2 Digital Products (Non‑Jasa) — 10 opsi
1) **Next.js Starter Kit** `/products/starters/next14` — template situs siap deploy.
2) **Dashboard Sheets/Excel Pro Pack** `/products/packs/dashboard` — KPI plug‑and‑play.
3) **WA Blast Desktop App** `/products/apps/wa-desktop` — GUI kirim dari CSV.
4) **Forms→Sheets Kit** `/products/kits/forms-sheets` — form anti‑spam + integrasi.
5) **Android Compose UI Kit** `/products/kits/compose-ui` — library UI.
6) **Prompt & Preset Pack** `/products/packs/prompts` — 300+ prompt TopMediaAI/GPT.
7) **Lottie & BG Motion Pack** `/products/packs/lottie` — animasi JSON/MP4 loop.
8) **Icon & Brand Asset Pack** `/products/packs/icons` — 300+ ikon, 3D badges.
9) **Sound FX & Jingle Pack** `/products/packs/sfx` — paket SFX/jingle bebas royalti.
10) **Mini Site Template + Fast Checkout** `/products/templates/minisite` — 5 landing siap jual.

> Model monetisasi: **sekali beli** / **lisensi tim** / **bundle**.

### 3.3 API‑based Micro‑SaaS (TopMediaAI, GPT/OpenAI, Meta WA, PortalPulsa) — 10 opsi
1) **Smart Lyric→Demo Generator** `/products/ai/lyric-demo` — GPT+TopMediaAI.
2) **WA AI Autoreply** `/products/ai/wa-autoreply` — FAQ, routing, intent.
3) **Conversational Top‑Up Bot** `/products/ai/topup-bot` — WA+PortalPulsa.
4) **Bulk Corporate Recharge** `/products/ai/bulk-recharge` — portal isi pulsa massal.
5) **Campaign Copy Composer** `/products/ai/copy-composer` — variasi copy+UTM.
6) **Voice Tag & Hook Finder** `/products/ai/hook-finder` — cari bagian catchy.
7) **WA Funnel Compliance Checker** `/products/ai/wa-compliance` — cek risiko template.
8) **Lead Scoring via Chat** `/products/ai/lead-scoring` — skor minat & ekspor ke CRM.
9) **Auto‑Invoice & Receipt Bot** `/products/ai/invoice-bot` — generate & kirim PDF.
10) **Music Promo Smart Splitter** `/products/ai/promo-splitter` — pecah lagu jadi klip.

> Model monetisasi: **langganan bulanan** + **kredit/usage** + **margin transaksi** (PortalPulsa).

### 3.4 Modul Platform (pendukung & bisa dijual add‑on)
- **Credits Wallet & Billing** `/products/platform/wallet` — kredit terpadu untuk semua fitur.
- **Partner/Afiliasi & Reseller Panel** `/products/platform/partners` — referral & reseller.
- **Link & QR (Bio‑link + Shortener + UTM)** `/products/link`
- **Forms→WhatsApp/Sheets** `/products/forms`
- **Scheduler & Sequences** `/products/scheduler`
- **Contacts Hygiene** `/products/contacts-hygiene`
- **Analytics (Campaign & Funnel)** `/products/analytics`
- **Template Studio (Copy & Design)** `/products/templates`
- **Doc/PDF Generator** `/products/docgen`
- **MiniSites & Fast Checkout** `/products/minisites`

> Catatan: item di atas bisa dipaketkan ke tier **Starter/Pro/Business/Enterprise**.

---

## 4) Monetization Map (ringkas)
- **Sekali beli**: Starters, Templates, Packs (ikon, lottie, SFX), UI Kit.
- **Langganan**: API micro‑SaaS (autoreply, compliance, analytics), WA Inbox/CRM.
- **Usage‑based**: kredit TopMediaAI/GPT, message Meta WA, render PDF, top‑up margin.
- **B2B margin**: Bulk Corporate Recharge (PortalPulsa), Reseller Panel.

---

## 5) User Stories (MVP)
1. UKM ingin kirim WA massal dari Sheets dan cek hasil. 
2. Koordinator ingin dashboard KPI per petugas & periode.
3. Admin ingin upload CSV & validasi otomatis.
4. Owner ingin paket harga jelas untuk cepat memutuskan.
5. Developer ingin API sederhana (kirim pesan/cek saldo/webhook).
6. Creator ingin template pesan siap pakai.
7. Enterprise ingin studi kasus & SLA.
8. Pengguna baru ingin onboarding 3 langkah.
9. Pengguna lama ingin metrik kampanye (delivered/read/CTR) & export.
10. Tim kreatif ingin halaman Tracks/Graph dengan lisensi jelas.
11. Jobseeker/kontributor ingin apply dengan form.
12. Pengunjung mobile ingin situs ringan (<2.5s).

---

## 6) Roadmap & Prioritas Eksekusi
**Now (Sprint 1–2)** — *default prioritas hingga direvisi*:
- API: **WA AI Autoreply**, **Conversational Top‑Up Bot**, **Bulk Corporate Recharge**.
- Digital: **Next.js Starter Kit**.
- Infra: **Credits Wallet**, **Pricing** & **Checkout** (tautan/Invoice) + **Links/UTM**.

**Next**:
- **Analytics (Campaign/Funnel)**, **Template Studio**, **Forms→Sheets**.

**Later**:
- **Hook Finder**, **Promo Splitter**, **Doc/PDF Generator**, **UI Kit Android**.

---

## 7) SEO, A11y, Kinerja
- **SEO**: title & meta unik; OG; schema Product/FAQ; sitemap/robots; canonical.
- **A11y**: label‑for, alt text, keyboard‑nav, focus ring; kontras AA.
- **Kinerja**: LCP < 2.5s, CLS < 0.1, TBT < 200ms; Next <Image/>; font‑display: swap; code‑split; prefetch.

---

## 8) Stack & Standar
- **Stack**: Next.js 14 App Router + TS; Tailwind + shadcn/ui; MDX blog; RHF + Zod; API Routes/Supabase opsional; next‑seo; GA4/Sentry opsional.
- **Struktur**: `/app`, `/components`, `/lib`, `/styles`, `/public`, `/content`, `/scripts`.
- **Aturan**: responsif 360/768/1024/1280; validasi input; .env; tidak expose secret di klien.

---

## 9) Kepatuhan & Risiko
- **Meta WA**: patuhi template HSM, consent, rate limit; no spam.
- **TopMediaAI/GPT**: hak cipta, moderasi konten; gunakan karya orisinal user.
- **PortalPulsa**: audit log, anti‑fraud, limit transaksi; SLA gagal isi.
- **Privasi**: PII minim, enkripsi at‑rest/in‑transit, retention policy.

---

## 10) Next Actions (taktis)
1. Buat halaman kerangka berikut (placeholder copy + CTA):
   - `/products/wa-autoreply`, `/products/topup-bot`, `/products/bulk-recharge`, `/products/starters/next14`, `/pricing`, `/products/platform/wallet`, `/products/link`.
2. Siapkan **pricing table** (Starter/Pro/Business/Enterprise) dengan contoh angka.
3. Draft **.env.example** + README (run lokal & deploy Vercel).
4. Implement **sitemap/robots** + metadata dasar.
5. Buat 1 studi kasus singkat (dummy) + 1 template gratis (lead magnet).

> Dokumen ini tersinkron dengan kanvas v1.1. Simpan file ini di `/docs/PLAN.md` dalam repo agar tim gampang rujuk & review.
