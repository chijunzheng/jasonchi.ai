# Jason.AI — Full Implementation Plan

## Overview

Build the complete Jason.AI interactive AI resume platform from greenfield. Three pre-implementation steps, then 17 features organized by dependency tier.

**Current state:** Only `project-spec.md` exists. No code, no repo, no dependencies.

---

## Pre-Implementation Steps

### Step 1: Update `project-spec.md`
Incorporate all discussion decisions into the living spec:
- Replace sidebar chat layout → horizontal category pills + full-width chat
- Add new features: starter prompts, follow-up chips, session summary, micro-commitment CTA, confidence indicator, meta.md
- Move JD Analyzer CTA to hero section
- Replace progress bar → contribution heatmap
- Move agent traces to Phase 2
- Update stack: Next.js App Router + shadcn/ui + Geist fonts
- Update content strategy: first-person conversational tone with Situation/Action/Result/Real Talk structure
- Add client-side-first architecture (Next.js route handlers as MVP backend, FastAPI + LangGraph as Phase 2)
- Replace ADK with LangGraph (higher job market demand, richer agent traces, model-agnostic)

### Step 2: Create Content File Templates
Create template markdown files for the user to fill in:
- `frontend/src/content/work-experience.md`
- `frontend/src/content/projects.md`
- `frontend/src/content/skills.md`
- `frontend/src/content/education.md`
- `frontend/src/content/honest-section.md`
- `frontend/src/content/meta.md`

Each template uses the story-based structure:
```
## [Entry Name]
### The Situation — [what you walked into]
### What I Did — [your approach, decisions, trade-offs]
### The Result — [outcomes with numbers]
### Real Talk — [honest reflection]
### Tech I Used — [comma-separated]
```

### Step 3: Create Feature Tasks
Use `/create-features` to generate trackable feature tasks from this plan.

---

## Architecture

```
Next.js App Router (Vercel)
├── Server Components → Hero section (fast SSR)
├── Client Components → Chat, JD Analyzer
├── Route Handlers → Gemini API proxy (MVP backend)
│   ├── /api/chat (streaming SSE)
│   ├── /api/analyze-jd (JSON response)
│   ├── /api/cover-letter (streaming)
│   ├── /api/session-summary
│   └── /api/github (cached proxy)
└── Content → Markdown files loaded at build/runtime

Phase 2: FastAPI + LangGraph on Cloud Run (same API contract)
```

**Stack:** Next.js 14+ · TypeScript · Tailwind CSS · shadcn/ui · Geist fonts · Gemini 2.0 Flash (+ Pro for JD analysis)

---

## Feature Breakdown

### TIER 0: Foundation

| ID | Feature | Complexity | Dependencies |
|----|---------|-----------|--------------|
| F0 | Project Scaffolding & Design System | S | None |
| F1 | Content System (loader + templates) | S | F0 |

### TIER 1: Core UI (parallel after Tier 0)

| ID | Feature | Complexity | Dependencies |
|----|---------|-----------|--------------|
| F2 | Hero Section | M | F0 |
| F3 | Chat UI Shell (no AI) | L | F0 |
| F4 | Theme Toggle & Layout | S | F0 |

### TIER 2: AI Integration

| ID | Feature | Complexity | Dependencies |
|----|---------|-----------|--------------|
| F5 | AI Chat Backend (Route Handlers) | L | F0, F1 |
| F6 | Wire Chat UI to AI | M | F3, F5 |

### TIER 3: JD Analysis

| ID | Feature | Complexity | Dependencies |
|----|---------|-----------|--------------|
| F7 | JD Analyzer | L | F0, F1, F5 |
| F8 | Cover Letter Generator | S | F7 |

### TIER 4: Engagement (parallel after Tier 2)

| ID | Feature | Complexity | Dependencies |
|----|---------|-----------|--------------|
| F9 | Contribution Heatmap | M | F0 |
| F10 | Session Summary | M | F6 |
| F11 | Micro-Commitment CTA | S | F0 |
| F12 | Analytics & UTM Tracking | S | F0 |

### TIER 5: Polish

| ID | Feature | Complexity | Dependencies |
|----|---------|-----------|--------------|
| F13 | SEO, OG Tags, Performance | S | F2, F3, F4 |
| F14 | Accessibility Audit | M | F2, F3, F7 |
| F15 | Resume PDF Download | S | F12 |

### TIER 6: Phase 2 (Post-Launch)

| ID | Feature | Complexity | Dependencies |
|----|---------|-----------|--------------|
| F16 | FastAPI + LangGraph Backend | L | F5 |
| F17 | Agent Traces (LangSmith) | M | F16 |

---

## Implementation Sequence

| Sprint | Days | Features | Focus |
|--------|------|----------|-------|
| 1 | 1-2 | F0, F1, F4 | Foundation + content system |
| 2 | 3-5 | F2, F3, F12 | Core UI + analytics |
| 3 | 6-8 | F5, F6 | AI integration |
| 4 | 9-11 | F7, F8 | JD analysis + cover letters |
| 5 | 12-14 | F9, F10, F11, F13, F14, F15 | Engagement + polish |
| Phase 2 | Post-launch | F16, F17 | LangGraph backend + agent traces |

---

## Project Structure

```
jasonchi.ai/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── globals.css
│   │   │   └── api/
│   │   │       ├── chat/route.ts
│   │   │       ├── analyze-jd/route.ts
│   │   │       ├── cover-letter/route.ts
│   │   │       ├── session-summary/route.ts
│   │   │       └── github/route.ts
│   │   ├── components/
│   │   │   ├── ui/              (shadcn)
│   │   │   ├── hero/
│   │   │   ├── chat/
│   │   │   ├── jd-analyzer/
│   │   │   ├── activity/
│   │   │   └── layout/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── types/
│   │   └── content/             (markdown files)
│   ├── public/
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── package.json
├── backend/                      (Phase 2 — LangGraph)
│   ├── main.py
│   ├── graph/
│   │   ├── state.py
│   │   ├── nodes/
│   │   ├── tools/
│   │   ├── edges.py
│   │   └── builder.py
│   ├── content/
│   ├── prompts/
│   └── Dockerfile
├── project-spec.md
└── README.md
```

---

## Verification Plan

After each tier:
- **Tier 0**: `pnpm dev` starts, theme toggle works, content loads
- **Tier 1**: Hero renders with animations, chat UI works with mock data, responsive on mobile
- **Tier 2**: Send message → receive streamed AI response, follow-up chips appear, conversation has memory
- **Tier 3**: Paste JD → see animated score + strengths/gaps, generate cover letter
- **Tier 4**: Heatmap renders, session summary generates, analytics events fire
- **Tier 5**: Lighthouse 90+, axe-core passes, OG tags validate

Full E2E flow: Visit site → scan hero → paste JD → see analysis → chat about gaps → get session summary → schedule call
