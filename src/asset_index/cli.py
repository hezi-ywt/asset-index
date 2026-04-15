"""CLI entry point for asset-index."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import click
import yaml

from . import __version__
from .checker import check_asset, is_asset, load_rules
from .models import Asset
from .store import get_project_root, load_index, save_index, scan_directory

SAMPLE_RULES = """# Asset index validation rules for this project.
# Customize these rules to match your project's frontmatter conventions.

# Directories to skip during scan (relative path prefixes or glob patterns)
exclude_paths:
  - .opencode/
  - .asset-index/
  - node_modules/

# Fields that must exist in every asset's frontmatter
required_fields:
  - title
  - type
  - status
  - created
  - modified

# Allowed asset types and their type-specific requirements
types:
  角色:
    required: [name]
  场景:
    required: [name]
  道具:
    required: [name]
  剧本:
    required: [episode]
  分镜:
    required: [episode]
  原始故事:
    required: [chapter]
  故事小说:
    required: []
  游戏设计:
    required: []

# Allowed status values
statuses:
  - 草稿
  - 进行中
  - 完成
  - 已整理
  - 已迁移
  - archived

# Fields that must be valid YYYY-MM-DD dates
date_fields:
  - created
  - modified

# Set to true to warn on unknown types
strict_types: false
"""


def _filter_assets(assets: list[Asset], rules: dict) -> list[Asset]:
    """Filter scanned markdown files down to assets according to project rules."""
    return [asset for asset in assets if is_asset(asset, rules)]


@click.group(invoke_without_command=True)
@click.version_option(version=__version__, prog_name="asset-index")
@click.pass_context
def main(ctx: click.Context) -> None:
    """Atomic CLI for frontmatter-based asset index management."""
    if ctx.invoked_subcommand is None:
        click.echo(
            "[asset-index] No command specified. Run 'asset-index --help' for usage.",
            err=True,
        )
        sys.exit(1)


@main.command()
@click.option("--force", is_flag=True, default=False, help="Overwrite existing config.")
@click.argument("path", default=".", required=False)
def init(force: bool, path: str) -> None:
    """Initialize .asset-index/ directory with sample rules.yaml."""
    target = Path(path).expanduser().resolve()
    asset_index_dir = target / ".asset-index"
    rules_file = asset_index_dir / "rules.yaml"

    if asset_index_dir.exists() and not force:
        click.echo(f"[asset-index] Config already exists ({asset_index_dir}).")
        click.echo("Run with --force to overwrite.")
        return

    asset_index_dir.mkdir(parents=True, exist_ok=True)
    rules_file.write_text(SAMPLE_RULES, encoding="utf-8")
    click.echo(f"[asset-index] Initialized {asset_index_dir}")
    click.echo(f"[asset-index] Created sample rules: {rules_file}")


def _load_exclude_paths(project_root: str) -> list[str]:
    rules = load_rules(project_root)
    return rules.get("exclude_paths", [])


@main.command()
@click.argument("path", default=".")
def scan(path: str) -> None:
    """Scan directory for .md files and build index cache."""
    target = Path(path).expanduser().resolve()
    project_root = get_project_root(str(target)) or str(target)
    cache_path = Path(project_root) / ".asset-index" / "cache.json"
    rules = load_rules(project_root)
    excludes = _load_exclude_paths(project_root)

    assets = scan_directory(str(target), exclude_paths=excludes)
    with_frontmatter = [a for a in assets if a.frontmatter]
    indexed_assets = _filter_assets(assets, rules)
    without_frontmatter = len(assets) - len(with_frontmatter)

    save_index(str(cache_path), assets)
    click.echo(
        f"Scanned {len(assets)} files, found {len(indexed_assets)} indexed assets."
    )
    click.echo(f"  ({len(with_frontmatter)} files with frontmatter)")
    if without_frontmatter > 0:
        click.echo(f"  ({without_frontmatter} files without frontmatter)")


def _get_assets(path: str) -> list[Asset]:
    """Load assets from cache or scan directory."""
    target = Path(path).expanduser().resolve()
    project_root = get_project_root(str(target)) or str(target)
    cache_path = Path(project_root) / ".asset-index" / "cache.json"

    assets = load_index(str(cache_path))
    if assets is None:
        excludes = _load_exclude_paths(project_root)
        assets = scan_directory(str(target), exclude_paths=excludes)
        save_index(str(cache_path), assets)
    return assets


def _get_indexed_assets(path: str) -> list[Asset]:
    """Load and filter assets according to project rules."""
    target = Path(path).expanduser().resolve()
    project_root = get_project_root(str(target)) or str(target)
    rules = load_rules(project_root)
    return _filter_assets(_get_assets(path), rules)


@main.command()
@click.argument("query", default="")
@click.option("--type", "asset_type", default=None, help="Filter by asset type.")
@click.option("--status", default=None, help="Filter by status.")
@click.option("--tag", default=None, help="Filter by tag.")
@click.option("--path", default=".", help="Project path to search.")
@click.option(
    "--format", "output_format", default="text", type=click.Choice(["text", "json"])
)
def search(
    query: str,
    asset_type: str | None,
    status: str | None,
    tag: str | None,
    path: str,
    output_format: str,
) -> None:
    """Search indexed assets by keyword or filters."""
    assets = _get_indexed_assets(path)
    results: list[Asset] = []
    query_lower = query.lower()

    for asset in assets:
        if asset_type and asset.asset_type != asset_type:
            continue
        if status and asset.status != status:
            continue
        if tag and tag not in asset.tags:
            continue

        if query:
            searchable = " ".join(
                [
                    asset.title or "",
                    asset.asset_type or "",
                    asset.status or "",
                    " ".join(asset.tags),
                    asset.body,
                ]
            ).lower()
            if query_lower not in searchable:
                continue

        results.append(asset)

    if output_format == "json":
        click.echo(
            json.dumps([a.to_dict() for a in results], ensure_ascii=False, indent=2)
        )
    else:
        for asset in results:
            title = asset.title or Path(asset.path).name
            click.echo(f"  {title} | {asset.asset_type or 'no-type'} | {asset.path}")


@main.command()
@click.option("--type", "asset_type", default=None, help="Filter by asset type.")
@click.option("--status", default=None, help="Filter by status.")
@click.option("--path", default=".", help="Project path to list.")
@click.option(
    "--format", "output_format", default="text", type=click.Choice(["text", "json"])
)
def list(
    asset_type: str | None, status: str | None, path: str, output_format: str
) -> None:
    """List all indexed assets."""
    results = _get_indexed_assets(path)

    if asset_type:
        results = [a for a in results if a.asset_type == asset_type]
    if status:
        results = [a for a in results if a.status == status]

    if output_format == "json":
        click.echo(
            json.dumps([a.to_dict() for a in results], ensure_ascii=False, indent=2)
        )
    else:
        click.echo(f"Assets ({len(results)}):")
        for asset in results:
            title = asset.title or Path(asset.path).name
            tags = ", ".join(asset.tags) if asset.tags else "-"
            click.echo(
                f"  {title} | type={asset.asset_type or '?'} | status={asset.status or '?'} | tags=[{tags}] | {asset.path}"
            )


@main.command()
@click.option("--file", "file_path", default=None, help="Check a single file.")
@click.option("--path", default=".", help="Project path to check.")
@click.option(
    "--format", "output_format", default="text", type=click.Choice(["text", "json"])
)
def check(file_path: str | None, path: str, output_format: str) -> None:
    """Validate assets against rules."""
    target = Path(path).expanduser().resolve()
    project_root = get_project_root(str(target)) or str(target)
    rules = load_rules(project_root)

    if file_path:
        assets = [Asset(path=file_path, frontmatter={}, body="")]
        try:
            text = Path(file_path).read_text(encoding="utf-8")
            from .store import parse_frontmatter

            fm, body = parse_frontmatter(text)
            assets[0].frontmatter = fm
            assets[0].body = body
        except (OSError, UnicodeDecodeError):
            click.echo(f"[asset-index] Cannot read file: {file_path}", err=True)
            sys.exit(1)
    else:
        assets = _get_indexed_assets(path)

    all_issues: list[dict] = []
    has_errors = False

    for asset in assets:
        issues = check_asset(asset, rules)
        for issue in issues:
            all_issues.append(
                {
                    "path": asset.path,
                    **issue,
                }
            )
            if issue["severity"] == "error":
                has_errors = True

    if output_format == "json":
        click.echo(json.dumps(all_issues, ensure_ascii=False, indent=2))
    else:
        if not all_issues:
            click.echo("All assets passed validation.")
        else:
            for issue in all_issues:
                sev = issue["severity"].upper()
                msg = issue["message"]
                p = issue["path"]
                click.echo(f"[{sev}] {p}: {msg}")

    if has_errors:
        sys.exit(1)


@main.command()
@click.option("--path", default=".", help="Project path to analyze.")
@click.option(
    "--format", "output_format", default="text", type=click.Choice(["text", "json"])
)
def stats(path: str, output_format: str) -> None:
    """Show asset statistics."""
    assets = _get_assets(path)
    indexed_assets = _get_indexed_assets(path)
    with_fm = [a for a in assets if a.frontmatter]
    without_fm = len(assets) - len(with_fm)

    type_counts: dict[str, int] = {}
    status_counts: dict[str, int] = {}
    tag_counts: dict[str, int] = {}

    for asset in indexed_assets:
        t = asset.asset_type or "(no type)"
        type_counts[t] = type_counts.get(t, 0) + 1
        s = asset.status or "(no status)"
        status_counts[s] = status_counts.get(s, 0) + 1
        for tag in asset.tags:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1

    data = {
        "total_files": len(assets),
        "with_frontmatter": len(with_fm),
        "indexed_assets": len(indexed_assets),
        "without_frontmatter": without_fm,
        "type_distribution": type_counts,
        "status_distribution": status_counts,
        "top_tags": dict(
            sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        ),
    }

    if output_format == "json":
        click.echo(json.dumps(data, ensure_ascii=False, indent=2))
    else:
        click.echo(f"Total files scanned: {len(assets)}")
        click.echo(f"  With frontmatter: {len(with_fm)}")
        click.echo(f"  Indexed assets: {len(indexed_assets)}")
        click.echo(f"  Without frontmatter: {without_fm}")
        click.echo()
        click.echo("Type distribution:")
        for t, count in sorted(type_counts.items(), key=lambda x: -x[1]):
            click.echo(f"  {t}: {count}")
        click.echo()
        click.echo("Status distribution:")
        for s, count in sorted(status_counts.items(), key=lambda x: -x[1]):
            click.echo(f"  {s}: {count}")
        if tag_counts:
            click.echo()
            click.echo("Top tags:")
            for tag, count in sorted(tag_counts.items(), key=lambda x: -x[1])[:10]:
                click.echo(f"  {tag}: {count}")
