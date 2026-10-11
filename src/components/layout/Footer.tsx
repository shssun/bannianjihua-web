import { Link as RouterLink } from 'react-router-dom';
import { Box, Container, Divider, Stack, Typography } from '@mui/material';

/** 页脚链接项。 */
interface FooterLink {
  label: string;
  to?: string;
  href?: string;
}

const FOOTER_LINKS: FooterLink[] = [
  { label: '关于', to: '/about' },
  { label: '文章', to: '/blog' },
  { label: '工具箱', to: '/tools' },
  { label: '研发计划', to: '/roadmap' },
  { label: 'RSS', href: '/rss.xml' },
  { label: 'GitHub', href: 'https://github.com/shssun/bannianjihua-web' },
];

/**
 * 页脚：站点导航 + 版权 + 联系方式。
 */
export default function Footer(): JSX.Element {
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{ borderTop: '1px solid var(--border)', mt: 6, color: 'var(--muted)' }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          sx={{ py: 3 }}
        >
          <Typography variant="body2" fontWeight={700} color="var(--fg)">
            ✦ 半年计划 · 个人站点
          </Typography>

          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {FOOTER_LINKS.map((link) =>
              link.to ? (
                <Typography
                  key={link.label}
                  variant="body2"
                  component={RouterLink}
                  to={link.to}
                  sx={{ color: 'inherit', '&:hover': { color: 'var(--primary)' } }}
                >
                  {link.label}
                </Typography>
              ) : (
                <Typography
                  key={link.label}
                  variant="body2"
                  component="a"
                  href={link.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  sx={{ color: 'inherit', '&:hover': { color: 'var(--primary)' } }}
                >
                  {link.label}
                </Typography>
              ),
            )}
          </Stack>
        </Stack>

        <Divider sx={{ borderColor: 'var(--border)' }} />

        <Box sx={{ py: 2 }}>
          <Typography variant="caption" color="var(--muted)">
            © {year} 半年计划 · 纯静态部署，工具默认在浏览器本地运行。保留所有权利。
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
