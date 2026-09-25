---
name: nicocat-comments
description: >-
  Self-hosted comment UI on Giscus/GitHub Discussions. Use when editing
  Comments.astro, comments.ts, src/lib/giscus, or .comments styles in global.css,
  or when the user mentions 评论 / Giscus / 留言板.
---

# 评论区（自研 UI）

## 硬约束

- **禁止** Giscus iframe、`public/giscus/*.css`
- 文件：`Comments.astro` · `src/scripts/comments.ts` · `src/lib/giscus/` · `global.css` 的 `.comments`
- 评论 HTML 容器必须 `class="comment-body prose"`
- 样式用 `global.css` 变量；改完 **暗 / 亮** 各看一遍

## 能力概览（当前）

| 能力 | 说明 |
|------|------|
| 登录 | Giscus OAuth → `localStorage['giscus-session']`；dev 走 `/giscus-api` 代理 |
| 排序 | 最新 / 最早（无「最热」、无赞同） |
| 回复 | 主评论可回复；未登录点回复会提示登录 |
| 表情 | GitHub Reaction；主评论与楼中楼均可；配置见 `reaction-config.ts` |
| 删除 | 仅自己的评论/回复；垃圾桶 + 确认 |
| 预览 | 顶栏用户菜单内「预览评论」（非独立按钮） |
| 时间 | 相对时间（如「5 分钟前」），悬停看完整时间 |

## 细节

OAuth 流程、GraphQL 变更、排查表见 [reference.md](reference.md)。

Rule 入口：`.cursor/rules/comments.mdc`（编辑评论相关文件时自动注入）。
