# Asset Index 设计理念

## 定位：原子只读技能

Asset Index 是一个**基于 frontmatter 的原子只读技能**。

"原子"的含义：**不可再分的最小有用单元**。它只做一件事——扫描 `.md` 文件，解析 YAML frontmatter，提供索引、查询和验证。

```
原子技能（asset-index）      → "读取并检查这个资产"
组合技能（上层 skill）        → "帮我创建角色并确保规范"
应用（agent / 产品）         → "管理整个内容创作项目"
```

这个分层是刻意的。Asset Index 保持只读，是为了让上层 skill 和 agent 能灵活组合，同时不会因为工具层的写入逻辑而限制创建方式。

| 你想做的 | Asset Index 负责 | 上层 skill/agent 负责 |
|---------|----------------|---------------------|
| 查找所有草稿角色 | 扫描、查询 | 决定查询条件、处理结果 |
| 验证新资产是否合规 | 按规则检查 frontmatter | 创建 `.md` 文件、修正错误 |
| 统计项目资产状态 | 输出统计数据 | 解读数据、生成报告 |
| 批量导入外部数据 | ❌ 不做 | 解析数据源、创建资产文件 |
| 编辑资产内容 | ❌ 不做 | 直接修改 `.md` 文件 |

**Asset Index 永远只做表格左列的事。** 右列的逻辑不会进入工具代码。

## 为什么做这个

内容创作项目的资产管理面临几个现实问题：

1. **元数据和内容分离** — 传统数据库或集中式 registry 需要维护两套系统，容易不同步
2. **每个项目的规范不同** — 游戏、动画、小说的资产字段差异很大
3. **Agent 需要快速检索** — 不想在每个 skill 里重复写文件扫描和 frontmatter 解析
4. **创建后缺乏验证** — 手写的 frontmatter 容易漏字段、格式错误

Asset Index 的解决方案：

- **frontmatter 即元数据**：数据和元数据共存于 `.md` 文件，天然同步
- **规则驱动**：`.asset-index/rules.yaml` 让每个项目自定义验证规则
- **统一索引层**：一次扫描，多次查询
- **创建→检查闭环**：新资产诞生后立即验证，问题早发现早修复

## 核心设计决策

### 为什么只读

创建资产的方式千变万化：
- 有的从 Excel 导入
- 有的由 agent 按模板生成
- 有的从其他系统迁移

如果在工具里内置"创建"逻辑，就假设了特定的创建方式。保持只读，让创建方式保持开放。

### 为什么用 frontmatter

YAML frontmatter 是 Markdown 生态的标准做法：
- 人和机器都能读
- 版本控制友好（Git diff 清晰）
- 不需要额外的数据库或 schema 迁移
- 元数据随文件移动，不会丢失

### 为什么规则驱动

不同项目的 frontmatter 规范差异很大：
- 动画项目需要 `episode`（集数）
- 游戏项目需要 `level`（关卡）
- 小说项目需要 `chapter`（章节）

把规则外置到 `rules.yaml`，工具代码保持通用，一个 CLI 可以服务多种项目。

### 为什么缓存索引

扫描整个项目的 `.md` 文件并解析 YAML 是 I/O 密集型操作。缓存到 `.asset-index/cache.json` 后：
- `search`、`list`、`check` 可以直接读缓存
- `scan` 命令负责显式刷新缓存
- 缓存格式是简单 JSON，便于调试

## 作为 Agent Skill 的设计

### 输入输出契约

- **输入**: CLI 参数（`scan`、`search`、`check` 等子命令）
- **输出**: 纯文本到 stdout，错误到 stderr，exit code 0/1
- **无副作用**: 不修改任何 `.md` 文件，只读写 `.asset-index/` 目录

### Agent 使用模式

```bash
# 基础调用
asset-index scan .
asset-index search --type 角色 --status 草稿

# 创建后验证
asset-index check --file ./世界观设定/角色/李雷/李雷.md

# 管道组合
asset-index list --status 草稿 --format json | jq '.[].path'
```

### 创建 → 检查闭环

这是 Asset Index 最重要的使用模式：

```bash
# 1. Agent 按模板创建资产文件
# （由 content-asset-management skill 或其他逻辑完成）

# 2. 立即验证
asset-index check --file ./世界观设定/角色/李雷/李雷.md

# 3. 如果有错误，修正 frontmatter
# 4. 重新验证，直到通过
```

这个闭环确保：
- 每个资产从诞生起就符合规范
- 问题在创建阶段被发现，而不是在项目后期堆积
- Agent 可以自我修复，不需要人工介入

## 原子能力 vs 上层 Skill

Asset Index 刻意保持只读原子状态。以下是边界：

| asset-index 做 | asset-index 不做（留给上层） |
|----------------|---------------------------|
| 扫描 `.md` 文件 | 创建、编辑、删除 `.md` |
| 解析 YAML frontmatter | 设计模板和目录结构 |
| 按规则验证 | 决定规则内容（虽然规则文件由人定义） |
| 查询和统计 | 解释查询结果、生成报告 |
| 输出纯文本/JSON | 可视化展示、仪表盘 |

上层 skill 可以这样组合 asset-index：

```bash
# Skill: 严格创建角色资产
# 1. Agent 按模板生成 .md 文件
# 2. 调用 asset-index check 验证
# 3. 如果有错误，修正 frontmatter
# 4. 验证通过后，返回成功

asset-index check --file ./世界观设定/角色/李雷/李雷.md
# → [ERROR] ...: missing 'created'
# Agent 修正后重新运行，直到无错误
```

```bash
# Skill: 项目健康度检查
# 1. 扫描整个项目
asset-index scan .

# 2. 检查所有资产
asset-index check

# 3. 输出统计
asset-index stats
```

## 后续方向

保持原子能力不变，可能扩展的方向：

- **`--watch` 模式**: 监听文件变化，自动刷新缓存
- **引用检查**: 扫描 `.md` 正文中的 `[[资产名]]` 或相对链接，标记未定义引用
- **多项目工作区**: 支持从根目录管理多个子项目的资产
- **导出功能**: 将索引导出为 CSV/JSON 供其他工具使用
