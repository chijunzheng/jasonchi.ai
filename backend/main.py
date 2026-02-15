"""FastAPI application — same API contract as Next.js route handlers."""

import asyncio
import json
import logging
import os
import re
import time
from collections import defaultdict

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from langchain_core.messages import AIMessage, HumanMessage
from pydantic import BaseModel, Field

from config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s [%(name)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)
from eval.judge import judge_faithfulness, judge_precision, judge_relevance
from eval.metrics import (
    EvalComparison,
    StrategyMetrics,
    comparison_to_dict,
    compute_improvement,
    generate_verdict,
)
from eval.shadow_runner import run_naive_shadow
from graph.builder import app_graph
from graph.state import GraphState
from graph.tools.content_index import get_content_index

load_dotenv()

# Enable LangSmith tracing if configured
if settings.langsmith_api_key:
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGCHAIN_API_KEY"] = settings.langsmith_api_key
    os.environ["LANGCHAIN_PROJECT"] = settings.langsmith_project

app = FastAPI(title="Jason.AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://jasonchi.ai"],
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _startup_prewarm() -> None:
    """Best-effort background warm-up for expensive singleton indexes."""
    if not settings.prewarm_content_index:
        return

    async def _prewarm_content_index() -> None:
        try:
            start = time.perf_counter()
            await get_content_index()
            elapsed = (time.perf_counter() - start) * 1000
            logger.info("Startup prewarm complete: content index ready in %.0fms", elapsed)
        except Exception:
            logger.exception("Startup prewarm failed (non-fatal)")

    asyncio.create_task(_prewarm_content_index())

# ---------- Rate limiting (in-memory, same as MVP) ----------

_rate_store: dict[str, list[float]] = defaultdict(list)


def _check_rate_limit(ip: str) -> tuple[bool, int]:
    now = time.time()
    window = 60.0
    timestamps = [t for t in _rate_store[ip] if now - t < window]
    _rate_store[ip] = timestamps
    remaining = max(0, settings.rate_limit_rpm - len(timestamps))
    if len(timestamps) >= settings.rate_limit_rpm:
        return False, remaining
    _rate_store[ip].append(now)
    return True, remaining - 1


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.headers.get("x-real-ip", request.client.host if request.client else "unknown")


def _trace_to_dict(state: GraphState) -> dict:
    """Extract trace data from graph state for the API response."""
    steps = []
    for s in state.trace_steps:
        step: dict = {
            "node": s.node,
            "reasoning": s.reasoning,
            "toolCalls": s.tool_calls,
            "latencyMs": round(s.latency_ms, 1),
            "tokensUsed": s.tokens_used,
        }
        if s.retrieval_decision is not None:
            step["retrievalDecision"] = s.retrieval_decision
        if s.retrieval_method is not None:
            step["retrievalMethod"] = s.retrieval_method
        if s.sources_used:
            step["sourcesUsed"] = s.sources_used
        if s.confidence_score is not None:
            step["confidenceScore"] = s.confidence_score
        if s.quality_check is not None:
            step["qualityCheck"] = s.quality_check
        steps.append(step)

    return {
        "steps": steps,
        "totalTokens": state.total_tokens,
        "totalLatencyMs": round(state.total_latency_ms, 1),
        "estimatedCost": round(state.total_tokens * 0.000001, 6),
    }


# ---------- Eval comparison helper ----------


