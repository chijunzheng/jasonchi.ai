# Feature: Reduce Per-Request QA Latency

**ID:** 02  
**Status:** ✅ Completed  
**Priority:** High  
**Estimated Complexity:** Low  
**Dependencies:** 01

## Description

Reduce prompt size and call count in QA fast path for large categories.

## Acceptance Criteria

- [x] QA fast path caps category context for oversized content.
- [x] Follow-up generation uses deterministic defaults unless explicitly enabled.
- [x] No API response shape changes.

## Files to Modify

- `backend/config.py`
- `backend/graph/nodes/qa.py`
