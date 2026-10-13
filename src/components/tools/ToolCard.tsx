import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Link as RouterLink } from 'react-router-dom';
import type { Tool } from '@/types';
import { TOOL_RUNTIME_LABEL, getToolEntryUrl } from '@/data/tools';
import { getChannelById } from '@/data/channels';
import StatusBadge from '@/components/common/StatusBadge';
import TagChip from '@/components/common/TagChip';

interface ToolCardProps {
  tool: Tool;
}

/**
 * 工具卡片：封面/图标 + 名称 + 一句话描述 + 标签 + 状态徽章 + 打开按钮。
 *
 * 「打开」用真实 <a> 链接新标签页打开工具产物（而非 window.open），
 * 可避免被浏览器弹窗拦截，且中键/右键「新标签打开」正常可用。
 */
export default function ToolCard({ tool }: ToolCardProps): JSX.Element {
  const canOpen = tool.status === 'online';
  const toolUrl = getToolEntryUrl(tool);
  const channel = getChannelById(tool.channel);

  return (
    <Box
      className="surface-card"
      sx={{
        p: 2.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        '&:hover': { borderColor: 'var(--primary)' },
      }}
    >
      {/* 头部：图标 + 状态 */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            bgcolor: 'var(--primary-soft)',
          }}
          aria-hidden
        >
          {tool.cover ?? '🧰'}
        </Box>
        <StatusBadge status={tool.status} />
      </Stack>

      {/* 名称 + 描述 */}
      <Box sx={{ flex: 1 }}>
        <Typography variant="h3" sx={{ fontSize: '1.1rem', mb: 0.5 }}>
          {tool.name}
        </Typography>
        <Typography variant="body2" color="var(--muted)" sx={{ lineHeight: 1.6 }}>
          {tool.description}
        </Typography>
      </Box>

      {/* 元信息：频道 + runtime + 预计时间 */}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {channel ? (
          <Chip
            label={`${channel.cover} ${channel.name}`}
            size="small"
            variant="outlined"
            clickable
            component={RouterLink}
            to={`/tools/channel/${channel.id}`}
            sx={{ borderColor: 'var(--border)' }}
          />
        ) : null}
        <Chip
          label={TOOL_RUNTIME_LABEL[tool.runtime]}
          size="small"
          variant="outlined"
          sx={{ borderColor: 'var(--border)' }}
        />
        {tool.eta ? (
          <Chip
            label={`预计 ${tool.eta}`}
            size="small"
            variant="outlined"
            sx={{ borderColor: 'var(--border)' }}
          />
        ) : null}
      </Stack>

      {/* 标签 */}
      {tool.tags.length > 0 ? (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          {tool.tags.map((tag) => (
            <TagChip key={tag} label={tag} />
          ))}
        </Stack>
      ) : null}

      {/* 打开按钮：新标签页直接打开工具（真实 <a> 链接，避免弹窗拦截） */}
      <Button
        variant={canOpen ? 'contained' : 'outlined'}
        size="small"
        disabled={!canOpen}
        endIcon={canOpen ? <OpenInNewIcon fontSize="small" /> : undefined}
        component={canOpen ? 'a' : 'button'}
        href={canOpen ? toolUrl : undefined}
        target={canOpen ? '_blank' : undefined}
        rel={canOpen ? 'noopener noreferrer' : undefined}
        sx={{ alignSelf: 'flex-start' }}
      >
        {canOpen ? '打开' : '敬请期待'}
      </Button>
    </Box>
  );
}
