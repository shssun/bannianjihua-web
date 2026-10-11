import type { Config } from 'tailwindcss';

/**
 * Tailwind 配置。
 *
 * 颜色统一映射到 CSS 变量（定义于 src/styles/index.css），
 * 通过 `darkMode: 'class'` 实现「一份 class 双主题」，
 * 与 MUI ThemeProvider 的深浅色保持同步。
 */
const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        fg: 'var(--fg)',
        muted: 'var(--muted)',
        card: 'var(--card)',
        border: 'var(--border)',
        primary: 'var(--primary)',
        'primary-soft': 'var(--primary-soft)',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'PingFang SC',
          'Microsoft YaHei',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: {
        xl: '0.875rem',
      },
      maxWidth: {
        content: '1200px',
      },
      boxShadow: {
        soft: '0 2px 12px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
