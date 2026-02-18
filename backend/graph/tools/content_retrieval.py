"""Content retrieval tool — loads markdown resume content."""

from functools import lru_cache
from pathlib import Path

import frontmatter

from config import settings

CATEGORIES = [
    "work-experience",
    "projects",
    "skills",
    "education",
    "honest-section",
    "meta",
]


@lru_cache(maxsize=32)
def _load_file(path: Path, mtime_ns: int) -> str:
    """Load and parse a single markdown file, stripping frontmatter.

    mtime_ns is part of the cache key so edits invalidate cache without restart.
    """
    _ = mtime_ns
    if not path.exists():
        return ""
    post = frontmatter.load(str(path))
    return post.content


def get_content(category: str) -> str:
    """Load content for a specific category."""
    path = settings.content_dir / f"{category}.md"
    try:
        mtime_ns = path.stat().st_mtime_ns if path.exists() else -1
    except OSError:
        mtime_ns = -1
    return _load_file(path, mtime_ns)


def get_all_content() -> str:
    """Load all content categories into a single string."""
    sections: list[str] = []
    for cat in CATEGORIES:
        content = get_content(cat)
        if content:
            sections.append(f"## {cat.replace('-', ' ').title()}\n\n{content}")
    return "\n\n---\n\n".join(sections)


def search_content(query: str) -> list[dict[str, str]]:
    """Simple keyword search across all content files."""
    query_lower = query.lower()
    results: list[dict[str, str]] = []

    for cat in CATEGORIES:
        content = get_content(cat)
        if query_lower in content.lower():
            results.append({"category": cat, "snippet": content[:500]})

    return results
