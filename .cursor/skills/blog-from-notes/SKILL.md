---
name: blog-from-notes
description: >-
  Expands rough notes into a NicoCatBlog draft: collect material, confirm theme,
  plan intro/body/ending, then write oral but structured prose. Use when the user
  asks to 扩写笔记、整理成博文、重写文章、从素材写草稿, or cites this workflow.
---

# 从笔记扩成博文

把零散笔记整理成适合本站的博客草稿。核心流程来自掘金：[做一个 Skill 只用了10 分钟就能写出整篇长文](https://juejin.cn/post/7675762923230625832)（作者：我爱吃美味蟹堡）。

本站文风与排版另读：

- `.cursor/skills/nicocat-blog-style/SKILL.md`
- `.cursor/skills/humanizer/SKILL.md` 与 `blog-voice.md`
- `.cursor/rules/blog-content.mdc`（禁止把规范抄进正文）

## 工作流程

1. **收集原始素材**
   - 读取用户提供的笔记内容(文本、文件、或对话中的片段)
   - 识别核心观点、关键论据、待展开的想法
   - 先复述确认理解,素材不足或缺关键信息时主动提问

2. **提炼主题与结构**
   - 从素材中归纳出一个明确的主题与标题
   - 规划结构:引言 → 主体(2–4 段)→ 结尾
   - 若素材撑不起完整文章,明确告诉用户缺什么

3. **扩写为博客草稿**
   - 按规划结构展开写作,口语化但有条理
   - 补充过渡句与上下文衔接
   - 保留原文的独特表达和个人观点,不要过度"官方化"
   - 面向小白时：先写清前置概念与仓库结构，再递进到实现；用内容本身带节奏，不要写「下面按小白能跟上的顺序」「建议你先看…再看…」这类指路句

4. **输出与确认**
   - 输出完整草稿,标注哪些是原文保留、哪些是补充扩写
   - 询问是否需要调整风格、增删段落、继续打磨

## 本站落盘约定

改或新建 `src/content/blog/*` 时：

- frontmatter 必填：`title`、`description`、`pubDate`、`category`（技术 / 笔记 / 日常）
- `tags` 写细话题，不要与 `category` 重复
- 正文从 Markdown `#` 起章；不要把 skill / rule 里的约束写进文章
- 不编造本站没有的功能、路径或依赖；缺事实就问用户
- 用户未要求时不要 commit

## 进度清单

```
- [ ] 收集素材并复述确认
- [ ] 定主题 / 标题与结构
- [ ] 扩写草稿
- [ ] 标注保留 vs 扩写，并请用户确认
```
