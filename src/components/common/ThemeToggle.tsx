import { IconButton, Tooltip } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useThemeMode } from '@/contexts/ThemeContext';

/**
 * 深浅色切换按钮：读取/切换 ThemeContext。
 */
export default function ThemeToggle(): JSX.Element {
  const { mode, toggleMode } = useThemeMode();
  const isDark = mode === 'dark';

  return (
    <Tooltip title={isDark ? '切换到浅色' : '切换到深色'}>
      <IconButton
        aria-label="切换深浅色主题"
        onClick={toggleMode}
        sx={{ color: 'var(--fg)' }}
      >
        {isDark ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
}
