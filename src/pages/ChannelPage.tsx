import { useMemo } from 'react';
import { Box, Grid, Stack, Typography } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import type { Tool } from '@/types';
import { getToolsByChannel } from '@/data/tools';
import { getChannelById } from '@/data/channels';
import ToolCard from '@/components/tools/ToolCard';
import EmptyState from '@/components/common/EmptyState';
import Section from '@/components/common/Section';

/**
 * 单频道页 `/tools/channel/:channel`。
 *
 * 展示该频道下的全部工具（已上线在前、研发中在后）。
 * 频道 id 非法或该频道下没有任何工具时，给出友好占位（不白屏）。
 */
export default function ChannelPage(): JSX.Element {
  const { channel: channelId } = useParams<{ channel: string }>();
  const channel = channelId ? getChannelById(channelId) : undefined;

  const tools = useMemo<Tool[]>(() => {
    if (!channelId) {
      return [];
    }
    return getToolsByChannel(channelId).sort((a, b) => {
      // 已上线优先，其次按 order
      const onlineRank = (tool: Tool): number => (tool.status === 'online' ? 0 : 1);
      const diff = onlineRank(a) - onlineRank(b);
      if (diff !== 0) {
        return diff;
      }
      return (a.order ?? 9999) - (b.order ?? 9999);
    });
  }, [channelId]);

  if (!channel) {
    return (
      <Box className="container-page py-10">
        <EmptyState
          icon="🧭"
          title="未找到该频道"
          description="频道可能不存在，或链接有误。"
          actionLabel="返回工具箱"
          actionTo="/tools"
        />
      </Box>
    );
  }

  return (
    <Section
      title={`${channel.cover} ${channel.name}`}
      subtitle={channel.description}
      actionLabel="返回工具箱"
      actionTo="/tools"
    >
      {tools.length === 0 ? (
        <EmptyState
          icon="🧰"
          title="该频道暂无工具"
          description="新的工具正在路上，敬请期待。"
          actionLabel="返回工具箱"
          actionTo="/tools"
        />
      ) : (
        <Stack spacing={3}>
          <Typography variant="body2" color="var(--muted)">
            共 {tools.length} 个工具
          </Typography>
          <Grid container spacing={2}>
            {tools.map((tool) => (
              <Grid item xs={12} sm={6} md={4} key={tool.id}>
                <ToolCard tool={tool} />
              </Grid>
            ))}
          </Grid>

          <Typography variant="body2" component="div" sx={{ pt: 1 }}>
            <Box
              component={RouterLink}
              to="/tools"
              sx={{ color: 'var(--primary)', '&:hover': { textDecoration: 'underline' } }}
            >
              ← 返回工具箱
            </Box>
          </Typography>
        </Stack>
      )}
    </Section>
  );
}
