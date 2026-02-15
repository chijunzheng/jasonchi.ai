"""A-RAG-style retrieval tools — the agent selects which tool to use."""

import logging
from dataclasses import dataclass, field

from graph.tools.content_index import ContentIndex, get_content_index
from graph.tools.proposition_index import Proposition

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class RetrievalResult:
    """Result from a retrieval tool with content and metadata."""

    content: str
    sources: tuple[str, ...]
    method: str                    # "quick_scan" | "deep_retrieve" | "full_context"
    propositions_matched: int
    tokens_estimated: int


class ContextTracker:
    """Tracks which propositions have been retrieved to prevent duplicates."""

    def __init__(self) -> None:
        self._seen_ids: set[str] = set()

    def filter_new(self, propositions: list[Proposition]) -> list[Proposition]:
        """Return only propositions not yet seen, and mark them as seen."""
        new_props = [p for p in propositions if p.id not in self._seen_ids]
        self._seen_ids.update(p.id for p in new_props)
        return new_props

    @property
    def seen_count(self) -> int:
        return len(self._seen_ids)


async def quick_scan(
    query: str,
    tracker: ContextTracker | None = None,
) -> RetrievalResult:
    """Keyword matching + category summaries. For simple factual questions."""
    index = await get_content_index()

    # Keyword search over propositions
    matched = index.keyword_search(query, top_k=10)
    if tracker:
        matched = tracker.filter_new(matched)

    # Combine matched propositions with category summaries
    prop_text = "\n".join(f"- {p.text}" for p in matched) if matched else ""
    summaries = index.get_all_summaries()

    content_parts = []
    if prop_text:
        content_parts.append(f"### Matched Facts\n{prop_text}")
    content_parts.append(f"### Category Summaries\n{summaries}")

    content = "\n\n".join(content_parts)
    sources = tuple(sorted({p.category for p in matched}))

    logger.info("quick_scan: matched=%d propositions, sources=%s", len(matched), sources)

    return RetrievalResult(
        content=content,
        sources=sources if sources else ("summaries",),
        method="quick_scan",
        propositions_matched=len(matched),
        tokens_estimated=len(content) // 4,
    )


async def deep_retrieve(
    query: str,
    categories: list[str] | None = None,
    tracker: ContextTracker | None = None,
) -> RetrievalResult:
    """Semantic search over propositions. For specific experience questions."""
    index = await get_content_index()

    # Semantic search
    matched = await index.semantic_search(query, top_k=8)

    # Filter by categories if specified
    if categories:
        matched = [p for p in matched if p.category in categories]

    if tracker:
        matched = tracker.filter_new(matched)

    # Build content with parent chunks for richer context
    seen_chunks: set[str] = set()
    content_parts: list[str] = []

    for prop in matched:
        content_parts.append(f"- [{prop.category}/{prop.section}] {prop.text}")
        # Include parent chunk if not already seen
        chunk_key = f"{prop.category}::{prop.section}"
        if chunk_key not in seen_chunks and prop.parent_chunk:
            seen_chunks.add(chunk_key)
            content_parts.append(f"  Context: {prop.parent_chunk[:200]}")

    content = "\n".join(content_parts) if content_parts else "No relevant propositions found."
    sources = tuple(
        f"{p.category}::{p.section}" for p in matched
    )

    logger.info("deep_retrieve: matched=%d propositions, categories=%s", len(matched), categories)

    return RetrievalResult(
        content=content,
        sources=sources,
        method="deep_retrieve",
        propositions_matched=len(matched),
        tokens_estimated=len(content) // 4,
    )


async def full_context(
    categories: list[str],
    tracker: ContextTracker | None = None,
) -> RetrievalResult:
    """Load complete category content. For broad questions or cover letters."""
    index = await get_content_index()

    content = index.get_full_category(categories)
    sources = tuple(categories)

    # Mark all propositions from these categories as seen
    if tracker:
        category_props = [
            p for p in index.propositions if p.category in categories
        ]
        tracker.filter_new(category_props)

    logger.info("full_context: categories=%s, chars=%d", categories, len(content))

    return RetrievalResult(
        content=content,
        sources=sources,
        method="full_context",
        propositions_matched=0,  # Not proposition-based
        tokens_estimated=len(content) // 4,
    )
