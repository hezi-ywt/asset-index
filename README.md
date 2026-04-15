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
# Clone and install from source
git clone https://github.com/hezi-ywt/asset-index.git
cd asset-index
pip install -e .

# Initialize a project
cd your-project/
asset-index init
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

**The tool is unified; the rules are project-specific.** The `asset-index` CLI is one shared indexing engine, but each project should define its own asset boundary through `.asset-index/rules.yaml`.

That is why the default recommendation is **project-level installation and usage**: not because the CLI changes per project, but because different projects may define assets, types, and directory conventions very differently.

This separation keeps the tool small, predictable, and safe for automated environments.

## AI Agent Integration

Asset Index is a **Skill + CLI** project.

Installing the skill alone is not enough. When an agent installs the `asset-index` skill, it should also install the `asset-index` CLI in the same environment, because the skill provides instructions/context while the CLI is what actually runs `asset-index` commands.

### Install

**GitHub:** https://github.com/hezi-ywt/asset-index

#### 1. Install the CLI first

Before using or installing the skill, install the CLI in the same project environment:

```bash
git clone https://github.com/hezi-ywt/asset-index.git
cd asset-index
pip install -e .
```

#### 2. Install the Skill

The skill is located at `skills/asset-index/` in this repository. Installing the skill should always be paired with installing the CLI above.

**Default recommendation: install per project.** Different projects may have different asset rules, types, and directory structures, so project-level installation should be the standard choice.

**Option A — Manual copy (recommended: project-level):**
```bash
git clone https://github.com/hezi-ywt/asset-index.git
# Recommended default: install per project, because different projects have different asset rules
# Also install the CLI in the same environment before using the skill
cd asset-index
pip install -e .
cd ..
cp -r asset-index/skills/asset-index your-project/.opencode/skills/

# Only use global install if you intentionally want one shared behavior across all projects:
# cp -r asset-index/skills/asset-index ~/.config/opencode/skills/
```

**Option B — Agent platform command (if supported):**
```bash
npx skills add hezi-ywt/asset-index
# Or your platform's equivalent skill installation command
# After adding the skill, also install the CLI in the environment where the agent will run:
# git clone https://github.com/hezi-ywt/asset-index.git && cd asset-index && pip install -e .
```

**Option C — Tell your agent directly:**
```
Install the asset-index skill from https://github.com/hezi-ywt/asset-index
The skill follows the Agent Skills standard (https://agentskills.io).
The skill path inside the repo is: skills/asset-index/
Also install the asset-index CLI in the same project environment by cloning the repo and running `pip install -e .`.
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
