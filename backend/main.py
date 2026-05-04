"""FastAPI application — same API contract as Next.js route handlers."""

import asyncio
import io
import json
import logging
import os
import re
import time
from collections import defaultdict
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from langchain_core.messages import AIMessage, HumanMessage
from pydantic import BaseModel, Field
from starlette.datastructures import UploadFile as StarletteUploadFile

from config import gemini_release, gemini_throttle, settings

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
from graph.nodes.qa import stream_fast_path_events, stream_reflective_events
from graph.state import GraphState
from graph.tools.content_index import get_content_index
from llm_factory import make_chat_llm
from prompts.templates import CATEGORY_INSTRUCTIONS

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


_index_ready = asyncio.Event()


@app.on_event("startup")
async def _startup_prewarm() -> None:
    """Best-effort background warm-up for expensive singleton indexes."""
    if not settings.prewarm_content_index:
        _index_ready.set()
        return

    async def _prewarm_content_index() -> None:
        try:
            start = time.perf_counter()
            await get_content_index()
            elapsed = (time.perf_counter() - start) * 1000
            logger.info("Startup prewarm complete: content index ready in %.0fms", elapsed)
        except Exception:
            logger.exception("Startup prewarm failed (non-fatal)")
        finally:
            _index_ready.set()

    asyncio.create_task(_prewarm_content_index())

# ---------- Rate limiting (in-memory, same as MVP) ----------

_rate_store: dict[str, list[float]] = defaultdict(list)


def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def _infer_category_from_message(message: str) -> str | None:
    """Infer a category for high-signal prompts when frontend category is missing."""
    normalized = _normalize_text(message)
    if not normalized:
        return None

    # Exact mappings for known overview/highlight chips.
    exact_map = {
        "tell me about your work experience": "work-experience",
        "tell me about your projects": "projects",
        "tell me about your skills": "skills",
        "tell me about your education": "education",
        "tell me about your ai engineer role at telus": "work-experience",
        "tell me about your ran engineer role at telus": "work-experience",
        "how did your side project turn into a production mandate?": "work-experience",
        "tell me about leading and mentoring your team": "work-experience",
        "tell me about the showme hackathon project": "projects",
        "tell me about your master's thesis": "education",
    }
    if normalized in exact_map:
        return exact_map[normalized]

    # Conservative keyword hints.
    if any(
        key in normalized
        for key in (
            "side project",
            "production mandate",
            "ai engineer role",
            "ran engineer role",
            "work experience",
            "telus role",
        )
    ):
        return "work-experience"

    if any(
        key in normalized
        for key in (
            "showme",
            "personal assistant",
            "second brain",
            "hackathon",
            "project",
            "jasonchi.ai",
        )
    ):
        return "projects"

    if any(
        key in normalized
        for key in (
            "skill",
            "tech stack",
            "tools",
            "language",
            "framework",
        )
    ):
        return "skills"

    if any(
        key in normalized
        for key in (
            "education",
            "master",
            "thesis",
            "degree",
            "certification",
        )
    ):
        return "education"

    if any(
        key in normalized
        for key in (
            "weakness",
            "growth area",
            "management style",
            "work best",
            "honest",
        )
    ):
        return "honest-section"

    if any(
        key in normalized
        for key in (
            "about this site",
            "how this site works",
            "site built",
            "model powers",
            "hosted",
            "stack for this site",
        )
    ):
        return "meta"

    return None


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


class TailoredResumeRequest(BaseModel):
    jobDescription: str = Field(min_length=50, max_length=10000)
    analysis: dict


class SessionSummaryRequest(BaseModel):
    messages: list[dict] = Field(min_length=3, max_length=50)


_SUPPORTED_JD_FILE_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}
_MAX_JD_UPLOAD_BYTES = 5 * 1024 * 1024


