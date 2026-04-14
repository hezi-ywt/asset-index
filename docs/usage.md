# Asset Index 使用指南

## 安装

```bash
# 推荐方式（全局可用，无需激活环境）
pipx install asset-index-cli

# 开发方式
git clone https://github.com/hezi-ywt/asset-index
cd asset-index
pip install -e .
```

验证安装：
```bash
asset-index --help
```

## 初始化项目

进入你的项目目录，运行：

```bash
asset-index init
```

这会创建 `.asset-index/` 目录和一份示例 `rules.yaml`：

```text
your-project/
├── .asset-index/
│   ├── rules.yaml      ← 验证规则
│   └── cache.json      ← 索引缓存（扫描后生成）
├── 世界观设定/
└── 创作产出/
```

编辑 `rules.yaml` 来匹配你项目的 frontmatter 规范。

## 扫描资产

```bash
# 扫描当前目录
asset-index scan .

# 扫描指定目录
asset-index scan ./项目库/甲武神之战甲少年/
```

输出示例：
```
Scanned 156 files, found 128 indexed assets.
  (142 files with frontmatter)
  (14 files without frontmatter)
```

扫描结果会保存到 `.asset-index/cache.json`。

如果 `rules.yaml` 中配置了 `types`，只有 `type` 出现在 `types` 里的 frontmatter 文件才会被视为资产并进入索引。
如果没有配置 `types`，则保持兼容行为：所有带 frontmatter 的 `.md` 都会被视为资产。

## 搜索资产

### 按关键词
```bash
asset-index search "甲武神"
```

### 按类型
```bash
asset-index search --type 剧本
```

### 按状态
```bash
asset-index search --status 草稿
```

### 按标签
```bash
asset-index search --tag 时间线
```

### 组合条件
```bash
asset-index search --type 角色 --status 草稿
```

### JSON 输出（方便 agent 解析）
```bash
asset-index search --type 剧本 --format json
```

## 列出资产

```bash
# 列出全部
asset-index list

# 按类型过滤
asset-index list --type 角色

# JSON 输出
asset-index list --format json
```

## 验证资产

### 验证全部
```bash
asset-index check
```

### 验证单个文件
```bash
asset-index check --file ./世界观设定/角色/李雷/李雷.md
```

输出示例：
```
[ERROR] /Users/.../李雷.md: Frontmatter is missing 'created' field.
[WARNING] /Users/.../第1集.md: Field 'modified' should be in YYYY-MM-DD format.
```

如果有 ERROR，exit code 为 1。

### JSON 输出
```bash
asset-index check --format json
```

## 统计信息

```bash
asset-index stats
```

输出示例：
```
Total files scanned: 156
  With frontmatter: 142
  Without frontmatter: 14

Type distribution:
  剧本: 21
  角色: 18
  场景: 12
  道具: 8

Status distribution:
  已整理: 89
  草稿: 45
  进行中: 8

Top tags:
  时间线: 12
  主线: 10
  第一季: 8
```

## 自定义验证规则

编辑 `.asset-index/rules.yaml`：

```yaml
# 所有资产都必须有的字段
required_fields:
  - title
  - type
  - status
  - created
  - modified

# 按类型定义额外必填字段
types:
  角色:
    required: [name]
  场景:
    required: [name]
  道具:
    required: [name]
  剧本:
    required: [episode]

# 允许的状态值
statuses:
  - 草稿
  - 进行中
  - 完成
  - 已整理
  - 已迁移

# 必须是 YYYY-MM-DD 格式的字段
date_fields:
  - created
  - modified

# 未知类型是否告警
strict_types: false
```

修改规则后，重新运行 `asset-index check` 即可生效。

### `types` 现在也决定“什么算资产”

这是当前最重要的一条规则：

- **如果配置了 `types`**：只有 `frontmatter.type` 出现在 `types` 中的文件才算资产
- **如果没有配置 `types`**：保持兼容，所有带 frontmatter 的文件都算资产

这意味着像报告、索引、分析文档，即使有 frontmatter，只要它们的 `type` 不在 `types` 中，就不会进入 `list/search/stats`，也不会参与批量 `check`。

单文件检查 `asset-index check --file some.md` 是例外：它始终检查你指定的文件，方便在创建后立即验证。

## Agent 使用模式

### 模式 1：创建后验证

```bash
# Agent 按模板创建 .md 文件后，立即检查
asset-index check --file ./世界观设定/角色/李雷/李雷.md
```

### 模式 2：批量查询

```bash
# 获取所有草稿资产
asset-index list --status 草稿 --format json
```

### 模式 3：项目健康度检查

```bash
# 扫描 + 检查 + 统计
asset-index scan .
asset-index check
asset-index stats
```

## 常见问题

**Q: 扫描后没有结果？**
A: 确认 `.md` 文件包含 YAML frontmatter（以 `---` 开头和结尾的 YAML 块）。

**Q: 如何忽略某些目录？**
A: 当前版本会扫描所有子目录。如果目录中有不需要索引的 `.md`，确保它们没有 frontmatter，这样就不会被识别为资产。

**Q: 缓存过期了怎么办？**
A: 重新运行 `asset-index scan .` 即可重建缓存。

**Q: 可以在没有 rules.yaml 的项目中使用吗？**
A: 可以。没有规则时，工具只做最基础的检查（frontmatter 存在、title/type/status 有值）。
