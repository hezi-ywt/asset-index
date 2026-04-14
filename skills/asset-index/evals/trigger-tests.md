# Trigger Tests for asset-index

## Should Trigger

1. "帮我扫描这个项目里的所有 markdown 资产"
2. "找出所有状态是草稿的角色"
3. "检查新创建的李雷.md 文件 frontmatter 对不对"
4. "列出所有类型为剧本的资产，输出 JSON"
5. "这个项目有多少个场景？给我统计一下"

## Should NOT Trigger

1. "帮我写一个角色设定" (creation, not indexing)
2. "把 Excel 里的角色导入到项目里" (import, not indexing)
3. "帮我设计这个项目的目录结构" (architecture design)
4. "把第1集剧本翻译成英文" (translation, not asset management)
