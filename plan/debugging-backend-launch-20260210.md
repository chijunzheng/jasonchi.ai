# Backend Launch Debugging — 2026-02-10

## Issues Encountered (in order)

### 1. GEMINI_API_KEY not found
**Symptom:** Frontend shows "GEMINI_API_KEY environment variable is not set"
**Root cause:** Two-layer problem:
- `.env` is at project root (`jasonchi.ai/.env`), not in `backend/` or `frontend/`
- `config.py` used `env_file: ".env"` which resolves relative to CWD, not the config file
- Frontend has its own Next.js API routes (`frontend/src/app/api/chat/route.ts`) that fall back to a direct Gemini client (`frontend/src/lib/gemini.ts`) when `BACKEND_URL` isn't set
- `proxyToBackend()` returned `null` because no `frontend/.env.local` existed

**Fixes applied:**
- `backend/config.py`: `env_file` now searches both `".env"` and `"../.env"` (project root)
- `backend/config.py`: Added `@model_validator` that raises immediately if `gemini_api_key` is empty (fail-fast)
- Created `frontend/.env.local` with `BACKEND_URL=http://localhost:8000`

**Lesson:** Pydantic Settings `env_file` resolves relative to CWD, not the file. Always provide fallback paths. Next.js route handlers have their own independent env var loading.

### 2. No backend logging
**Symptom:** Errors only visible in the frontend error card. Backend terminal showed nothing.
**Root cause:** Zero `logging` usage across the entire backend. All `except Exception: pass` blocks silently swallowed errors.

**Fixes applied:** Added `logging` to 7 backend files:
- `main.py` — logging.basicConfig setup, request/response logging, exception tracebacks
- `qa.py` — pipeline phase logging (assess/retrieve/evaluate)
- `content_index.py` — index build timing, proposition/summary counts
- `proposition_index.py` — decomposition logging, error tracebacks
- `retrieval_tools.py` — tool execution results
- `shadow_runner.py` — shadow pipeline metrics
- `judge.py` — judge scores, exception tracebacks

### 3. Double request from React strict mode
**Symptom:** LangSmith showed 2 LangGraph runs and 2 ChatGoogleGenerativeAI calls for a single user message (4 total traces)
**Root cause:** `use-chat.ts` called `streamResponse()` (async fetch) inside `setMessages()` state updater function. React 18 strict mode calls state updaters twice to detect impure functions, triggering the API call twice.

**Fix applied:**
- Moved `streamResponse()` outside `setMessages()` updater in both `sendMessage` and `selectCategory`
- Added `isLoading` guard to prevent rapid double-clicks

**Lesson:** NEVER put side effects (API calls, logging, subscriptions) inside React state updater functions. They must be pure.

### 4. Shadow eval pipeline doubles API cost
**Symptom:** Every query ran both the reflective pipeline AND a shadow naive pipeline + 5 LLM judge calls
**Root cause:** The A/B eval system was always-on, adding ~6 extra Gemini API calls per query

**Fix applied:**
- `config.py`: Added `enable_shadow_eval: bool = False`
- `main.py`: Shadow task only created when `settings.enable_shadow_eval` is True
- Enable with `ENABLE_SHADOW_EVAL=true` in `.env`

### 5. Gemini 429 rate limit exhaustion
**Symptom:** Persistent "429 Resource exhausted" errors even with semaphore=1 and after waiting 60s
**Root cause:** Multiple compounding factors:
1. `ContentIndex.build()` fires 12+ concurrent API calls via `asyncio.gather()` (6 proposition decompositions + 6 summaries)
2. `asyncio.Semaphore` limits concurrency but NOT rate — calls still fire instantly back-to-back
3. `langchain_google_genai` has built-in exponential backoff retry (2s→4s→8s→16s→32s) that consumes MORE quota with each retry
4. Background processes (backend + test scripts) stuck in retry loops, burning the entire rate window
5. Google trial account may have lower limits than standard Tier 1

**Fixes applied:**
- `config.py`: Replaced bare semaphore with `gemini_throttle()`/`gemini_release()` that enforce:
  - Max 1 concurrent call (semaphore)
  - 4-second minimum gap between calls (~15 RPM max)
- `proposition_index.py`: Skip LLM decomposition for files < 2KB (all current content is < 1KB), saves 6 API calls
- Applied throttle to all API call sites: `proposition_index.py`, `content_index.py`, `qa.py`

**Lesson:** For rate-limited APIs, you need BOTH concurrency control AND rate control. A semaphore alone is insufficient. Also: always kill retrying processes before debugging rate limit issues — their retry loops consume the entire quota window.

## Current API Call Budget

### First request (cold start — builds ContentIndex)
| Phase | API Calls | Time @ 4s/call |
|-------|-----------|----------------|
| Category summaries | 6 | ~24s |
| Embeddings | 1 | ~4s |
| QA answer | 1 | ~4s |
| Follow-ups | 1 | ~4s |
| **Total** | **9** | **~36s** |

### Subsequent requests (warm — index cached)
| Pipeline | API Calls | Time |
|----------|-----------|------|
| Fast path (category) | 2 (answer + follow-ups) | ~8s |
| Reflective path | 4 (assess + evaluate + answer + follow-ups) | ~16s |

## Files Modified in This Session

### Backend
- `backend/config.py` — env_file paths, model_validator, gemini_throttle/release, enable_shadow_eval
- `backend/main.py` — logging setup, conditional shadow eval, structured log statements
- `backend/graph/nodes/qa.py` — logging, gemini_throttle/release on all LLM calls
- `backend/graph/tools/content_index.py` — logging, gemini_throttle/release, build timing
- `backend/graph/tools/proposition_index.py` — logging, gemini_throttle/release, skip LLM for small files
- `backend/graph/tools/retrieval_tools.py` — logging
- `backend/eval/shadow_runner.py` — logging
- `backend/eval/judge.py` — logging

### Frontend
- `frontend/.env.local` — Created with `BACKEND_URL=http://localhost:8000`
- `frontend/src/hooks/use-chat.ts` — Fixed side effect in state updater, added isLoading guard

## Status
All fixes implemented. Backend needs clean restart after rate limit cooldown (~2 min).
First request will be slow (~36s) but should not hit 429 errors.
