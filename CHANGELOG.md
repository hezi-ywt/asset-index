# Changelog

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
