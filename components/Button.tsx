/* eslint-disable @typescript-eslint/no-explicit-any */
import { cn } from "@/lib/utils";

export type ButtonProps = (
  | React.ButtonHTMLAttributes<HTMLButtonElement>
  | React.AnchorHTMLAttributes<HTMLAnchorElement>
) & {
  variant?: "default" | "outline";
  asChild?: boolean;
};

export function Button({
  className,
  variant = "default",
  asChild,
  ...props
}: ButtonProps) {
  const Comp: any = asChild ? "a" : "button";
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none px-4 py-2",
        variant === "default" &&
          "bg-primary text-primary-foreground hover:opacity-90",
        variant === "outline" &&
          "border border-border bg-transparent hover:bg-muted hover:text-foreground",
        className,
      )}
      {...(props as any)}
    />
  );
}
