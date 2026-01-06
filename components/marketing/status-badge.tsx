import { productStatusLabel, type ProductStatus } from "@/lib/products";

const statusStyles: Record<ProductStatus, string> = {
  available:
    "border-[color:var(--gv-accent)] bg-[color:var(--gv-accent-soft)] text-[color:var(--gv-accent)]",
  beta: "border-[color:var(--gv-accent-2)] bg-[color:var(--gv-magenta-soft)] text-[color:var(--gv-accent-2)]",
  coming:
    "border-[color:var(--gv-border)] bg-[color:var(--gv-card-soft)] text-[color:var(--gv-muted)]",
};

export function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${statusStyles[status]}`}
    >
      {productStatusLabel[status]}
    </span>
  );
}
