---
name: asset-index
description: "基于 frontmatter 的资产索引管理。当用户说使用资产管理、扫描带有 YAML frontmatter 的 Markdown 文件、按 type/status/tag 搜索内容创作资产、按项目规则验证资产元数据、或在创建后检查资产健康度时使用。也用于构建诸如'找出所有草稿状态的角色'、'列出第一季所有剧本'、'使用资产管理看一下这个项目里有哪些资产'之类的查询。"
compatibility: "需要在 agent 运行环境中同时安装 asset-index CLI。推荐项目级安装：git clone 仓库后执行 pip install -e .；仅安装 skill 本身并不能执行 asset-index 命令。"
---

# Asset Index -- 基于 Frontmatter 的资产管理

一句话：扫描 `.md` 文件，解析 YAML frontmatter，建立索引并验证。

本 skill 分为三个文件：
- **SKILL.md**（本文件）—— 命令语法、输出约定、错误速查。稳定知识。
- **references/schema.md** —— 资产 schema、项目根 `.asset-index/rules.yaml` 的格式，以及验证规则说明。
- **references/user-notes.md** —— 用户偏好、习得模式、项目特定约定。由你在使用过程中持续维护。

## 安装

### 1. 安装 CLI 工具

安装或使用本 skill 之前，必须先在同一个 agent 运行环境中安装 `asset-index` CLI：

```bash
python3 --version               # 需要 Python >= 3.10

# 从源码克隆并安装到当前环境
git clone https://github.com/hezi-ywt/asset-index.git
cd asset-index
pip install -e .
```

### 2. 安装本 Skill

本 skill 位于仓库的 `skills/asset-index/` 目录下。

安装本 skill 时，也要同时安装 CLI。skill 提供的是说明和上下文，真正执行命令的是 `asset-index` CLI。

**推荐按项目安装**，因为不同项目的资产规则、类型定义和目录结构可能不同：

```bash
git clone https://github.com/hezi-ywt/asset-index.git
cd asset-index
pip install -e .
cd ..
cp -r asset-index/skills/asset-index your-project/.opencode/skills/

# 只有当你明确希望所有项目共用同一套行为时，才安装到全局：
# cp -r asset-index/skills/asset-index ~/.config/opencode/skills/
```

### 3. 初始化项目

首次使用前，在目标项目目录运行：

```bash
cd your-project/
asset-index init                # 创建 .asset-index/rules.yaml
```

## 快速参考

```bash
# 扫描并建立索引缓存
asset-index scan .

# 搜索资产
asset-index search "keyword"
asset-index search --type 角色 --status 草稿
asset-index search --tag 时间线

# 列出所有资产（支持条件过滤）
asset-index list
asset-index list --type 剧本 --format json

# 按规则验证资产
asset-index check
asset-index check --file ./世界观设定/角色/李雷/李雷.md

# 显示统计信息
asset-index stats
asset-index stats --format json
```

## 使用原则

### 只读工具

Asset Index **不会**创建、编辑或删除 `.md` 文件。它的职责是读取和验证。当你需要创建资产时，使用对应的 skill 或直接写入 `.md` 文件，然后运行 `asset-index check` 进行验证。

### 创建 → 检查闭环

创建或修改资产后，应立即验证：

```bash
asset-index check --file ./path/to/new-asset.md
```

如果出现错误，修正 frontmatter 后重新检查。这确保每个资产从诞生起就符合规范。

### 规则驱动验证

验证规则存放在每个项目**根目录**的 `.asset-index/rules.yaml` 中。规则格式见 `references/schema.md`。在检查项目前，如需了解必填字段，应先阅读该项目根目录下的 `rules.yaml`。

这个文件**不属于 skill 目录**。skill 负责解释、引用和辅助维护流程；真正的项目级资产索引规范属于项目根目录。

### 成本与可组合性

Asset Index 将扫描结果缓存在 `.asset-index/cache.json` 中。运行 `scan` 可重建缓存，其他命令直接从缓存读取以提升速度。输出为管道安全的纯文本或 JSON。

## 输出约定

- **stdout**：仅输出结果（纯文本或 JSON）
- **stderr**：`[asset-index] ...` 形式的错误和警告
- **exit 0**：成功 | **exit 1**：失败（如发现验证错误）

## 错误速查

| stderr 内容 | 原因 | 修复 |
|------------|------|------|
| `No command specified` | 缺少子命令 | 运行 `asset-index --help` |
| `missing_frontmatter` | `.md` 文件没有 YAML frontmatter | 在文件顶部添加 `---` 包裹的 YAML 块 |
| `missing_title` | 缺少 `title` 或 `name` 字段 | 在 frontmatter 中添加 `title: ...` |
| `missing_type` | 缺少 `type` 字段 | 在 frontmatter 中添加 `type: ...` |
| `missing_status` | 缺少 `status` 字段 | 在 frontmatter 中添加 `status: ...` |
| `invalid_date` | 日期格式不是 `YYYY-MM-DD` | 修正日期字段 |

## 资产 Schema

完整 schema、常用字段定义和项目根 `rules.yaml` 格式见 `references/schema.md`。

## 持续改进

在使用 asset-index 处理该用户的项目前，先阅读 `references/user-notes.md`。
它记录了该用户偏好的资产类型、标签约定、项目结构和有效工作流。
当你发现值得记住的信息时，更新该文件 —— 常见触发信号列在该文件内部，但你也应自行判断。
保持条目简短且实用。
