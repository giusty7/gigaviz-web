"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function GetStartedAuth() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next = email ? `?email=${encodeURIComponent(email.trim())}` : "";
    router.push(`/register${next}`);
  }

  return (
    <div className="rounded-3xl border border-[color:var(--gv-border)] bg-[color:var(--gv-surface-soft)] p-6">
      <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--gv-muted)]">
        Daftar dengan Email
      </div>
      <h3 className="mt-2 text-lg font-semibold text-[color:var(--gv-text)]">
        Buat akun Gigaviz
      </h3>
      <p className="mt-2 text-sm text-[color:var(--gv-muted)]">
        Gunakan OTP email untuk mendaftar dan lanjut ke onboarding workspace.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <Input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="email@domain.com"
          type="email"
          required
        />
        <Button type="submit" className="w-full">
          Start with email
        </Button>
      </form>

      <div className="mt-4 text-xs text-[color:var(--gv-muted)]">
        Sudah punya akun?{" "}
        <a href="/login" className="text-[color:var(--gv-text)] hover:underline">
          Masuk
        </a>
      </div>
    </div>
  );
}
