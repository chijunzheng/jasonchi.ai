# Feature: Frontend Trace Enhancements

**ID:** F23
**Status:** ⬜ Not Started
**Priority:** High
**Estimated Complexity:** Medium
**Dependencies:** F20

## Description

Enhance the trace panel to display the reflective retrieval pipeline: confidence gauge, retrieval decision reasoning, source badges, quality evaluation result, and a visual assess → retrieve → evaluate → answer pipeline indicator.

## Acceptance Criteria

- [ ] `TraceStep` interface extended with: retrievalDecision, retrievalMethod, sourcesUsed, confidenceScore, qualityCheck
- [ ] Confidence gauge: colored bar (red < 0.4, yellow 0.4-0.7, green > 0.7)
- [ ] Retrieval decision reasoning displayed
- [ ] Source badges showing accessed content categories/sections
- [ ] Quality evaluation result shown
- [ ] Visual pipeline: assess → retrieve → evaluate → answer with active state indicators
- [ ] SSE event type updated to include `eval`

## Modified Files

### `frontend/src/lib/sse-client.ts`

```typescript
export interface TraceStep {
  // existing fields...
  readonly retrievalDecision?: string
  readonly retrievalMethod?: string
  readonly sourcesUsed?: readonly string[]
  readonly confidenceScore?: number
  readonly qualityCheck?: string
}

export interface SSEEvent {
  readonly type: 'text' | 'followUps' | 'trace' | 'eval' | 'done' | 'error'
  readonly content?: string | readonly string[] | TraceData | EvalComparison
}
```

### `frontend/src/components/chat/trace-panel.tsx`

Enhanced rendering:
- Confidence gauge component (colored bar)
- Retrieval decision text
- Source badges (pill-shaped tags)
- Quality evaluation badge
- Pipeline visualization (horizontal step indicator)

## Implementation Checklist

- [ ] Add new optional fields to `TraceStep` interface in `sse-client.ts`
- [ ] Add `eval` to SSEEvent type union
- [ ] Create confidence gauge sub-component in trace panel
- [ ] Create source badges sub-component
- [ ] Create pipeline visualization (assess → retrieve → evaluate → answer)
- [ ] Update trace step rendering to show retrieval-specific data
- [ ] Handle missing fields gracefully (backward compatible with old trace data)

---

**Created:** 2026-02-10
**Last Updated:** 2026-02-10
