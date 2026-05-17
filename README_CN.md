# Asset Index

**基于 frontmatter 的原子资产索引管理 CLI。**

一句话：扫描 `.md` 文件，读取 YAML frontmatter，建立索引并验证。Asset Index 不创建资产——它只读取和检查。创建资产是 agent 的事。

```
┌──────────────────────────────────────────────────────┐
│  AI Agent / Skill                                     │
│  "帮我找出所有草稿状态的角色"                           │
├──────────────────────────────────────────────────────┤
│  asset-index  ← 你的位置                               │
│  扫描 .md → 解析 frontmatter → 索引 / 查询 / 检查      │
├──────────────────────────────────────────────────────┤
│  文件系统：带 YAML frontmatter 的 .md 文件              │
│  世界观设定/角色/李雷.md                               │
└──────────────────────────────────────────────────────┘
```

## 特性

| | 特性 | 说明 |
|---|------|------|
| 📁 | **扫描** | 递归查找所有 `.md` 文件并解析 frontmatter |
| 🔍 | **搜索** | 按关键词、类型、状态、标签查询 |
| 📋 | **列出** | 浏览所有已索引的资产 |
| ✅ | **检查** | 按项目自定义规则验证 frontmatter |
| 📊 | **统计** | 类型分布、状态分布、标签云 |
| ⚙️ | **规则驱动** | 通过 `.asset-index/rules.yaml` 自定义验证规则 |
| 🤖 | **Agent 友好** | 纯文本 stdout，`[asset-index]` stderr，exit 0/1 |

> **v0.3.0 更新**：从 Python 改写为 **Node.js**。安装用 `npm`，无需 Python。CLI 命令、`rules.yaml` 格式、输出行为完全兼容。

## 快速开始

```bash
# 全局安装（Node.js 18+）
npm install -g asset-index-cli

# 或从源码安装
git clone https://github.com/hezi-ywt/asset-index.git
cd asset-index
npm install
npm link              # 把 asset-index 命令链接到全局

# 初始化项目
cd your-project/
asset-index init

# 扫描并建立索引
asset-index scan .

# 搜索
asset-index search "主角"
asset-index search --type 剧本 --status 已整理

# 验证
asset-index check

# 统计
asset-index stats
```

## 老用户更新方式

### npm 安装

```bash
npm update -g asset-index-cli
```

### 源码安装

```bash
cd /path/to/asset-index
git pull
npm install
```

### 更新 Skill

如果之前是手动复制 `skills/asset-index/` 到项目里的，拉取最新源码后请重新复制：

```bash
cp -r /path/to/asset-index/skills/asset-index your-project/.opencode/skills/
```

## 使用示例

```bash
# 扫描指定目录
asset-index scan ./assets/my-project/

# 按标签搜索
asset-index search --tag 时间线

# 列出所有剧本（JSON 格式）
asset-index list --type 剧本 --format json

# 检查单个文件
asset-index check --file ./世界观设定/角色/李雷/李雷.md

# 统计信息输出为 JSON
asset-index stats --format json
```

如果项目的 `.asset-index/rules.yaml` 配置了 `types`，只有 `type` 命中这些规则的 frontmatter 文件才会被视为资产并进入索引。
如果没有配置 `types`，则保持兼容行为：所有带 frontmatter 的文件都会被视为资产。

## CLI 参考

```
asset-index [COMMAND]

Commands:
  init    初始化 .asset-index/ 目录和 sample rules.yaml
  scan    扫描 .md 文件并建立索引缓存
  search  按关键词或条件搜索资产
  list    列出所有已索引资产
  check   按规则验证 frontmatter
  stats   显示资产统计信息
```

## 设计理念

> Asset Index 是一个**只读的原子技能**，用于 frontmatter 项目。

**它做什么** — 扫描、解析、查询、验证。

**它不做** — 创建、编辑、删除 `.md` 文件。这些操作交给 agent 或上层 skill。

**统一的是工具，不统一的是规则。** `asset-index` CLI 是统一的索引引擎，但每个项目都应通过自己的 `.asset-index/rules.yaml` 定义"什么算资产"。

因此，默认推荐**项目级安装和使用**：不是因为工具不统一，而是因为不同项目的资产定义、类型体系和目录结构可能有较大区别。

这种分离让工具保持小巧、可预测、对自动化环境安全。

## AI Agent 集成

Asset Index 是一个 **Skill + CLI** 项目。

**只安装 skill 不够。** 当 agent 安装 `asset-index` skill 时，也必须在同一个运行环境里安装 `asset-index` CLI，因为 skill 提供的是说明和上下文，真正执行 `asset-index` 命令的是 CLI。

### 安装

**GitHub:** https://github.com/hezi-ywt/asset-index

#### 1. 先安装 CLI

```bash
# 方式 A：npm 全局
npm install -g asset-index-cli

# 方式 B：从源码
git clone https://github.com/hezi-ywt/asset-index.git
cd asset-index && npm install && npm link
```

#### 2. 安装 Skill

Skill 文件位于本仓库的 `skills/asset-index/` 目录下。

**默认推荐：项目级安装。**

```bash
git clone https://github.com/hezi-ywt/asset-index.git
cp -r asset-index/skills/asset-index your-project/.opencode/skills/
```

### 创建 → 检查闭环

当 agent 创建新的资产 `.md` 文件时，应立即运行：

```bash
asset-index check --file ./世界观设定/角色/李雷/李雷.md
```

如果验证失败，agent 修正 frontmatter 并重新检查。这确保每个资产从诞生起就符合规范。

## 项目结构

```
src/
  cli.js            Commander CLI 入口
  models.js         Asset 类
  store.js          Frontmatter 解析、扫描、缓存
  checker.js        规则驱动的验证引擎
bin/
  asset-index.js    npm bin shebang
```

## 环境要求

- **Node.js >= 18**
- 依赖：`commander`、`gray-matter`、`js-yaml`、`fast-glob`

## 许可证

MIT
