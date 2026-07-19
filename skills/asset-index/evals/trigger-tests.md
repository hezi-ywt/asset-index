# Trigger Tests for asset-index

## Should Trigger

1. "帮我扫描这个项目里的所有 markdown 资产"
2. "找出所有状态是草稿的角色"
3. "检查新创建的李雷.md 文件 frontmatter 对不对"
4. "列出所有类型为剧本的资产，输出 JSON"
5. "这个项目有多少个场景？给我统计一下"
6. "使用资产管理看一下这个项目里有哪些资产"

## Should NOT Trigger

1. "帮我写一个角色设定" (creation, not indexing)
2. "把 Excel 里的角色导入到项目里" (import, not indexing)
3. "帮我设计这个项目的目录结构" (architecture design)
4. "把第1集剧本翻译成英文" (translation, not asset management)

## Preflight Behavior

1. Skill 和同源 CLI 都完整：预检成功，并输出 CLI 版本、实际命令和项目规则路径。
2. Skill 缺少 `SKILL.md` 或必读 reference：预检失败，资产命令不得继续。
3. 同源 CLI 存在但依赖未安装：预检失败并提示在源码根运行 `npm ci`，不得静默改用全局 CLI。
4. 手动复制的 Skill 没有同源 CLI，但全局 `asset-index` 可用：预检成功并明确选择全局命令。
5. 同源与全局 CLI 都不可用：预检失败，`scan/search/list/check/stats` 均不得执行。
