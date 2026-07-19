# Changelog

## [Unreleased]

### 修复

- CLI 版本号改为读取 `package.json`，避免包版本与 `asset-index --version` 漂移。
- 测试入口改为显式匹配 `tests/*.test.js`，兼容 Windows 与新版 Node.js。
- 更新 `js-yaml` 直接与间接依赖的锁定版本，修复重复 alias 触发的二次复杂度 DoS 风险。

### 测试

- 新增 CLI `--version` 与 `package.json` 一致性测试。

## [0.3.0] - 2026-05-17

### 🚀 Breaking: 改用 Node.js 实现（替换 Python）

- **CLI 从 Python 改写为 Node.js**——目标用户（中文 AI 创作者）100% 已装 Claude Code 等于装 Node，`pip install` 摩擦大，`npm install -g` 更顺
- **行为完全兼容**：所有命令、参数、输出格式、`rules.yaml` 格式、`cache.json` 格式与 0.2.0 一致
- **依赖最小化**：commander / gray-matter / js-yaml / fast-glob（4 个）
- **Node.js >= 18** 必需

### 迁移指南

- **从 0.2.0 升级**：先 `pip uninstall asset-index-cli`，再 `npm install -g asset-index-cli`（或 `git pull && npm install && npm link`）
- 现有 `.asset-index/rules.yaml` 和 `cache.json` **无需改动**
- 现有 `.md` 资产文件**无需改动**

### 修复

- YAML 自动把 `YYYY-MM-DD` 解析成 Date 对象的问题：用 YAML CORE_SCHEMA（YAML 1.2 core）避免日期自动解析，保持与 Python 版行为一致

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
