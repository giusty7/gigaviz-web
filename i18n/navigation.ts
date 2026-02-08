import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware navigation helpers.
 *
 * Use these instead of next/link and next/navigation in components
 * that need locale-aware routing:
 *
 *   import { Link, redirect, usePathname, useRouter } from "@/i18n/navigation";
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
