# Asset Index -- Agent 上下文

## 这是什么

Asset Index 是一个**基于 frontmatter 的原子只读技能**，用于内容创作资产管理。它扫描带有 YAML frontmatter 的 Markdown 文件，建立索引，并提供查询与验证能力。

它**不会**创建或编辑文件。它只读取。

## 快速使用

```bash
# 安装（默认推荐项目级源码安装）
git clone https://github.com/hezi-ywt/asset-index.git
cd asset-index
pip install -e .

# 初始化项目
cd your-project/
asset-index init

# 扫描并索引
asset-index scan .

# 搜索
asset-index search "keyword"
asset-index search --type 角色 --status 草稿
asset-index search --tag 主线

# 验证
asset-index check
asset-index check --file ./path/to/asset.md

# 统计
asset-index stats
```

## 代码结构

```
src/asset_index/
  cli.py            Click 命令组：init, scan, search, list, check, stats
  models.py         Asset 数据类（frontmatter + body）
  store.py          parse_frontmatter(), scan_directory(), 缓存读写
  checker.py        load_rules(), check_asset() —— 规则驱动验证
```

## 核心设计决策

- **frontmatter 即唯一真实来源**：每个 `.md` 文件自带元数据，无需额外数据库。
- **只读 CLI**：创建和编辑是 agent/上层 skill 的职责，工具只负责索引和检查。
- **统一工具，项目级规则**：CLI 是统一引擎，但每个项目通过项目根目录的 `.asset-index/rules.yaml` 定义自己的资产边界、允许类型和验证要求。
- **默认项目级安装**：因为不同项目的资产管理模式可能差异很大，推荐在项目环境内从源码安装并使用，而不是默认全局安装。
- **Agent 安全输出**：stdout = 数据，stderr = `[asset-index] ...` 错误，exit 0/1。
- **缓存加速**：`.asset-index/cache.json` 存储扫描结果，`scan` 命令负责重建。

## 创建 → 检查闭环

当 agent 创建资产 `.md` 时，应立即验证：

```bash
asset-index check --file ./世界观设定/角色/李雷/李雷.md
```

发现错误则修正，然后重新检查。这确保 frontmatter 从创建之初就合规。
