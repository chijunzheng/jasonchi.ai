# Original Plan: Reflective Latency Reduction + Live Processing Status

**Created:** 2026-02-18

## Goal
Reduce post-JD reflective query latency and show subtle live processing progress while waiting for first tokens.

## Scope
1. Skip assess LLM step by default for reflective queries to remove a major latency source.
2. Emit backend status events during assess/retrieve/answer phases.
3. Render a subtle dynamic processing label in frontend typing indicator.
4. Keep trace output and answer quality behavior consistent.
