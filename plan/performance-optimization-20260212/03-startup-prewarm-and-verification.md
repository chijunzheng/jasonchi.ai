# Feature: Startup Prewarm + Verification

**ID:** 03  
**Status:** ✅ Completed  
**Priority:** Medium  
**Estimated Complexity:** Low  
**Dependencies:** 01, 02

## Description

Prewarm the content index in background during app startup and verify syntax/runtime behavior.

## Acceptance Criteria

- [x] Startup schedules background prewarm task (non-blocking).
- [x] Errors in prewarm are logged without crashing startup.
- [x] Validation checks pass for modified modules.

## Files to Modify

- `backend/config.py`
- `backend/main.py`
