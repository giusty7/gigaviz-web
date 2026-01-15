"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import { registerSchema } from "@/lib/validation/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type RegisterValues = z.infer<typeof registerSchema>;

/** Password strength levels with colors and micro-copy tips */
const STRENGTH_CONFIG = [
  { label: "Weak", barColor: "bg-[#e11d48]", textColor: "text-[#e11d48]", suggestion: "Add uppercase, numbers, and symbols" },
  { label: "Fair", barColor: "bg-orange-500", textColor: "text-orange-400", suggestion: "Add more variety" },
  { label: "Good", barColor: "bg-yellow-500", textColor: "text-yellow-400", suggestion: "Almost there!" },
  { label: "Strong", barColor: "bg-[#d4af37]", textColor: "text-[#d4af37]", suggestion: "" },
  { label: "Secure", barColor: "bg-[#f9d976]", textColor: "text-[#f9d976]", suggestion: "" },
] as const;

function getStrength(value: string) {
  if (!value) return 0;
  const checks = [
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /[0-9]/.test(value),
    /[^A-Za-z0-9]/.test(value),
    value.length >= 12,
  ];
  return checks.filter(Boolean).length;
}

/** Imperium dark input styling — Navy/Cream with Magenta focus */
const inputClassName =
  "border-[#d4af37]/20 bg-[#0a1229]/60 text-[#f5f5dc] placeholder:text-[#f5f5dc]/30 focus:border-[#e11d48]/60 focus:ring-[#e11d48]/20 focus:ring-2 transition-all";

export default function RegisterForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const formId = useId();
  const submitRef = useRef(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
    },
    mode: "onChange",
  });

  const { isSubmitting, isValid } = form.formState;
  const passwordValue = useWatch({ control: form.control, name: "password" }) ?? "";
  const confirmValue = useWatch({ control: form.control, name: "confirmPassword" }) ?? "";

  const strength = useMemo(() => getStrength(passwordValue), [passwordValue]);
  const strengthInfo = STRENGTH_CONFIG[Math.max(0, strength - 1)] ?? STRENGTH_CONFIG[0];

  // Real-time password match indicator
  const passwordsMatch = useMemo(() => {
    if (!confirmValue) return null;
    return passwordValue === confirmValue;
  }, [passwordValue, confirmValue]);

  const onSubmit = useCallback(
    async (values: RegisterValues) => {
      // Prevent double submit
      if (submitRef.current) return;
      submitRef.current = true;

      setError(null);

      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as { error?: string };
          const msg = payload.error ?? "Registration failed.";
          // Friendly messages for known errors
          if (msg.includes("rate")) {
            setError("Too many attempts. Please wait a moment and try again.");
          } else if (msg.includes("already") || msg.includes("exists")) {
            setError("An account with this email already exists.");
          } else {
            setError(msg);
          }
          return;
        }

        setSuccess(true);
        router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
      } finally {
        submitRef.current = false;
      }
    },
    [router]
  );

  useEffect(() => {
    const emailParam = sp.get("email");
    if (emailParam) {
      form.setValue("email", emailParam);
    }
  }, [form, sp]);

  // IDs for aria-describedby
  const passwordHelpId = `${formId}-password-help`;
  const passwordStrengthId = `${formId}-password-strength`;
  const confirmMatchId = `${formId}-confirm-match`;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <Alert variant="destructive" className="border-[#e11d48]/30 bg-[#e11d48]/10 text-[#f5f5dc]">
            <AlertTitle>Registration failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f5f5dc]">
            <AlertTitle>Check your email</AlertTitle>
            <AlertDescription>
              We&apos;ve sent a verification link to your email. Click it to activate your account.
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={`${formId}-fullName`} className="text-[#f5f5dc]/80">
                Full name (optional)
              </FormLabel>
              <FormControl>
                <Input
                  id={`${formId}-fullName`}
                  placeholder="Your name"
                  autoComplete="name"
                  className={inputClassName}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={`${formId}-email`} className="text-[#f5f5dc]/80">
                Email
              </FormLabel>
              <FormControl>
                <Input
                  id={`${formId}-email`}
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  className={inputClassName}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={`${formId}-password`} className="text-[#f5f5dc]/80">
                Password
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    id={`${formId}-password`}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    aria-describedby={`${passwordHelpId} ${passwordStrengthId}`}
                    className={`${inputClassName} pr-10`}
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#f5f5dc]/40 transition-colors hover:text-[#f5f5dc]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>

              {/* Password requirements helper text */}
              <p id={passwordHelpId} className="text-xs text-[#f5f5dc]/40">
                8+ characters with uppercase, lowercase, number, and symbol.
              </p>

              {/* Multi-segment strength indicator */}
              {passwordValue && (
                <div
                  id={passwordStrengthId}
                  className="mt-2 space-y-1.5"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          strength >= level
                            ? strengthInfo.barColor
                            : "bg-[#f5f5dc]/10"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${strengthInfo.textColor}`}>
                      {strengthInfo.label}
                    </span>
                    {strengthInfo.suggestion && (
                      <span className="text-xs text-[#f5f5dc]/40">{strengthInfo.suggestion}</span>
                    )}
                  </div>
                </div>
              )}

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={`${formId}-confirmPassword`} className="text-[#f5f5dc]/80">
                Confirm password
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    id={`${formId}-confirmPassword`}
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    aria-describedby={confirmMatchId}
                    className={`${inputClassName} pr-10`}
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#f5f5dc]/40 transition-colors hover:text-[#f5f5dc]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>

              {/* Real-time match indicator */}
              {passwordsMatch !== null && (
                <p
                  id={confirmMatchId}
                  className={`flex items-center gap-1.5 text-xs ${
                    passwordsMatch ? "text-[#d4af37]" : "text-[#e11d48]"
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  {passwordsMatch ? (
                    <>
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      Passwords match
                    </>
                  ) : (
                    <>
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      Passwords do not match
                    </>
                  )}
                </p>
              )}

              <FormMessage />
            </FormItem>
          )}
        />

        {/* Primary CTA — Gold gradient with Navy text */}
        <Button
          type="submit"
          disabled={isSubmitting || !isValid}
          aria-disabled={isSubmitting || !isValid}
          className="w-full bg-gradient-to-r from-[#d4af37] to-[#f9d976] font-semibold text-[#050a18] shadow-lg shadow-[#d4af37]/25 transition-all hover:scale-[1.02] hover:shadow-[#d4af37]/40 focus-visible:ring-2 focus-visible:ring-[#d4af37] disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </span>
          ) : (
            "Create account"
          )}
        </Button>

        {/* Terms & Privacy */}
        <p className="text-center text-xs text-[#f5f5dc]/40">
          By creating an account, you agree to our{" "}
          <Link
            href="/policies/terms-of-service"
            className="text-[#f5f5dc]/60 underline transition-colors hover:text-[#d4af37]"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/policies/privacy-policy"
            className="text-[#f5f5dc]/60 underline transition-colors hover:text-[#d4af37]"
          >
            Privacy Policy
          </Link>
          .
        </p>

        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-[#f5f5dc]/50 transition-colors hover:text-[#d4af37]">
            Sign in
          </Link>
        </div>
      </form>
    </Form>
  );
}
