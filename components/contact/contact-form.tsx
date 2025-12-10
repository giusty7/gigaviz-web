"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  contactSchema,
  type ContactFormData,
} from "@/lib/validation/contact";

const WHATSAPP_NUMBER = "6283165655670"; // GANTI NOMOR INI JIKA PERLU

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      topic: "",
      message: "",
      website: "", // honeypot
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      setStatus("loading");
      setServerMessage(null);

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setStatus("error");
        setServerMessage(json?.message ?? "Gagal mengirim pesan.");
        return;
      }

      setStatus("success");
      setServerMessage(json?.message ?? "Pesan berhasil dikirim.");
      reset();
    } catch (error) {
      console.error(error);
      setStatus("error");
      setServerMessage("Terjadi kesalahan. Coba lagi nanti.");
    }
  };

  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Halo Gigaviz, saya ingin diskusi soal layanan/produk."
  )}`;

  return (
    <div className="grid gap-10 md:grid-cols-[1.2fr,1fr]">
      {/* Info + tombol WA */}
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Kontak & Kolaborasi
        </h1>
        <p className="max-w-xl text-sm text-slate-300">
          Kirim pesan singkat mengenai kebutuhan Anda. Ceritakan konteks,
          skala tim, dan tujuan yang ingin dicapai. Kami akan merespons
          seefisien mungkin.
        </p>

        <div className="space-y-2 text-sm text-slate-300">
          <p className="font-semibold text-slate-100">
            Cara tercepat: WhatsApp
          </p>
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-2xl bg-emerald-500 px-4 py-2 text-xs font-medium text-slate-900 shadow-sm hover:bg-emerald-400"
          >
            Chat via WhatsApp Business
          </a>
          <p className="text-xs text-slate-500">
            *Tombol di atas akan membuka WhatsApp dengan template pesan awal.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-300">
          <p className="mb-2 font-semibold">
            Contoh informasi yang bisa Anda kirim:
          </p>
          <ul className="list-disc space-y-1 pl-4">
            <li>Jenis kebutuhan (WA Blast, dashboard, musik, dll)</li>
            <li>Jumlah tim/pelanggan yang terlibat</li>
            <li>Target utama (monitoring, pengingat, branding, dll)</li>
            <li>Perkiraan waktu mulai yang diharapkan</li>
          </ul>
        </div>
      </div>

      {/* Form kontak */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-50">
          Form kontak
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="block text-slate-200" htmlFor="name">
              Nama lengkap
            </label>
            <input
              id="name"
              type="text"
              {...register("name")}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-50 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              placeholder="Nama Anda"
            />
            {errors.name && (
              <p className="text-[11px] text-rose-400">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-slate-200" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register("email")}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-50 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              placeholder="email@contoh.com"
            />
            {errors.email && (
              <p className="text-[11px] text-rose-400">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-slate-200" htmlFor="topic">
              Topik singkat
            </label>
            <input
              id="topic"
              type="text"
              {...register("topic")}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-50 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              placeholder="Contoh: WA Blast penagihan, dashboard kinerja tim..."
            />
            {errors.topic && (
              <p className="text-[11px] text-rose-400">
                {errors.topic.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-slate-200" htmlFor="message">
              Ceritakan kebutuhan Anda
            </label>
            <textarea
              id="message"
              rows={5}
              {...register("message")}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-50 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              placeholder="Jelaskan konteks, skala tim, dan tujuan yang ingin dicapai..."
            />
            {errors.message && (
              <p className="text-[11px] text-rose-400">
                {errors.message.message}
              </p>
            )}
          </div>

          {/* Honeypot anti-spam (disembunyikan dari user normal) */}
          <div className="hidden">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              type="text"
              autoComplete="off"
              {...register("website")}
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="mt-2 inline-flex items-center rounded-2xl bg-cyan-400 px-4 py-2 text-xs font-medium text-slate-900 shadow-sm hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading" ? "Mengirim..." : "Kirim pesan"}
          </button>

          {serverMessage && (
            <p
              className={`mt-2 text-[11px] ${
                status === "success" ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {serverMessage}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
