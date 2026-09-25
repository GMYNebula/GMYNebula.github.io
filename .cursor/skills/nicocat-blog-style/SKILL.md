---
name: nicocat-blog-style
description: >-
  Applies the visual and UX language of 星云可可の小窝 (NicoCatBlog / NebulaGMY).
  Use when editing UI, Markdown prose, TOC, code blocks, pages, or components
  in this Astro blog, or when the user mentions 博客风格 / 玻璃风 / 目录 / prose.
---

# 星云可可の小窝 · 设计与实现规范

## 人设与语气

- 站名：星云可可の小窝；作者：星云可可 / NebulaGMY
- 文案轻量、口语、可带少量符号（✧ ♪），不堆营销话术
- 改 UI 文案时保持可爱感，避免冷冰冰的文档站口吻

### 禁止提示词式文案（硬性）

**所有对外可见文本**（文章正文、标题、描述、frontmatter、页面文案、组件内用户可见字符串）里，**不得**出现给 AI / 写作者下指令或复述规范的句式。改博文时 rule **`.cursor/rules/blog-content.mdc`** 会随 `src/content/**` 注入。

典型禁止示例（含曾漏进正文的）：

- 「以……为主 / 为辅」「介绍为主、可爱为辅」
- 「不要写……」「应该……」「务必……」「不必重复……」
- 「视觉效果一致」「当对照表」「把这篇当对照」
- 「本站也认 / 本站会 / 本站交给 ……」「素材库 / src/assets……」（向读者解释引擎或内部资源）
- 任何读起来像在复述 prompt、skill、规范条目、或交代 demo 写法理由的句子

正文只写读者该看到的内容：事实、感受、步骤、说明。**风格通过语气自然体现**，不要把创作约束写进文章里。Agent 改文案时遵守 skill / rule 即可，**不要把 skill 里的规则抄进站点文本**。

## 视觉系统（必须复用）

优先用 `src/styles/global.css` 里的 CSS 变量，禁止另起一套色板：

| Token | 用途 |
|-------|------|
| `--bg` / `--bg-2` | 页面底、次级面 |
| `--ink` / `--ink-soft` / `--muted` | 标题 / 正文 / 辅助 |
| `--line` / `--line-strong` | 描边 |
| `--glass` / `--glass-strong` | 半透明面板 |
| `--accent` / `--accent-deep` / `--accent-glow` | 主强调（珊瑚） |
| `--teal` | 次强调（层级、编号） |
| `--font-display-stack` | 标题、引用、标签感文案 |
| `--font-body-stack` | 正文 |

氛围：暗/亮双主题玻璃风；全站背景为**轻磨砂幻灯片**（`SiteBackground` + `public/backgrounds/`），上覆主题 veil 与径向光晕，不是纯平色。

## 日夜间双主题（硬性）

**任何**可见样式改动（CSS、Giscus 主题、Expressive Code、组件内联样式、Markdown 演示文）都必须 **分别验证并设计** `html[data-theme='dark']` 与 `html[data-theme='light']`：

- 优先用 `global.css` 里成对的 CSS 变量（`:root` / `html[data-theme='light']`），不要写死只适配一侧的颜色
- 需要两套值时：用 `[暗色值, 亮色值]` 元组（Expressive Code `styleOverrides`）或 `html[data-theme='light']` 选择器覆盖
- iframe 内样式（Giscus 旧方案）→ 已弃用；评论改在 `global.css` 的 `.comments` 段 + `prose`
- 改完必须在两种主题下各看一遍：对比度、边框、表头、代码块、玻璃层、封面嵌入

## UI 规则

