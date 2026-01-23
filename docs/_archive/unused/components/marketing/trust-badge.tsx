"use client";

/**
 * TrustBadge - Premium cream pill with verified check and spark effect
 * Used in hero section to display Technology Provider status
 * 
 * Note: All SVG coordinates are pre-computed constants to avoid
 * hydration mismatch from floating-point differences between SSR and client.
 */

// Pre-computed ray coordinates for angles [0, 120, 240] degrees
// Formula: x1 = 14 + 9 * cos(rad), y1 = 14 + 9 * sin(rad)
//          x2 = 14 + 12 * cos(rad), y2 = 14 + 12 * sin(rad)
const SPARK_RAYS = [
  { x1: 23, y1: 14, x2: 26, y2: 14 },           // 0°
  { x1: 9.5, y1: 21.79, x2: 8, y2: 24.39 },     // 120°
  { x1: 9.5, y1: 6.21, x2: 8, y2: 3.61 },       // 240°
] as const;

// Pre-computed dot coordinates for angles [30, 90, 150, 210, 270, 330] degrees
// Formula: cx = 14 + 11 * cos(rad), cy = 14 + 11 * sin(rad)
const SPARK_DOTS = [
  { cx: 23.53, cy: 19.5, isGold: true },   // 30°
  { cx: 14, cy: 25, isGold: false },        // 90°
  { cx: 4.47, cy: 19.5, isGold: true },    // 150°
  { cx: 4.47, cy: 8.5, isGold: false },    // 210°
  { cx: 14, cy: 3, isGold: true },          // 270°
  { cx: 23.53, cy: 8.5, isGold: false },   // 330°
] as const;

export function TrustBadge() {
  return (
    <div
      className="inline-flex h-10 items-center gap-3 rounded-full border border-gigaviz-navy/20 bg-gigaviz-cream px-4 shadow-[0_4px_20px_-6px_var(--gv-gold)]"
      role="status"
      aria-label="Verified Technology Provider for WhatsApp Business Platform"
    >
      {/* Spark/Starburst container with check - slightly larger */}
      <div className="relative flex h-7 w-7 items-center justify-center">
        {/* Outer spark rays - 3 short subtle rays */}
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full motion-safe:animate-[spin_25s_linear_infinite]"
          viewBox="0 0 28 28"
          fill="none"
        >
          {SPARK_RAYS.map((ray, i) => (
            <line
              key={i}
              x1={ray.x1}
              y1={ray.y1}
              x2={ray.x2}
              y2={ray.y2}
              stroke="var(--gv-gold)"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity={0.4}
            />
          ))}
        </svg>

        {/* Inner spark dots - 6 tiny dots around the check */}
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 28 28"
          fill="none"
        >
          {SPARK_DOTS.map((dot, i) => (
            <circle
              key={i}
              cx={dot.cx}
              cy={dot.cy}
              r="0.9"
              fill={dot.isGold ? "var(--gv-gold)" : "currentColor"}
              opacity={dot.isGold ? 0.5 : 0.35}
              className={dot.isGold ? "" : "text-green-500"}
            />
          ))}
        </svg>

        {/* Faint glow behind check */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-400/30 blur-sm"
        />

        {/* Check icon - ~12% larger, green filled circle with white check */}
        <svg
          aria-hidden
          className="relative z-10 h-[22px] w-[22px] drop-shadow-[0_0_6px_rgba(34,197,94,0.55)]"
          viewBox="0 0 24 24"
          fill="none"
        >
          {/* Green circle background */}
          <circle cx="12" cy="12" r="10" fill="currentColor" className="text-green-500" />
          {/* White checkmark */}
          <path
            d="M8 12.5L10.5 15L16 9.5"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Badge text */}
      <span className="text-xs font-semibold tracking-tight text-gigaviz-navy">
        Technology Provider — WhatsApp Business Platform
      </span>
    </div>
  );
}
