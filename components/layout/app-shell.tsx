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
    <div className={cn("min-h-screen bg-background text-foreground", className)}>
      <div className="flex min-h-screen">
        <aside className="hidden w-64 border-r border-border bg-gigaviz-surface/80 px-5 py-6 lg:flex lg:flex-col backdrop-blur">
          {sidebar}
        </aside>
        <div className="flex-1">
          <header className="sticky top-0 z-20 border-b border-border bg-gigaviz-surface/70 backdrop-blur">
            {header}
          </header>
          <main className="px-6 py-8 bg-background">{children}</main>
        </div>
      </div>
    </div>
  );
}
