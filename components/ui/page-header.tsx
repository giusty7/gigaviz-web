import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ─────────── Types ─────────── */
type PageHeaderProps = {
  /** Page title (h1) */
  title: string;
  /** Optional subtitle/description below the title */
  description?: string;
  /** Optional badge rendered above the title (e.g. plan badge, icon) */
  badge?: ReactNode;
  /** Optional action slot on the right side (buttons, links) */
  actions?: ReactNode;
  /** Additional CSS classes for the wrapper */
  className?: string;
  /** Additional CSS classes for the title */
  titleClassName?: string;
};

/**
 * Shared page header component for consistent styling across all modules.
 *
 * Standard usage:
 * ```tsx
 * <PageHeader
 *   title="Meta Hub"
 *   description="Enterprise-grade integration hub for WhatsApp, Instagram & Messenger"
 *   actions={<Button>Connect</Button>}
 * />
 * ```
 */
export function PageHeader({
  title,
  description,
  badge,
  actions,
  className,
  titleClassName,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0 flex-1 space-y-1">
        {badge && <div className="mb-2">{badge}</div>}
        <h1
          className={cn(
            "text-2xl font-bold tracking-tight text-foreground sm:text-3xl",
            titleClassName
          )}
        >
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
