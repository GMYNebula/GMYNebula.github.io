# 站点增强计划

含 Markdown 插件、站内功能、跨平台可借鉴思路。**按需勾选，不要一次全装。**

---

## 一、Markdown / 正文（已启用）


| 能力                                 | 实现                  | 你会感觉到什么                        |
| ---------------------------------- | ------------------- | ------------------------------ |
| **GFM**                            | Astro 内置            | 表格、删除线、任务列表、脚注语法               |
| **Smartypants**                    | Astro 内置            | 弯引号、破折号等排版细节                   |
| **rehype-slug**                    | 插件                  | 标题有 `id`，可 `#某节` 跳转            |
| **rehype-autolink-headings**       | 插件 + CSS `::before` | 悬停标题出现 `#`，**不写进目录文本**         |
| **rehype-external-links**          | 插件                  | 外链新标签 + `noopener`             |
| **rehypeDemoteHeadings**           | 自写                  | 正文 `#` → 页内 h2，页顶 card 才是唯一 h1 |
| **remark-github-blockquote-alert** | 插件                  | `[!NOTE]` / `[!TIP]` 等提示框      |
| **remark-math + rehype-katex**     | 插件                  | `$E=mc^2$`、块级公式                |
| **rehype-mermaid**                 | 自写 + 客户端 `mermaid`  | 流程图；随主题重绘；可复制源码                |
| **rehype-accessible-emojis**       | 插件                  | emoji 带无障碍标签                   |
| **Expressive Code**                | 集成                  | Ayu 双主题代码块、复制按钮                |


**三者关系（简记）：** slug 给身份证 → autolink 挂锚点 → external-links 只管正文外链。

---



## 二、Markdown / 待选



### 阅读体验

- [ ] **阅读时长**（`remark-reading-time` 或自写）  
  已有 `wordCount` 工具，可衍生「约 N 分钟」。文章头 meta 一行即可。

- [x] **脚注样式**（GFM + `.prose` CSS）  
- [x] **阅读进度条 + 回到顶部**（`ReadingProgress.astro`）  
- [x] **锚点滚动偏移**（`article-enhancements.ts`，避开 sticky 顶栏）



### 内容能力

- [ ] **代码行号 / diff 高亮**（Expressive Code 配置或 Shiki transformers）  
- [ ] **Twoslash**（TS 类型悬停，重，技术文再考虑）  
- [ ] **Wiki 链接** `[[slug|标题]]`（Obsidian 风；需自写 remark + 链接解析）  
- [ ] **粘贴/拖拽上传图**（需后端或图床；Typora / Notion 常见）  
- [ ] **脚注反向链接**（GFM 脚注 + 自定义 rehype，Medium 风）  
- [ ] **目录深度扩展**（当前 TOC h2–h5，可按需调整）  
- [ ] **abbr / 术语表**（`remark-abbr` 或自写）  
- [ ] **PlantUML / Graphviz**（与 Mermaid 二选一或共存，构建更重）



### 导航与结构

- [x] **上一篇 / 下一篇**（`PostNav.astro`）  
- [ ] **相关文章推荐**（同 tag / 同 category 打分，WordPress「相关文章」思路）  
- [ ] **系列 / 连载**（frontmatter `series: 名称` + 系列页，dev.to Series 思路）  
- [ ] **文内「编辑此页」**（链到 GitHub 源文件，VitePress / GitHub 文档站常见）

---



## 三、站内功能（已启用）


| 区域      | 能力                    | 说明                                                                   |
| ------- | --------------------- | -------------------------------------------------------------------- |
| **全局**  | 日夜间主题                 | `localStorage` + `data-theme`；顶栏切换                                   |
| **全局**  | 背景幻灯片                 | `SiteBackground` + `public/backgrounds/`；尊重 `prefers-reduced-motion` |
| **全局**  | Pagefind 搜索           | 构建后索引；模态框；`data-pagefind-body` 限定范围                                  |
| **全局**  | RSS + Sitemap         | `@astrojs/rss`、`@astrojs/sitemap`                                    |
| **导航**  | 分类 + 标签               | 固定大类 + 自由 tags；分类页 / 标签词云                                            |
| **归档**  | 卡片 / 时间轴切换            | `localStorage` 记忆视图                                                  |
| **文章页** | 目录 TOC                | 右侧 fixed + 当前节高亮；小屏可折叠                                               |
| **文章页** | 字数统计                  | `countArticleWords`（尚未换算阅读分钟）                                        |
| **文章页** | CC 许可脚注               | `PostLicense`，frontmatter 可 `license: false`                         |
| **文章页** | Giscus 评论             | 自研 API 壳（非 iframe）；OAuth + 反应                                        |
| **关于**  | QQ 加好友                | NTQQ 协议 + 降级逻辑（`open-qq.ts`）                                         |
| **品牌**  | Simple Icons          | GitHub / B 站 / CSDN 等 `BrandIcon`                                    |
| **内容**  | Content Collections   | 必填 `category`；`draft` 生产隐藏                                           |
| **路由**  | `/blog` → `/archives` | 文章仍 `/blog/{slug}/`                                                  |
| **开发**  | `npm run dev:clean`   | 清 `.astro` + Vite 缓存（**改 schema 后必跑**）                               |


