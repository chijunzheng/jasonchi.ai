# Feature: Project Scaffolding & Design System

**ID:** F0
**Tier:** 0 — Foundation
**Status:** ✅ Completed
**Priority:** High
**Estimated Complexity:** Small
**Dependencies:** None

## Description

Initialize the Next.js project with the complete design system foundation. This is the critical path — every other feature depends on this being done correctly.

## Acceptance Criteria

- [ ] Next.js 14+ App Router project initializes and runs with `pnpm dev`
- [ ] TypeScript configured with strict mode
- [ ] Tailwind CSS configured with shadcn/ui design tokens
- [ ] Geist Sans + Geist Mono fonts loaded via `next/font`
- [ ] `next-themes` installed and ThemeProvider wired (default: light)
- [ ] shadcn/ui components installed: button, card, badge, dialog, input, textarea, tabs, tooltip, separator
- [ ] `lib/utils.ts` with `cn()` helper exists
- [ ] `lib/constants.ts` with site metadata exists
- [ ] `types/` directory structure created
- [ ] `app/layout.tsx` renders with fonts, theme provider, and metadata
- [ ] `app/page.tsx` renders a placeholder page
- [ ] `app/globals.css` has Tailwind directives and CSS variables for theming
- [ ] Project builds without errors (`pnpm build`)

## Implementation Details

### Files to Create

- `frontend/package.json` — dependencies and scripts
- `frontend/next.config.ts` — Next.js configuration
- `frontend/tailwind.config.ts` — Tailwind + shadcn design tokens
- `frontend/tsconfig.json` — TypeScript strict config
- `frontend/components.json` — shadcn/ui configuration
- `frontend/src/app/layout.tsx` — Root layout with fonts + ThemeProvider
- `frontend/src/app/page.tsx` — Placeholder landing page
- `frontend/src/app/globals.css` — Tailwind directives + CSS variables
- `frontend/src/lib/utils.ts` — `cn()` utility (clsx + tailwind-merge)
- `frontend/src/lib/constants.ts` — Site metadata, social links, stats
- `frontend/src/types/index.ts` — Shared type exports

### Key Dependencies

```json
{
  "next": "^14.2",
  "react": "^18.3",
  "typescript": "^5",
  "tailwindcss": "^3.4",
  "@tailwindcss/typography": "latest",
  "next-themes": "latest",
  "clsx": "latest",
  "tailwind-merge": "latest",
  "class-variance-authority": "latest",
  "lucide-react": "latest"
}
```

### shadcn/ui Components to Install

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card badge dialog input textarea tabs tooltip separator
```

### Design System Tokens

**Fonts:**
- `Geist Sans` — headings, body text
- `Geist Mono` — code, stats, technical content

**Colors (CSS Variables):**
- Uses shadcn/ui default tokens (mapped to Tailwind classes)
- Light mode: professional, clean whites and grays
- Dark mode: zinc-based dark palette

**Spacing:** 4px base unit via Tailwind defaults

### Technical Decisions

- **pnpm over npm/yarn:** Faster, disk-efficient, strict dependency resolution
- **`src/` directory:** Keeps app code separate from config files
- **App Router over Pages:** Server Components for hero SSR, route handlers for API
- **Geist fonts via next/font:** Self-hosted, no CLS, no external requests

## Dependencies

### Depends On
- Nothing — this is the foundation

### Blocks
- **F1:** Content System needs project structure
- **F2:** Hero Section needs components and design tokens
- **F3:** Chat UI needs components and design tokens
- **F4:** Theme Toggle needs ThemeProvider
- **F5:** AI Backend needs route handler structure
- **F9, F11, F12:** Various engagement features need base project

## Testing Requirements

- [ ] `pnpm dev` starts without errors
- [ ] `pnpm build` completes without errors
- [ ] Page renders in browser at localhost:3000
- [ ] Theme toggle switches between light/dark (basic wiring)
- [ ] Geist fonts load correctly (inspect via DevTools)
- [ ] shadcn components render correctly

## Implementation Checklist

- [ ] Initialize Next.js project with `create-next-app`
- [ ] Configure TypeScript strict mode
- [ ] Set up Tailwind CSS with design tokens
- [ ] Install and configure Geist fonts
- [ ] Initialize shadcn/ui and install components
- [ ] Set up next-themes with ThemeProvider
- [ ] Create lib/utils.ts and lib/constants.ts
- [ ] Create types directory structure
- [ ] Create root layout with fonts and providers
- [ ] Create placeholder page
- [ ] Verify build passes

## Notes

- Use `pnpm` as package manager throughout the project
- The `frontend/` directory structure is intentional — Phase 2 adds `backend/` alongside it
- Keep `constants.ts` as the single source of truth for site metadata (name, title, social links, stats)

---

**Created:** 2026-02-09
**Last Updated:** 2026-02-09
**Implemented By:** Claude Code
