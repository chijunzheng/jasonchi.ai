"""QA node — handles general resume Q&A with reflective agentic retrieval.

3-phase pipeline:
  Phase A (Assess): Can I answer without retrieval? → confidence + retrieval plan
  Phase B (Retrieve): Execute planned retrieval tool (quick_scan/deep_retrieve/full_context)
  Phase C (Answer): Generate answer from retrieved context (evaluation disabled for latency)

Fast path: category-scoped queries skip assessment, go directly to targeted retrieval.
"""

import json
import logging
import re
import time
from collections.abc import AsyncIterator

from langchain_core.messages import AIMessage, SystemMessage

logger = logging.getLogger(__name__)

from config import gemini_release, gemini_throttle, settings
from graph.state import GraphState, TraceStep
from graph.tools.content_retrieval import CATEGORIES
from graph.tools.content_index import get_content_index
from graph.tools.retrieval_tools import (
    ContextTracker,
    RetrievalResult,
    deep_retrieve,
    full_context,
    quick_scan,
)
from llm_factory import make_chat_llm, make_followup_llm
from prompts.retrieval_prompts import ASSESS_PROMPT
from prompts.templates import (
    CATEGORY_INSTRUCTIONS,
    FOLLOW_UP_PROMPT,
    JD_CONTEXT_SECTION,
    SYSTEM_PROMPT,
    get_category_instruction,
)

_SMALL_RESUME_THRESHOLD_CHARS = 8_000
_DEFAULT_FOLLOW_UPS = [
    "Tell me more about that",
    "What was the biggest challenge?",
    "How did that impact the team?",
]


