# Gigaviz Web

Website untuk promosi dan penjualan ekosistem Gigaviz dengan alur konversi yang jelas.

## Prinsip

Lihat [docs/PRINCIPLES.md](docs/PRINCIPLES.md) untuk tujuan dan prinsip pengembangan.

## Definition of Done

Ringkasan kualitas dan QA ada di [docs/QUALITY.md](docs/QUALITY.md).

## Roadmap (high-level)

- Step 0 – Guardrails & Docs
- Step 1 – Core pages & layout (TBD)
- Step 2 – Content & launch (TBD)

## Menjalankan

```bash
npm install
npm run dev
```

### Build & QA

```bash
npm run lint
npm run typecheck
npm run build
npm run start
```

## Struktur Proyek

- `app/` – routes dan halaman
- `components/` – komponen UI dasar
- `lib/` – utilitas kecil (SEO, rate limit, validasi)
- `styles/` – berkas CSS global dan design tokens
