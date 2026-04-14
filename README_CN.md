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

## 快速开始

```bash
pipx install asset-index-cli
# 或开发模式：
pip install -e .

# 初始化项目
cd your-project/
asset-index init

# 扫描并建立索引
asset-index scan .

# 搜索
asset-index search "甲武神"
asset-index search --type 剧本 --status 已整理

# 验证
asset-index check

# 统计
asset-index stats
```

## 使用示例

```bash
# 扫描指定目录
asset-index scan ./项目库/甲武神之战甲少年/

# 按标签搜索
asset-index search --tag 时间线

# 列出所有剧本（JSON 格式）
asset-index list --type 剧本 --format json

# 检查单个文件
asset-index check --file ./世界观设定/角色/李雷/李雷.md

# 统计信息输出为 JSON
asset-index stats --format json
```

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

这种分离让工具保持小巧、可预测、对自动化环境安全。

## AI Agent 集成

Asset Index 是一个 **Skill + CLI** 项目。

### 安装

**GitHub:** https://github.com/hezi-ywt/asset-index

#### 1. 安装 CLI 工具

```bash
pipx install asset-index-cli
# 或者从 release wheel 安装：
pip install https://github.com/hezi-ywt/asset-index/releases/download/v0.1.0/asset_index_cli-0.1.0-py3-none-any.whl
```

#### 2. 安装 Skill

Skill 文件位于本仓库的 `skills/asset-index/` 目录下。根据你的 agent 平台，选择以下方式之一：

**方式 A — 手动复制（推荐项目级安装）：**
```bash
git clone https://github.com/hezi-ywt/asset-index.git
# 推荐按项目安装，因为不同项目的资产规则和模式不同
cp -r asset-index/skills/asset-index your-project/.opencode/skills/

# 只有当你希望所有项目共用同一套行为时，才安装到全局：
# cp -r asset-index/skills/asset-index ~/.config/opencode/skills/
```

**方式 B — Agent 平台命令（如果支持）：**
```bash
npx skills add hezi-ywt/asset-index
# 或使用你所在平台的等效 skill 安装命令
```

**方式 C — 直接告诉 agent：**
```
从 https://github.com/hezi-ywt/asset-index 安装 asset-index skill
该 skill 遵循 Agent Skills 标准（https://agentskills.io）
仓库内的 skill 路径为：skills/asset-index/
```

### 三文件 Skill 设计

```
skills/asset-index/
├── SKILL.md                    # 稳定知识：命令、输出约定、错误速查
└── references/
    ├── schema.md               # 资产 schema 和 rules.yaml 格式
    └── user-notes.md           # Agent 维护的记忆
```

### 创建 → 检查闭环

当 agent 创建新的资产 `.md` 文件时，应立即运行：

```bash
asset-index check --file ./世界观设定/角色/李雷/李雷.md
```

如果验证失败，agent 修正 frontmatter 并重新检查。这确保每个资产从诞生起就符合规范。

## 项目结构

```
src/asset_index/
  cli.py            Click CLI 入口
  models.py         Asset 数据类
  store.py          Frontmatter 解析、扫描、缓存
  checker.py        规则驱动的验证引擎
```

## 环境要求

- Python >= 3.10
- click, PyYAML

## 许可证

MIT