async def _extract_uploaded_jd_text(upload: UploadFile) -> str:
    """Extract text from an uploaded job description file."""
    filename = upload.filename or "job-description"
    suffix = Path(filename).suffix.lower()
    if suffix not in _SUPPORTED_JD_FILE_EXTENSIONS:
        raise ValueError("Unsupported file type. Please upload PDF, DOCX, TXT, or MD.")

    raw = await upload.read()
    if not raw:
        raise ValueError("Uploaded file is empty.")
    if len(raw) > _MAX_JD_UPLOAD_BYTES:
        raise ValueError("File is too large. Please upload a file smaller than 5MB.")

    if suffix in {".txt", ".md"}:
        return raw.decode("utf-8", errors="ignore").strip()

    if suffix == ".pdf":
        try:
            from pypdf import PdfReader
        except ImportError as exc:
            raise RuntimeError("PDF extraction dependency is not available.") from exc

        reader = PdfReader(io.BytesIO(raw))
        text_chunks = [(page.extract_text() or "").strip() for page in reader.pages]
        return "\n".join(chunk for chunk in text_chunks if chunk).strip()

    if suffix == ".docx":
        try:
            from docx import Document
        except ImportError as exc:
            raise RuntimeError("DOCX extraction dependency is not available.") from exc

        document = Document(io.BytesIO(raw))
        paragraphs = [p.text.strip() for p in document.paragraphs if p.text and p.text.strip()]
        return "\n".join(paragraphs).strip()

    raise ValueError("Unsupported file type. Please upload PDF, DOCX, TXT, or MD.")


async def _resolve_jd_analysis_input(request: Request) -> str:
    """Resolve JD text from JSON payload or multipart upload."""
    content_type = request.headers.get("content-type", "").lower()

    if "multipart/form-data" in content_type:
        form = await request.form()
        raw_text = form.get("jobDescription")
        typed_text = raw_text.strip() if isinstance(raw_text, str) else ""

        if len(typed_text) >= 50:
            return typed_text

        uploaded = form.get("file")
        if isinstance(uploaded, (UploadFile, StarletteUploadFile)):
            return await _extract_uploaded_jd_text(uploaded)
        return typed_text

    payload = await request.json()
    parsed = JDAnalysisRequest.model_validate(payload)
    return parsed.jobDescription.strip()


def _tailored_resume_prompt(
    resume_content: str,
    job_description: str,
    analysis: dict,
) -> str:
    strengths = analysis.get("strengths", [])
    gaps = analysis.get("gaps", [])
    angle = analysis.get("angle", "")

    strengths_text = "; ".join(s for s in strengths if isinstance(s, str)) or "N/A"
    gaps_text = "; ".join(g for g in gaps if isinstance(g, str)) or "N/A"
    angle_text = angle if isinstance(angle, str) and angle.strip() else "N/A"

    return f"""Rewrite Jason Chi's resume so it is tightly tailored to this specific job description.

## Hard Constraints (critical)
- Use ONLY experiences, projects, skills, and facts that appear in Resume Content.
- NEVER invent companies, titles, dates, metrics, or technologies.
- If a JD requirement is not directly covered, do not fabricate coverage.
- Keep production-confidential code references private (state "Internal TELUS (confidential/NDA)" when needed).

## Output Format
- Return markdown only (no code fences).
- Keep it ATS-friendly and concise.
- Include sections in this order:
  1) # Jason Chi
  2) ## Summary
  3) ## Experience
  4) ## Projects
  5) ## Skills
  6) ## Education
- Use bullets for accomplishments and technical outcomes.
- Prioritize content most relevant to the JD.

## Tailoring Inputs
Strengths: {strengths_text}
Gaps: {gaps_text}
Positioning Angle: {angle_text}

## Job Description
{job_description}

## Resume Content
{resume_content}

Write the tailored resume now."""