1. **少卡片**：交互容器才用 `glass`；装饰性边框/阴影能省则省
2. **一节一事**：一块区域一个标题 + 一句说明
3. **圆角**：面板约 `0.65–0.9rem`，不要全圆角 pill 堆砌（标签 pill 除外）
4. **动效**：只用已有 `rise` / `fade-in` 或极短 hover；不炫技
5. **图标**：UI 操作用 `Icon.astro`（Lucide）；**品牌/社交**（GitHub、B 站、QQ、微信等）用 `BrandIcon.astro`（[Simple Icons](https://simpleicons.org)），禁止用 sparkle 等占位
6. **图标优先**：工具栏、复制、删除、主题切换等操作按钮**默认纯图标**（配 `aria-label`）；只有导航标签、表单提交、读者必须读字的场景才用「图标 + 文字」或纯文字
7. **不要**：紫渐变默认风、奶油衬线杂志风、报纸密排、多层重阴影、emoji 当图标

## Markdown / 文章页

文件：`BlogPost.astro`、`.prose`（`global.css`）、`TableOfContents.astro`、`ec.config.mjs`

### 正文

- 排版落在 `.prose`，不要再给 `.content` 重复一套表格/标题样式
- 页顶卡片是唯一的 `<h1>`（frontmatter 标题）；正文章节从 Markdown `#` 写起，经 `rehypeDemoteHeadings` 渲染为 h2–h6
- h2（章）保留下横线；章与章之间优先靠 h2 横线，少写 `---`
- `>` 引用块：灰字轻底；竖线 **accent 珊瑚色**（日间比例更高），禁止 muted 灰线、禁止日间混 teal 发绿
- 正文字号约 1.04rem；h2/h3 用 display 字体；**h4–h6 字号不低于正文、颜色不低于正文**（均 `--ink`），靠字重/间距分层
- Display：Fredoka（圆润拉丁）+ ZCOOL XiaoWei（中文标题软萌），见 `astro.config.mjs` `fonts`
- Body：Nunito + 系统中文黑体
- 改字体时同步更新 `--font-display-stack` / `--font-body-stack`

### 标题锚点

- `rehype-slug`：给标题 `id`（跳转基础）
- `rehype-autolink-headings`：锚点链接本身**不得写入可见文本节点**（否则会污染 `headings[].text` 和目录）
- 用空 `<span aria-hidden>` + CSS `::before { content: '#' }` 显示符号
- 默认几乎不可见，hover / focus 才显现

### 目录（TOC）

- 只列 h2–h5（对应 Markdown `#` ~ `####`）；**嵌套 `<ol>` 树** + 子级 `padding-left` 缩进，不要扁平排列
- 章（h2）**无任何**编号、圆点、竖杠；子级也**不要**符号，只靠缩进 + 字重/字号区分
- 正文 h4–h6：字号 **≥ 正文字号（1.04rem）**，颜色用 `--ink`，**禁止** `--muted` 灰字（不能看起来比正文还弱）
- 桌面：右侧 **fixed** 跟随滚动 + 当前章节高亮；小屏：正文上方可折叠
- 文案用「本篇目录」一类中性小窝语气，**不要**全大写 TOC / CONTENTS
- 样式：细左边线轨道 + accent 悬停 / 激活，嵌套用缩进，不要厚重卡片感
- **禁止**把锚点 `#`、复制按钮文案写进目录项
- 清洗：若历史数据仍带尾部 `#`，渲染前去掉
- 有目录时正文壳仍 **860px 居中**；目录 fixed 在正文右侧留白，不把正文挤偏

### 代码块

- 只用 Expressive Code（`syntaxHighlight: false`）
- Shiki 主题：**夜间** `ayu-dark`；**日间** `ayu-light`（外框底色对齐 Ayu 编辑器色，标签指示条用 Ayu 琥珀 accent）
- 主题跟随 `html[data-theme='dark'|'light']`（`ec.config.mjs` 里 `theme.name` + `[暗, 亮]` 元组）
- 夜间：深底 `#0a0c0e`、浅描边、珊瑚 tab 指示；日间：暖底 `#faf4ed`、淡紫灰描边、轻阴影
- 阴影透明、圆角与 prose 一致；不抢文章视觉

### 博文封面

- 有 `heroImage` 时：封面嵌在 **正文玻璃卡片顶部**，上/左/右贴卡片边、无渐隐；底边用 `--line` 与标题区分
- 无封面时：卡片保持普通内边距

### 表格

- 气质：**淡雅、灵动、可爱** — 融进玻璃正文，不要「报表感」 Heavy header
- 表头：`--accent-glow` / 低比例 `--accent` 混 `--glass`；**日间**表头要比 tbody 深一档（accent ~12% + `--bg-2`），正文行更浅，斑马纹极淡

### 分类与标签

- **category**（必填，三选一）：`技术` | `笔记` | `日常` — 定义见 `src/data/categories.ts`
- **tags**：具体话题（如 `Astro`、`Markdown`）；**不要**与 category 重复
- 示例：`category: 技术` + `tags: ['Astro']`；分类页 `/categories/`，标签页 `/tags/`

### 评论

改评论 UI/API 时读 skill **`nicocat-comments`** 与 rule `.cursor/rules/comments.mdc`，勿在本 skill 重复维护评论细则。

## 技术约束

- Astro 7 + MDX + Content Collections；Unified 处理器承载 rehype 插件
- 改 Markdown 行为先查 `astro.config.mjs` 与本 skill，再加依赖
- 不主动 commit；不擅自改 `site` / Giscus / 人设常量除非用户要求
- 对话结束简要说明改了哪些文件；中文回复可加「喵」

## 改动检查清单

- [ ] 用了现有 CSS 变量，无新色板
- [ ] **暗 / 亮主题分别检查过**（正文、表头、代码块、评论、封面嵌入）
- [ ] 目录文字干净（无 `#`）
- [ ] 锚点不影响 `getHeadings` / TOC
- [ ] 移动端正文宽度与表格横向滚动正常
- [ ] 正文 / 页面文案无提示词式、规范复述式句子
