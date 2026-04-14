"""Rule-driven validation engine for asset-index."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from .models import Asset


DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def load_rules(project_root: str) -> dict[str, Any]:
    """Load .asset-index/rules.yaml if it exists."""
    rules_path = Path(project_root) / ".asset-index" / "rules.yaml"
    if not rules_path.exists():
        return {}

    import yaml

    try:
        return yaml.safe_load(rules_path.read_text(encoding="utf-8")) or {}
    except yaml.YAMLError:
        return {}


def _has_field(asset: Asset, field: str) -> bool:
    value = asset.frontmatter.get(field)
    return value is not None and str(value).strip() != ""


def _is_valid_date(value: Any) -> bool:
    if value is None:
        return False
    return bool(DATE_PATTERN.match(str(value)))


def check_asset(asset: Asset, rules: dict[str, Any]) -> list[dict[str, Any]]:
    """Validate a single asset against rules."""
    issues: list[dict[str, Any]] = []

    # --- Default checks ---
    if not asset.frontmatter:
        issues.append(
            {
                "severity": "error",
                "code": "missing_frontmatter",
                "message": "Markdown file has no YAML frontmatter.",
                "field": None,
            }
        )
        return issues

    if not _has_field(asset, "title") and not _has_field(asset, "name"):
        issues.append(
            {
                "severity": "error",
                "code": "missing_title",
                "message": "Frontmatter is missing 'title' or 'name' field.",
                "field": "title",
            }
        )

    if not _has_field(asset, "type"):
        issues.append(
            {
                "severity": "error",
                "code": "missing_type",
                "message": "Frontmatter is missing 'type' field.",
                "field": "type",
            }
        )

    if not _has_field(asset, "status"):
        issues.append(
            {
                "severity": "error",
                "code": "missing_status",
                "message": "Frontmatter is missing 'status' field.",
                "field": "status",
            }
        )

    for date_field in ("created", "modified"):
        value = asset.frontmatter.get(date_field)
        if value is not None and not _is_valid_date(value):
            issues.append(
                {
                    "severity": "warning",
                    "code": "invalid_date",
                    "message": f"Field '{date_field}' should be in YYYY-MM-DD format.",
                    "field": date_field,
                }
            )

    # --- Rule-driven checks ---
    required_fields = rules.get("required_fields", [])
    for field in required_fields:
        if not _has_field(asset, field):
            issues.append(
                {
                    "severity": "error",
                    "code": "missing_required_field",
                    "message": f"Required field '{field}' is missing.",
                    "field": field,
                }
            )

    asset_type = asset.asset_type
    type_rules = rules.get("types", {})
    if asset_type and type_rules:
        if asset_type in type_rules:
            type_rule = type_rules[asset_type]
            for field in type_rule.get("required", []):
                if not _has_field(asset, field):
                    issues.append(
                        {
                            "severity": "error",
                            "code": "type_missing_field",
                            "message": f"Type '{asset_type}' requires field '{field}'.",
                            "field": field,
                        }
                    )
        elif rules.get("strict_types", False):
            issues.append(
                {
                    "severity": "warning",
                    "code": "unknown_type",
                    "message": f"Type '{asset_type}' is not defined in rules.",
                    "field": "type",
                }
            )

    allowed_statuses = rules.get("statuses", [])
    if allowed_statuses and asset.status and asset.status not in allowed_statuses:
        issues.append(
            {
                "severity": "warning",
                "code": "invalid_status",
                "message": f"Status '{asset.status}' is not in allowed values: {allowed_statuses}.",
                "field": "status",
            }
        )

    date_fields = rules.get("date_fields", [])
    for field in date_fields:
        value = asset.frontmatter.get(field)
        if value is not None and not _is_valid_date(value):
            issues.append(
                {
                    "severity": "error",
                    "code": "invalid_date_rule",
                    "message": f"Field '{field}' must be in YYYY-MM-DD format.",
                    "field": field,
                }
            )
        elif field not in ("created", "modified") and not _has_field(asset, field):
            issues.append(
                {
                    "severity": "warning",
                    "code": "missing_date_field",
                    "message": f"Date field '{field}' is recommended.",
                    "field": field,
                }
            )

    return issues
