---

title: '网站搭建'
description: 'Astro 静态站、仓库分工、文章与日夜样式、评论搜索，以及推到 GitHub Pages。'
pubDate: 2026-08-28
heroImage: '../../assets/covers/cover-02.webp'
category: 技术
tags: ['Astro', 'GitHub Pages', '静态站点']
---

我想有一个加载快、改完就能上线的小站，又不想自己租服务器、装数据库。最后用的是 Astro + GitHub Pages。

# Astro 是什么

按官方的说法，[Astro 是为内容站设计的](https://docs.astro.build/zh-cn/concepts/why-astro/)：用 `src/pages/` 里的文件当路由，在构建时把 `.astro` 页面和 Markdown 文章编成普通的 HTML / CSS / JS。默认输出就是静态文件，适合丢到 GitHub Pages 这类只托管静态资源的地方。

我看中的就是这个静态生成。改完构建一下就能上线，访客来了，服务器只管把文件递出去，云端不用跑 Node，也不用查数据库。

本站的选型：


| 部分  | 选择                     | 一句话                    |
| --- | ---------------------- | ---------------------- |
| 框架  | Astro 7                | 静态生成，Markdown / MDX 好用 |
| 内容  | Content Collections    | 文章进 Git，构建时校验字段        |
| 样式  | CSS 变量 + `data-theme`  | 日夜两套颜色，组件只引用变量         |
| 部署  | GitHub Pages + Actions | 推 `main` 就更新网站         |




## 从脚手架起一步

先装 [Node.js](https://nodejs.org/)。[Astro 安装文档](https://docs.astro.build/zh-cn/install-and-setup/) 要求 `v22.12.0` 或更高，`v23` 这类奇数版本不支持，装偶数的 LTS 最省心（本站 `package.json` 的 `engines` 写的也是 `>=22.12.0`）。装好后，终端里这两条应该都能打出版本号：

```bash
node -v
npm -v
```



### 1. 建项目

在想放代码的目录打开终端，跑官方脚手架 `create astro`：

```bash
npm create astro@latest
```

不用提前建空文件夹，向导会帮你建。第一次运行会问要不要装 `create-astro`，选 `y`。之后它会依次问：

1. 项目放哪：填一个还不存在的文件夹名，比如 `./my-blog`（新项目只能建在空目录里）
2. 用哪套模板：方向键选 Blog。本站就是从这套起步的；选 Minimal 也行，只是没有示例文章
3. 要不要装依赖：选 `y`，省得之后自己 `npm install`
4. 要不要初始化 Git：选 `y`

嫌按键多，也可以用参数一步指定博客模板：

```bash
npm create astro@latest my-blog -- --template blog --install --git
```

中间那个 `--` 是给 npm 看的，有了它，后面的参数才会传给 `create-astro`。还有哪些参数，见 [create-astro 的说明](https://github.com/withastro/astro/tree/main/packages/create-astro#cli-flags)。

跑完进入目录：

```bash
cd my-blog
```

刚才没选装依赖的话，这里补一次 `npm install`。

### 2. 本地跑起来

```bash
npm run dev
```

终端会打印本地地址，一般是 `http://localhost:4321`。浏览器打开能看到模板自带的首页和几篇示例博文，开发服务器就算跑起来了。

之后改源码，页面会热更新。要停掉，在终端按 `Ctrl + C`。

### 3. 构建和预览

准备上线，或者要测搜索这种只有生产产物里才有的功能时，再跑：

```bash
npm run build
npm run preview
```

`build` 把站点写进 `dist/`，`preview` 在本地起一个静态服务器打开这份产物（这几个命令的完整说明见 [CLI 参考](https://docs.astro.build/zh-cn/reference/cli-reference/)）。本站的 `build` 脚本在 Astro 构建完之后还会跑 Pagefind 给搜索建索引。官方博客模板没有这一步，是我后来加的。

## 仓库里怎么分

脚手架生成的目录大致如下。按 [项目结构文档](https://docs.astro.build/zh-cn/basics/project-structure/) 的说法，Astro 真正保留的目录只有 `src/pages/`，其余都是社区惯例，本站也照着分：


| 你改哪里                             | 大致作用                                                   |
| -------------------------------- | ------------------------------------------------------ |
| `src/pages/`                     | 网址从这里来。例如 `index.astro` → 首页，`about.astro` → `/about/` |
| `src/content/blog/`              | 博文正文（`.md` / `.mdx`），一篇文件对应一篇文章                        |
| `src/components/`、`src/layouts/` | 页头、页脚、文章壳子等可复用零件                                       |
| `src/styles/`                    | 全局 CSS：颜色变量、正文排版                                        |


另外还有：

- `public/`：图片、背景、`robots.txt` 等，不经过 Astro 处理，构建时原样拷进 `dist/`
- `src/content.config.ts`：定义内容集合（博文从哪读、frontmatter 长什么样）
- `astro.config.mjs`：站点域名、Markdown 插件、字体等总配置
- `.github/workflows/`：推代码后自动构建、发布到 GitHub Pages

线上访客打开的，是 `dist/` 里已经生成好的静态文件。

## 和本站相关的几个概念

1. **页面与路由（**`src/pages`**）**
  Astro 用[基于文件的路由](https://docs.astro.build/zh-cn/guides/routing/)：文件路径就是网址，不用另写路由配置。`src/pages/friends/index.astro` → `/friends/`。文件名带方括号的是动态路由，例如 `blog/[...slug].astro`。静态模式下，所有网址都得在构建时确定，所以动态路由页面要导出 `getStaticPaths()`，列出要生成哪些页面。
2. `.astro` **文件**
  一个 [Astro 组件](https://docs.astro.build/zh-cn/basics/astro-components/)分两块：顶部两行 `---` 之间是组件脚本（引入组件、取数据），只在构建时运行，不会发到浏览器；下面是 HTML 模板，可以再写 `<style>`、`<script>`。`<style>` 默认[只作用于当前组件](https://docs.astro.build/zh-cn/guides/styling/#作用域样式)，不会漏到别的页；确实要全局生效时才用 `is:global`。
3. **内容集合（Content Collections）**
  博文不塞进 `pages` 里，而是在 `src/content.config.ts` 里定义一个[内容集合](https://docs.astro.build/zh-cn/guides/content-collections/)：用 `glob()` loader 指明从 `src/content/blog/` 读 `.md` / `.mdx`，每篇的 `id` 由文件名生成。`blog/[...slug].astro` 在 `getStaticPaths()` 里用 `getCollection('blog')` 取出文章（线上构建会滤掉 `draft`），给每篇生成一个页面，套进统一的文章布局。
4. **构建产物**
  跑完 `npm run build` 才有完整站点。页面壳子、Markdown 文章和组件都被编译成静态文件，可以直接丢到 GitHub Pages 上。



# 文章怎么写进来

文章是普通 Markdown（或 MDX），放在 `src/content/blog/`。文件开头用 `---` 包住的元数据叫 frontmatter，至少要有标题、摘要、日期、分类：

```yaml
title: '标题'
description: '摘要'
pubDate: 2026-08-28
category: 技术   # 只能是：技术 / 笔记 / 日常
tags: ['Astro', 'GitHub Pages']  # 细话题；不要和 category 重复
heroImage: '../../assets/covers/cover-02.webp'  # 可选封面
draft: false     # true = 线上隐藏，本地 dev 还能看见
```

这些字段在 `src/content.config.ts` 里用 schema 规定好了，写法是 Astro 自带的 Zod：

```ts
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      category: z.enum(categoryNames),
      tags: z.array(z.string()).default([]),
      heroImage: z.optional(image()),
      draft: z.boolean().default(false),
    }),
});
```

少写必填项、日期格式不对、分类写成别的词，构建都会直接报错，总比页面打开才发现没标题好查。字段类型怎么写，见 [定义集合 schema](https://docs.astro.build/zh-cn/guides/content-collections/#定义集合模式schema)。

几个约定：

- `category`：三个大类，出现在 [分类页](/categories/)
- `tags`：更细的话题，汇总到 [标签页](/tags/)
- 单篇网址：`/blog/<文件名>/`（不含 `.md`）
- 顶栏没有单独「博客列表」，时间线看 [归档](/archives/)；分类页是文件夹式点开看标题

正文里的 `#` 是文章的章，不是整页大标题。大标题已经在文章页顶部的卡片里了，构建时会把正文标题统一降一级，右侧目录只收章和节。

# 样式怎么写

页面和文章都能显示之后，剩下的是让日间、夜间两种外观共用一套结构。本站没用 Tailwind，CSS 是手写的，也可以让 AI 照同一套结构生成。

文件这样分：


| 文件                      | 做什么                           |
| ----------------------- | ----------------------------- |
| `src/styles/global.css` | 颜色变量、正文排版、评论等 |
| `src/styles/motion.css` | 少量入场动画                        |
| 各页 `.astro` 的 `<style>` | 这一页自己的排版                      |




## 1. 先准备两套颜色变量

在 `global.css` 里，夜间和日间各写一套 [CSS 自定义属性](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Using_CSS_custom_properties)（俗称 CSS 变量）。夜间挂在 `:root`（并与 `html[data-theme='dark']` 共用），日间挂在 `html[data-theme='light']`：

```css
:root,
html[data-theme='dark'] {
  --bg: #0e1114;
  --ink: #eef0f2;
  --accent: #e8836b;
}

html[data-theme='light'] {
  --bg: #f4f6f8;
  --ink: #171a1e;
  --accent: #c44b2f;
}
```

组件里只引用变量，不写死只适合某一种主题的颜色：

```css
.card {
  color: var(--ink);
  background: var(--bg);
}
```

切换主题时只换变量的值，类名不用动。自定义属性会沿 DOM 往下继承，`<html>` 上的值一变，整页引用它的地方都跟着变。

## 2. 按钮如何切换日夜

页头按钮修改的是根节点 `<html>` 的 [`data-*` 属性](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Reference/Global_attributes/data-*) `data-theme`（`dark` 或 `light`），并写进 [`localStorage`](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/localStorage)，下次打开还记得：

```js
root.setAttribute('data-theme', theme);
localStorage.setItem('theme', theme);
```



## 3. 代码块也要跟主题

Astro 配置里关掉了自带语法高亮（`syntaxHighlight: false`），改用 [Expressive Code](https://expressive-code.com/)。在 `ec.config.mjs` 里放夜间 / 日间两套主题（`ayu-dark` / `ayu-light`）。

按 Expressive Code 的[主题文档](https://expressive-code.com/guides/themes/)，同时给一暗一亮两套主题时，它默认跟着系统的深色模式切换；站点有自己的切换按钮的话，它也能按 `<html>` 上 `data-theme` 的值，找同名的主题来用。所以本站改了两处：

```js
export default defineEcConfig({
  themes: ['ayu-dark', 'ayu-light'],
  useDarkModeMediaQuery: false, // 不跟系统，只跟站点按钮
  customizeTheme(theme) {
    theme.name = theme.type === 'dark' ? 'dark' : 'light'; // 名字对上 data-theme 的值
    return theme;
  },
});
```

边框、背景等颜色在 [`styleOverrides`](https://expressive-code.com/reference/style-overrides/) 里改，用数组按「夜、日」各写一个值：

```js
borderColor: ['#1b1f29', 'rgba(107, 125, 143, 0.15)'],
codeBackground: ['#10141c', '#fcfcfc'],
```

## 4. 背景图

`SiteBackground` 组件轮播 `public/backgrounds/` 里的图，上面再盖一层 veil（遮罩）。日间的遮罩更不透明一点，免得照片把字冲淡，这部分用 `html[data-theme='light'] …` 单独调。

# 评论、搜索和更多

页面能打开、能发文、有了基本样式，再往上加这些：


| 需求      | 本站做法                                |
| ------- | ----------------------------------- |
| 代码高亮    | Expressive Code（见上一节）               |
| 公式      | remark-math + KaTeX                 |
| 流程图     | Mermaid                             |
| 提示框     | GitHub 风格的 `[!NOTE]` 等              |
| 目录      | 由标题生成；桌面在右侧固定                       |
| 评论      | GitHub Discussions 的数据 + 自己画的评论 UI  |
| 搜索      | Pagefind：在 `build` 之后扫描 `dist/` 做索引 |
| 订阅 / 地图 | RSS；`@astrojs/sitemap`（会排除开发页等）     |


## 评论

评论存在 GitHub Discussions 里，思路来自 [giscus](https://giscus.app/zh-CN)。不过我没嵌 giscus 官方的 iframe，而是自己取数据、自己排版，这样评论区能和正文共用 CSS 变量。

读评论时，浏览器直接调 GitHub 的 API。GitHub 允许浏览器跨域调用，线上和本地都没问题。登录换 token、第一次创建讨论这两件事要走 giscus 的接口，本地开发时会被浏览器拦下来。

拦下来是因为浏览器的[同源策略和 CORS](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/CORS)。页面脚本只能随意请求同源的地址，也就是协议、域名、端口都相同；请求别的源时，对方要在响应头 `Access-Control-Allow-Origin` 里明确允许你的来源，浏览器才会把结果交给脚本。本地页面的源是 `http://localhost:4321`，giscus 的接口不认它。

我用 Vite 的 [`server.proxy`](https://vite.dev/config/server-options#server-proxy) 绕过去：前端请求本站自己的 `/giscus-api/...`，对浏览器来说是同源；开发服务器收到后，再从服务器这边转发到 `https://giscus.app/api/...`。服务器之间的请求不受浏览器 CORS 限制。

```js
vite: {
  server: {
    proxy: {
      '/giscus-api': {
        target: 'https://giscus.app/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/giscus-api/, ''),
      },
    },
  },
},
```

`server.proxy` 只对 `dev` 生效，所以我在 `vite.preview.proxy` 里也配了一份，`preview` 时评论照样能用。

## 搜索

搜索用的是 [Pagefind](https://pagefind.app/)，它在静态站生成之后运行。它扫描 `dist/` 里的 HTML，产出一份静态的搜索索引，跟站点一起发布，不需要搜索服务器。本站把它接在 `build` 脚本后面：

```json
"build": "astro build && npx --yes pagefind --site dist"
```

所以 `npm run dev` 里没有搜索索引，要看搜索得先 `build` 再 `preview`。

# 怎么上线

本站没有服务器要维护。本地改完推到 GitHub，Actions 负责构建，Pages 把静态文件挂出去。自定义域名是后来才绑的。整体做法和 Astro 的 [部署到 GitHub Pages](https://docs.astro.build/zh-cn/guides/deploy/github/) 一致。

## 1. 代码里先对准域名

`astro.config.mjs` 里的 `site` 要写成正式地址（本站是 `https://nebulacoco.top`）。RSS、sitemap、canonical 都会用它。

另一个选项是 `base`。Pages 默认把站点发在 `https://用户名.github.io/仓库名/` 这样的子路径下，这时 `base` 要设成 `/仓库名`。本站仓库叫 `用户名.github.io`，站点本来就在根路径，后来又换了自定义域名，两种情况都不用设 `base`。

## 2. 写好工作流

工作流文件是 `.github/workflows/deploy.yml`，推 `main` 就会跑，也可以在 Actions 页手动触发（`workflow_dispatch`）。Astro 文档推荐直接用官方的 [`withastro/action`](https://github.com/withastro/action)，装依赖、构建、上传一步搞定；我是把这几步拆开手写的，结果一样：

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: npm
      - run: npm ci --legacy-peer-deps
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

`npm run build` 跑的是 `package.json` 里的脚本，Pagefind 索引也就一起生成了。工作流顶部还得给 `pages: write` 和 `id-token: write` 两个权限，`deploy-pages` 才能发布。

## 3. 推到 GitHub

在含 `package.json` 的项目根目录：

```bash
git add .
git commit -m "说明这次改了什么"
git push origin main
```

推之前最好在本地先过一遍：

```bash
npm run build
npm run preview
```

preview 里首页、文章和搜索都正常了再推，免得到 Actions 里才发现构建挂了。

## 4. 打开 GitHub Pages（用 Actions 发布）

仓库 → **Settings** → **Pages**：

1. **Build and deployment** 下的 **Source** 选 **GitHub Actions**，而不是「Deploy from a branch」（那个是直接挂某个分支的目录）
2. 打开 **Actions** 页，等 **Deploy to GitHub Pages** 出现绿勾

成功后就有一个 `*.github.io` 地址能打开了。`dist/` 是工作流现场构建的，不用提交进 Git，也不用手动上传。

## 5. 绑自定义域名

本站后来用的是 `nebulacoco.top`。GitHub 的 [管理 Pages 自定义域名](https://docs.github.com/zh/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) 要求先在 GitHub 填域名，再去配 DNS。顺序反过来的话，DNS 已经指向 GitHub，仓库却还没认领这个域名，别人就有机会把它挂到自己的仓库上。

1. 仓库 **Settings** → **Pages** → **Custom domain**，填入 `nebulacoco.top` 并保存
2. 去域名服务商那里加解析。`nebulacoco.top` 这种不带前缀的主域（apex domain），加四条 `A` 记录指向 GitHub Pages：

   ```text
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

   想让 `www.nebulacoco.top` 也能访问，再给 `www` 加一条 `CNAME`，指向 `用户名.github.io`（不带仓库名），GitHub 会自动在两者之间跳转。服务商自带的默认记录要先删掉
3. 等 GitHub 做 **DNS check**。官方说 DNS 生效最长要 24 小时，检查通过之前，用域名访问可能一直是 404
4. 检查通过后勾选 **Enforce HTTPS**。这个选项也可能要等最多 24 小时才能勾

`public/CNAME` 这个文件要单独说一下。Astro 文档让你在 `public/` 里放一个只写域名的 `CNAME` 文件，随站点一起发布；GitHub 文档却写明，用自定义 Actions 工作流发布时这个文件会被忽略，域名以 Settings 里填的为准。我的仓库里还留着它，没什么坏处，只是真正起作用的是 Settings 那一栏。

我自己碰到过两次 404。一次是 DNS 已经改了，Pages 里还没绑好自定义域名，绑上、检查通过之后才正常。另一次是 HTTPS 已经能用，HTTP 却偶尔 404（请求打到部分 Pages 的 IP 上时），这种情况以 HTTPS 为准，等 DNS 和证书都稳定下来就好。

## 6. 日常更新

以后发文或改站，改完在本地 `build`、`preview` 看一眼，然后 `commit`、推到 `main`，Actions 会再发一版静态文件。整个过程没有重启服务器这回事。

页脚的萌 ICP、友链信息，都是站点能访问之后才补上的，跟发布流程无关。

# 小结

这个小窝的骨架是 Astro。用脚手架起项目，分清 `pages`、`content`、组件和样式各放哪，文章字段交给 Content Collections 校验。日夜两套外观靠手写的 CSS 变量加 `data-theme` 切换。评论、搜索、公式都是骨架跑通之后才加的，因为没有自己的后端，评论借 GitHub Discussions，搜索用 Pagefind 生成静态索引。发布就是推 `main`，由 Actions 构建、发到 GitHub Pages；绑自定义域名时，Pages 设置和 DNS 两边都要配好，再开 HTTPS。

要是从零跟着搭，我建议先让本地 `dev` 能打开，再写一篇 Markdown 并构建通过，然后推上去让 `*.github.io` 能访问，最后才绑域名、加评论和搜索。一次加太多东西，出了问题不好查。

## 参考链接

- Astro 文档：[内容集合](https://docs.astro.build/zh-cn/guides/content-collections/)
- Astro 文档：[部署你的 Astro 站点至 GitHub Pages](https://docs.astro.build/zh-cn/guides/deploy/github/)
- GitHub 文档：[管理 GitHub Pages 网站的自定义域](https://docs.github.com/zh/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- Expressive Code 文档：[Themes](https://expressive-code.com/guides/themes/)
- MDN：[跨源资源共享（CORS）](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/CORS)