# 部署到 GitHub Pages（gmynebula.github.io）

本站是 Astro 静态站，构建产物在 `dist/`。仓库已包含 GitHub Actions 工作流：`.github/workflows/deploy.yml`。

---

## 一、前置条件

| 项目 | 说明 |
|------|------|
| 仓库名 | 用户页需为 **`GMYNebula/GMYNebula.github.io`**（用户名与域名一致） |
| 站点 URL | `astro.config.mjs` 里 `site: 'https://gmynebula.github.io'` |
| Node | ≥ 22.12.0（与 `package.json` engines 一致） |

---

## 二、首次推送

在 **`NicoCatBlog`** 目录（含 `package.json` 的那层）执行：

```powershell
cd d:\NikoCatBlog\NicoCatBlog

git init
git add .
git commit -m "Astro 小窝初版"

git remote add origin https://github.com/GMYNebula/GMYNebula.github.io.git
git branch -M main
git push -u origin main
```

若远程已有旧 Hexo 内容，推送前请确认：**push 会覆盖远程默认分支上的文件**（旧站会被替换）。

远程已存在时：

```powershell
git remote add origin https://github.com/GMYNebula/GMYNebula.github.io.git
# 或 git remote set-url origin ...
git pull origin main --allow-unrelated-histories   # 如需保留远程历史再合并
git push -u origin main
```

---

## 三、开启 GitHub Pages

1. 打开 GitHub 仓库 → **Settings** → **Pages**
2. **Build and deployment** → **Source** 选 **GitHub Actions**
3. 推送 `main`（或 `master`）后，在 **Actions** 里查看 **Deploy to GitHub Pages**
4. 工作流成功后访问：<https://gmynebula.github.io/>

---

## 四、日常更新

```powershell
cd d:\NikoCatBlog\NicoCatBlog

git add .
git commit -m "更新说明"
git push origin main
```

推送后 Actions 会自动 `npm ci` → `npm run build` → 发布 `dist/`。

---

## 五、本地自测（推送前）

```powershell
npm run build
npm run preview
```

浏览器打开终端提示的地址（通常 `http://localhost:4321`），检查：

- 首页、归档、文章页
- 搜索（Pagefind 仅 build 后有效，dev 里会提示）
- Giscus 评论（生产环境需 GitHub 登录）

开发时若内容/ schema 异常缓存：

```powershell
npm run dev:clean
```

---

## 六、评论（Giscus）注意

- 配置在 `src/consts.ts`（仓库 `GMYNebula/discussion4giscus`）
- 若 OAuth 回调域名仍是旧站，需在 [giscus.app](https://giscus.app) 与 GitHub OAuth App 里改为 **`gmynebula.github.io`**
- 本地 dev 通过 Vite 代理 `/giscus-api`；生产直连 GitHub / giscus API

---

## 七、覆盖旧 Hexo 站后可能的问题

| 问题 | 处理 |
|------|------|
| 旧文章 URL 404 | 旧链多为 `/2023/.../`，新站为 `/blog/<slug>/`，需手动迁移文章或配置重定向 |
| 友链为空 | 编辑 `src/data/friends.ts` |
| RSS / sitemap 域名不对 | 确认 `astro.config.mjs` 的 `site` 已改 |

---

## 八、工作流做了什么

`.github/workflows/deploy.yml` 大致步骤：

1. `checkout` 代码  
2. `npm ci` 安装依赖  
3. `npm run build`（Astro 构建 + Pagefind 索引）  
4. 上传 `dist/` 为 Pages artifact  
5. `deploy-pages` 发布到 GitHub Pages  

无需手动上传 `dist/`，也不要把 `dist/` 提交进 git。
