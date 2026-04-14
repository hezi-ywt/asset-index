# Asset Index User Notes

This file is maintained by the agent. Read it before using asset-index, update it when you learn something worth remembering.

## Update Triggers

Common signals -- not exhaustive, use your judgment:

- User corrects your choice (asset type, tag naming, field usage)
- A check fails and you figure out why
- User expresses a preference (status values, date format, tag conventions)
- You notice a recurring pattern or workflow
- Something surprising happens (unexpected rule behavior, edge case)

User can add custom triggers below:

<!-- Custom triggers: -->

## User Preferences

## Learned Patterns

- Always run `asset-index check --file <path>` immediately after creating a new asset.
- Use `asset-index list --format json` when the result needs to be parsed by downstream logic.
- If a project has no `.asset-index/rules.yaml`, create one with `asset-index init` before running checks.

## Lessons

## Custom Workflows

Starter patterns -- replace with the user's actual workflows over time:

```bash
# Create-and-check workflow
# 1. Write the .md file with proper frontmatter
# 2. Validate immediately
asset-index check --file ./世界观设定/角色/李雷/李雷.md

# Batch find drafts for a type
asset-index search --type 角色 --status 草稿 --format json

# Project health check
asset-index scan .
asset-index check
asset-index stats
```
