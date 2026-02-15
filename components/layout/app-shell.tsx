import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AppShellProps = {
  sidebar: ReactNode;
  header?: ReactNode;
  children: ReactNode;
  className?: string;
  collapsed?: boolean;
};

export function AppShell({ sidebar, header, children, className, collapsed = false }: AppShellProps) {
  const columnTemplate = collapsed ? "lg:grid-cols-[72px_1fr]" : "lg:grid-cols-[280px_1fr]";
  const asideWidth = collapsed ? "w-[72px] px-3 items-center" : "w-[280px] px-5";

  return (
    <div className={cn("min-h-screen bg-background text-foreground antialiased", className)}>
      <div
        className={cn(
          "min-h-screen transition-[grid-template-columns] duration-200 ease-out",
          "lg:grid",
          columnTemplate
        )}
      >
        {/* Left Sidebar - Navy Glassmorphism (8 Products Navigation) */}
        <aside
          className={cn(
            "hidden flex-col border-r border-[#d4af37]/10 bg-[#050a18]/95 py-6 backdrop-blur-2xl transition-[width,padding] duration-200 ease-out lg:flex",
            asideWidth
          )}
        >
          {sidebar}
        </aside>
        <div className="flex min-h-screen flex-col">
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
