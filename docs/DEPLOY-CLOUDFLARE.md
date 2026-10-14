# 切换自定义域名：Cloudflare Pages 部署指南

> 目的：把站点从 GitHub Pages 项目子路径（`https://shssun.github.io/bannianjihua-web/`）
> 迁到 Cloudflare Pages 根路径（自定义域名）。本文档只覆盖**仓库内可准备的构建与验证**；
> 域名注册、Cloudflare 项目创建、DNS 绑定属人工步骤，见 §4。

## 1. 强前置条件（缺一不可）

- **T-005（本地学习记录导出/导入 UI）已完成**：换 origin 会让所有浏览器本地存储
  （localStorage + IndexedDB）全部孤立，用户必须先用 `/data` 页导出旧数据、
  到新域名下导入。T-005 未完成前**禁止切换**。
- Supabase 后端不受影响：前端直连 Supabase URL，与托管平台无关，无需迁移。
- `public/_redirects`、`public/.nojekyll` 状态复核结论见 §5。

## 2. 为什么只需改构建命令、零代码改动（三件套机制）

站点有三处部署路径适配，全部由同一个变量驱动：

| 位置 | 作用 | 根路径下的取值 |
|---|---|---|
| `vite.config.ts` 的 `base` | 静态资源与 `public/` 引用前缀 | `BASE_PATH=/` 时为 `'/'` |
| `src/lib/paths.ts` 的 `BASE_PREFIX` | React Router `basename`（读 `import.meta.env.BASE_URL`） | `'/'` |
| `src/lib/paths.ts` 的 `publicUrl()` | 工具 entry 等 `public/` 资源的完整 URL | 无前缀直拼 |

`vite.config.ts` 读取优先级：进程环境变量 `BASE_PATH` > `.env` 文件 > 默认
`'/bannianjihua-web/'`。因此**构建时传 `BASE_PATH=/` 即可**，router 与
`publicUrl()` 会跟随 Vite 注入的 `BASE_URL` 自动变为根路径形态，无需改任何源码。

⚠️ **本地不要跑默认 outDir 的 `npm run build`**：`vite build` 的 `emptyOutDir`
在受限环境下会触发批量删除闸门。本地验证构建请显式指定新的空目录。

## 3. 构建命令与 Cloudflare Pages 配置

本地构建验证（PowerShell）：

```powershell
$env:BASE_PATH = '/'; npm run build   # 正式构建（CI/平台侧执行）
```

Cloudflare Pages 项目设置（Dashboard → Workers & Pages → Create → Pages →
Connect to Git）：

| 配置项 | 值 |
|---|---|
| Production branch | `main` |
| Framework preset | `None`（纯 Vite，无需框架预设） |
| Build command | `BASE_PATH=/ npm run build` |
| Build output directory | `dist` |
| Environment variable | `NODE_VERSION` = `20`（与 GitHub Actions 的 node-version 保持一致） |

构建命令里内联 `BASE_PATH=/` 优于只配环境变量：命令自解释，且避免有人
改环境变量后命令语义不一致。

## 4. 域名绑定（人工步骤，不在仓库内）

1. Cloudflare Dashboard → 该 Pages 项目 → Custom domains → 添加域名。
2. 若域名 DNS 也在 Cloudflare 托管，CNAME 记录会自动创建；否则按提示在
   当前 DNS 服务商处加 CNAME 指向 `<project>.pages.dev`。
3. 等待证书签发（通常数分钟），用 `https://<你的域名>/tools` 验证。

## 5. `public/_redirects` 与 `public/.nojekyll` 的取舍

- **`public/_redirects`：保留**。内容 `/*  /index.html  200` 是 SPA 兜底，
  Cloudflare Pages **原生识别**该文件，所有未命中实体文件的路径都会返回
  `index.html` 由前端路由接管——深层路由（如 `/tools/xxx` 直接刷新）必需。
- **`public/.nojekyll`：保留（无害）**。它只对 GitHub Pages 的 Jekyll 处理
  有意义；Cloudflare Pages 会忽略它，留着可在回滚到 GitHub Pages 时免去
  重新添加的遗漏风险。

## 6. 切换后验证清单

- [ ] 首页、`/blog`、`/tools` 深层路由直接刷新均 200（验证 `_redirects`）
- [ ] 任一工具「打开工具」能打开（验证 `publicUrl()` 无多余前缀）
- [ ] 产物 `index.html` 中资源以 `/assets/` 开头（验证 base，见 §7）
- [ ] 留言板可发留言（Supabase 正常）
- [ ] `/data` 页导入从旧域名导出的 JSON 成功（用户数据迁移收口）

## 7. 回滚到 GitHub Pages 的步骤

1. **停用 Cloudflare 触发**：GitHub 仓库若无自动同步到 Cloudflare 的保护，
   最直接是把 Cloudflare Pages 项目 Pause（暂停构建部署），防止回滚期间
   两边交替部署。
2. **恢复 GitHub Pages 构建**：`.github/workflows/deploy.yml` 无需修改——
   它的 Build 步骤跑 `npm run build`（不带 `BASE_PATH`），默认即
   `/bannianjihua-web/`，与 GitHub Pages 项目站点路径匹配。
3. **重新部署**：GitHub 仓库 → Actions → "Deploy to GitHub Pages" →
   Run workflow（或推一个空提交触发）。
4. **恢复 DNS**：把域名的 CNAME 从 `<project>.pages.dev` 改回
   `shssun.github.io`（或在 Cloudflare DNS 里把自定义域名记录删除、
   GitHub Pages 继续用 `shssun.github.io/bannianjihua-web/` 原地址）。
5. **验证回滚**：`https://shssun.github.io/bannianjihua-web/` 打开正常，
   产物资源以 `/bannianjihua-web/assets/` 开头。
6. **用户数据不受影响**：GitHub Pages 与旧 origin 相同，本地记录自动恢复；
   若用户已在自定义域名下产生了新数据，提醒其在 `/data` 页导出后再回旧域
   名导入。

## 8. 根路径构建验证记录

验收执行（本地沙箱，outDir 用仓库内 gitignored 临时目录替代仓库外目录，
行为等价）：

```powershell
$env:BASE_PATH='/'; npx vite build --outDir node_modules/.bc-t011
# 验证产物 base：
Select-String -Path node_modules/.bc-t011/index.html -Pattern '/assets/'
# 命中 /assets/index-*.js|css（而非 /bannianjihua-web/assets/）即正确
```
