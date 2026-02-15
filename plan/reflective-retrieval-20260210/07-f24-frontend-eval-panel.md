# Feature: Frontend Eval Comparison Panel

**ID:** F24
**Status:** ⬜ Not Started
**Priority:** High
**Estimated Complexity:** Medium
**Dependencies:** F22

## Description

A new collapsible panel below each assistant message showing side-by-side comparison of Reflective vs Naive RAG answers and metrics. Two tabs: Answers (side-by-side text) and Metrics (bar chart scores).

## Acceptance Criteria

- [ ] Collapsible "Compare: Reflective vs Naive RAG" panel below assistant messages
- [ ] Answers tab: side-by-side comparison of both answers with source badges + token counts
- [ ] Metrics tab: bar chart comparison of faithfulness, precision, relevance, tokens, latency
- [ ] Delta column showing improvement percentages
- [ ] Verdict text explaining the comparison
- [ ] Panel only appears when eval data is available
- [ ] Eval data wired through chat state from SSE `eval` event

## New Files

### `frontend/src/components/chat/eval-comparison.tsx` (~120 lines)

Collapsible panel with two tabs:
- **Answers Tab**: Two-column layout with reflective answer (left) and naive answer (right), source badges, token counts
- **Metrics Tab**: Table with bar visualizations for each metric, delta column
- **Verdict**: Summary text below metrics

## Modified Files

### `frontend/src/types/chat.ts`

Add `EvalComparison` type:
```typescript
export interface EvalStrategyMetrics {
  readonly answer: string
  readonly faithfulness: number
  readonly contextPrecision: number
  readonly answerRelevance: number
  readonly tokensUsed: number
  readonly latencyMs: number
  readonly propositionsMatched: number | null
  readonly sourcesUsed: readonly string[]
}

export interface EvalComparison {
  readonly reflective: EvalStrategyMetrics
  readonly naive: EvalStrategyMetrics
  readonly improvement: Readonly<Record<string, string>>
  readonly verdict: string
}

export interface ChatMessage {
  // ... existing fields
  readonly eval?: EvalComparison
}
```

### `frontend/src/hooks/use-chat.ts`

Handle `eval` SSE event:
```typescript
case 'eval':
  setMessages((prev) =>
    prev.map((m) =>
      m.id === assistantId
        ? { ...m, eval: event.content as EvalComparison }
        : m,
    ),
  )
  break
```

### `frontend/src/components/chat/chat-main.tsx`

Render eval panel below trace panel:
```tsx
{message.eval && <EvalComparison data={message.eval} />}
```

### `frontend/src/components/chat/chat-message.tsx`

Pass eval data if needed (or handle in chat-main where trace is already rendered).

## Implementation Checklist

- [ ] Create `EvalComparison` component with collapsible panel
- [ ] Implement Answers tab (side-by-side layout)
- [ ] Implement Metrics tab (bar chart table)
- [ ] Add `EvalComparison` and `EvalStrategyMetrics` types to `chat.ts`
- [ ] Handle `eval` SSE event in `use-chat.ts`
- [ ] Render eval panel in `chat-main.tsx`
- [ ] Verify panel appears after answer streams, shows correct data

---

**Created:** 2026-02-10
**Last Updated:** 2026-02-10
