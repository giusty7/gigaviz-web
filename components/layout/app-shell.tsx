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
    <div className={cn("min-h-screen bg-background text-foreground antialiased", className)}>
      <div className="flex min-h-screen">
        {/* Left Sidebar - Navy Glassmorphism (10 Pillars Navigation) */}
        <aside className="hidden w-64 flex-col border-r border-[#d4af37]/10 bg-[#050a18]/95 px-5 py-6 backdrop-blur-2xl lg:flex">
          {sidebar}
        </aside>
        <div className="flex-1">
          {/* Royal Topbar - Slim Glassmorphism */}
          <header className="sticky top-0 z-20 border-b border-[#d4af37]/15 bg-[#050a18]/80 backdrop-blur-xl">
            {header}
          </header>
          <main className="bg-background px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
