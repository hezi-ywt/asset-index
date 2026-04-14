# Changelog

## [0.2.0] - 2026-04-14

### 新增

- **基于 `type` 的资产识别规则**：`rules.yaml` 中配置的 `types` 现在同时决定哪些 frontmatter 文件会被视为资产。配置了 `types` 时，只有 `type` 命中规则的文件才会进入 `scan/list/search/stats` 和批量 `check`；未配置 `types` 时保持兼容行为。
- `scan` 输出更精确：区分 "indexed assets" 和 "files with frontmatter"。
- `stats` 新增 `indexed_assets` 统计项。

### 改进

- 文档和 Skill 安装说明补充项目级安装推荐。
- `schema.md` 和 `usage.md` 明确解释 `types` 的双重语义。

## [0.1.0] - 2026-04-14

### 初始发布

- `scan` — 递归扫描 `.md` 文件并解析 YAML frontmatter，生成索引缓存
- `search` — 按关键词、type、status、tag 搜索资产
- `list` — 列出所有已索引资产，支持过滤和 JSON 输出
- `check` — 按项目规则验证 frontmatter 完整性
- `stats` — 输出资产统计信息（类型分布、状态分布、标签云）
- `init` — 初始化项目，生成示例 `rules.yaml`
- 规则驱动验证引擎 — 通过 `.asset-index/rules.yaml` 自定义项目规范
- Agent 安全输出 — stdout 为结果，stderr 为 `[asset-index]` 错误，exit 0/1
- 附带 Agent Skill — `skills/asset-index/` 提供完整的使用指导和上下文
