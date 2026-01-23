"use client";

const nodes = [
  { id: "meta", label: "Meta Hub", angle: -25, color: "gold" },
  { id: "helper", label: "Helper AI", angle: 90, color: "magenta" },
  { id: "studio", label: "Studio", angle: 205, color: "gold" },
];

export function HeroOrb() {
  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[340px] items-center justify-center md:max-w-[380px]">
      {/* Outer glow ring */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-gigaviz-gold/10 via-gigaviz-magenta/5 to-transparent blur-2xl"
      />

      {/* Connector lines */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 340 340"
      >
        <defs>
          <linearGradient id="lineGradGold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--gv-gold)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--gv-gold)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--gv-gold)" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="lineGradMagenta" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--gv-magenta)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--gv-magenta)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--gv-magenta)" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        {nodes.map((node) => {
          const cx = 170;
          const cy = 170;
          const rad = (node.angle * Math.PI) / 180;
          const r = 130;
          const x2 = cx + r * Math.cos(rad);
          const y2 = cy + r * Math.sin(rad);
          const gradId = node.color === "gold" ? "url(#lineGradGold)" : "url(#lineGradMagenta)";
          return (
            <line
              key={node.id}
              x1={cx}
              y1={cy}
              x2={x2}
              y2={y2}
              stroke={gradId}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* Satellite nodes */}
      {nodes.map((node) => {
        const rad = (node.angle * Math.PI) / 180;
        const r = 130;
        const x = 50 + (r / 170) * 50 * Math.cos(rad);
        const y = 50 + (r / 170) * 50 * Math.sin(rad);
        const glowClass =
          node.color === "gold"
            ? "shadow-[0_0_24px_-6px_var(--gv-gold)]"
            : "shadow-[0_0_24px_-6px_var(--gv-magenta)]";
        const borderClass =
          node.color === "gold" ? "border-gigaviz-gold/40" : "border-gigaviz-magenta/40";
        return (
          <div
            key={node.id}
            className={`absolute flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border bg-card/80 backdrop-blur transition hover:scale-105 ${borderClass} ${glowClass}`}
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div className="text-center">
              <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">
                {node.label}
              </span>
              <span className="mt-0.5 block text-[10px] text-muted-foreground/80">
                Shared plane
              </span>
            </div>
          </div>
        );
      })}

      {/* Core node */}
      <div className="relative z-10 flex h-28 w-28 flex-col items-center justify-center rounded-2xl border border-gigaviz-gold/50 bg-card/90 shadow-[0_20px_60px_-20px_var(--gv-gold)] backdrop-blur-lg md:h-32 md:w-32">
        <span className="text-[10px] uppercase tracking-widest text-gigaviz-gold">Core</span>
        <span className="mt-1 text-sm font-semibold text-foreground">Gigaviz Platform</span>
        <span className="mt-0.5 text-[10px] text-muted-foreground">Auth · Billing · Audit</span>
      </div>
    </div>
  );
}
