# Feature: Backend JD-Aware Chat Responses

**ID:** 03
**Status:** ✅ Completed
**Priority:** High
**Estimated Complexity:** Low
**Dependencies:** None (backend-only, can be done in parallel with frontend)

## Description

Add `jobDescription` field to `ChatRequest`, pass it to `GraphState.job_description`, and inject JD context into the QA node's system prompt when present. All answer paths (small resume, fast path, reflective) converge through `_generate_answer`, making it the single injection point.

## Acceptance Criteria

- [x] `ChatRequest` model includes optional `jobDescription` field (max 10000 chars)
- [x] Chat endpoint passes `jobDescription` to `GraphState.job_description`
- [x] `JD_CONTEXT_SECTION` template added to `prompts/templates.py`
- [x] `_generate_answer` in `qa.py` appends JD context to system prompt when `state.job_description` is set
- [x] Empty/None `job_description` has no effect (no regression)

## Files Modified

- `backend/main.py` - Added `jobDescription` to `ChatRequest`, passed to `GraphState`
- `backend/prompts/templates.py` - Added `JD_CONTEXT_SECTION` template
- `backend/graph/nodes/qa.py` - Imported and injected `JD_CONTEXT_SECTION` in `_generate_answer`

## Key Decisions

- **Single injection point in `_generate_answer`:** All 3 answer paths (small resume, fast, reflective) call this function, so JD context is automatically available everywhere
- **Prompt appended, not prepended:** JD context comes after resume content to avoid diluting the core identity

---

**Created:** 2026-02-13
**Implemented By:** Claude
