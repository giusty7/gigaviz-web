# Tailwind CSS v4 Migration Guide

> **Status**: PLANNED  
> **Readiness**: 7/10  
> **Risk**: HIGH — affects 229 components, 418 lines of CSS, all UI primitives  
> **Recommendation**: Execute in a dedicated branch with full visual regression testing

## Pre-Migration Checklist

- [x] Zero `@apply` usage (confirmed Feb 2026)
- [x] Single CSS file (`globals.css`)
- [x] CSS custom properties used throughout (easy to port to `@theme`)
- [x] tailwind-merge@2.6.0 → needs upgrade to v3
- [ ] Visual regression tests setup (Playwright screenshots)
- [ ] Component test coverage expanded (now 5 test files, 33+ component assertions)

## Migration Steps

### Step 1: Install Tailwind CSS v4

```bash
npm install tailwindcss@latest @tailwindcss/postcss@latest @tailwindcss/vite@latest
npm uninstall autoprefixer  # Built into v4
npm install tailwind-merge@3  # v3 required for v4 compatibility
```

### Step 2: Update `postcss.config.mjs`

```js
// BEFORE (v3)
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},  // Remove
  },
};

// AFTER (v4)
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

### Step 3: Update `globals.css`

Replace Tailwind directives:

```css
/* BEFORE (v3) */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* AFTER (v4) */
@import "tailwindcss";
```

### Step 4: Convert `tailwind.config.ts` → CSS `@theme`

The entire `tailwind.config.ts` must be converted to a `@theme` block in `globals.css`.

```css
@import "tailwindcss";

@theme {
  /* Colors */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-primary: var(--accent);
  --color-primary-foreground: var(--accent-foreground);

  /* Gigaviz brand colors */
  --color-gigaviz-navy: var(--gv-navy);
  --color-gigaviz-navy-light: var(--gv-navy-light);
  --color-gigaviz-gold: var(--gv-gold);
  --color-gigaviz-gold-bright: var(--gv-gold-bright);
  --color-gigaviz-magenta: var(--gv-magenta);
  --color-gigaviz-magenta-neon: var(--gv-magenta-neon);
  --color-gigaviz-cream: var(--gv-cream);
  --color-gigaviz-cream-soft: var(--gv-cream-soft);
  --color-gigaviz-bg: var(--gv-bg);
  --color-gigaviz-surface: var(--gv-surface);
  --color-gigaviz-card: var(--gv-card);
  --color-gigaviz-card-cream: var(--gv-card-cream);
  --color-gigaviz-text: var(--gv-text);
  --color-gigaviz-muted: var(--gv-muted);
  --color-gigaviz-border: var(--gv-border);
  --color-gigaviz-primary: var(--gv-accent);
  --color-gigaviz-accent: var(--gv-accent);
  --color-gigaviz-accent2: var(--gv-accent-2);
  --color-gigaviz-accentSoft: var(--gv-accent-soft);
  --color-gigaviz-magentaSoft: var(--gv-magenta-soft);

  /* Fonts */
  --font-sans: var(--font-gv), system-ui, ui-sans-serif, sans-serif;
  --font-gv: var(--font-gv), system-ui, ui-sans-serif, sans-serif;
  --font-gvDisplay: var(--font-gv-display), ui-serif, serif;
  --font-display: var(--font-gv-display), ui-serif, serif;

  /* Border radius */
  --radius-sm: var(--gv-radius-sm);
  --radius-md: var(--gv-radius-md);
  --radius-lg: var(--gv-radius-lg);
  --radius-xl: var(--gv-radius-xl);
  --radius-2xl: var(--gv-radius-2xl);

  /* Breakpoints */
  --breakpoint-sm: 360px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}
```

### Step 5: Class Name Renames (Breaking Changes)

| v3 Class | v4 Class | Files Affected |
|----------|----------|----------------|
| `shadow-sm` | `shadow-xs` | card.tsx, tokens-tabs.tsx, etc. |
| `shadow` | `shadow-sm` | multiple |
| `shadow-md` | `shadow` | multiple |
| `ring-offset-*` | ring utility with inset | button.tsx, input.tsx, switch.tsx, checkbox.tsx, dialog.tsx, sheet.tsx, slider.tsx |
| `blur-sm` | `blur-xs` | glass effects |
| `rounded-sm` | `rounded-xs` | checkbox.tsx, dialog.tsx, sheet.tsx |
| `outline-none` | `outline-hidden` | multiple |

### Step 6: Update `tailwind-merge` calls

tailwind-merge v3 has a new API. Check `lib/utils.ts`:

```typescript
// v2 → v3: Generally compatible, but verify custom config
import { twMerge } from "tailwind-merge";
```

### Step 7: Delete `tailwind.config.ts`

After converting all config to `@theme`, delete the config file.

### Step 8: Test

```bash
npm run typecheck
npm run lint
npm run build
npm test
npx playwright test  # Visual regression
```

## Affected Files (Estimated)

- `tailwind.config.ts` — DELETE
- `postcss.config.mjs` — UPDATE
- `app/globals.css` — MAJOR REWRITE
- `components/ui/*.tsx` — ~15 files (class name renames)
- `components/marketing/*.tsx` — ~5 files
- `components/tokens/*.tsx` — ~2 files
- `lib/utils.ts` — tailwind-merge update
- `package.json` — dependency changes
- `vitest.config.ts` — may need update for CSS processing
- Component test files — class name assertions update

## Risk Mitigation

1. **Branch**: Execute in `feat/tailwind-v4` branch
2. **Screenshots**: Capture Playwright screenshots before/after
3. **Incremental**: Test each step with `npm run build`
4. **Rollback**: Keep `tailwind.config.ts` backup until verified
5. **CI**: Ensure all 1515 tests pass before merge
