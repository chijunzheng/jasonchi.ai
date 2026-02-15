# Feature: Replace Unsupported Default Embedding Model

**ID:** 01  
**Status:** ✅ Completed  
**Priority:** High  
**Estimated Complexity:** Low  
**Dependencies:** -

## Description

Switch backend default embedding model to one supported by the current Gemini API key/environment.

## Acceptance Criteria

- [x] `backend/config.py` default `embedding_model` is updated to supported model ID.
- [x] Minimal runtime embedding call succeeds using default config.
- [x] Existing env override behavior remains intact.

## Implementation Details

### Files to Modify

- `backend/config.py` - Update default model identifier.

## Testing Requirements

- [x] Run a minimal embedding call with `make_embeddings_model().aembed_documents(...)`.
- [x] Confirm no import/runtime regressions in the touched path.

## Implementation Checklist

- [x] Update config default.
- [x] Execute targeted runtime validation.
- [x] Perform code-review pass.
- [x] Mark feature complete in overview.

---

**Created:** 2026-02-12  
**Last Updated:** 2026-02-12  
**Implemented By:** Codex
