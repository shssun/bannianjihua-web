/**
 * GitHub Pages SPA 兜底脚本（npm run postbuild）。
 *
 * 复制 dist/index.html → dist/404.html，使 GH Pages 在命中未知路径时
 * 返回 SPA 入口，由前端路由重新接管深层链接。
 *
 * 目录/文件不存在时安全跳过，不影响 Cloudflare Pages 部署。
 */
import { existsSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const distDir = join(currentDir, '..', 'dist');
const source = join(distDir, 'index.html');
const target = join(distDir, '404.html');

if (!existsSync(source)) {
  console.warn('[copy-404] dist/index.html 不存在，跳过（可能尚未执行 vite build）');
  process.exit(0);
}

try {
  copyFileSync(source, target);
  console.log('[copy-404] 已生成 dist/404.html（GitHub Pages SPA 兜底）');
} catch (error) {
  console.error('[copy-404] 复制失败：', error);
  process.exit(1);
}
