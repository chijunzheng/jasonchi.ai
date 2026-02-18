# Original Plan: Embedding Model 404 Fix

**Date:** 2026-02-12  
**Issue:** Backend chat pipeline fails while building content index with `404 models/text-embedding-004 is not found`.

## Goal

Restore embedding generation during content-index build by switching to a currently supported Gemini embedding model.

## Root Cause Evidence

- Error originates from `GoogleGenerativeAIEmbeddings` call in `backend/graph/tools/content_index.py`.
- Current default model in `backend/config.py` is `models/text-embedding-004`.
- Live model listing for current API key shows embeddings support for `models/gemini-embedding-001` and not `models/text-embedding-004`.

## Implementation Plan

1. Update default embedding model in backend settings to `models/gemini-embedding-001`.
2. Keep env override behavior unchanged (operators can still set `EMBEDDING_MODEL`).
3. Validate by running a minimal embedding call through current factory path.
4. Run a code-review pass focused on regression risk and config impacts.

## Acceptance Criteria

- Content-index embedding calls no longer fail with 404 for default config.
- No changes required to existing env config mechanism.
- Validation command succeeds with current environment.
