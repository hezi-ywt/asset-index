"""Data models for asset-index."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class Asset:
    """Represents a single Markdown asset with YAML frontmatter."""

    path: str
    frontmatter: dict[str, Any] = field(default_factory=dict)
    body: str = ""

    @property
    def title(self) -> str | None:
        return self.frontmatter.get("title") or self.frontmatter.get("name")

    @property
    def asset_type(self) -> str | None:
        return self.frontmatter.get("type")

    @property
    def status(self) -> str | None:
        return self.frontmatter.get("status")

    @property
    def tags(self) -> list[str]:
        tags = self.frontmatter.get("tags", [])
        if isinstance(tags, str):
            return [t.strip() for t in tags.split(",") if t.strip()]
        return list(tags)

    def to_dict(self) -> dict[str, Any]:
        return {
            "path": self.path,
            "frontmatter": self.frontmatter,
            "body_preview": self.body[:500],
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Asset:
        return cls(
            path=data["path"],
            frontmatter=data.get("frontmatter", {}),
            body=data.get("body_preview", ""),
        )
