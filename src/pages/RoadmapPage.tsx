import { Box, Chip, Stack, Typography } from '@mui/material';
import type { Tool } from '@/types';
import { getUpcomingTools, getOnlineTools, TOOL_STATUS_LABEL, TOOL_RUNTIME_LABEL } from '@/data/tools';
import Section from '@/components/common/Section';
import EmptyState from '@/components/common/EmptyState';

interface RoadmapColumn {
  key: 'developing' | 'planned' | 'paused';
  title: string;
}

const COLUMNS: RoadmapColumn[] = [
  { key: 'developing', title: '开发中' },
  { key: 'planned', title: '规划中' },
  { key: 'paused', title: '已暂停' },
];

/**
 * 研发计划页 `/roadmap`：未来工具看板（按状态分列）。
 */
export default function RoadmapPage(): JSX.Element {
  const upcoming: Tool[] = getUpcomingTools();
  const onlineCount = getOnlineTools().length;

  return (
    <Section
      title="研发计划"
      subtitle={`已上线 ${onlineCount} 个工具 · 研发中 ${upcoming.length} 个`}
    >
      {upcoming.length === 0 ? (
        <EmptyState icon="🗺️" title="暂无研发中的工具" description="新的想法正在酝酿。" />
      ) : (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
          {COLUMNS.map((column) => {
            const items = upcoming.filter((tool) => tool.status === column.key);
            return (
              <Box
                key={column.key}
                sx={{
                  flex: 1,
                  width: '100%',
                  minWidth: 0,
                  bgcolor: 'var(--primary-soft)',
                  borderRadius: 3,
                  p: 2,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography variant="h3" sx={{ fontSize: '1.05rem' }}>
                    {column.title}
                  </Typography>
                  <Chip label={items.length} size="small" />
                </Stack>

                <Stack spacing={1.5}>
                  {items.length === 0 ? (
                    <Typography variant="body2" color="var(--muted)">
                      暂无
                    </Typography>
                  ) : (
                    items.map((tool) => (
                      <Box key={tool.id} className="surface-card" sx={{ p: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {tool.cover ?? '🧭'} {tool.name}
                        </Typography>
                        <Typography variant="body2" color="var(--muted)" sx={{ mb: 1, lineHeight: 1.6 }}>
                          {tool.description}
                        </Typography>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                          <Chip
                            label={TOOL_STATUS_LABEL[tool.status]}
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                          <Chip
                            label={TOOL_RUNTIME_LABEL[tool.runtime]}
                            size="small"
                            variant="outlined"
                            sx={{ borderColor: 'var(--border)' }}
                          />
                          {tool.eta ? (
                            <Chip
                              label={tool.eta}
                              size="small"
                              variant="outlined"
                              sx={{ borderColor: 'var(--border)' }}
                            />
                          ) : null}
                        </Stack>
                      </Box>
                    ))
                  )}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}

      <Typography variant="caption" color="var(--muted)" sx={{ display: 'block', mt: 3 }}>
        * 研发排期可能随实际情况调整；已上线工具可在「工具箱」中直接使用。
      </Typography>
    </Section>
  );
}
