import { Box, Chip, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { Tool } from '@/types';
import { getUpcomingTools, TOOL_STATUS_LABEL } from '@/data/tools';
import Section from '@/components/common/Section';
import EmptyState from '@/components/common/EmptyState';

/**
 * 研发计划预览区：时间线形式展示 planned/developing/paused 工具。
 */
export default function RoadmapSection(): JSX.Element {
  const tools: Tool[] = getUpcomingTools();

  return (
    <Section
      title="研发计划"
      subtitle="正在路上 / 规划中的工具"
      actionLabel="查看完整路线图"
      actionTo="/roadmap"
    >
      {tools.length === 0 ? (
        <EmptyState icon="🗺️" title="暂无研发中的工具" description="新的想法正在酝酿。" />
      ) : (
        <Stack spacing={2}>
          {tools.map((tool) => (
            <Box
              key={tool.id}
              className="surface-card"
              sx={{
                p: 2.5,
                display: 'flex',
                gap: 2,
                alignItems: 'flex-start',
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  bgcolor: 'var(--primary-soft)',
                }}
                aria-hidden
              >
                {tool.cover ?? '🧭'}
              </Box>

              <Box sx={{ flex: 1 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                  useFlexGap
                  sx={{ mb: 0.5 }}
                >
                  <Typography variant="h3" sx={{ fontSize: '1.05rem' }}>
                    {tool.name}
                  </Typography>
                  <Chip label={TOOL_STATUS_LABEL[tool.status]} size="small" color="info" variant="outlined" />
                  {tool.eta ? (
                    <Chip label={tool.eta} size="small" variant="outlined" sx={{ borderColor: 'var(--border)' }} />
                  ) : null}
                </Stack>
                <Typography variant="body2" color="var(--muted)" sx={{ lineHeight: 1.7 }}>
                  {tool.description}
                </Typography>
              </Box>

              <Typography
                component={RouterLink}
                to="/roadmap"
                variant="body2"
                sx={{
                  color: 'var(--primary)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  alignSelf: { xs: 'flex-start', sm: 'center' },
                }}
              >
                详情 →
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Section>
  );
}
