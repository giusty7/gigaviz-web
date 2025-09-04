import { cn } from "@/lib/utils";

export default function Section({
  className,
  children,
  id,
}: React.PropsWithChildren<{ className?: string; id?: string }>) {
  return (
    <section id={id} className={cn("py-10 md:py-16", className)}>
      <div className="container">{children}</div>
    </section>
  );
}
