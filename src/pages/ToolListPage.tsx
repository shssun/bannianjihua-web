import { useMemo, useState } from 'react';
import { Box, Grid, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { Tool } from '@/types';
import { TOOLS, getOnlineTools, getUpcomingTools } from '@/data/tools';
import type { Channel } from '@/data/channels';
import { getSortedChannels } from '@/data/channels';
import Section from '@/components/common/Section';
import ToolCard from '@/components/tools/ToolCard';
import ToolFilterBar, {
  collectTags,
  type StatusFilter,
} from '@/components/tools/ToolFilterBar';
import EmptyState from '@/components/common/EmptyState';

/** 频道小标题：图标 + 名称 + 描述 + 数量 + 进入频道链接。 */
function ChannelHeading({
  channel,
  count,
}: {
  channel: Channel;
  count: number;
}): JSX.Element {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-end"
      spacing={2}
      sx={{ mb: 2 }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Typography component="span" sx={{ fontSize: '1.4rem' }} aria-hidden>
          {channel.cover}
        </Typography>
        <Box>
          <Typography variant="h3" sx={{ fontSize: '1.15rem' }}>
            {channel.name}
            <Typography component="span" variant="body2" color="var(--muted)" sx={{ ml: 1 }}>
              {count}
            </Typography>
          </Typography>
          <Typography variant="caption" color="var(--muted)">
            {channel.description}
          </Typography>
        </Box>
      </Stack>

      <Typography
        component={RouterLink}
        to={`/tools/channel/${channel.id}`}
        variant="body2"
        sx={{
          color: 'var(--primary)',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          '&:hover': { textDecoration: 'underline' },
        }}
      >
        进入频道 →
      </Typography>
    </Stack>
  );
}

/** 工具卡片网格。 */
function ToolGrid({ tools }: { tools: Tool[] }): JSX.Element {
  return (
    <Grid container spacing={2}>
      {tools.map((tool) => (
        <Grid item xs={12} sm={6} md={4} key={tool.id}>
          <ToolCard tool={tool} />
        </Grid>
      ))}
    </Grid>
  );
}

/**
 * 工具箱页 `/tools`。
 *
 * - **默认视图**：按频道分区，**列出全部频道**（每区一个频道标题），
 *   区内先展示已上线工具，再以「研发中」小标题展示该频道尚未上线的工具；
 *   无任何已上线工具的频道给出占位说明。每个工具只在其所属频道出现一次。
 * - **筛选时**：状态/标签筛选生效，退化为一张平铺结果网格。
 */
export default function ToolListPage(): JSX.Element {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [tag, setTag] = useState<string | null>(null);

  const tags = useMemo<string[]>(() => collectTags(TOOLS), []);

  const isFiltering = status !== 'all' || tag !== null;

  /** 筛选后的平铺结果。 */
  const filtered = useMemo<Tool[]>(() => {
    return TOOLS.filter((tool) => {
      const statusOk =
        status === 'all' ||
        (status === 'online' && tool.status === 'online') ||
        (status === 'upcoming' && tool.status !== 'online');
      const tagOk = tag === null || tool.tags.includes(tag);
      return statusOk && tagOk;
    }).sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
  }, [status, tag]);

  /**
   * 默认视图：**列出全部频道**（二级目录 = 频道，须始终可见），
   * 每个频道内再分「已上线」与「研发中」两组；空频道给出占位说明。
   * 这样老板规划好的 english / math / cognition / general 四个二级目录永远都在，
   * 且每个工具只在其所属频道出现一次，不会在两处重复展示。
   */
  const channelSections = useMemo(() => {
    const online = getOnlineTools();
    const upcoming = getUpcomingTools();
    return getSortedChannels().map((channel) => ({
      channel,
      online: online.filter((tool) => tool.channel === channel.id),
      upcoming: upcoming.filter((tool) => tool.channel === channel.id),
    }));
  }, []);

  return (
    <Section title="工具箱" subtitle="默认浏览器本地运行 · 按频道浏览，或筛选查找">
      <ToolFilterBar
        tags={tags}
        status={status}
        tag={tag}
        onStatusChange={setStatus}
        onTagChange={setTag}
      />

      {isFiltering ? (
        filtered.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="没有符合条件的工具"
            description="试试放宽筛选条件。"
            actionLabel="重置筛选"
            onAction={() => {
              setStatus('all');
              setTag(null);
            }}
          />
        ) : (
          <ToolGrid tools={filtered} />
        )
      ) : (
        <Stack spacing={5}>
          {channelSections.map(({ channel, online, upcoming: upcomingInChannel }) => (
            <Box key={channel.id}>
              <ChannelHeading channel={channel} count={online.length} />
              {online.length > 0 ? (
                <ToolGrid tools={online} />
              ) : (
                <Typography variant="body2" color="var(--muted)" sx={{ mb: 1 }}>
                  该频道暂无已上线工具，研发中 {upcomingInChannel.length} 个。
                </Typography>
              )}

              {upcomingInChannel.length > 0 ? (
                <Box sx={{ mt: online.length > 0 ? 2 : 1.5 }}>
                  <Typography variant="caption" color="var(--muted)">
                    研发中 · {upcomingInChannel.length}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <ToolGrid tools={upcomingInChannel} />
                  </Box>
                </Box>
              ) : null}
            </Box>
          ))}
        </Stack>
      )}
    </Section>
  );
}
