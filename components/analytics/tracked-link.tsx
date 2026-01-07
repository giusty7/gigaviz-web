"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackCta } from "@/lib/analytics";

type TrackedLinkProps = {
  href: string;
  label: string;
  location: string;
  className?: string;
  children: ReactNode;
};

export default function TrackedLink({
  href,
  label,
  location,
  className,
  children,
}: TrackedLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackCta(label, location, href)}
    >
      {children}
    </Link>
  );
}
