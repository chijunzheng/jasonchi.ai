"""Proposition indexing — decomposes content into atomic facts at startup."""

import json
import logging
import re

from dataclasses import dataclass

logger = logging.getLogger(__name__)

from config import gemini_release, gemini_throttle, settings
from graph.tools.content_retrieval import CATEGORIES, get_content
from llm_factory import make_chat_llm
from prompts.retrieval_prompts import DECOMPOSE_PROMPT


@dataclass(frozen=True)
class Proposition:
    """A single atomic fact extracted from resume content."""

    id: str                    # "work-experience::llm::3"
    text: str                  # "Led migration of monolith to microservices"
    category: str              # "work-experience"
    section: str               # "What I Did"
    parent_chunk: str          # Original paragraph text
    keywords: frozenset[str]   # Extracted keywords for keyword search


@dataclass(frozen=True)
class Section:
    """A markdown section parsed from content."""

    heading: str
    level: int
    content: str
    category: str


_STOP_WORDS = frozenset({
    "the", "a", "an", "is", "was", "were", "are", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "shall", "can",
    "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "as", "into", "through", "during", "before", "after", "above",
    "below", "between", "and", "but", "or", "not", "no", "nor",
    "so", "yet", "both", "each", "few", "more", "most", "other",
    "some", "such", "than", "too", "very", "just", "because",
    "about", "if", "when", "where", "how", "what", "which", "who",
    "this", "that", "these", "those", "then", "there", "here",
    "i", "my", "me", "we", "our", "you", "your", "it", "its",
    "they", "them", "their", "todo", "using", "used", "also",
})


def parse_sections(content: str, category: str) -> list[Section]:
    """Parse markdown content into sections by heading."""
    sections: list[Section] = []
    current_heading = "Introduction"
    current_level = 1
    current_lines: list[str] = []

    for line in content.split("\n"):
        heading_match = re.match(r"^(#{1,4})\s+(.+)$", line)
        if heading_match:
            # Save previous section
            text = "\n".join(current_lines).strip()
            if text:
                sections.append(Section(
                    heading=current_heading,
                    level=current_level,
                    content=text,
                    category=category,
                ))
            current_level = len(heading_match.group(1))
            current_heading = heading_match.group(2)
            current_lines = []
        else:
            current_lines.append(line)

    # Save final section
    text = "\n".join(current_lines).strip()
    if text:
        sections.append(Section(
            heading=current_heading,
            level=current_level,
            content=text,
            category=category,
        ))

    return sections


def extract_keywords(text: str) -> frozenset[str]:
    """Extract keywords from text, filtering stop words."""
    cleaned = re.sub(r"[#*_`\[\]()]", "", text.lower())
    words = set(re.findall(r"\b[a-z]{3,}\b", cleaned))
    return frozenset(words - _STOP_WORDS)


def _split_sentences(text: str) -> list[str]:
    """Split text into sentence-like units for deterministic proposition extraction."""
    collapsed = re.sub(r"\s+", " ", text).strip()
    if not collapsed:
        return []
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", collapsed) if s.strip()]


def _strip_code_blocks(text: str) -> str:
    """Remove markdown code block wrappers from LLM output."""
    text = re.sub(r"^```json\s*", "", text.strip(), flags=re.IGNORECASE)
    text = re.sub(r"^```\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text, flags=re.IGNORECASE)
    return text.strip()


async def _decompose_with_llm(content: str, category: str) -> list[dict]:
    """Use Gemini to decompose content into atomic propositions."""
    if not content.strip() or len(content.strip()) < 20:
        return []

    llm = make_chat_llm()

    prompt = DECOMPOSE_PROMPT.format(category=category, content=content)

    try:
        await gemini_throttle()
        try:
            result = await llm.ainvoke(prompt)
        finally:
            gemini_release()
        text = _strip_code_blocks(result.content)
        propositions = json.loads(text)
        if isinstance(propositions, list):
            logger.debug("Decomposed '%s': %d propositions via LLM", category, len(propositions))
            return propositions
    except Exception:
        logger.exception("LLM decomposition failed for category '%s'", category)
    return []


async def _decompose_category(category: str, content: str) -> list[Proposition]:
    """Decompose a single category's content into propositions."""
    propositions: list[Proposition] = []

    # Optional LLM-based decomposition (disabled by default for faster cold starts).
    min_chars = 5000 if settings.low_quota_mode else 2000
    if settings.enable_llm_index_enrichment and len(content) > min_chars:
        llm_props = await _decompose_with_llm(content, category)

        for i, prop in enumerate(llm_props):
            text = prop.get("text", "") if isinstance(prop, dict) else str(prop)
            section = prop.get("section", "General") if isinstance(prop, dict) else "General"
            if text:
                propositions.append(Proposition(
                    id=f"{category}::llm::{i}",
                    text=text,
                    category=category,
                    section=section,
                    parent_chunk=content[:500],
                    keywords=extract_keywords(text),
                ))
    else:
        reason = (
            "disabled by config" if not settings.enable_llm_index_enrichment
            else f"{len(content)} chars < {min_chars}"
        )
        logger.info("Skipping LLM decomposition for '%s' (%s)", category, reason)

    # Section-level propositions (always generated as baseline)
    sections = parse_sections(content, category)
    seen_texts: set[str] = set()
    heuristic_count = 0
    max_heuristic_props = 120

    for i, section in enumerate(sections):
        is_todo_only = section.content.strip().startswith("TODO")
        if section.content and not is_todo_only:
            propositions.append(Proposition(
                id=f"{category}::section::{i}",
                text=section.content[:300],
                category=category,
                section=section.heading,
                parent_chunk=section.content,
                keywords=extract_keywords(section.content),
            ))
            seen_texts.add(section.content[:300].lower())

        # Deterministic sentence-level extraction to retain retrieval granularity
        # even when LLM enrichment is disabled for latency/cost reasons.
        if heuristic_count >= max_heuristic_props:
            continue

        for raw_line in section.content.splitlines():
            if heuristic_count >= max_heuristic_props:
                break

            line = raw_line.strip().lstrip("-* ").strip()
            if not line or line.lower().startswith("todo"):
                continue

            for sentence in _split_sentences(line):
                if heuristic_count >= max_heuristic_props:
                    break

                text = sentence.strip()
                if len(text) < 40:
                    continue
                if len(text) > 260:
                    text = text[:257].rstrip() + "..."

                key = text.lower()
                if key in seen_texts:
                    continue
                seen_texts.add(key)

                propositions.append(Proposition(
                    id=f"{category}::heuristic::{heuristic_count}",
                    text=text,
                    category=category,
                    section=section.heading,
                    parent_chunk=section.content[:500],
                    keywords=extract_keywords(text),
                ))
                heuristic_count += 1

    return propositions


async def build_propositions() -> list[Proposition]:
    """Build proposition index from all content files. Runs in parallel."""
    import asyncio

    tasks = []
    for category in CATEGORIES:
        content = get_content(category)
        if content:
            tasks.append(_decompose_category(category, content))

    logger.info("Decomposing %d categories into propositions...", len(tasks))
    results = await asyncio.gather(*tasks, return_exceptions=True)

    propositions: list[Proposition] = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            logger.error("Proposition build failed for task %d: %s", i, result)
        else:
            propositions.extend(result)

    logger.info("Total propositions built: %d", len(propositions))
    return propositions
