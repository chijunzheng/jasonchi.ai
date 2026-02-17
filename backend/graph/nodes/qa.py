"""QA node — handles general resume Q&A with reflective agentic retrieval.

3-phase pipeline:
  Phase A (Assess): Can I answer without retrieval? → confidence + retrieval plan
  Phase B (Retrieve): Execute planned retrieval tool (quick_scan/deep_retrieve/full_context)
  Phase C (Evaluate + Answer): Is context sufficient? → answer or corrective re-retrieval

Fast path: category-scoped queries skip assessment, go directly to targeted retrieval.
"""

import json
import logging
import re
import time

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
from llm_factory import make_chat_llm
from prompts.retrieval_prompts import ASSESS_PROMPT, EVALUATE_PROMPT
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

    priorities = ["telus ai agent", "showme", "jasonchi.ai", "cortex"]
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

    # Reflective path: assess → retrieve → evaluate + answer
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


async def _reflective_path(state: GraphState) -> dict:
    """Full assess → retrieve → evaluate → answer pipeline."""
    trace_steps: list[TraceStep] = []
    total_tokens = 0
    total_start = time.perf_counter()
    tracker = ContextTracker()

    # Phase A: Assess
    assess_start = time.perf_counter()
    assess_result = await _assess(state)
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

    # Phase C: Evaluate + Answer
    eval_start = time.perf_counter()

    # When skip_evaluation is enabled, bypass the evaluate LLM call and corrective
    # re-retrieval entirely — go straight to answer generation with retrieved context.
    if settings.skip_evaluation:
        logger.info("Evaluate skipped (skip_evaluation=True)")
        eval_result = {
            "sufficiency": 1.0,
            "reasoning": "Evaluation skipped — skip_evaluation enabled",
            "suggestion": "sufficient",
            "alternatives": [],
            "tokens": 0,
        }
    else:
        eval_result = await _evaluate(state, retrieval)
        total_tokens += eval_result["tokens"]

        logger.info(
            "Evaluate complete: sufficiency=%.2f, suggestion=%s",
            eval_result["sufficiency"], eval_result.get("suggestion"),
        )

    # Corrective re-retrieval if quality too low (max 1 retry)
    if eval_result["sufficiency"] < 0.6 and eval_result.get("alternatives"):
        corrective_start = time.perf_counter()
        corrective_categories = eval_result["alternatives"]
        corrective_retrieval = await full_context(corrective_categories, tracker)
        corrective_latency = (time.perf_counter() - corrective_start) * 1000

        # Merge content
        combined_content = retrieval.content + "\n\n" + corrective_retrieval.content
        combined_sources = list(retrieval.sources) + list(corrective_retrieval.sources)

        trace_steps.append(TraceStep(
            node="corrective_retrieve",
            reasoning=f"Quality {eval_result['sufficiency']:.2f} < 0.6 — corrective retrieval from {corrective_categories}",
            tool_calls=[f"full_context({corrective_categories})"],
            latency_ms=corrective_latency,
            tokens_used=0,
            retrieval_method="full_context",
            sources_used=list(corrective_retrieval.sources),
            quality_check=f"corrective retrieval triggered (score: {eval_result['sufficiency']:.2f})",
        ))

        retrieval = RetrievalResult(
            content=combined_content,
            sources=tuple(combined_sources),
            method=f"{retrieval.method}+full_context",
            propositions_matched=retrieval.propositions_matched,
            tokens_estimated=len(combined_content) // 4,
        )

    # Generate answer
    answer_text, answer_tokens = await _generate_answer(
        state, retrieval.content, "Answer based on the retrieved context.",
    )
    total_tokens += answer_tokens

    # Safety net: if the answer contains the "not covered" fallback, the retrieval
    # missed relevant content. Retry once with full context from all categories.
    _NOT_COVERED_MARKER = "not something covered in my resume"
    if _NOT_COVERED_MARKER in answer_text.lower():
        logger.warning("Safety net triggered: answer contained fallback phrase, retrying with full context")
        safety_start = time.perf_counter()
        index = await get_content_index()
        full_resume = index.get_full_category(CATEGORIES)
        answer_text, safety_tokens = await _generate_answer(
            state, full_resume, "Answer based on all available resume content.",
        )
        total_tokens += safety_tokens
        safety_latency = (time.perf_counter() - safety_start) * 1000

        trace_steps.append(TraceStep(
            node="safety_net",
            reasoning="Initial answer triggered 'not covered' fallback — retried with full resume content",
            tool_calls=[f"full_context({list(CATEGORIES)})"],
            latency_ms=safety_latency,
            tokens_used=safety_tokens,
            retrieval_method="full_context",
            sources_used=list(CATEGORIES),
            quality_check="safety net: full context retry",
        ))

    follow_ups = await _generate_follow_ups(answer_text)

    eval_latency = (time.perf_counter() - eval_start) * 1000
    total_latency = (time.perf_counter() - total_start) * 1000

    quality_label = (
        "sufficient" if eval_result["sufficiency"] >= 0.6
        else "corrective retrieval triggered"
    )

    trace_steps.append(TraceStep(
        node="evaluate_and_answer",
        reasoning=f"Quality: {eval_result['sufficiency']:.2f} — {quality_label}",
        tool_calls=[],
        latency_ms=eval_latency,
        tokens_used=answer_tokens + eval_result["tokens"],
        sources_used=list(retrieval.sources),
        quality_check=quality_label,
        confidence_score=eval_result["sufficiency"],
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


async def _evaluate(state: GraphState, retrieval: RetrievalResult) -> dict:
    """Phase C (part 1): Evaluate retrieval quality."""
    last_msg = state.messages[-1].content if state.messages else ""

    llm = make_chat_llm()

    prompt = EVALUATE_PROMPT.format(
        question=last_msg,
        context=retrieval.content[:6000],
        sources=", ".join(retrieval.sources),
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
            "sufficiency": float(parsed.get("sufficiency_score", 0.7)),
            "reasoning": parsed.get("reasoning", "Evaluation completed"),
            "suggestion": parsed.get("suggestion", "sufficient"),
            "alternatives": parsed.get("alternative_categories", []),
            "tokens": tokens,
        }
    except (json.JSONDecodeError, ValueError):
        return {
            "sufficiency": 0.7,
            "reasoning": "Evaluation parse failed — proceeding with current context",
            "suggestion": "sufficient",
            "alternatives": [],
            "tokens": tokens,
        }


async def _generate_answer(
    state: GraphState,
    context: str,
    category_instruction: str,
) -> tuple[str, int]:
    """Generate the final answer from the provided context."""
    system_prompt = SYSTEM_PROMPT.format(
        category_instruction=category_instruction,
        resume_content=context,
    )

    if state.job_description:
        system_prompt += JD_CONTEXT_SECTION.format(
            job_description=state.job_description,
        )

    llm = make_chat_llm()

    messages = [SystemMessage(content=system_prompt)] + list(state.messages)
    await gemini_throttle()
    try:
        result = await llm.ainvoke(messages)
    finally:
        gemini_release()
    tokens = result.usage_metadata.get("total_tokens", 0) if result.usage_metadata else 0

    return result.content, tokens


async def _generate_follow_ups(response: str) -> list[str]:
    """Generate follow-up question suggestions."""
    if not settings.generate_followups_with_llm:
        return list(_DEFAULT_FOLLOW_UPS)

    try:
        llm = make_chat_llm()
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
