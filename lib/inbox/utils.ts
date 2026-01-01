const fmt = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
});

export function fmtTime(iso: string) {
  return fmt.format(new Date(iso));
}

export function clsx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

export function badgeColor(kind: string) {
  switch (kind) {
    case "open": return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "pending": return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "solved": return "bg-sky-500/15 text-sky-300 border-sky-500/30";
    case "spam": return "bg-rose-500/15 text-rose-300 border-rose-500/30";
    case "urgent": return "bg-rose-500/15 text-rose-300 border-rose-500/30";
    case "high": return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "med": return "bg-sky-500/15 text-sky-300 border-sky-500/30";
    case "low": return "bg-slate-500/15 text-slate-300 border-slate-500/30";
    default: return "bg-slate-500/15 text-slate-300 border-slate-500/30";
  }
}
