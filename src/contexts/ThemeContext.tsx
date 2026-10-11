import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ThemeMode } from '@/types';
import { safeGetItem, safeSetItem, STORAGE_PREFIX } from '@/lib/utils';

/**
 * 主题上下文：管理深浅色模式、持久化到 localStorage，并同步到 <html> class。
 *
 * 默认 **深色**；localStorage key：`bannianjihua:theme`。
 * iframe 内工具的主题同步由 ToolFrame 监听 mode 变化后 postMessage 广播。
 */

/** localStorage 主题 key。 */
const THEME_STORAGE_KEY = `${STORAGE_PREFIX}theme`;

export interface ThemeContextValue {
  mode: ThemeMode;
  /** 在 light/dark 间切换 */
  toggleMode(): void;
  /** 显式设置模式 */
  setMode(mode: ThemeMode): void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/** 读取初始主题：localStorage 优先，否则默认 dark。 */
function readInitialMode(): ThemeMode {
  const stored = safeGetItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return 'dark';
}

interface ThemeModeProviderProps {
  children: ReactNode;
}

/** 主题 Provider：包裹应用根组件。 */
export function ThemeModeProvider({ children }: ThemeModeProviderProps): JSX.Element {
  const [mode, setModeState] = useState<ThemeMode>(readInitialMode);

  /** 将模式同步到 <html> 的 class 与 color-scheme，驱动 Tailwind / CSS 变量。 */
  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.style.colorScheme = mode;
    safeSetItem(THEME_STORAGE_KEY, mode);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, toggleMode, setMode }),
    [mode, toggleMode, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** 读取主题上下文；必须在 ThemeModeProvider 内部使用。 */
export function useThemeMode(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeMode 必须在 <ThemeModeProvider> 内部使用');
  }
  return ctx;
}
