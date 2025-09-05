"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Section from "@/components/Section";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { canonical } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontak",
  description: "Hubungi tim Gigaviz.",
  alternates: { canonical: canonical("/contact") },
};

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
  website: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ContactPage() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <Section>
      <h1 className="text-3xl font-bold mb-6">Kontak</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        aria-busy={status === "loading"}
      >
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Nama
          </label>
          <Input id="name" {...register("name")} aria-invalid={!!errors.name} />
          {errors.name && (
            <p role="alert" className="text-sm text-primary mt-1">
              {errors.name.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p role="alert" className="text-sm text-primary mt-1">
              {errors.email.message}
            </p>
          )}
        </div>
        <div className="hidden">
          <label htmlFor="website">Website</label>
          <Input
            id="website"
            tabIndex={-1}
            autoComplete="off"
            {...register("website")}
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">
            Pesan
          </label>
          <textarea
            id="message"
            className="min-h-[120px] w-full rounded-md border border-border bg-transparent p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register("message")}
            aria-invalid={!!errors.message}
          ></textarea>
          {errors.message && (
            <p role="alert" className="text-sm text-primary mt-1">
              {errors.message.message}
            </p>
          )}
        </div>
        <Button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Mengirim..." : "Kirim"}
        </Button>
        {status === "success" && (
          <p role="status" className="text-sm text-primary">
            Pesan terkirim.
          </p>
        )}
        {status === "error" && (
          <p role="alert" className="text-sm text-primary">
            Terjadi kesalahan.
          </p>
        )}
      </form>
    </Section>
  );
}
