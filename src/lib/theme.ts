import { createTheme, type Theme } from '@mui/material/styles';
import type { ThemeMode } from '@/types';

/**
 * MUI 主题工厂：依据主题模式返回对应的 light / dark 主题。
 *
 * 与 Tailwind 的 CSS 变量色板语义对齐（--primary 等），
 * 使 MUI 组件与 Tailwind 布局在同一主题下观感一致。
 */

/** 品牌主色（深浅主题共用）。 */
const PRIMARY = '#38bdf8';
const PRIMARY_DARK = '#0ea5e9';

/**
 * 创建 MUI 主题。
 * @param mode 主题模式（'light' | 'dark'）
 * @returns MUI Theme 实例
 */
export function getTheme(mode: ThemeMode): Theme {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: PRIMARY,
        dark: PRIMARY_DARK,
      },
      secondary: {
        main: '#6366f1',
      },
      background: {
        default: isDark ? '#0b1120' : '#f8fafc',
        paper: isDark ? '#111827' : '#ffffff',
      },
      text: {
        primary: isDark ? '#e5e7eb' : '#111827',
        secondary: isDark ? '#9ca3af' : '#4b5563',
      },
      divider: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(15, 23, 42, 0.12)',
    },
    typography: {
      fontFamily: [
        'system-ui',
        '-apple-system',
        'Segoe UI',
        'Roboto',
        'PingFang SC',
        'Microsoft YaHei',
        'sans-serif',
      ].join(','),
      h1: { fontSize: '2.4rem', fontWeight: 700, lineHeight: 1.2 },
      h2: { fontSize: '1.8rem', fontWeight: 700, lineHeight: 1.25 },
      h3: { fontSize: '1.3rem', fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? '#0b1120' : '#f8fafc',
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });
}
