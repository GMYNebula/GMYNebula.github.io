---
title: '搭博客我用了什么'
description: '静态小窝用的框架、内容、评论和搜索，以及我为什么这么选。'
pubDate: 2026-08-28
heroImage: '../../assets/covers/cover-02.webp'
category: 技术
tags: ['Astro', 'GitHub Pages', '静态站点']
---

我想有一个加载快、改完就能上线的小站，又不想把精力耗在运维上。试了几种方案，最后定的是下面这套。

# 骨架

| 部分 | 选择 | 为什么 |
|------|------|--------|
| 框架 | [Astro 7](https://astro.build/) | 静态生成，页面轻，Markdown/MDX 开箱即用 |
| 内容 | Content Collections | 文章进 Git，构建时校验 frontmatter，少写错字段 |
| 样式 | 手写 CSS | 日/夜双主题，玻璃风，背景用幻灯片轮播 |
| 部署 | GitHub Pages | 推代码就能更新，没有服务器要盯 |

# 写作约定

文章放在 `src/content/blog/`，frontmatter 里至少要写这些：

```yaml
title: '标题'
description: '摘要'
pubDate: 2026-08-28
category: 技术   # 技术 / 笔记 / 日常，三选一
tags: ['Astro', 'GitHub Pages']  # 具体话题，别和 category 重复；一篇 2～4 个即可
heroImage: '../../assets/covers/cover-02.webp'  # 可选
draft: false     # true 时线上隐藏，本地 dev 仍可见
```

`category` 会出现在 [分类页](/categories/)，`tags` 会汇总到 [标签页](/tags/)。单篇地址是 `/blog/<文件名>/`；顶栏没有单独的「博客列表」，[归档](/archives/) 承担这个功能。

# 加料

| 需求 | 方案 |
|------|------|
| 代码高亮 | Expressive Code，主题跟日/夜走 |
| 数学公式 | remark-math + KaTeX |
| 图表 | Mermaid |
| 提示框 | GitHub 风格 `[!NOTE]` 等 |
| 目录 | 正文标题自动生成，桌面端右侧固定 |
| 评论 | Giscus 数据 + 自绘 UI（GitHub Discussions） |
| 搜索 | Pagefind，构建后索引静态页 |
| 订阅 | RSS |
| 站点地图 | `@astrojs/sitemap` |

评论没有用 giscus.app 的 iframe。我自己拉 Discussions API，样式和正文对齐。本地开发要走代理，不然跨域会报错，这里我踩过一次坑。

# 为什么选静态站

改动都在 Git 里，回滚方便；构建一次就能部署，没有数据库和后台。我偶尔写一篇，也希望页面别拖后腿，这种节奏对我来说刚好。

如果你也在搭个人站，先把发文和部署跑通，再慢慢加评论、搜索、公式。功能一次叠太多，出问题不好查。