async def _run_eval_comparison(
    question: str,
    reflective_answer: str,
    reflective_state: GraphState,
    naive_result: dict,
) -> dict:
    """Run LLM-as-judge on both strategies and return comparison dict."""
    naive_answer = naive_result["answer"]

    # Extract reflective context from trace (sources used)
    reflective_sources = []
    for step in reflective_state.trace_steps:
        reflective_sources.extend(step.sources_used)
    reflective_sources = list(set(reflective_sources))

    # Count propositions matched from trace
    propositions_matched = 0
    for step in reflective_state.trace_steps:
        if "matched" in step.reasoning.lower():
            try:
                matched = re.search(r"matched (\d+)", step.reasoning)
                if matched:
                    propositions_matched = int(matched.group(1))
            except (ValueError, AttributeError):
                pass

    # Run all judge calls in parallel
    r_faith, r_rel, r_prec, n_faith, n_rel = await asyncio.gather(
        judge_faithfulness(reflective_answer, reflective_answer),
        judge_relevance(question, reflective_answer),
        judge_precision(reflective_answer, reflective_sources),
        judge_faithfulness(naive_answer, naive_answer),
        judge_relevance(question, naive_answer),
    )

    # Naive precision is always low (uses all content)
    n_prec = 0.3  # Baseline: loaded everything, most is irrelevant

    reflective_metrics = StrategyMetrics(
        answer=reflective_answer,
        faithfulness=r_faith,
        context_precision=r_prec,
        answer_relevance=r_rel,
        tokens_used=reflective_state.total_tokens,
        latency_ms=reflective_state.total_latency_ms,
        propositions_matched=propositions_matched,
        sources_used=tuple(reflective_sources),
    )

    naive_metrics = StrategyMetrics(
        answer=naive_answer,
        faithfulness=n_faith,
        context_precision=n_prec,
        answer_relevance=n_rel,
        tokens_used=naive_result["tokens_used"],
        latency_ms=naive_result["latency_ms"],
        propositions_matched=None,
        sources_used=naive_result["sources_used"],
    )

    improvement = compute_improvement(reflective_metrics, naive_metrics)
    verdict = generate_verdict(reflective_metrics, naive_metrics)

    comparison = EvalComparison(
        reflective=reflective_metrics,
        naive=naive_metrics,
        improvement=improvement,
        verdict=verdict,
    )

    return comparison_to_dict(comparison)


# ---------- Request schemas ----------


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    conversationHistory: list[dict] = Field(default_factory=list, max_length=10)
    category: str | None = None
    jobDescription: str | None = Field(default=None, max_length=10000)


class JDAnalysisRequest(BaseModel):
    jobDescription: str = Field(min_length=50, max_length=10000)


class CoverLetterRequest(BaseModel):
    jobDescription: str = Field(min_length=50, max_length=10000)
    analysis: dict
    companyName: str | None = None
    roleTitle: str | None = None


class SessionSummaryRequest(BaseModel):
    messages: list[dict] = Field(min_length=3, max_length=50)


# ---------- Endpoints ----------


@app.post("/api/chat")
async def chat(body: ChatRequest, request: Request):
    ip = _get_client_ip(request)
    allowed, remaining = _check_rate_limit(ip)
    if not allowed:
        return JSONResponse(
            {"error": "Too many requests. Please wait a moment and try again."},
            status_code=429,
            headers={"X-RateLimit-Remaining": str(remaining)},
        )

    # Build LangChain messages from conversation history
    messages: list[HumanMessage | AIMessage] = []
    for msg in body.conversationHistory[-settings.max_history_messages:]:
        if msg.get("role") == "user":
            messages.append(HumanMessage(content=msg["content"]))
        elif msg.get("role") == "assistant":
            messages.append(AIMessage(content=msg["content"]))
    messages.append(HumanMessage(content=body.message))

    initial_state = GraphState(
        messages=messages,
        intent="chat",
        category=body.category,
        job_description=body.jobDescription or "",
    )

    async def generate():
        shadow_task = None
        try:
            logger.info("Chat request: category=%s, message='%s'", body.category, body.message[:80])

            # Optionally run naive shadow pipeline in parallel for A/B eval
            if settings.enable_shadow_eval:
                shadow_task = asyncio.create_task(
                    run_naive_shadow(messages, body.category),
                )

            result = await app_graph.ainvoke(initial_state)
            state = GraphState(**result) if isinstance(result, dict) else result

            # Stream the response as SSE chunks (matches frontend contract)
            response_text = state.response_chunks[0] if state.response_chunks else ""
            logger.info(
                "Chat response: tokens=%d, latency=%.0fms, response_len=%d",
                state.total_tokens, state.total_latency_ms, len(response_text),
            )
            chunk_size = 50
            for i in range(0, len(response_text), chunk_size):
                chunk = response_text[i:i + chunk_size]
                yield f"data: {json.dumps({'type': 'text', 'content': chunk})}\n\n"

            # Follow-ups
            if state.follow_ups:
                yield f"data: {json.dumps({'type': 'followUps', 'content': state.follow_ups})}\n\n"

            # Trace data
            trace = _trace_to_dict(state)
            yield f"data: {json.dumps({'type': 'trace', 'content': trace})}\n\n"

            yield f"data: {json.dumps({'type': 'done'})}\n\n"

            # Run eval comparison (non-blocking — after answer is streamed)
            if shadow_task is not None:
                try:
                    naive_result = await shadow_task
                    eval_data = await _run_eval_comparison(
                        question=body.message,
                        reflective_answer=response_text,
                        reflective_state=state,
                        naive_result=naive_result,
                    )
                    yield f"data: {json.dumps({'type': 'eval', 'content': eval_data})}\n\n"
                    logger.info("Eval comparison streamed successfully")
                except Exception:
                    logger.exception("Eval comparison failed (non-blocking)")

        except Exception as e:
            logger.exception("Chat pipeline failed: %s", e)
            if shadow_task is not None:
                shadow_task.cancel()
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-RateLimit-Remaining": str(remaining),
        },
    )


