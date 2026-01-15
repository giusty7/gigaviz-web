import type { ReactNode } from "react";
import { AuthLayoutClient } from "./auth-layout-client";

type AuthLayoutProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Show the Technology Provider trust badge */
  showTrustBadge?: boolean;
  /** Show the 10-pillar ecosystem grid */
  showPillarGrid?: boolean;
};

/**
 * Auth Layout — Imperium Edition
 * Server component wrapper that renders the client-side animated layout
 */
export function AuthLayout(props: AuthLayoutProps) {
  return <AuthLayoutClient {...props} />;
}