---



## 四、站内待选



### 体验 / 动效

- [ ] **View Transitions**（Astro 内置，页面切换更顺；注意与 Mermaid / 评论初始化配合）  
- [x] **图片灯箱**（点击正文图放大，Medium / Hugo 相册思路）  
- [ ] **封面模糊占位**（LQIP / `sharp` 生成 tiny blur，Next/Image 思路）  
- [ ] **首页精选 / 置顶**（`pinned: true` frontmatter）  
- [ ] **骨架屏 / 加载态**（搜索、评论列表）  



### 发现 / 组织

- [ ] **Pagefind 分类/标签过滤**（`data-pagefind-filter` 按 category 索引）  
- [x] **归档热力图**（GitHub Contributions 风，按发文日期）  
- [ ] **标签关系图**（共现统计 → 简单力导向图，可选 D3 / 纯 CSS）  
- [ ] **友链 RSS 聚合**（friends 页拉取对方 RSS 标题）  



### SEO / 分发

- [ ] **自动 OG 图**（标题 + 站名合成 social card，Vercel OG / Satori 思路）  
- [ ] **更新** `site` **为真实域名**（`astro.config.mjs`，影响 RSS / sitemap / canonical）  
- [ ] **JSON-LD 结构化数据**（`BlogPosting`，Google 富摘要）  
- [ ] **Webmention**（IndieWeb；他人链接你时显示）  



### 统计 / 运维

- [ ] **隐私统计**（Umami / Plausible，单脚本）  
- [ ] **PWA / 离线**（service worker；博客优先级低）  
- [ ] **构建时链接检查**（internal 404 扫描）  
- [ ] **图片 CDN**（Cloudflare R2 / 又拍，大图站再考虑）  

---



## 五、跨平台可借鉴（思想）

不必同款插件，只借交互或信息架构。


| 来源                         | 可借鉴点                                 | 本站可落地方式                          |
| -------------------------- | ------------------------------------ | -------------------------------- |
| **Hexo / Fluid**           | 时间轴归档、卡片双视图、分类色条                     | 已在 `ArchiveTimeline`；可继续打磨轴样式    |
| **Hugo**                   | taxonomies、related posts、Goldmark 扩展 | category/tag 已有；related 待做       |
| **VitePress / Docusaurus** | 侧边 TOC、编辑链接、最后更新日期                   | TOC 已有；`updatedDate` 已有字段可展示     |
| **WordPress**              | 相关文章、阅读数、短代码                         | 相关文章用 tag 重合度；阅读数需统计后端           |
| **Obsidian**               | Callout、双链、图谱                        | Callout 已有 alert；双链需 remark 插件   |
| **Notion**                 | Toggle、分栏、数据库视图                      | Toggle 可用 `<details>` 或自写 remark |
| **Medium**                 | 阅读进度、预估时长、段落间距                       | 进度条已有；时长待做                       |
| **dev.to**                 | Series、反应、讨论                         | 评论反应已有；Series 待做                 |
| **GitHub**                 | 任务列表、Alert、Permalink                 | 任务列表 GFM 已有；permalink 已有 slug    |
| **Typora**                 | WYSIWYG 写作、本地图床                      | 本站仓库流；图床可选图床 API                 |
| **Giscus / Utterances**    | 讨论串 UI                               | 已自研壳；可对照补「排序 / 懒加载」              |
| **Algolia DocSearch**      | 即时搜索高亮                               | Pagefind 已有；可加结果关键词高亮            |
| **Apple / 玻璃风 UI**         | 磨砂、轻动效、少边框                           | 已写入 skill；新组件继续跟 `--glass` 变量    |


---



## 六、开发 / 踩坑备忘

- **Content 改 schema 后**：跑 `npm run dev:clean`，否则 dev 里 category 等字段可能是旧缓存，分类页会显示 0 篇。  
- **Mermaid dev 504**：`article-enhancements.ts` 已重试；仍失败就 `dev:clean`。  
- **Giscus 本地**：Vite 代理 `/giscus-api`；生产直连。  
- **嵌套** `<a>`：卡片内不要再套分类/标签链接（Invalid HTML，列表会乱）。卡片内用 `CategoryChip link={false}`。  
- **分类导航图标**：用 `layers`（叠层），不要用 `code`（像编程入口）。  
- **对用户可见文案**：不要写规范式句子（「每篇文章只归一个大类…」），见 skill `nicocat-blog-style`。

---



## 七、优先级建议（个人向）

1. **阅读时长** — 成本低，和现有字数工具衔接
2. **真实** `site` **+ OG 图** — 分享出去才像样
3. **View Transitions** — 全站质感提升，需回归测试 Mermaid / 评论
4. **相关文章** — 提升读完留存
5. **Pagefind 按分类过滤** — 文章多了以后更有用

其余按需；Mermaid、评论、搜索已偏重，先稳再叠。