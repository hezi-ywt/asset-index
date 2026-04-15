"""Storage and indexing layer for asset-index."""

from __future__ import annotations

import datetime
import json
from pathlib import Path

import yaml

from .models import Asset


def _json_safe(value):
    """Recursively convert YAML parsed values to JSON-safe types."""
    if isinstance(value, datetime.date):
        return value.isoformat()
    if isinstance(value, dict):
        return {k: _json_safe(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_json_safe(v) for v in value]
    return value


def parse_frontmatter(text: str) -> tuple[dict, str]:
    """Parse YAML frontmatter from markdown text.

    Returns a tuple of (frontmatter_dict, body).
    If no frontmatter is found, returns ({}, text).
    """
    if not text.startswith("---"):
        return {}, text

    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text

    try:
        fm = yaml.safe_load(parts[1]) or {}
    except yaml.YAMLError:
        return {}, text

    if not isinstance(fm, dict):
        return {}, text

    body = parts[2].strip("\n")
    return fm, body


def _is_excluded(path: Path, root: Path, exclude_paths: list[str]) -> bool:
    """Match relative path against prefix or glob patterns in *exclude_paths*."""
    try:
        rel = path.relative_to(root)
    except ValueError:
        return False

    rel_str = str(rel)

    for pattern in exclude_paths:
        if pattern.startswith("./"):
            pattern = pattern[2:]
        if "*" in pattern:
            if rel.match(pattern):
                return True
        else:
            if rel_str == pattern or rel_str.startswith(pattern.rstrip("/") + "/"):
                return True

    return False


def scan_directory(path: str, *, exclude_paths: list[str] | None = None) -> list[Asset]:
    """Scan *path* for .md files, skipping any matching *exclude_paths*."""
    root = Path(path).expanduser().resolve()
    excludes = exclude_paths or []
    assets: list[Asset] = []

    for md_path in root.rglob("*.md"):
        if excludes and _is_excluded(md_path, root, excludes):
            continue

        try:
            text = md_path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue

        fm, body = parse_frontmatter(text)
        assets.append(
            Asset(
                path=str(md_path),
                frontmatter=fm,
                body=body,
            )
        )

    return assets


def get_project_root(start_path: str) -> str | None:
    """Walk up from start_path looking for a .asset-index directory."""
    current = Path(start_path).expanduser().resolve()

    if current.is_file():
        current = current.parent

    for parent in [current, *current.parents]:
        if (parent / ".asset-index").is_dir():
            return str(parent)

    return None


def load_index(cache_path: str) -> list[Asset] | None:
    """Load cached index if it exists."""
    path = Path(cache_path).expanduser()
    if not path.exists():
        return None

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return [Asset.from_dict(item) for item in data.get("assets", [])]
    except (OSError, json.JSONDecodeError, KeyError, TypeError):
        return None


def save_index(cache_path: str, assets: list[Asset]) -> None:
    """Save index to JSON cache."""
    path = Path(cache_path).expanduser()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(
            _json_safe({"assets": [a.to_dict() for a in assets]}),
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
