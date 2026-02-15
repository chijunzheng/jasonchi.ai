# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Planning Instructions

- Every time you finish planning with native planning mode, use `/create-features` to create plan files before implementing.
- Update plan files in `plan/` directory after completing implementation of each feature.

## Commands

### Frontend (`frontend/`)

```bash
pnpm dev          # Dev server on :3000 (Turbopack)
pnpm build        # Production build (use to verify no broken imports)
pnpm lint         # ESLint
pnpm start        # Start production build
```

### Backend (`backend/`)

```bash
python main.py                      # Dev server on :8000
uvicorn main:app --reload --port 8000  # Alternative with hot reload
python -m backend.eval.runner       # Batch eval (50 questions, 5 tiers)
```

### Adding shadcn/ui Components

```bash
cd frontend && npx shadcn add <component>
```

## Architecture

### Dual-Mode Frontend ↔ Backend

The frontend runs in two modes based on `BACKEND_URL` in `frontend/.env.local`:

- **Without `BACKEND_URL`:** Next.js API routes (`app/api/*/route.ts`) call Gemini directly via `@google/generative-ai`. Content loaded from `frontend/src/content/*.md`.
- **With `BACKEND_URL=http://localhost:8000`:** API routes proxy to FastAPI backend via `lib/backend-proxy.ts`. Backend runs the reflective agentic retrieval pipeline.

### API Routes (6 endpoints)

| Route | Method | Response | Purpose |
|-------|--------|----------|---------|
| `/api/chat` | POST | SSE stream | Chat with resume AI |
| `/api/analyze-jd` | POST | JSON | Job description fit analysis |
| `/api/cover-letter` | POST | SSE stream | Generate cover letter |
| `/api/session-summary` | POST | JSON | Summarize conversation |
| `/api/lead` | POST | JSON | Lead capture |
| `/api/github` | GET | JSON | GitHub activity data |

### SSE Event Types

```
text       → streamed answer chunks
followUps  → suggested follow-up questions
trace      → retrieval execution trace
eval       → shadow A/B comparison (when ENABLE_SHADOW_EVAL=true)
done       → stream complete
error      → error message
```

### Backend RAG Pipeline (LangGraph)

3-phase reflective retrieval: **Assess** (Self-RAG) → **Retrieve** (A-RAG with 3 tool types) → **Evaluate+Answer** (CRAG corrective re-retrieval).

Key files:
- `graph/builder.py` — LangGraph StateGraph assembly
- `graph/state.py` — GraphState schema
- `graph/nodes/qa.py` — Main QA node (assess, retrieve, evaluate, answer)
- `graph/nodes/router.py` — Routes to chat, JD analyzer, cover letter, or session summary
- `graph/tools/content_index.py` — ContentIndex singleton: keyword_search, semantic_search, get_full_category, get_all_summaries
- `graph/tools/proposition_index.py` — LLM-decomposed atomic facts via Gemini Flash
- `config.py` — Pydantic Settings + `gemini_throttle()`/`gemini_release()` rate limiting

**Fast path:** Category-scoped queries skip the assess phase, go directly to `full_context`.

### Frontend Component Architecture

- `app/page.tsx` — Main page, switches between hero and chat views
- `components/hero/hero-section.tsx` — Hero card with avatar, status, tagline, stats, quick facts, social links
- `components/chat/chat-section.tsx` — Owns chat state via `useChat` hook, passes to `ChatSidebar` + `ChatMain`
- `hooks/use-chat.ts` — Central chat state management (messages, streaming, SSE)
- `lib/sse-client.ts` — SSE stream parser
- `lib/content-loader.ts` — Loads markdown content via `gray-matter`

### Content System

6 markdown files in `frontend/src/content/` with YAML frontmatter:
`work-experience.md`, `projects.md`, `skills.md`, `education.md`, `honest-section.md`, `meta.md`

The backend copies these at Docker build time → `backend/content_source/`. Backend indexes them into propositions (atomic facts) and embeddings (text-embedding-004 + numpy cosine similarity) at startup.

## Styling

- **Tailwind CSS v4** — uses `@theme inline` blocks in `globals.css`, NOT `tailwind.config.js`
- **Dual accent theme:** blue (oklch 262 hue) in light mode, amber (oklch 86 hue) in dark mode
- **CSS custom properties:** `--accent-gradient-from`, `--accent-gradient-to` auto-adapt to theme
- **shadcn/ui:** New York style, components in `components/ui/`

## Environment Variables

### `frontend/.env.local`

```
GEMINI_API_KEY=              # Required
BACKEND_URL=                 # Optional — omit for MVP mode, set to http://localhost:8000 for backend
GITHUB_TOKEN=                # Optional — increases GitHub API rate limits
```

### `backend/.env` (or root `.env`)

```
GEMINI_API_KEY=              # Required
LANGSMITH_API_KEY=           # Optional — enables LangSmith tracing
ENABLE_SHADOW_EVAL=false     # Optional — A/B eval (naive vs reflective)
```

## Critical Gotchas

- **Pydantic Settings `env_file`** resolves relative to CWD, not the config file. Run backend from `backend/` directory.
- **NEVER put side effects** (API calls) inside React `setState` updater functions — strict mode runs them twice.
- **Gemini rate limiting** needs BOTH concurrency control AND rate control. `gemini_throttle()`/`gemini_release()` in `config.py` enforces max 1 concurrent call + 4s gap.
- **Kill retrying processes** before debugging rate limits — their exponential backoff consumes quota silently.
- **Content changes** require backend restart to rebuild the content index (propositions + embeddings are computed at startup).


When commiting, don't mention Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>" — we want to keep the AI contribution invisible in commit history, as it's a tool usage rather than a co-authoring role. Just write the commit message as if you were doing it solo, without referencing the AI assistant.