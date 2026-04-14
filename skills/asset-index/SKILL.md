---
name: asset-index
description: "基于 frontmatter 的资产索引管理。当需要扫描带有 YAML frontmatter 的 Markdown 文件、按 type/status/tag 搜索内容创作资产、按项目规则验证资产元数据、或在创建后检查资产健康度时使用。也用于构建诸如'找出所有草稿状态的角色'或'列出第一季所有剧本'之类的查询。"
compatibility: "需要 asset-index-cli（pipx install asset-index-cli 或 pip install -e .）"
---

# Asset Index -- 基于 Frontmatter 的资产管理

一句话：扫描 `.md` 文件，解析 YAML frontmatter，建立索引并验证。

本 skill 分为三个文件：
- **SKILL.md**（本文件）—— 命令语法、输出约定、错误速查。稳定知识。
- **references/schema.md** —— 资产 schema、rules.yaml 格式、验证规则说明。
- **references/user-notes.md** —— 用户偏好、习得模式、项目特定约定。由你在使用过程中持续维护。

## 安装

### 1. 安装 CLI 工具

```bash
python3 --version               # 需要 Python >= 3.10
pipx --version                  # 如果没有：brew install pipx (macOS) / apt install pipx (Linux)
pipx install asset-index-cli    # 全局安装，无需激活环境
```

也可以从 GitHub Release 直接安装：
```bash
pip install https://github.com/hezi-ywt/asset-index/releases/download/v0.1.0/asset_index_cli-0.1.0-py3-none-any.whl
```

### 2. 安装本 Skill

本 skill 位于仓库的 `skills/asset-index/` 目录下：

```bash
git clone https://github.com/hezi-ywt/asset-index.git
cp -r asset-index/skills/asset-index ~/.config/opencode/skills/
# 或复制到项目目录的 .opencode/skills/ 下
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

验证规则存放在每个项目的 `.asset-index/rules.yaml` 中。规则格式见 `references/schema.md`。在检查项目前，如需了解必填字段，可先阅读该项目的 `rules.yaml`。

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

完整 schema、常用字段定义和 `rules.yaml` 格式见 `references/schema.md`。

## 持续改进

在使用 asset-index 处理该用户的项目前，先阅读 `references/user-notes.md`。
它记录了该用户偏好的资产类型、标签约定、项目结构和有效工作流。
当你发现值得记住的信息时，更新该文件 —— 常见触发信号列在该文件内部，但你也应自行判断。
保持条目简短且实用。
