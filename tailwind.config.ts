import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        primary: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        gigaviz: {
          navy: "var(--gv-navy)",
          "navy-light": "var(--gv-navy-light)",
          gold: "var(--gv-gold)",
          "gold-bright": "var(--gv-gold-bright)",
          magenta: "var(--gv-magenta)",
          "magenta-neon": "var(--gv-magenta-neon)",
          cream: "var(--gv-cream)",
          "cream-soft": "var(--gv-cream-soft)",
          bg: "var(--gv-bg)",
          surface: "var(--gv-surface)",
          card: "var(--gv-card)",
          "card-cream": "var(--gv-card-cream)",
          text: "var(--gv-text)",
          muted: "var(--gv-muted)",
          border: "var(--gv-border)",
          primary: "var(--gv-accent)",
          accent: "var(--gv-accent)",
          accent2: "var(--gv-accent-2)",
          accentSoft: "var(--gv-accent-soft)",
          magentaSoft: "var(--gv-magenta-soft)",
        },
      },
      fontFamily: {
        sans: ["var(--font-gv)", "system-ui", "ui-sans-serif", "sans-serif"],
        gv: ["var(--font-gv)", "system-ui", "ui-sans-serif", "sans-serif"],
        gvDisplay: ["var(--font-gv-display)", "ui-serif", "serif"],
        display: ["var(--font-gv-display)", "ui-serif", "serif"],
      },
      borderRadius: {
        sm: "var(--gv-radius-sm)",
        md: "var(--gv-radius-md)",
        lg: "var(--gv-radius-lg)",
        xl: "var(--gv-radius-xl)",
        "2xl": "var(--gv-radius-2xl)",
      },
      spacing: {
        "gv-1": "var(--gv-space-1)",
        "gv-2": "var(--gv-space-2)",
        "gv-3": "var(--gv-space-3)",
        "gv-4": "var(--gv-space-4)",
        "gv-5": "var(--gv-space-5)",
        "gv-6": "var(--gv-space-6)",
      },
      fontSize: {
        xs: ["var(--gv-text-xs)", { lineHeight: "1.4" }],
        sm: ["var(--gv-text-sm)", { lineHeight: "1.5" }],
        base: ["var(--gv-text-base)", { lineHeight: "1.6" }],
        lg: ["var(--gv-text-lg)", { lineHeight: "1.5" }],
        xl: ["var(--gv-text-xl)", { lineHeight: "1.4" }],
        "2xl": ["var(--gv-text-2xl)", { lineHeight: "1.3" }],
        "3xl": ["var(--gv-text-3xl)", { lineHeight: "1.2" }],
        "4xl": ["var(--gv-text-4xl)", { lineHeight: "1.1" }],
      },
      container: {
        center: true,
        padding: "1rem",
      },
      screens: {
        sm: "360px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
      },
    },
  },
  plugins: [],
};

export default config;
