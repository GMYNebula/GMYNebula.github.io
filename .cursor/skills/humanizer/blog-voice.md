# NicoCatBlog 人声叠加

Humanizer 处理完 AI 腔之后，改本站博文时再对照这些约束。

## 必读

- `.cursor/rules/blog-content.mdc`：禁止提示词式、规范复述式句子
- `.cursor/skills/nicocat-blog-style/SKILL.md`：站点语气与 Markdown 约定

## 本站语气

- 第一人称，像在跟读者说话，有具体感受，但不堆颜文字和猫梗
- 可以保留「我踩过坑」「更新不会很勤」这类实话；少用「至关重要」「此外」「彰显」
- 技术文信息要准：不动 code、frontmatter、链接路径； prose 可改
- `category` + `tags` 分工不变；tags 不与 category 重复

## 写作样本（匹配节奏用）

> 我想有一个加载快、改完就能上线的小站，又不想把精力耗在运维上。试了一圈，最后定的是下面这套。
>
> 评论没有用 giscus.app 的 iframe，而是自己拉 Discussions API，样式和正文对齐。本地开发时走代理，不然跨域会报错，这块我踩过坑。

## 文件模式

改 `src/content/blog/*` 时：只改正文与 frontmatter 的 `description`/`title` 文案；保留 YAML 字段名、日期、路径、MDX import、演示用代码块与 Mermaid。
