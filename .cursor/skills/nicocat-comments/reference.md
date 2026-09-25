# 评论区 · 参考

## 架构

```
Comments.astro          结构壳
comments.ts             客户端状态与渲染
src/lib/giscus/
  api.ts                读讨论、OAuth token、GraphQL（发评/回复/删/表情）
  config.ts             giscus-api 代理 vs 生产直连
  reactions.ts          表情分组与本地 toggle
  reaction-config.ts    可选表情与 emoji 映射
  types.ts              类型
global.css              .comments 段 + .comments .prose
```

## 网络

| 环境 | 读讨论 / OAuth | GitHub API |
|------|----------------|------------|
| dev/preview | `/giscus-api/*` → giscus.app | 直连 `api.github.com` |
| 生产 | 直连 giscus.app | 直连 `api.github.com` |

`viewer`：discussions 响应或 REST `/user`；**viewer 拉取失败不得清 session**。

## GraphQL（经 `api.ts`）

- 发评论：`addDiscussionComment`（无 `replyToId`）
- 回复：`addDiscussionComment` + `replyToId`
- 删自己的：`deleteDiscussionComment`
- 表情：`addReaction` / `removeReaction`（非 Discussion upvote）

## UI 布局

1. 顶栏：评论数 + 排序 + 登录菜单  
2. 输入区（上）：头像 + 圆角 textarea；左 Markdown 提示；右「评论」pill  
3. 列表（下）：头像 + meta（作者左、时间右）+ prose 正文 + 工具栏  

工具栏：左表情栏（chip + ＋ 选择器）；右「回复」+ 自己的「删除」。

## 表情配置

仅 GitHub `ReactionContent` 八种；改 `PICKER_REACTIONS` / `REACTION_EMOJI`，不可自造 API 外表情。

## 改完检查

- [ ] 暗 / 亮主题  
- [ ] 评论内列表、引用、代码、链接  
- [ ] 回复、回复的表情、删除  
- [ ] 无 giscus 品牌文案  
