# Feature: Make LLM Index Enrichment Opt-In

**ID:** 01  
**Status:** ✅ Completed  
**Priority:** High  
**Estimated Complexity:** Medium  
**Dependencies:** -

## Description

Disable expensive LLM-based index enrichment by default and keep it configurable for quality-focused deployments.

## Acceptance Criteria

- [x] Default behavior no longer performs LLM proposition decomposition during index build.
- [x] Default behavior no longer performs LLM summaries during index build.
- [x] Existing deterministic indexing remains functional.
- [x] Operators can re-enable LLM enrichment via config/env.

## Files to Modify

- `backend/config.py`
- `backend/graph/tools/proposition_index.py`
- `backend/graph/tools/content_index.py`
