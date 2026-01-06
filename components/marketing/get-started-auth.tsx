"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

export default function GetStartedAuth() {
  const supabase = useMemo(() => supabaseClient(), []);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function sendOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setStep("otp");
    setMessage("Kode OTP sudah dikirim ke email Anda.");
  }

  async function verifyOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/onboarding");
    router.refresh();
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

      {message && (
        <div className="mt-4 rounded-2xl border border-[color:var(--gv-accent)] bg-[color:var(--gv-accent-soft)] p-3 text-sm text-[color:var(--gv-text)]">
          {message}
        </div>
      )}

      {step === "email" ? (
        <form onSubmit={sendOtp} className="mt-4 space-y-3">
          <input
            className="mt-1 w-full rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-4 py-3 text-sm text-[color:var(--gv-text)] placeholder:text-[color:var(--gv-muted)]"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@domain.com"
            type="email"
            required
          />
          <button
            disabled={loading}
            className="w-full rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)] disabled:opacity-60"
          >
            {loading ? "Mengirim..." : "Kirim OTP"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="mt-4 space-y-3">
          <input
            className="mt-1 w-full rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-4 py-3 text-sm text-[color:var(--gv-text)]"
            value={email}
            readOnly
          />
          <input
            className="mt-1 w-full rounded-2xl border border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] px-4 py-3 text-center text-sm tracking-[0.3em] text-[color:var(--gv-text)]"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="------"
            inputMode="numeric"
            maxLength={6}
            required
          />
          <button
            disabled={loading}
            className="w-full rounded-2xl bg-[color:var(--gv-accent)] px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-[color:var(--gv-cream)] disabled:opacity-60"
          >
            {loading ? "Memverifikasi..." : "Verifikasi OTP"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setMessage(null);
            }}
            className="w-full rounded-2xl border border-[color:var(--gv-border)] px-5 py-3 text-sm font-semibold text-[color:var(--gv-text)]"
          >
            Ganti email
          </button>
        </form>
      )}

      <div className="mt-4 text-xs text-[color:var(--gv-muted)]">
        Sudah punya akun? <a href="/login" className="text-[color:var(--gv-text)] hover:underline">Masuk</a>
      </div>
    </div>
  );
}
