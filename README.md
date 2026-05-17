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

> **v0.3.0 update**: Rewritten in **Node.js** (was Python). Install via `npm` — no Python required. Same CLI commands, same `rules.yaml` format, same behavior.

## Quick Start

```bash
# Install globally via npm (Node.js 18+ required)
npm install -g asset-index-cli

# Or run without installing
npx asset-index-cli init

# Initialize a project
cd your-project/
asset-index init

# Scan and build index
asset-index scan .

# Search
asset-index search "主角"
asset-index search --type 剧本 --status 已整理

# Validate
asset-index check

# Statistics
asset-index stats
```

## Install From Source

If `asset-index-cli` is not yet published to npm, install from source:

```bash
git clone https://github.com/hezi-ywt/asset-index.git
cd asset-index
npm install
npm link              # link the asset-index command globally
```

## Update for Existing Users

### Update the CLI (npm)

```bash
npm update -g asset-index-cli
```

### Update the CLI (source install)

```bash
cd /path/to/asset-index
git pull
npm install
```

### Update the Skill

If you copied `skills/asset-index/` manually into a project, re-copy the updated skill directory after pulling the latest source:

```bash
cp -r /path/to/asset-index/skills/asset-index your-project/.opencode/skills/
```

## Usage Examples

```bash
# Scan a specific directory
asset-index scan ./assets/my-project/

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

This separation keeps the tool small, predictable, and safe for automated environments.

## AI Agent Integration

Asset Index is a **Skill + CLI** project.

Installing the skill alone is not enough. When an agent installs the `asset-index` skill, it should also install the `asset-index` CLI in the same environment, because the skill provides instructions/context while the CLI is what actually runs `asset-index` commands.

### Install

**GitHub:** https://github.com/hezi-ywt/asset-index

#### 1. Install the CLI first

```bash
# Via npm
npm install -g asset-index-cli

# Or from source
git clone https://github.com/hezi-ywt/asset-index.git
cd asset-index && npm install && npm link
```

#### 2. Install the Skill

The skill is located at `skills/asset-index/` in this repository.

**Default recommendation: install per project.**

```bash
git clone https://github.com/hezi-ywt/asset-index.git
cp -r asset-index/skills/asset-index your-project/.opencode/skills/
```

### The Create → Check Loop

When an agent creates a new asset `.md` file, it should immediately run:

```bash
asset-index check --file ./世界观设定/角色/李雷/李雷.md
```

If validation fails, the agent fixes the frontmatter and re-checks. This ensures every asset is born compliant.

## Project Structure

```
src/
  cli.js            Commander CLI entry point
  models.js         Asset class
  store.js          Frontmatter parsing, scanning, caching
  checker.js        Rule-driven validation engine
bin/
  asset-index.js    npm bin shebang
```

## Requirements

- **Node.js >= 18**
- Dependencies: `commander`, `gray-matter`, `js-yaml`, `fast-glob`

## License

MIT
