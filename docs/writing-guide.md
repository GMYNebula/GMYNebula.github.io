# 写作指南：博客、动态、相册、收藏

四种内容都是 Markdown 文件，放在 `src/content/` 下对应的文件夹里。

| 内容 | 文件夹 | 一个文件是 | 网址 |
| --- | --- | --- | --- |
| 博客 | `src/content/blog/` | 一篇文章 | `/blog/<文件名>/` |
| 动态 | `src/content/moments/` | 一条动态 | 全部在 `/moments/` |
| 相册 | `src/content/albums/` | 一个相册 | `/albums/<文件名>/` |
| 收藏 | `src/content/bookmarks/` | 一个分组 | 全部在 `/bookmarks/` |

## 通用流程

1. 新建或修改 `.md` 文件。
2. `npm run dev`，打开 <http://localhost:4321> 预览。frontmatter 写错时，终端和页面都会报出是哪个文件、哪个字段。
3. 提交并推送到 GitHub，Actions 自动构建发布。

几条共同规则：

- 文件开头 `---` 之间的部分叫 frontmatter，是 YAML 格式：冒号后面要有空格，列表用 `- ` 开头，缩进只能用空格。
- 大部分内容加 `draft: true` 就是草稿，只在本地预览时出现，线上不显示。收藏没有草稿。
- 文件名会出现在网址里（博客、相册），用英文、数字和连字符最稳妥，例如 `git-notes.md`。

---

## 博客

```markdown
---
title: '文章标题'
description: '一两句简介，显示在列表卡片和搜索结果里'
pubDate: 2026-09-28
updatedDate: 2026-10-01
heroImage: '../../assets/covers/cover-01.webp'
category: 技术
tags: ['Astro', 'Git']
draft: false
license: true
---

正文从这里开始。
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 标题 |
| `description` | 是 | 简介 |
| `pubDate` | 是 | 发表日期，写 `2026-09-28` 即可 |
| `updatedDate` | 否 | 更新日期 |
| `heroImage` | 否 | 封面图，放在 `src/assets/` 下，写相对路径；构建时会自动压缩 |
| `category` | 是 | 只能是 `技术`、`笔记`、`日常` 之一（在 `src/data/categories.ts` 里定义） |
| `tags` | 否 | 细分话题，不要和 category 重复 |
| `draft` | 否 | 草稿 |
| `license` | 否 | 写 `false` 关闭文末许可说明 |

正文写法：

- 正文里的 `#` 是“章”，`##` 是“节”。页面大标题已经由 `title` 显示，构建时正文标题会自动降一级，右侧目录只收章和节。
- 插图：图片放 `src/assets/` 下，用相对路径 `![说明](../../assets/xxx.webp)`，会被压缩，点击可放大。
- 代码块：写上语言名，例如 ```` ```ts ````，日夜两套配色自动切换。
- 提示块：

  ```markdown
  > [!TIP]
  > 这是一条提示。
  ```

  可用 `NOTE`、`TIP`、`IMPORTANT`、`WARNING`、`CAUTION`。
- 数学公式：行内 `$E=mc^2$`，独立一行用 `$$ ... $$`。
- 流程图：代码块语言写 `mermaid`。
- 想在正文里用组件，把文件后缀改成 `.mdx`，参考 `markdown-playground.mdx`。

---

## 动态

文件名随意，不会出现在网址里，建议用日期开头：`2026-09-28-coffee.md`。

```markdown
---
date: 2026-09-28T14:30:00+08:00
mood: 摸鱼
location: 杭州
tags: [游戏, 日常]
link: https://www.bilibili.com/video/BV1GJ411x7h7
images:
  - https://你的图床/a.jpg
  - https://你的图床/b.jpg
---

