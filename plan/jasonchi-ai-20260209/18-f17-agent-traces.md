# Feature: Agent Traces (LangSmith)

**ID:** F17
**Tier:** 6 — Phase 2 (Post-Launch)
**Status:** ✅ Completed
**Priority:** Low (Post-Launch)
**Estimated Complexity:** Medium
**Dependencies:** F16

## Description

Collapsible trace panels in the chat UI powered by LangSmith callback data. Shows graph execution path, tool calls, node transition reasoning, latency, and token usage. Technical showcase for hiring managers.

## Acceptance Criteria

- [ ] Collapsible "Show reasoning" panel on each AI response
- [ ] Shows graph execution path (which nodes were visited)
- [ ] Shows tool calls with retrieved content snippets
- [ ] Shows node transition reasoning
- [ ] Shows latency per node, total tokens, estimated cost
- [ ] Visual representation of execution path
- [ ] Data sourced from LangSmith callback handler

## Implementation Details

### Trace Panel Display

```
┌─────────────────────────────────────────┐
│ ▼ Show reasoning                        │
│ ┌─────────────────────────────────────┐ │
│ │ router → qa (confidence: 0.92)     │ │
│ │ Tool: content_retrieval("work")    │ │
│ │ Retrieved: work-experience.md      │ │
│ │ Latency: 340ms | Tokens: 1,247    │ │
│ │ Cost: ~$0.002                      │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Data Flow

```
LangGraph execution → LangSmith callback → FastAPI response metadata → Frontend trace panel
```

### Technical Decisions

- **LangSmith over custom tracing:** Built-in, production-grade, industry standard
- **Collapsible panel:** Don't clutter UI for non-technical users
- **Estimated cost:** Demonstrates cost awareness — important signal for hiring managers

## Dependencies

### Depends On
- **F16:** LangGraph backend with LangSmith integration

### Blocks
- None

## Implementation Checklist

- [ ] Add LangSmith callback handler to LangGraph execution
- [ ] Include trace metadata in API response
- [ ] Create trace panel component
- [ ] Create execution path visualization
- [ ] Wire into chat message cards
- [ ] Test with various query types

## Notes

- This is a Phase 2 technical showcase — it demonstrates production observability skills
- Keep trace data in the API response metadata, not a separate call
- The visual graph could use a simple SVG representation of the node path

---

**Created:** 2026-02-09
**Last Updated:** 2026-02-09
**Implemented By:** Claude Code
