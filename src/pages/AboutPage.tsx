import { Box, Stack, Typography } from '@mui/material';
import Section from '@/components/common/Section';
import { Link as RouterLink } from 'react-router-dom';

/** 站点能力清单。 */
const FEATURES: Array<{ icon: string; title: string; desc: string }> = [
  { icon: '🧰', title: '浏览器本地工具', desc: '工具均为自包含单文件 HTML，无需登录、离线可用。' },
  { icon: '📝', title: 'Markdown 博客', desc: '文章以 Markdown 存储与渲染，支持 GFM 与代码高亮。' },
  { icon: '🗺️', title: '研发路线图', desc: '公开的工具演进计划，持续更新。' },
  { icon: '💬', title: '匿名留言板', desc: '与站点主沟通的轻量通道（含防滥用）。' },
];

/**
 * 关于页 `/about`：站点介绍、能力清单、联系方式。
 */
export default function AboutPage(): JSX.Element {
  return (
    <Section title="关于本站" subtitle="一句话：一个浏览器优先的个人工具站与博客底座。">
      <Typography variant="body1" sx={{ lineHeight: 1.9, maxWidth: 760, mb: 4 }}>
        本站是「百年计划」的个人站点：以纯静态方式部署，没有任何服务器端常驻进程；
        所有动态能力由在线数据库（Supabase）承担，工具默认 100% 在浏览器本地执行。
        目标是建立一个可长期演进的内容与工具底座 —— 加工具、加文章都不需要改动框架。
      </Typography>

      <Typography variant="h3" sx={{ fontSize: '1.2rem', mb: 2 }}>
        站点能力
      </Typography>
      <Stack spacing={2} sx={{ mb: 4 }}>
        {FEATURES.map((feature) => (
          <Box
            key={feature.title}
            className="surface-card"
            sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'flex-start' }}
          >
            <Box sx={{ fontSize: '1.6rem' }} aria-hidden>
              {feature.icon}
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {feature.title}
              </Typography>
              <Typography variant="body2" color="var(--muted)">
                {feature.desc}
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>

      <Typography variant="h3" sx={{ fontSize: '1.2rem', mb: 1.5 }}>
        联系方式
      </Typography>
      <Typography variant="body2" color="var(--muted)" sx={{ lineHeight: 1.9 }}>
        欢迎通过
        <Box
          component={RouterLink}
          to="/message"
          sx={{ color: 'var(--primary)', mx: 0.5, '&:hover': { textDecoration: 'underline' } }}
        >
          留言板
        </Box>
        与我交流，或到 GitHub 上找到我。
      </Typography>
    </Section>
  );
}
