# 资产 Schema 与规则格式

## 资产数据模型

每个被 `asset-index` 解析的 `.md` 文件都会变成一个 `Asset` 对象：

| 属性 | 来源 | 说明 |
|------|------|------|
| `path` | 文件路径 | `.md` 文件的绝对路径 |
| `frontmatter` | YAML 块 | 所有 frontmatter 字段的字典 |
| `body` | Markdown 正文 | frontmatter 之后的文本内容 |
| `title` | `title` 或 `name` | 人可读的资源名称 |
| `asset_type` | `type` | 资产分类 |
| `status` | `status` | 当前生命周期状态 |
| `tags` | `tags` | 标签列表（自动从字符串或列表规范化） |

## 常用 Frontmatter 字段

以下内容创作项目中常见的字段：

| 字段 | 是否必需 | 说明 | 示例 |
|------|---------|------|------|
| `title` / `name` | 是 | 资产名称 | `"李雷"` |
| `type` | 是 | 资产类型 | `"角色"`, `"剧本"`, `"场景"` |
| `status` | 是 | 当前状态 | `"草稿"`, `"已整理"`, `"完成"` |
| `created` | 推荐 | 创建日期 | `2026-03-20` |
| `modified` | 推荐 | 最后修改日期 | `2026-03-20` |
| `tags` | 可选 | 自定义标签 | `["主线", "魔法系"]` |
| `episode` | 剧本类 | 集数/章节标识 | `"E01"` |
| `chapter` | 小说类 | 章节编号 | `"第1章"` |
| `category` | 可选 | 更细分类 | `"主角"`, `"室内"` |
| `importance` | 可选 | 重要程度 | `"高"`, `"中"`, `"低"` |

## rules.yaml 格式

将该文件放在**项目根目录**的 `.asset-index/rules.yaml`。

这是 CLI 的项目级运行配置，也是运行时的 source of truth。它不应放在 skill 目录中；skill 可以引用它、解释它，或提供模板，但不替代它。

```yaml
# 每个资产的 frontmatter 都必须包含的字段
required_fields:
  - title
  - type
  - status
  - created
  - modified

# 按类型定义的额外必填字段
types:
  角色:
    required: [name]
  场景:
    required: [name]
  道具:
    required: [name]
  剧本:
    required: [episode]
  分镜:
    required: [episode]
  原始故事:
    required: [chapter]
  故事小说:
    required: []
  游戏设计:
    required: []

# 允许的状态值
statuses:
  - 草稿
  - 进行中
  - 完成
  - 已整理
  - 已迁移
  - archived

# 必须匹配 YYYY-MM-DD 格式的字段
date_fields:
  - created
  - modified

# 未知类型是否告警
strict_types: false
```

### 字段说明

| 键 | 类型 | 说明 |
|-----|------|------|
| `required_fields` | `list[str]` | 所有资产都必须有的字段 |
| `types` | `dict` | 按类型定义的要求。每个类型可设 `required: [fields]` |
| `statuses` | `list[str]` | 允许的状态值列表 |
| `date_fields` | `list[str]` | 必须匹配 `YYYY-MM-DD` 的字段 |
| `strict_types` | `bool` | 为 true 时，若 `type` 不在 `types` 键中则告警 |

## `types` 的双重语义

`types` 现在不只是“按类型定义额外必填字段”，它还决定哪些 frontmatter 文件会被视为资产：

- **如果配置了 `types`**：只有 `frontmatter.type` 命中 `types` 键的文件才会被纳入资产索引
- **如果没有配置 `types`**：保持兼容，所有带 frontmatter 的文件都会被当作资产

这让你可以把 `types` 当成项目级的“资产类型白名单”。

例如：

- `type: 剧本` → 如果 `剧本` 在 `types` 中，则会被索引
- `type: 剧本分析` → 如果 `剧本分析` 不在 `types` 中，则不会被当成资产

这对于区分“资产本体”和“分析/报告/索引文档”非常有用。

## 默认检查（始终执行）

即使没有 `rules.yaml`，`asset-index check` 也会始终验证：

1. frontmatter 是否存在
2. `title` 或 `name` 是否存在
3. `type` 是否存在
4. `status` 是否存在
5. `created` / `modified` 是否为有效日期（若存在）

## 标签规范化

`tags` 可以写成列表或逗号分隔的字符串，两者等价：

```yaml
# 以下两种写法等价
tags: ["主线", "魔法系"]
tags: "主线, 魔法系"
```

## 通过自定义字段扩展

对于 schema 未覆盖的字段，可直接在 frontmatter 中添加任意键。检查器只验证 `rules.yaml` 中明确提到的字段。

```yaml
---
title: "艾莉丝"
type: 角色
status: 草稿
age: 17
height: 165cm
affiliation: 魔法学院
created: 2026-03-20
modified: 2026-03-20
---
```

像 `age`、`height` 这样的自定义字段会被保留在索引中，但只有你把它加入 `rules.yaml` 后才会被检查。
