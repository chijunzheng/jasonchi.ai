"""Unified multi-granularity content index with keyword and semantic search."""

import asyncio
import logging
import time

import numpy as np

logger = logging.getLogger(__name__)

from config import gemini_release, gemini_throttle, settings
from graph.tools.content_retrieval import CATEGORIES, get_content
from graph.tools.proposition_index import (
    Proposition,
    Section,
    build_propositions,
    parse_sections,
)
from llm_factory import make_chat_llm, make_embeddings_model


class ContentIndex:
    """Unified content access with multiple granularity levels.

    Provides keyword search, semantic search, section-level access,
    full-file access, and one-paragraph summaries per category.
    """

    def __init__(
        self,
        propositions: list[Proposition],
        sections: dict[str, list[Section]],
        full_files: dict[str, str],
        summaries: dict[str, str],
        embeddings: np.ndarray,
    ):
        self.propositions = propositions
        self.sections = sections
        self.full_files = full_files
        self.summaries = summaries
        self._embeddings = embeddings

        # Pre-normalize embeddings for fast cosine similarity
        if embeddings.size > 0:
            norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
            norms = np.where(norms == 0, 1, norms)
            self._normalized = embeddings / norms
        else:
            self._normalized = embeddings

    @classmethod
    async def build(cls) -> "ContentIndex":
        """Build the content index from all content files."""
        build_start = time.perf_counter()
        logger.info("Building content index...")

        # Parse sections and full files (sync, fast)
        sections: dict[str, list[Section]] = {}
        full_files: dict[str, str] = {}

        for category in CATEGORIES:
            content = get_content(category)
            if content:
                sections[category] = parse_sections(content, category)
                full_files[category] = content
                logger.debug("Loaded category '%s': %d chars", category, len(content))

        logger.info("Loaded %d categories, running LLM tasks...", len(full_files))

        # Run LLM-dependent tasks in parallel
        propositions_task = build_propositions()
        summaries_task = _generate_summaries(full_files)

        propositions, summaries = await asyncio.gather(
            propositions_task, summaries_task,
        )

        logger.info(
            "Propositions: %d, Summaries: %d categories",
            len(propositions), len(summaries),
        )

        # Compute embeddings for all propositions
        proposition_texts = [p.text for p in propositions]
        min_props_for_embeddings = 50 if settings.low_quota_mode else 20
        if not proposition_texts:
            embeddings = np.empty((0, 0))
            logger.warning("No propositions — skipping embeddings")
        elif len(proposition_texts) < min_props_for_embeddings:
            # Avoid spending quota on embeddings when the corpus is tiny (semantic search won't help much).
            embeddings = np.empty((0, 0))
            logger.info(
                "Skipping embeddings: only %d propositions (<%d)",
                len(proposition_texts),
                min_props_for_embeddings,
            )
        else:
            embeddings = await _compute_embeddings(proposition_texts)
            logger.info("Embeddings computed: shape=%s", embeddings.shape)

        elapsed = (time.perf_counter() - build_start) * 1000
        logger.info("Content index built in %.0fms", elapsed)

        return cls(
            propositions=propositions,
            sections=sections,
            full_files=full_files,
            summaries=summaries,
            embeddings=embeddings,
        )

    def keyword_search(self, query: str, top_k: int = 10) -> list[Proposition]:
        """Keyword-based search across all propositions."""
        query_terms = set(query.lower().split())
        scored: list[tuple[float, Proposition]] = []

        for prop in self.propositions:
            overlap = len(query_terms & prop.keywords)
            exact_bonus = 2.0 if query.lower() in prop.text.lower() else 0.0
            score = overlap + exact_bonus
            if score > 0:
                scored.append((score, prop))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [prop for _, prop in scored[:top_k]]

    async def semantic_search(self, query: str, top_k: int = 5) -> list[Proposition]:
        """Semantic similarity search over proposition embeddings."""
        if len(self.propositions) == 0:
            return []
        if self._embeddings.size == 0:
            # Fallback to keyword retrieval when embeddings are unavailable.
            return self.keyword_search(query, top_k=top_k)

        query_embedding = await _compute_embeddings([query])
        query_vec = query_embedding[0]

        query_norm = np.linalg.norm(query_vec)
        if query_norm == 0:
            return []
        query_normalized = query_vec / query_norm

        similarities = self._normalized @ query_normalized
        top_indices = np.argsort(similarities)[-top_k:][::-1]

        return [
            self.propositions[i]
            for i in top_indices
            if similarities[i] > 0
        ]

    def get_section(self, category: str, section_heading: str) -> str:
        """Get content for a specific section within a category."""
        category_sections = self.sections.get(category, [])
        for section in category_sections:
            if section.heading.lower() == section_heading.lower():
                return section.content
        return ""

    def get_full_category(self, categories: list[str] | str) -> str:
        """Get complete content for one or more categories."""
        if isinstance(categories, str):
            categories = [categories]

        parts: list[str] = []
        for cat in categories:
            content = self.full_files.get(cat, "")
            if content:
                parts.append(f"## {cat.replace('-', ' ').title()}\n\n{content}")

        return "\n\n---\n\n".join(parts)

    def get_all_summaries(self) -> str:
        """Get one-paragraph summary of each category."""
        parts: list[str] = []
        for cat in CATEGORIES:
            summary = self.summaries.get(cat, "")
            if summary:
                parts.append(f"**{cat.replace('-', ' ').title()}:** {summary}")
        return "\n\n".join(parts)