def _balanced_projects_context(content: str, max_chars: int) -> str:
    """Keep representative project coverage under truncation budget."""
    truncation_note = "\n\n[Context truncated for latency.]"

    def _with_note(text: str) -> str:
        cutoff = max(0, max_chars - len(truncation_note))
        return text[:cutoff].rstrip() + truncation_note

    if max_chars <= 0 or len(content) <= max_chars:
        return content

    matches = list(re.finditer(r"(?m)^##\s+", content))
    if not matches:
        return _with_note(content)

    sections: list[tuple[str, str]] = []
    for i, match in enumerate(matches):
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(content)
        block = content[start:end].strip()
        title = block.splitlines()[0].lower() if block else ""
        sections.append((title, block))

    priorities = ["telus ai agent", "showme", "jasonchi.ai", "personal assistant"]
    selected: list[str] = []
    for key in priorities:
        for title, block in sections:
            if key in title and block not in selected:
                selected.append(block)
                break

    if not selected:
        return _with_note(content)

    separator = "\n\n---\n\n"
    available = max_chars - (len(separator) * (len(selected) - 1))
    if available <= 0:
        return _with_note(content)

    per_section = max(500, available // len(selected))
    parts: list[str] = []
    for block in selected:
        if len(block) <= per_section:
            parts.append(block)
        else:
            parts.append(block[:per_section].rstrip() + "\n\n[Section truncated for latency.]")

    merged = separator.join(parts)
    if len(merged) > max_chars:
        merged = _with_note(merged)
    return merged


def _strip_json_blocks(text: str) -> str:
    """Remove markdown code block wrappers from LLM JSON output."""
    text = re.sub(r"^```json\s*", "", text.strip(), flags=re.IGNORECASE)
    text = re.sub(r"^```\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text, flags=re.IGNORECASE)
    return text.strip()


def _build_system_prompt(
    state: GraphState,
    context: str,
    category_instruction: str,
) -> str:
    """Build the full system prompt (including optional JD context)."""
    system_prompt = SYSTEM_PROMPT.format(
        category_instruction=category_instruction,
        resume_content=context,
    )
    if state.job_description:
        system_prompt += JD_CONTEXT_SECTION.format(
            job_description=state.job_description,
        )
    return system_prompt


def _extract_chunk_text(chunk: object) -> str:
    """Extract plain text from LangChain stream chunks defensively."""
    if isinstance(chunk, str):
        return chunk

    content = getattr(chunk, "content", "")
    if isinstance(content, str):
        return content

    if isinstance(content, list):
        pieces: list[str] = []
        for part in content:
            if isinstance(part, str):
                pieces.append(part)
            elif isinstance(part, dict):
                text = part.get("text")
                if isinstance(text, str):
                    pieces.append(text)
            else:
                text = getattr(part, "text", None)
                if isinstance(text, str):
                    pieces.append(text)
        return "".join(pieces)

    return ""


def _extract_total_tokens(chunk: object) -> int:
    """Best-effort token extraction from streamed chunks."""
    usage = getattr(chunk, "usage_metadata", None)
    if not isinstance(usage, dict):
        return 0
    total = usage.get("total_tokens", 0)
    return int(total) if isinstance(total, int | float) else 0


async def _prepare_fast_path_context(state: GraphState) -> tuple[str, str]:
    """Prepare context + instruction for category fast path."""
    index = await get_content_index()
    resume_content = index.get_full_category(state.category)
    original_len = len(resume_content)
    max_chars = int(getattr(settings, "fast_path_max_context_chars", 0) or 0)
    if max_chars > 0 and len(resume_content) > max_chars:
        if state.category == "projects":
            resume_content = _balanced_projects_context(resume_content, max_chars)
            logger.info(
                "Fast path project context balanced: category=%s chars=%d->%d",
                state.category,
                original_len,
                len(resume_content),
            )
        else:
            logger.info(
                "Fast path context capped: category=%s chars=%d->%d",
                state.category,
                original_len,
                max_chars,
            )
            resume_content = (
                resume_content[:max_chars].rstrip()
                + "\n\n[Context truncated for latency. Ask for a specific topic for deeper detail.]"
            )

    category_instruction = get_category_instruction(
        state.category,
        state.job_description,
    )
    return resume_content, category_instruction


def _default_reflective_plan(question: str) -> dict:
    """Low-latency default retrieval plan when assessment is disabled."""
    return {
        "method": "deep_retrieve",
        "categories": ["work-experience", "projects", "skills"],
        "search_query": question,
    }


async def _assess_or_default(state: GraphState) -> dict:
    """Use LLM assess step unless disabled by latency settings."""
    if not settings.skip_assessment_for_reflective:
        return await _assess(state)

    question = state.messages[-1].content if state.messages else ""
    return {
        "confidence": 0.0,
        "reasoning": "Assessment skipped for latency — using direct deep retrieval plan.",
        "needs_retrieval": True,
        "plan": _default_reflective_plan(question),
        "tokens": 0,
    }


async def qa_node(state: GraphState) -> dict:
    """Answer resume questions using reflective agentic retrieval."""
    question = state.messages[-1].content if state.messages else "(empty)"

    # If the entire resume corpus is small, retrieval/eval scaffolding adds cost but little value.
    # Use a single-call full-context answer path to reduce quota pressure.
    if not state.category and not settings.force_reflective_pipeline:
        index = await get_content_index()
        total_chars = sum(len(v) for v in index.full_files.values())
        if total_chars and total_chars < _SMALL_RESUME_THRESHOLD_CHARS:
            logger.info("QA small resume mode: total_chars=%d, question='%s'", total_chars, question[:60])
            return await _small_resume_path(state, index)

    # Fast path: explicit category query → skip assessment
    if state.category and state.category in CATEGORY_INSTRUCTIONS:
        logger.info("QA fast path: category='%s', question='%s'", state.category, question[:60])
        return await _fast_path(state)

    # Reflective path: assess → retrieve → answer
    logger.info("QA reflective path: question='%s'", question[:60])
    return await _reflective_path(state)


async def _small_resume_path(state: GraphState, index) -> dict:
    """Single-call full-context answer for small corpora (avoids multi-call reflective overhead)."""
    start = time.perf_counter()

    resume_content = index.get_full_category(CATEGORIES)
    answer_text, answer_tokens = await _generate_answer(
        state, resume_content, "Answer based on all available resume content.",
    )
    follow_ups = await _generate_follow_ups(answer_text)
    latency = (time.perf_counter() - start) * 1000

    return {
        "messages": [AIMessage(content=answer_text)],
        "response_chunks": [answer_text],
        "follow_ups": follow_ups,
        "trace_steps": [
            TraceStep(
                node="qa",
                reasoning="Small resume mode: full context answer (skipped assess/evaluate)",
                tool_calls=[f"full_context({CATEGORIES})"],
                latency_ms=latency,
                tokens_used=answer_tokens,
                retrieval_decision="skipped: corpus small",
                retrieval_method="full_context",
                sources_used=[c for c in CATEGORIES if index.full_files.get(c)],
                confidence_score=1.0,
                quality_check="skipped — corpus small",
            ),
        ],
        "total_tokens": state.total_tokens + answer_tokens,
        "total_latency_ms": state.total_latency_ms + latency,
    }


async def _fast_path(state: GraphState) -> dict:
    """Category-scoped direct retrieval — preserves current performance."""
    start = time.perf_counter()

    resume_content, category_instruction = await _prepare_fast_path_context(state)

    # Generate answer
    answer_text, answer_tokens = await _generate_answer(
        state, resume_content, category_instruction,
    )
    follow_ups = await _generate_follow_ups(answer_text)

    latency = (time.perf_counter() - start) * 1000

    return {
        "messages": [AIMessage(content=answer_text)],
        "response_chunks": [answer_text],
        "follow_ups": follow_ups,
        "trace_steps": [
            TraceStep(
                node="qa",
                reasoning=f"Fast path: category='{state.category}'",
                tool_calls=[f"full_context([{state.category}])"],
                latency_ms=latency,
                tokens_used=answer_tokens,
                retrieval_decision=f"fast path: category '{state.category}' selected",
                retrieval_method="full_context",
                sources_used=[state.category],
                confidence_score=1.0,
                quality_check="category scoped — skipped evaluation",
            ),
        ],
        "total_tokens": state.total_tokens + answer_tokens,
        "total_latency_ms": state.total_latency_ms + latency,
    }


async def stream_fast_path_events(
    state: GraphState,
) -> AsyncIterator[dict[str, object]]:
    """Stream fast-path answer text chunks, then emit final state payload."""
    start = time.perf_counter()
    resume_content, category_instruction = await _prepare_fast_path_context(state)

    token_counter = {"total": 0}
    answer_parts: list[str] = []

    yield {"type": "status", "content": "Drafting response..."}

    async for chunk_text in _generate_answer_stream(
        state,
        resume_content,
        category_instruction,
        token_counter,
    ):
        answer_parts.append(chunk_text)
        yield {"type": "text", "content": chunk_text}

    answer_text = "".join(answer_parts)
    answer_tokens = token_counter["total"] or max(1, len(answer_text) // 4)
    follow_ups = await _generate_follow_ups(answer_text)
    latency = (time.perf_counter() - start) * 1000

    final_state = {
        "messages": [AIMessage(content=answer_text)],
        "response_chunks": [answer_text],
        "follow_ups": follow_ups,
        "trace_steps": [
            TraceStep(
                node="qa",
                reasoning=f"Fast path: category='{state.category}' (streaming)",
                tool_calls=[f"full_context([{state.category}])"],
                latency_ms=latency,
                tokens_used=answer_tokens,
                retrieval_decision=f"fast path: category '{state.category}' selected",
                retrieval_method="full_context",
                sources_used=[state.category] if state.category else [],
                confidence_score=1.0,
                quality_check="category scoped — skipped evaluation",
            ),
        ],
        "total_tokens": state.total_tokens + answer_tokens,
        "total_latency_ms": state.total_latency_ms + latency,
    }
    yield {"type": "state", "content": final_state}


async def stream_reflective_events(
    state: GraphState,
) -> AsyncIterator[dict[str, object]]:
    """Stream reflective-path answers (assess/retrieve first, then token stream answer)."""
    if not state.category and not settings.force_reflective_pipeline:
        index = await get_content_index()
        total_chars = sum(len(v) for v in index.full_files.values())
        if total_chars and total_chars < _SMALL_RESUME_THRESHOLD_CHARS:
            start = time.perf_counter()
            resume_content = index.get_full_category(CATEGORIES)
            token_counter = {"total": 0}
            answer_parts: list[str] = []

            yield {"type": "status", "content": "Drafting response..."}

            async for chunk_text in _generate_answer_stream(
                state,
                resume_content,
                "Answer based on all available resume content.",
                token_counter,
            ):
                answer_parts.append(chunk_text)
                yield {"type": "text", "content": chunk_text}

            answer_text = "".join(answer_parts)
            answer_tokens = token_counter["total"] or max(1, len(answer_text) // 4)
            follow_ups = await _generate_follow_ups(answer_text)
            latency = (time.perf_counter() - start) * 1000

            final_state = {
                "messages": [AIMessage(content=answer_text)],
                "response_chunks": [answer_text],
                "follow_ups": follow_ups,
                "trace_steps": [
                    TraceStep(
                        node="qa",
                        reasoning="Small resume mode: full context streamed answer (skipped assess/retrieve)",
                        tool_calls=[f"full_context({CATEGORIES})"],
                        latency_ms=latency,
                        tokens_used=answer_tokens,
                        retrieval_decision="skipped: corpus small",
                        retrieval_method="full_context",
                        sources_used=[c for c in CATEGORIES if index.full_files.get(c)],
                        confidence_score=1.0,
                        quality_check="skipped — corpus small",
                    ),
                ],
                "total_tokens": state.total_tokens + answer_tokens,
                "total_latency_ms": state.total_latency_ms + latency,
            }
            yield {"type": "state", "content": final_state}
            return

    trace_steps: list[TraceStep] = []
    total_tokens = 0
    total_start = time.perf_counter()
    tracker = ContextTracker()

    # Phase A: Assess
    yield {"type": "status", "content": "Understanding your question..."}
    assess_start = time.perf_counter()
    assess_result = await _assess_or_default(state)
    assess_latency = (time.perf_counter() - assess_start) * 1000
    total_tokens += assess_result["tokens"]

    trace_steps.append(TraceStep(
        node="assess",
        reasoning=assess_result["reasoning"],
        tool_calls=[],
        latency_ms=assess_latency,
        tokens_used=assess_result["tokens"],
        retrieval_decision=(
            f"skipped: confidence {assess_result['confidence']:.2f}"
            if assess_result["confidence"] > 0.7
            else f"needed: confidence {assess_result['confidence']:.2f}"
        ),
        confidence_score=assess_result["confidence"],
    ))

    # Phase B: Determine context
    if assess_result["confidence"] > 0.7:
        index = await get_content_index()
        answer_context = index.get_all_summaries()
        answer_instruction = "Answer based on the available summaries."
        answer_sources = ["summaries"]
        answer_retrieval_method = "summaries"
    else:
        yield {"type": "status", "content": "Searching relevant experience..."}
        retrieve_start = time.perf_counter()
        plan = assess_result["plan"]
        retrieval = await _execute_retrieval(plan, tracker)
        retrieve_latency = (time.perf_counter() - retrieve_start) * 1000

        trace_steps.append(TraceStep(
            node="retrieve",
            reasoning=f"Tool: {retrieval.method}, matched {retrieval.propositions_matched} propositions",
            tool_calls=[f"{retrieval.method}({plan.get('search_query', '')})"],
            latency_ms=retrieve_latency,
            tokens_used=0,
            retrieval_method=retrieval.method,
            sources_used=list(retrieval.sources),
        ))

        answer_context = retrieval.content
        answer_instruction = "Answer based on the retrieved context."
        answer_sources = list(retrieval.sources)
        answer_retrieval_method = retrieval.method

    # Phase C: Stream answer tokens
    yield {"type": "status", "content": "Drafting response..."}
    answer_start = time.perf_counter()
    token_counter = {"total": 0}
    answer_parts: list[str] = []

    async for chunk_text in _generate_answer_stream(
        state,
        answer_context,
        answer_instruction,
        token_counter,
    ):
        answer_parts.append(chunk_text)
        yield {"type": "text", "content": chunk_text}

    answer_text = "".join(answer_parts)
    answer_tokens = token_counter["total"] or max(1, len(answer_text) // 4)
    total_tokens += answer_tokens
    follow_ups = await _generate_follow_ups(answer_text)

    answer_latency = (time.perf_counter() - answer_start) * 1000
    total_latency = (time.perf_counter() - total_start) * 1000

    trace_steps.append(TraceStep(
        node="answer",
        reasoning="Evaluation disabled — streamed answer from selected context",
        tool_calls=[],
        latency_ms=answer_latency,
        tokens_used=answer_tokens,
        retrieval_method=answer_retrieval_method,
        sources_used=answer_sources,
        quality_check="evaluation disabled",
    ))

    final_state = {
        "messages": [AIMessage(content=answer_text)],
        "response_chunks": [answer_text],
        "follow_ups": follow_ups,
        "trace_steps": trace_steps,
        "total_tokens": state.total_tokens + total_tokens,
        "total_latency_ms": state.total_latency_ms + total_latency,
    }
    yield {"type": "state", "content": final_state}


async def _reflective_path(state: GraphState) -> dict:
    """Full assess → retrieve → answer pipeline (evaluation disabled for latency)."""
    trace_steps: list[TraceStep] = []
    total_tokens = 0
    total_start = time.perf_counter()
    tracker = ContextTracker()

    # Phase A: Assess
    assess_start = time.perf_counter()
    assess_result = await _assess_or_default(state)
    assess_latency = (time.perf_counter() - assess_start) * 1000
    total_tokens += assess_result["tokens"]

    logger.info(
        "Assess complete: confidence=%.2f, needs_retrieval=%s, method=%s",
        assess_result["confidence"],
        assess_result["needs_retrieval"],
        assess_result["plan"].get("method", "?"),
    )

    trace_steps.append(TraceStep(
        node="assess",
        reasoning=assess_result["reasoning"],
        tool_calls=[],
        latency_ms=assess_latency,
        tokens_used=assess_result["tokens"],
        retrieval_decision=(
            f"skipped: confidence {assess_result['confidence']:.2f}"
            if assess_result["confidence"] > 0.7
            else f"needed: confidence {assess_result['confidence']:.2f}"
        ),
        confidence_score=assess_result["confidence"],
    ))

    # High confidence → answer from summaries alone
    if assess_result["confidence"] > 0.7:
        index = await get_content_index()
        context = index.get_all_summaries()
        answer_text, answer_tokens = await _generate_answer(
            state, context, "Answer based on the available summaries.",
        )
        total_tokens += answer_tokens
        follow_ups = await _generate_follow_ups(answer_text)
        total_latency = (time.perf_counter() - total_start) * 1000

        trace_steps.append(TraceStep(
            node="answer",
            reasoning="High confidence — answered from summaries",
            tool_calls=["get_all_summaries()"],
            latency_ms=total_latency - assess_latency,
            tokens_used=answer_tokens,
            retrieval_method="summaries",
            sources_used=["summaries"],
            quality_check="skipped — high confidence",
        ))

        return {
            "messages": [AIMessage(content=answer_text)],
            "response_chunks": [answer_text],
            "follow_ups": follow_ups,
            "trace_steps": trace_steps,
            "total_tokens": state.total_tokens + total_tokens,
            "total_latency_ms": state.total_latency_ms + total_latency,
        }

    # Phase B: Retrieve
    retrieve_start = time.perf_counter()
    plan = assess_result["plan"]
    retrieval = await _execute_retrieval(plan, tracker)
    retrieve_latency = (time.perf_counter() - retrieve_start) * 1000

    logger.info(
        "Retrieve complete: method=%s, matched=%d, sources=%s, latency=%.0fms",
        retrieval.method, retrieval.propositions_matched,
        retrieval.sources, retrieve_latency,
    )

    trace_steps.append(TraceStep(
        node="retrieve",
        reasoning=f"Tool: {retrieval.method}, matched {retrieval.propositions_matched} propositions",
        tool_calls=[f"{retrieval.method}({plan.get('search_query', '')})"],
        latency_ms=retrieve_latency,
        tokens_used=0,
        retrieval_method=retrieval.method,
        sources_used=list(retrieval.sources),
    ))

    # Phase C: Answer (evaluation/corrective retrieval intentionally disabled)
    answer_start = time.perf_counter()

    # Generate answer
    answer_text, answer_tokens = await _generate_answer(
        state, retrieval.content, "Answer based on the retrieved context.",
    )
    total_tokens += answer_tokens

    follow_ups = await _generate_follow_ups(answer_text)

    answer_latency = (time.perf_counter() - answer_start) * 1000
    total_latency = (time.perf_counter() - total_start) * 1000

    trace_steps.append(TraceStep(
        node="answer",
        reasoning="Evaluation disabled — answered directly from retrieved context",
        tool_calls=[],
        latency_ms=answer_latency,
        tokens_used=answer_tokens,
        sources_used=list(retrieval.sources),
        quality_check="evaluation disabled",
    ))

    return {
        "messages": [AIMessage(content=answer_text)],
        "response_chunks": [answer_text],
        "follow_ups": follow_ups,
        "trace_steps": trace_steps,
        "total_tokens": state.total_tokens + total_tokens,
        "total_latency_ms": state.total_latency_ms + total_latency,
    }


async def _assess(state: GraphState) -> dict:
    """Phase A: Assess confidence and plan retrieval strategy."""
    index = await get_content_index()
    summaries = index.get_all_summaries()

    last_msg = state.messages[-1].content if state.messages else ""
    history = "\n".join(
        f"{m.type}: {m.content[:200]}"
        for m in state.messages[-4:]
    )

    llm = make_chat_llm()

    prompt = ASSESS_PROMPT.format(
        summaries=summaries,
        history=history,
        question=last_msg,
    )

    await gemini_throttle()
    try:
        result = await llm.ainvoke(prompt)
    finally:
        gemini_release()
    tokens = result.usage_metadata.get("total_tokens", 0) if result.usage_metadata else 0

    try:
        parsed = json.loads(_strip_json_blocks(result.content))
        return {
            "confidence": float(parsed.get("confidence", 0.5)),
            "reasoning": parsed.get("reasoning", "Assessment completed"),
            "needs_retrieval": parsed.get("needs_retrieval", True),
            "plan": parsed.get("retrieval_plan", {
                "method": "deep_retrieve",
                "categories": [],
                "search_query": last_msg,
            }),
            "tokens": tokens,
        }
    except (json.JSONDecodeError, ValueError):
        return {
            "confidence": 0.3,
            "reasoning": "Assessment parse failed — defaulting to retrieval",
            "needs_retrieval": True,
            "plan": {
                "method": "deep_retrieve",
                "categories": [],
                "search_query": last_msg,
            },
            "tokens": tokens,
        }


async def _execute_retrieval(
    plan: dict,
    tracker: ContextTracker,
) -> RetrievalResult:
    """Phase B: Execute the retrieval plan using the selected tool."""
    method = plan.get("method", "deep_retrieve")
    categories = plan.get("categories", [])
    search_query = plan.get("search_query", "")

    if method == "quick_scan":
        return await quick_scan(search_query, tracker)
    elif method == "full_context":
        target_categories = categories or ["work-experience", "projects", "skills"]
        return await full_context(target_categories, tracker)
    else:
        return await deep_retrieve(search_query, categories or None, tracker)


async def _generate_answer(
    state: GraphState,
    context: str,
    category_instruction: str,
) -> tuple[str, int]:
    """Generate the final answer from the provided context."""
    system_prompt = _build_system_prompt(state, context, category_instruction)

    llm = make_chat_llm()

    messages = [SystemMessage(content=system_prompt)] + list(state.messages)
    await gemini_throttle()
    try:
        result = await llm.ainvoke(messages)
    finally:
        gemini_release()
    tokens = result.usage_metadata.get("total_tokens", 0) if result.usage_metadata else 0

    return result.content, tokens


async def _generate_answer_stream(
    state: GraphState,
    context: str,
    category_instruction: str,
    token_counter: dict[str, int] | None = None,
) -> AsyncIterator[str]:
    """Stream the final answer token-by-token from the chat model."""
    system_prompt = _build_system_prompt(state, context, category_instruction)
    llm = make_chat_llm()
    messages = [SystemMessage(content=system_prompt)] + list(state.messages)

    await gemini_throttle()
    try:
        async for chunk in llm.astream(messages):
            if token_counter is not None:
                stream_tokens = _extract_total_tokens(chunk)
                if stream_tokens > 0:
                    token_counter["total"] = stream_tokens

            text = _extract_chunk_text(chunk)
            if text:
                yield text
    finally:
        gemini_release()


async def _generate_follow_ups(response: str) -> list[str]:
    """Generate follow-up question suggestions."""
    if not settings.generate_followups_with_llm:
        return list(_DEFAULT_FOLLOW_UPS)

    try:
        llm = make_followup_llm()
        prompt = FOLLOW_UP_PROMPT.format(response=response)
        await gemini_throttle()
        try:
            result = await llm.ainvoke(prompt)
        finally:
            gemini_release()
        text = _strip_json_blocks(result.content)
        parsed = json.loads(text)
        if isinstance(parsed, list) and all(isinstance(s, str) for s in parsed):
            return parsed[:3]
    except Exception:
        logger.exception("Follow-up generation failed")
    return [
        "Tell me more about that",
        "What was the biggest challenge?",
        "How did that impact the team?",
    ]
