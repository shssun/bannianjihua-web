import { Box, Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

interface HeroSectionProps {
  /** 工具总数（用于统计） */
  toolCount: number;
  /** 已上线工具数 */
  onlineToolCount: number;
  /** 文章总数 */
  postCount: number;
}

/** 单个统计项。 */
interface StatItem {
  label: string;
  value: number;
}

/**
 * 首页 Hero 区：一句话定位 + 副标题 + 两个 CTA + 站点统计。
 */
export default function HeroSection({
  toolCount,
  onlineToolCount,
  postCount,
}: HeroSectionProps): JSX.Element {
  const stats: StatItem[] = [
    { label: '工具总数', value: toolCount },
    { label: '已上线', value: onlineToolCount },
    { label: '文章', value: postCount },
  ];

  return (
    <Box component="section" className="container-page" sx={{ pt: 6, pb: 4 }}>
      <Stack spacing={2.5} alignItems="center" textAlign="center">
        <Typography
          variant="h1"
          component="h1"
          sx={{ fontSize: { xs: '2rem', md: '2.8rem' }, maxWidth: 760 }}
        >
          一个浏览器优先的个人工具站
        </Typography>

        <Typography
          variant="body1"
          color="var(--muted)"
          sx={{ maxWidth: 640, fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.8 }}
        >
          这里是一个可长期演进的个人 blog 底座：首页即「工具箱 + 研发路线图」，
          所有工具默认在浏览器本地运行，几乎零服务器成本。
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 1 }}>
          <Button component={RouterLink} to="/tools" variant="contained" size="large">
            进入工具箱
          </Button>
          <Button component={RouterLink} to="/roadmap" variant="outlined" size="large">
            查看研发计划
          </Button>
        </Stack>

        {/* 统计 */}
        <Stack
          direction="row"
          spacing={{ xs: 3, md: 6 }}
          sx={{ pt: 3 }}
          justifyContent="center"
          flexWrap="wrap"
          useFlexGap
        >
          {stats.map((stat) => (
            <Box key={stat.label} textAlign="center">
              <Typography variant="h3" sx={{ fontSize: '1.8rem', color: 'var(--primary)' }}>
                {stat.value}
              </Typography>
              <Typography variant="body2" color="var(--muted)">
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
