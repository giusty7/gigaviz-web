import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}
