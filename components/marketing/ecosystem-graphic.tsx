"use client";

const nodes = [
  { id: "meta", label: "Meta Hub", sub: "WhatsApp API", angle: -30, color: "gold" as const },
  { id: "helper", label: "Helper AI", sub: "Copilot + RAG", angle: 90, color: "magenta" as const },
  { id: "studio", label: "Studio", sub: "Templates", angle: 210, color: "gold" as const },
];

export function EcosystemGraphic() {
  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[360px] items-center justify-center md:max-w-[400px]">
      {/* Outer ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[-20%] rounded-full bg-gradient-to-br from-gigaviz-gold/8 via-transparent to-gigaviz-magenta/5 blur-3xl"
      />

      {/* Connector lines with gradient strokes */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 360 360"
      >
        <defs>
          <linearGradient id="connectorGold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--gv-gold)" stopOpacity="0.1" />
            <stop offset="40%" stopColor="var(--gv-gold)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--gv-gold)" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="connectorMagenta" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--gv-magenta)" stopOpacity="0.15" />
            <stop offset="40%" stopColor="var(--gv-magenta)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--gv-magenta)" stopOpacity="0.9" />
          </linearGradient>
          <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {nodes.map((node) => {
          const cx = 180;
          const cy = 180;
          const rad = (node.angle * Math.PI) / 180;
          const r = 125;
          const x2 = cx + r * Math.cos(rad);
          const y2 = cy + r * Math.sin(rad);
          const gradId = node.color === "gold" ? "url(#connectorGold)" : "url(#connectorMagenta)";
          return (
            <line
              key={node.id}
              x1={cx}
              y1={cy}
              x2={x2}
              y2={y2}
              stroke={gradId}
              strokeWidth="2"
              strokeLinecap="round"
              filter="url(#lineGlow)"
            />
          );
        })}
      </svg>

      {/* Satellite nodes */}
      {nodes.map((node) => {
        const rad = (node.angle * Math.PI) / 180;
        const r = 125;
        const x = 50 + (r / 180) * 50 * Math.cos(rad);
        const y = 50 + (r / 180) * 50 * Math.sin(rad);
        
        const isAI = node.color === "magenta";
        
        return (
          <div
            key={node.id}
            className={`
              absolute flex h-[5.5rem] w-[5.5rem] -translate-x-1/2 -translate-y-1/2 
              flex-col items-center justify-center rounded-2xl
              transition-all duration-300 hover:scale-105
              ${isAI 
                ? "glass-cream text-gigaviz-navy neon-magenta" 
                : "glass-dark border-gigaviz-gold/30 shadow-[0_8px_32px_-8px_var(--gv-gold)]"
              }
            `}
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <span className={`text-[10px] font-semibold uppercase tracking-widest ${isAI ? "text-gigaviz-magenta" : "text-gigaviz-gold"}`}>
              {node.label}
            </span>
            <span className={`mt-0.5 text-[9px] ${isAI ? "text-gigaviz-navy/70" : "text-muted-foreground"}`}>
              {node.sub}
            </span>
            {isAI && (
              <span className="mt-1 inline-flex items-center gap-1 text-[8px] font-medium text-gigaviz-magenta">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gigaviz-magenta" />
                AI-Powered
              </span>
            )}
          </div>
        );
      })}

      {/* Core node - cream with gold accent */}
      <div 
        className="relative z-10 flex h-32 w-32 flex-col items-center justify-center rounded-2xl glass-cream console-border md:h-36 md:w-36"
        style={{
          boxShadow: `
            0 0 0 1px hsla(42 62% 62% / 0.3),
            0 8px 40px -12px var(--gv-gold),
            0 20px 60px -20px hsla(42 62% 62% / 0.4)
          `
        }}
      >
        {/* Inner glow ring */}
        <div 
          aria-hidden
          className="absolute inset-0 rounded-2xl"
          style={{
            background: "linear-gradient(135deg, hsla(42 62% 62% / 0.15) 0%, transparent 50%, hsla(323 70% 60% / 0.08) 100%)"
          }}
        />
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-gigaviz-gold">Core</span>
        <span className="mt-1.5 text-base font-semibold text-gigaviz-navy">Gigaviz Platform</span>
        <span className="mt-1 text-[10px] text-gigaviz-navy/70">Auth · Billing · Audit</span>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_2px_rgba(34,197,94,0.6)]" />
          <span className="text-[9px] font-medium uppercase tracking-wider text-green-600">Online</span>
        </div>
      </div>
    </div>
  );
}
