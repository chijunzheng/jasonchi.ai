# Feature: FastAPI + LangGraph Backend

**ID:** F16
**Tier:** 6 — Phase 2 (Post-Launch)
**Status:** ✅ Completed
**Priority:** Low (Post-Launch)
**Estimated Complexity:** Large
**Dependencies:** F5

## Description

Replace Next.js route handlers with a FastAPI + LangGraph multi-agent backend on Cloud Run. Graph-based state machine with router node, specialist nodes (QA, JD analyzer, cover letter), and content retrieval tools. Same API contract — frontend unchanged.

## Acceptance Criteria

- [ ] FastAPI server runs locally and on Cloud Run
- [ ] LangGraph StateGraph with router → specialist node architecture
- [ ] Streaming via FastAPI StreamingResponse connected to LangGraph async generators
- [ ] Same API contract as MVP route handlers
- [ ] Next.js route handlers become thin proxies to FastAPI
- [ ] Content retrieval tools load from same markdown files
- [ ] LangSmith integration for tracing (see F17)
- [ ] Docker container for Cloud Run deployment

## Implementation Details

### Project Structure

```
backend/
├── main.py                       # FastAPI app
├── graph/
│   ├── state.py                  # LangGraph state schema
│   ├── nodes/
│   │   ├── router.py             # Intent classification node
│   │   ├── qa.py                 # General Q&A node
│   │   ├── jd_analyzer.py        # JD analysis node
│   │   └── cover_letter.py       # Cover letter generation node
│   ├── tools/
│   │   ├── content_retrieval.py  # Load markdown content
│   │   └── search.py             # Keyword search across content
│   ├── edges.py                  # Conditional routing logic
│   └── builder.py                # StateGraph assembly
├── content/                      # Symlinked from frontend
├── prompts/
├── config.py
├── requirements.txt
└── Dockerfile
```

### Why LangGraph over ADK

- 2-3K+ job postings mention LangGraph/LangChain (vs. niche ADK)
- Graph-based state machines are a richer technical showcase
- Model-agnostic (still uses Gemini as LLM)
- LangSmith provides built-in observability

### Technical Decisions

- **Same API contract:** Frontend doesn't change at all
- **Symlinked content:** Same markdown files, no duplication
- **Cloud Run:** Scales to zero, containerized, cost-efficient
- **Streaming via FastAPI:** `StreamingResponse` with `async def generate()`

## Dependencies

### Depends On
- **F5:** API contract to maintain compatibility

### Blocks
- **F17:** Agent traces need LangGraph + LangSmith

## Implementation Checklist

- [ ] Set up Python project with FastAPI + LangGraph
- [ ] Define StateGraph schema
- [ ] Implement router node (intent classification)
- [ ] Implement QA, JD analyzer, cover letter nodes
- [ ] Implement content retrieval tools
- [ ] Wire streaming responses
- [ ] Create Dockerfile
- [ ] Deploy to Cloud Run
- [ ] Update Next.js route handlers to proxy
- [ ] Verify identical behavior

---

**Created:** 2026-02-09
**Last Updated:** 2026-02-09
**Implemented By:** Claude Code
