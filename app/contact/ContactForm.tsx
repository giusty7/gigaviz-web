"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
// pakai komponen dasar; kalau Input/Button-mu tak kontras di dark mode,
// ganti ke <input> biasa seperti di textarea di bawah.

import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

const schema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  message: z.string().min(10, "Pesan minimal 10 karakter"),
  website: z.string().optional(), // honeypot
});
type FormData = z.infer<typeof schema>;

export default function ContactForm() {
  const [status, setStatus] =
    useState<"idle" | "loading" | "success" | "error">("idle");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", message: "", website: "" },
  });

  async function onSubmit(data: FormData) {
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) throw new Error("send failed");
      setStatus("success");
      reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4">
      {/* honeypot (disembunyikan) */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        {...register("website")}
      />

      <div>
        <label className="mb-1 block text-sm">Nama</label>
        <Input
          {...register("name")}
          placeholder="Nama lengkap"
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm">Email</label>
        <Input
          type="email"
          {...register("email")}
          placeholder="nama@contoh.com"
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm">Pesan</label>
        {/* gunakan textarea dengan kelas kontras agar pasti terlihat di dark mode */}
        <textarea
          rows={5}
          {...register("message")}
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Tulis pesanmu…"
          aria-invalid={!!errors.message}
        />
        {errors.message && (
          <p className="mt-1 text-sm text-red-400">{errors.message.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting || status === "loading"}>
        {status === "loading" ? "Mengirim..." : "Kirim"}
      </Button>

      {status === "success" && (
        <p role="status" className="mt-2 text-sm text-emerald-400">
          Pesan terkirim. Terima kasih!
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="mt-2 text-sm text-red-400">
          Terjadi kesalahan. Coba lagi nanti.
        </p>
      )}
    </form>
  );
}
