import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

/**
 * Vite 构建配置。
 *
 * - `@` 别名指向 `src/`，与 tsconfig 的 paths 保持一致。
 * - `base` 同时从两处读取（后者优先）：
 *     1. Node 进程环境变量 `process.env.BASE_PATH`（GitHub Actions / shell 最简单）
 *     2. Vite `.env` 文件里的 `BASE_PATH`（本地开发时的默认值，如 .env.example）
 *   两者都缺失时回退到 GitHub Pages 项目站点默认子路径 '/bannianjihua-web/'。
 *
 * 部署场景对照：
 *   - GitHub Pages 项目站点（https://shssun.github.io/bannianjihua-web/）：
 *       使用默认值 '/bannianjihua-web/'，无需任何额外配置。
 *   - Cloudflare Pages / 自有域名（部署在根路径 / 或自定义域名）：
 *       显式传入 BASE_PATH=/，例如 CI 里 `BASE_PATH=/ npm run build`
 *       或在部署平台的构建环境变量里设置 BASE_PATH=/。
 */
export default defineConfig(({ mode }) => {
  // 读取 .env / .env.[mode] / .env.local 等文件中的 BASE_PATH（前缀为空以读取裸变量名）
  const env = loadEnv(mode, process.cwd(), '');
  // 进程环境变量优先，其次 .env 文件，最后回退到 GitHub Pages 项目站点子路径
  const base = process.env.BASE_PATH ?? env.BASE_PATH ?? '/bannianjihua-web/';

  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 1200,
    },
  };
});