今天的碎碎念，支持 **Markdown** 和 [链接](https://example.com)。
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `date` | 是 | 发布时间。末尾的 `+08:00` 不能省，否则按 UTC 解析，显示会差 8 小时 |
| `mood` | 否 | 心情，显示在昵称旁的小标签里 |
| `location` | 否 | 地点，显示在日期后面；不写默认是「北京」 |
| `tags` | 否 | 话题，显示成 `#游戏 #日常` |
| `link` | 否 | 分享一个网址，显示成带封面和标题的卡片 |
| `images` | 否 | 外链图片地址列表，必须是 `https://` 开头；没有图就整段删掉 |
| `draft` | 否 | 草稿 |

- 正文就是动态内容。
- 图片排法：1 张按原比例；2、4 张两列；3 张或 5 张以上三列。点击可放大。
- 写了 `link` 要运行一次 `npm run bookmarks` 抓标题和封面，和收藏用同一个脚本、同一个 `bookmarks-meta.json`，详见下面「收藏」一节。没抓的话卡片只显示域名。
- 时间按北京时间显示：1 小时内是「刚刚」「5 分钟前」，三天内是「今天 / 昨天 / 前天 14:30」，今年内是「8月1日 14:30」，更早的显示完整日期；鼠标悬停看完整时间。
- 每条动态右下角有「转发」按钮，点开生成带文字和二维码的图片，二维码指向动态页上这一条。
- 动态不进 RSS，也不进站内搜索。

---

## 相册

文件名就是网址：`2026-kyoto.md` 对应 `/albums/2026-kyoto/`。

```markdown
---
title: 京都三日
date: 2026-04-02
location: 京都
description: 一句话简介
cover: https://你的图床/kyoto/cover.jpg
photos:
  - src: https://你的图床/kyoto/01.jpg
    caption: 清水寺的傍晚
  - src: https://你的图床/kyoto/02.jpg
---

可以写几句相册介绍，不写也行。
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 相册名 |
| `date` | 是 | 日期，决定相册列表的排序（新的在前） |
| `location` | 否 | 地点 |
| `description` | 否 | 一句话简介 |
| `cover` | 是 | 封面图 |
| `photos` | 是 | 至少一张；每张写 `src`，`caption` 可选，会显示在图下 |
| `draft` | 否 | 草稿 |

图片地址有两种写法：

- 外链：`https://你的图床/xxx.jpg`。确认图床没有开防盗链，否则站上显示不出来。
- 站内：把图片放进 `public/albums/<相册名>/`，写成 `/albums/<相册名>/01.webp`。参考 `sky.md`、`night.md`。

两种都不经过压缩，访客下载的就是原图，放进去之前请自己压缩（长边 1600–2000px、几百 KB 以内比较合适）。站内图片会跟着仓库一起变大，照片多的话建议用图床。

照片墙是瀑布流，按原比例排列，点击可放大。

---

## 收藏

一个分组一个文件，分组按文件名排序，所以建议用数字开头：`01-视频.md`、`02-工具.md`。

```markdown
---
title: 视频
links:
  - url: https://www.bilibili.com/video/BV1GJ411x7h7
    note: 一句备注
  - url: https://astro.build/
  - url: https://blog.csdn.net/xxx/article/details/123
    title: 标题解析不准时手动写
---
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 分组名，显示成小标题 |
| `links[].url` | 是 | 网址 |
| `links[].note` | 否 | 你的备注，显示在卡片里 |
| `links[].title` / `description` / `cover` | 否 | 手动覆盖自动解析的标题、简介、封面 |

加完链接后：

1. 运行 `npm run bookmarks`。它只抓新链接（包括动态里的 `link`）的标题、简介、封面等信息，写进 `src/data/bookmarks-meta.json`。
2. 把 `.md` 文件和 `bookmarks-meta.json` 一起提交。线上构建只读这个 json，不联网。

说明：

- B 站视频要写 `bilibili.com/video/BV…` 这种完整网址，会显示封面、时长和 UP 主。`b23.tv` 短链会被当成普通网页，请先在浏览器打开，再复制完整网址。
- 其他网站读网页自带的标题、简介和分享图。有的网站（例如 CSDN）没有分享图，会显示成不带封面的文字卡片。
- 想重新抓某一条：从 `bookmarks-meta.json` 里删掉那一条，再运行 `npm run bookmarks`。
- 从 `.md` 里删掉的链接，下次运行时会自动从 json 里清掉。
- 原站删了图，卡片会显示一块浅色占位。
