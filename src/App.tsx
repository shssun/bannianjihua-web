import { useMemo } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { RouterProvider } from 'react-router-dom';
import { ThemeModeProvider, useThemeMode } from '@/contexts/ThemeContext';
import { getTheme } from '@/lib/theme';
import { router } from '@/router';

/**
 * 主题桥接组件：读取 ThemeContext 的 mode 并驱动 MUI ThemeProvider。
 * 拆分出来是为了在 ThemeModeProvider 内部才能调用 useThemeMode。
 */
function ThemedApp(): JSX.Element {
  const { mode } = useThemeMode();
  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

/**
 * 根组件：组装 ThemeModeProvider（主题状态）→ 主题桥接 → 路由。
 */
export default function App(): JSX.Element {
  return (
    <ThemeModeProvider>
      <ThemedApp />
    </ThemeModeProvider>
  );
}
