# Feature: Backend Status SSE Events

**ID:** 02
**Status:** ✅ Completed
**Priority:** High
**Dependencies:** 01

## Description
Emit subtle phase-status updates so users see progress before first text tokens appear.

## Acceptance Criteria
- [x] Fast and reflective stream paths emit `status` events.
- [x] API forwards `status` events over SSE.
- [x] Text streaming remains unchanged.

## Implementation Notes
- Added status emits in `backend/graph/nodes/qa.py` for assess/retrieve/answer phases.
- Added SSE passthrough for status in `backend/main.py`.