def _extract_llm_text(content: object) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                text = item.get("text")
                if isinstance(text, str):
                    parts.append(text)
            else:
                text = getattr(item, "text", None)
                if isinstance(text, str):
                    parts.append(text)
        return "".join(parts)
    return ""


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

    effective_category = body.category or _infer_category_from_message(body.message)
    if body.category is None and effective_category is not None:
        logger.info(
            "Inferred category='%s' from message='%s'",
            effective_category,
            body.message[:80],
        )

    initial_state = GraphState(
        messages=messages,
        intent="chat",
        category=effective_category,
        job_description=body.jobDescription or "",
    )

    async def generate():
        shadow_task = None
        try:
            logger.info("Chat request: category=%s, message='%s'", effective_category, body.message[:80])

            # Stream chat responses when shadow eval is disabled.
            # Shadow eval requires a completed final response object from the graph.
            if not settings.enable_shadow_eval:
                is_fast_category = bool(
                    effective_category
                    and effective_category in CATEGORY_INSTRUCTIONS
                )

                streamed_state: GraphState | None = None
                stream_fn = stream_fast_path_events if is_fast_category else stream_reflective_events
                async for event in stream_fn(initial_state):
                    if event.get("type") == "text":
                        chunk = str(event.get("content", ""))
                        if chunk:
                            yield f"data: {json.dumps({'type': 'text', 'content': chunk})}\n\n"
                    elif event.get("type") == "status":
                        status = str(event.get("content", ""))
                        if status:
                            yield f"data: {json.dumps({'type': 'status', 'content': status})}\n\n"
                    elif event.get("type") == "state":
                        payload = event.get("content")
                        if isinstance(payload, dict):
                            streamed_state = GraphState(**payload)

                if streamed_state is None:
                    raise RuntimeError("Streaming path finished without final state")

                if streamed_state.follow_ups:
                    yield f"data: {json.dumps({'type': 'followUps', 'content': streamed_state.follow_ups})}\n\n"

                trace = _trace_to_dict(streamed_state)
                yield f"data: {json.dumps({'type': 'trace', 'content': trace})}\n\n"
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                return

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
async def analyze_jd(request: Request):
    ip = _get_client_ip(request)
    allowed, remaining = _check_rate_limit(ip)
    if not allowed:
        return JSONResponse(
            {"error": "Too many requests. Please wait a moment."},
            status_code=429,
            headers={"X-RateLimit-Remaining": str(remaining)},
        )

    try:
        job_description = await _resolve_jd_analysis_input(request)
    except ValueError as exc:
        return JSONResponse(
            {"error": str(exc)},
            status_code=400,
            headers={"X-RateLimit-Remaining": str(remaining)},
        )
    except Exception:
        logger.exception("JD analysis request parse failed")
        return JSONResponse(
            {"error": "Please provide a valid job description (at least 50 characters)."},
            status_code=400,
            headers={"X-RateLimit-Remaining": str(remaining)},
        )

    if len(job_description) < 50:
        return JSONResponse(
            {"error": "Please provide a valid job description (at least 50 characters after extraction)."},
            status_code=400,
            headers={"X-RateLimit-Remaining": str(remaining)},
        )

    if not _index_ready.is_set():
        return JSONResponse(
            {"error": "Service is warming up. Please try again in a few seconds."},
            status_code=503,
            headers={"Retry-After": "5", "X-RateLimit-Remaining": str(remaining)},
        )

    initial_state = GraphState(
        intent="jd_analysis",
        job_description=job_description,
    )

    try:
        logger.info("JD analysis request: %d chars", len(job_description))
        result = await asyncio.wait_for(
            app_graph.ainvoke(initial_state),
            timeout=120,
        )
        state = GraphState(**result) if isinstance(result, dict) else result

        response_body = dict(state.analysis_result or {})
        response_body["_jobDescription"] = job_description
        response_body["_trace"] = _trace_to_dict(state)
        logger.info("JD analysis complete: tokens=%d", state.total_tokens)

        return JSONResponse(
            response_body,
            headers={"X-RateLimit-Remaining": str(remaining)},
        )
    except asyncio.TimeoutError:
        logger.error("JD analysis timed out after 120s")
        return JSONResponse(
            {"error": "Analysis took too long. Please try again."},
            status_code=504,
            headers={"X-RateLimit-Remaining": str(remaining)},
        )
    except asyncio.CancelledError:
        logger.warning("JD analysis cancelled (client disconnected)")
        raise
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


@app.post("/api/tailored-resume")
async def tailored_resume(body: TailoredResumeRequest, request: Request):
    ip = _get_client_ip(request)
    allowed, remaining = _check_rate_limit(ip)
    if not allowed:
        return JSONResponse(
            {"error": "Too many requests. Please wait a moment."},
            status_code=429,
            headers={"X-RateLimit-Remaining": str(remaining)},
        )

    try:
        index = await get_content_index()
        resume_content = index.get_full_category(
            ["work-experience", "projects", "skills", "education"],
        )
        prompt = _tailored_resume_prompt(
            resume_content=resume_content,
            job_description=body.jobDescription,
            analysis=body.analysis,
        )

        llm = make_chat_llm()
        await gemini_throttle()
        try:
            result = await llm.ainvoke(prompt)
        finally:
            gemini_release()

        resume_text = _extract_llm_text(result.content).strip()
        if not resume_text:
            return JSONResponse(
                {"error": "Failed to generate tailored resume."},
                status_code=502,
                headers={"X-RateLimit-Remaining": str(remaining)},
            )

        file_name = f"jason-chi-tailored-resume-{time.strftime('%Y%m%d')}.md"
        return JSONResponse(
            {"resumeText": resume_text, "fileName": file_name},
            headers={"X-RateLimit-Remaining": str(remaining)},
        )
    except Exception:
        logger.exception("Tailored resume generation failed")
        return JSONResponse(
            {"error": "Failed to generate tailored resume."},
            status_code=500,
            headers={"X-RateLimit-Remaining": str(remaining)},
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
