/**
 * 部署路径工具。
 *
 * 站点可能部署在域名根路径（Cloudflare Pages / 自有域名）或子路径
 * （GitHub Pages 项目站点，如 `/bannianjihua-web/`）。
 *
 * Vite 会把 `base` 注入到 `import.meta.env.BASE_URL`，它满足：
 * - 总是以 `/` 开头、以 `/` 结尾（如 '/' 或 '/bannianjihua-web/'）。
 * - 生产构建时由 vite.config.ts 的 `base` 决定；开发时为 '/'。
 *
 * 本模块提供两件事：
 * 1. `BASE_PREFIX`：去掉首尾斜杠的裸前缀（根部署为 ''），
 *    用于给 `createBrowserRouter` 的 `basename` 传值。
 * 2. `publicUrl(path)`：把 `public/` 下资源的绝对路径（如 '/tools/x.html'）
 *    加上 base 前缀，得到可在任意部署路径下正确解析的 URL。
 */

/** Vite 注入的 base（含首尾斜杠）。 */
const RAW_BASE: string = import.meta.env.BASE_URL ?? '/';

/**
 * 去掉首尾斜杠的裸 base，用作 React Router 的 basename。
 * 例：'/bannianjihua-web/' → 'bannianjihua-web'；'/' → ''。
 */
export const BASE_PREFIX: string = RAW_BASE.replace(/^\/+/, '').replace(/\/+$/, '');

/**
 * 为 `public/` 目录下的绝对资源路径补上 base 前缀。
 *
 * @param path 以 '/' 开头的资源路径，如 '/tools/md-to-html-reader.html'
 * @returns 带 base 前缀的路径，如 '/bannianjihua-web/tools/md-to-html-reader.html'
 */
export function publicUrl(path: string): string {
  const normalized: string = path.startsWith('/') ? path.slice(1) : path;
  // RAW_BASE 末尾已带 '/'，直接拼接即可
  return `${RAW_BASE}${normalized}`;
}
