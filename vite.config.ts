import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

/**
 * Vite 构建配置。
 *
 * - `@` 别名指向 `src/`，与 tsconfig 的 paths 保持一致。
 * - `base` 默认为 '/'，部署到 GitHub Pages 子路径时可通过
 *   环境变量 BASE_PATH 覆盖（例如 BASE_PATH=/bannianjihua_web/）。
 */
export default defineConfig(() => {
  const base = process.env.BASE_PATH ?? '/';

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
