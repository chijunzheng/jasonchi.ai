# Feature: Normalize Loading Phases in Chat Hook

**ID:** 01
**Status:** ✅ Completed
**Priority:** High
**Dependencies:** -

## Description
Define deterministic loading phases from backend statuses and local pre-token drafting hints.

## Acceptance Criteria
- [x] Existing hook status events are mapped into step indices in indicator logic.
- [x] Indicator derives active phase index + readable timeline labels.
- [x] Drafting phase now cycles granular sub-steps before first token.
