import { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ThemeToggle from '@/components/common/ThemeToggle';

/** 主导航项（与 PRD §3.1 一致）。 */
interface NavItem {
  label: string;
  to: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: '首页', to: '/' },
  { label: '文章', to: '/blog' },
  { label: '工具箱', to: '/tools' },
  { label: '研发计划', to: '/roadmap' },
  { label: '留言板', to: '/message' },
  { label: '关于', to: '/about' },
];

/**
 * 顶部固定导航栏：Logo + 6 项导航 + 深浅色切换。
 * 移动端折叠为抽屉菜单。
 */
export default function Navbar(): JSX.Element {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const isActive = (to: string): boolean =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const closeDrawer = (): void => setDrawerOpen(false);

  return (
    <AppBar
      position="fixed"
      color="transparent"
      elevation={0}
      sx={{
        backdropFilter: 'blur(8px)',
        backgroundColor: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <Container maxWidth="lg" disableGutters>
        <Toolbar sx={{ gap: 1 }}>
          {/* Logo */}
          <Button
            component={RouterLink}
            to="/"
            disableRipple
            sx={{
              color: 'var(--fg)',
              fontWeight: 800,
              fontSize: '1.05rem',
              px: 1,
              '&:hover': { background: 'transparent' },
            }}
          >
            <Box component="span" sx={{ mr: 0.75 }}>
              ✦
            </Box>
            半年计划
          </Button>

          <Box sx={{ flexGrow: 1 }} />

          {/* 桌面端导航 */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.to}
                component={RouterLink}
                to={item.to}
                size="small"
                sx={{
                  color: isActive(item.to) ? 'var(--primary)' : 'var(--muted)',
                  fontWeight: isActive(item.to) ? 700 : 500,
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <ThemeToggle />

          {/* 移动端菜单按钮 */}
          <Tooltip title="菜单">
            <IconButton
              aria-label="打开导航菜单"
              onClick={() => setDrawerOpen(true)}
              sx={{ display: { xs: 'inline-flex', md: 'none' }, color: 'var(--fg)' }}
            >
              <MenuIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </Container>

      {/* 移动端抽屉 */}
      <Drawer anchor="right" open={drawerOpen} onClose={closeDrawer}>
        <Box sx={{ width: 240, p: 1 }} role="navigation">
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton onClick={closeDrawer} aria-label="关闭导航菜单">
              <CloseIcon />
            </IconButton>
          </Box>
          <List>
            {NAV_ITEMS.map((item) => (
              <ListItemButton
                key={item.to}
                component={RouterLink}
                to={item.to}
                onClick={closeDrawer}
                selected={isActive(item.to)}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}
