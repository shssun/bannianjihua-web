import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { Tool } from '@/types';
import { TOOL_RUNTIME_LABEL } from '@/data/tools';
import StatusBadge from '@/components/common/StatusBadge';
import TagChip from '@/components/common/TagChip';

interface ToolCardProps {
  tool: Tool;
  /** 点击「打开」回调（通常为路由跳转） */
  onOpen: (tool: Tool) => void;
}

/**
 * 工具卡片：封面/图标 + 名称 + 一句话描述 + 标签 + 状态徽章 + 打开按钮。
 */
export default function ToolCard({ tool, onOpen }: ToolCardProps): JSX.Element {
  const canOpen = tool.status === 'online';

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

      {/* 元信息：runtime + 预计时间 */}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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

      {/* 打开按钮 */}
      <Button
        variant={canOpen ? 'contained' : 'outlined'}
        size="small"
        disabled={!canOpen}
        endIcon={canOpen ? <OpenInNewIcon fontSize="small" /> : undefined}
        onClick={() => onOpen(tool)}
        sx={{ alignSelf: 'flex-start' }}
      >
        {canOpen ? '打开' : '敬请期待'}
      </Button>
    </Box>
  );
}
