"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function VerifyEmailClient() {
  const supabase = useMemo(() => supabaseClient(), []);
  const sp = useSearchParams();
  const email = sp.get("email");

  const [status, setStatus] = useState<"checking" | "verified" | "pending">(
    "checking"
  );

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const user = data.user;
      if (user?.email_confirmed_at || user?.confirmed_at) {
        setStatus("verified");
      } else {
        setStatus("pending");
      }
    });
    return () => {
      active = false;
    };
  }, [supabase]);

  const description =
    status === "verified"
      ? "Your email is verified. You can continue to your workspace."
      : "Check your inbox for the verification link. Once verified, you can sign in.";

  return (
    <div className="space-y-4 text-sm text-gigaviz-muted">
      <p>{description}</p>
      {email ? <p>Sent to: {email}</p> : null}
      <div className="flex flex-col gap-2">
        {status === "verified" ? (
          <Button asChild>
            <Link href="/app">Continue</Link>
          </Button>
        ) : (
          <Button asChild variant="secondary">
            <Link href="/login">Back to login</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
