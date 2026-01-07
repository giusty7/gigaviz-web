"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function GAPageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (!GA_ID) return;
    if (typeof window === "undefined") return;
    if (!window.gtag) return;

    const search = window.location.search || "";
    const pagePath = `${pathname}${search}`;

    window.gtag("event", "page_view", {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname]);

  return null;
}
