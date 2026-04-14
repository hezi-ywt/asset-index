# Asset Index

**Atomic CLI for frontmatter-based asset index management.**

One command: scan `.md` files, read YAML frontmatter, index and validate. Asset Index does not create assets — it reads and checks them. Creation is the agent's job.

```
┌──────────────────────────────────────────────────────┐
│  AI Agent / Skill                                     │
│  "Find all draft characters"                          │
├──────────────────────────────────────────────────────┤
│  asset-index  ← you are here                         │
│  scan .md → parse frontmatter → index / query / check │
├──────────────────────────────────────────────────────┤
│  Filesystem: .md files with YAML frontmatter          │
│  世界观设定/角色/李雷.md                               │
└──────────────────────────────────────────────────────┘
```

## Features

| | Feature | Detail |
|---|---------|--------|
| 📁 | **Scan** | Recursively find all `.md` files and parse frontmatter |
| 🔍 | **Search** | Query by keyword, type, status, or tag |
| 📋 | **List** | Browse all indexed assets with filters |
| ✅ | **Check** | Validate frontmatter against project-specific rules |
| 📊 | **Stats** | Type distribution, status breakdown, tag cloud |
| ⚙️ | **Rule-driven** | Customize validation via `.asset-index/rules.yaml` |
| 🤖 | **Agent-ready** | Plain text stdout, `[asset-index]` stderr, exit 0/1 |

## Quick Start

```bash
pipx install asset-index-cli
# or for development:
pip install -e .

# Initialize a project
cd your-project/
asset-index init

# Scan and build index
asset-index scan .

# Search
asset-index search "甲武神"
asset-index search --type 剧本 --status 已整理

# Validate
asset-index check

# Statistics
asset-index stats
```

## Usage Examples

```bash
# Scan a specific directory
asset-index scan ./项目库/甲武神之战甲少年/

# Search by tag
asset-index search --tag 时间线

# List all scripts
asset-index list --type 剧本 --format json

# Check a single file
asset-index check --file ./世界观设定/角色/李雷/李雷.md

# Stats as JSON for downstream processing
asset-index stats --format json
```

## CLI Reference

```
asset-index [COMMAND]

Commands:
  init    Initialize .asset-index/ with sample rules.yaml
  scan    Scan .md files and build index cache
  search  Search assets by keyword or filters
  list    List all indexed assets
  check   Validate frontmatter against rules
  stats   Show asset statistics
```

## Design Philosophy

> Asset Index is an **atomic read-only skill** for frontmatter-based projects.

**What it does** — scan, parse, query, validate.

**What it does NOT do** — create, edit, or delete `.md` files. Those operations belong to the agent or higher-level skills.

This separation keeps the tool small, predictable, and safe for automated environments.

## AI Agent Integration

Asset Index is a **Skill + CLI** project.

### Install

**GitHub:** https://github.com/hezi-ywt/asset-index

#### 1. Install the CLI

```bash
pipx install asset-index-cli
# Or install from the release wheel:
pip install https://github.com/hezi-ywt/asset-index/releases/download/v0.1.0/asset_index_cli-0.1.0-py3-none-any.whl
```

#### 2. Install the Skill

The skill is located at `skills/asset-index/` in this repository. Depending on your agent platform:

**Option A — Manual copy (recommended: project-level):**
```bash
git clone https://github.com/hezi-ywt/asset-index.git
# Recommended: install per project, because different projects have different asset rules
cp -r asset-index/skills/asset-index your-project/.opencode/skills/

# Only use global install if you want the same behavior across all projects:
# cp -r asset-index/skills/asset-index ~/.config/opencode/skills/
```

**Option B — Agent platform command (if supported):**
```bash
npx skills add hezi-ywt/asset-index
# Or your platform's equivalent skill installation command
```

**Option C — Tell your agent directly:**
```
Install the asset-index skill from https://github.com/hezi-ywt/asset-index
The skill follows the Agent Skills standard (https://agentskills.io).
The skill path inside the repo is: skills/asset-index/
```

### Three-File Skill Design

```
skills/asset-index/
├── SKILL.md                    # Stable facts: commands, output contract, errors
└── references/
    ├── schema.md               # Asset schema and rules.yaml format
    └── user-notes.md           # Agent-maintained memory
```

### The Create → Check Loop

When an agent creates a new asset `.md` file, it should immediately run:

```bash
asset-index check --file ./世界观设定/角色/李雷/李雷.md
```

If validation fails, the agent fixes the frontmatter and re-checks. This ensures every asset is born compliant.

## Project Structure

```
src/asset_index/
  cli.py            Click CLI entry point
  models.py         Asset dataclass
  store.py          Frontmatter parsing, scanning, caching
  checker.py        Rule-driven validation engine
```

## Requirements

- Python >= 3.10
- click, PyYAML

## License

MIT
