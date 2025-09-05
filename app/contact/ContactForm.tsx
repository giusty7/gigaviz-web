"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Section from "@/components/Section";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

const schema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  message: z.string().min(1, "Pesan wajib diisi"),
  website: z.string().optional(), // honeypot
});
type FormData = z.infer<typeof schema>;

export default function ContactForm() {
  const [status, setStatus] =
    useState<"idle" | "loading" | "success" | "error">("idle");

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body?.ok) {
        setStatus("success");
        reset(); // <- penting: bersihkan form
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <Section>
      {/* …label + input sama seperti sebelumnya… */}
      <Button type="submit" disabled={isSubmitting || status === "loading"}>
        {status === "loading" ? "Mengirim..." : "Kirim"}
      </Button>

      {status === "success" && (
        <p role="status" className="text-sm text-primary mt-2">
          Pesan terkirim. Terima kasih!
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="text-sm text-primary mt-2">
          Terjadi kesalahan. Coba lagi nanti.
        </p>
      )}
    </Section>
  );
}
