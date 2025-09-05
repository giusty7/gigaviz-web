"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

const schema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  message: z.string().min(1, "Pesan wajib diisi"),
  website: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

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
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
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

      {/* honeypot */}
      <div className="hidden">
        <label htmlFor="website">Website</label>
        <Input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
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
        />
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
        <p role="status" className="text-sm text-primary">Pesan terkirim.</p>
      )}
      {status === "error" && (
        <p role="alert" className="text-sm text-primary">Terjadi kesalahan.</p>
      )}
    </form>
  );
}
