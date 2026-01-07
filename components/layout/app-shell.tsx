import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AppShellProps = {
  sidebar: ReactNode;
  header?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function AppShell({ sidebar, header, children, className }: AppShellProps) {
  return (
    <div className={cn("min-h-screen bg-gigaviz-bg text-gigaviz-cream", className)}>
      <div className="flex min-h-screen">
        <aside className="hidden w-64 border-r border-gigaviz-border bg-black/30 px-5 py-6 lg:flex lg:flex-col">
          {sidebar}
        </aside>
        <div className="flex-1">
          <header className="sticky top-0 z-20 border-b border-gigaviz-border bg-black/40 backdrop-blur">
            {header}
          </header>
          <main className="px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