async def _generate_summaries(full_files: dict[str, str]) -> dict[str, str]:
    """Generate one-paragraph summaries per category using Gemini."""
    llm = make_chat_llm()

    def heuristic_summary(category: str, content: str) -> str:
        # For small files, LLM summaries are unnecessary and burn quota. Extract a few non-TODO lines.
        lines: list[str] = []
        for raw in content.splitlines():
            s = raw.strip()
            if not s:
                continue
            if s.startswith("#"):
                continue
            s = s.lstrip("-* ").strip()
            if not s:
                continue
            if s.lower().startswith("todo"):
                continue
            lines.append(s)
            if len(lines) >= 2:
                break

        if not lines:
            return f"TODO: {category.replace('-', ' ')} content not filled out yet."

        summary = " ".join(lines)
        if len(summary) > 240:
            summary = summary[:237].rstrip() + "..."
        return summary

    async def summarize(category: str, content: str) -> tuple[str, str]:
        if not content.strip() or len(content.strip()) < 30:
            return category, f"Content about {category.replace('-', ' ')}."
        if not settings.enable_llm_index_enrichment:
            return category, heuristic_summary(category, content)
        # Small content: skip LLM to reduce rate-limit pressure (and it's usually not worth it).
        summary_min_chars = 5000 if settings.low_quota_mode else 2000
        if len(content) < summary_min_chars:
            return category, heuristic_summary(category, content)
        try:
            await gemini_throttle()
            try:
                result = await llm.ainvoke(
                    f"Summarize this resume section in 1-2 sentences. "
                    f"Be specific about skills, technologies, and achievements mentioned.\n\n"
                    f"{content[:2000]}"
                )
            finally:
                gemini_release()
            return category, result.content.strip()
        except Exception:
            logger.exception("Summary generation failed for category '%s'", category)
            return category, heuristic_summary(category, content)

    tasks = [summarize(cat, content) for cat, content in full_files.items()]
    results = await asyncio.gather(*tasks)

    return dict(results)


async def _compute_embeddings(texts: list[str]) -> np.ndarray:
    """Compute embeddings using Google's text-embedding model."""
    embeddings_model = make_embeddings_model()
    await gemini_throttle()
    try:
        embeddings = await embeddings_model.aembed_documents(texts)
    finally:
        gemini_release()
    return np.array(embeddings)


# Singleton content index with async initialization
_content_index: ContentIndex | None = None
_index_lock = asyncio.Lock()


async def get_content_index() -> ContentIndex:
    """Get or build the singleton content index."""
    global _content_index
    if _content_index is not None:
        return _content_index
    async with _index_lock:
        if _content_index is None:
            logger.info("First request — building content index...")
            _content_index = await ContentIndex.build()
            logger.info("Content index ready")
        return _content_index