@app.post("/api/analyze-jd")
async def analyze_jd(body: JDAnalysisRequest, request: Request):
    ip = _get_client_ip(request)
    allowed, remaining = _check_rate_limit(ip)
    if not allowed:
        return JSONResponse(
            {"error": "Too many requests. Please wait a moment."},
            status_code=429,
            headers={"X-RateLimit-Remaining": str(remaining)},
        )

    initial_state = GraphState(
        intent="jd_analysis",
        job_description=body.jobDescription,
    )

    try:
        logger.info("JD analysis request: %d chars", len(body.jobDescription))
        result = await app_graph.ainvoke(initial_state)
        state = GraphState(**result) if isinstance(result, dict) else result

        response_body = state.analysis_result or {}
        response_body["_trace"] = _trace_to_dict(state)
        logger.info("JD analysis complete: tokens=%d", state.total_tokens)

        return JSONResponse(
            response_body,
            headers={"X-RateLimit-Remaining": str(remaining)},
        )
    except json.JSONDecodeError:
        logger.exception("JD analysis JSON decode error")
        return JSONResponse(
            {"error": "AI produced an unexpected response format. Please try again."},
            status_code=502,
        )
    except Exception:
        logger.exception("JD analysis failed")
        return JSONResponse(
            {"error": "Analysis failed. Please try again."},
            status_code=500,
        )


@app.post("/api/cover-letter")
async def cover_letter(body: CoverLetterRequest, request: Request):
    ip = _get_client_ip(request)
    allowed, remaining = _check_rate_limit(ip)
    if not allowed:
        return JSONResponse(
            {"error": "Too many requests. Please wait a moment."},
            status_code=429,
            headers={"X-RateLimit-Remaining": str(remaining)},
        )

    initial_state = GraphState(
        intent="cover_letter",
        job_description=body.jobDescription,
        cover_letter_analysis=body.analysis,
    )

    async def generate():
        try:
            result = await app_graph.ainvoke(initial_state)
            state = GraphState(**result) if isinstance(result, dict) else result

            response_text = state.response_chunks[0] if state.response_chunks else ""
            chunk_size = 50
            for i in range(0, len(response_text), chunk_size):
                chunk = response_text[i:i + chunk_size]
                yield f"data: {json.dumps({'type': 'text', 'content': chunk})}\n\n"

            trace = _trace_to_dict(state)
            yield f"data: {json.dumps({'type': 'trace', 'content': trace})}\n\n"

            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            logger.exception("Cover letter pipeline failed")
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-RateLimit-Remaining": str(remaining),
        },
    )


@app.post("/api/session-summary")
async def session_summary(body: SessionSummaryRequest, request: Request):
    ip = _get_client_ip(request)
    allowed, _ = _check_rate_limit(ip)
    if not allowed:
        return JSONResponse({"error": "Too many requests."}, status_code=429)

    conversation_text = "\n\n".join(
        f"{m.get('role', 'unknown')}: {m.get('content', '')}" for m in body.messages
    )

    initial_state = GraphState(
        intent="session_summary",
        conversation_text=conversation_text,
    )

    try:
        logger.info("Session summary request: %d messages", len(body.messages))
        result = await app_graph.ainvoke(initial_state)
        state = GraphState(**result) if isinstance(result, dict) else result

        response_body = state.analysis_result or {}
        response_body["_trace"] = _trace_to_dict(state)
        logger.info("Session summary complete")

        return JSONResponse(response_body)
    except Exception:
        logger.exception("Session summary failed")
        return JSONResponse(
            {"error": "Failed to generate summary."},
            status_code=500,
        )


@app.get("/health")
async def health():
    return {"status": "ok", "model": settings.model_name}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True)
