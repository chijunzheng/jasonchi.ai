# Feature: Wire Timeline and Cleanup Behavior

**ID:** 03
**Status:** ✅ Completed
**Priority:** High
**Dependencies:** 02

## Description
Pass timeline state through chat containers and ensure cleanup on first token/done/error/retry.

## Acceptance Criteria
- [x] `ChatMain` already passes status into `TypingIndicator`.
- [x] Indicator disappears when assistant stream starts.
- [x] Existing status reset on done/error/retry prevents stale state.
