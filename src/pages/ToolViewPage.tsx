import { Box, Chip, Stack, Typography } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import type { Tool } from '@/types';
import { getToolById, getToolEntryUrl, TOOL_RUNTIME_LABEL } from '@/data/tools';
import ToolFrame from '@/components/tools/ToolFrame';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import TagChip from '@/components/common/TagChip';

/**
 * 工具页 `/tools/:id`：查注册表 → 渲染 ToolFrame 或友好占位（不白屏）。
 */
export default function ToolViewPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const tool: Tool | undefined = id ? getToolById(id) : undefined;

  // 工具不存在 → 友好占位
  if (!tool) {
    return (
      <Box className="container-page py-10">
        <EmptyState
          icon="🧭"
          title="未找到该工具"
          description="工具可能尚未注册，或链接有误。"
          actionLabel="返回工具箱"
          actionTo="/tools"
        />
      </Box>
    );
  }

  return (
    <Box className="container-page" sx={{ py: 4 }}>
      {/* 面包屑 */}
      <Typography variant="body2" color="var(--muted)" sx={{ mb: 2 }}>
        <Box
          component={RouterLink}
          to="/tools"
          sx={{ color: 'inherit', '&:hover': { color: 'var(--primary)' } }}
        >
          工具箱
        </Box>{' '}
        / {tool.name}
      </Typography>

      {/* 工具头部 */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '1.6rem', md: '2rem' } }}>
              {tool.cover ?? '🧰'} {tool.name}
            </Typography>
            <StatusBadge status={tool.status} size="medium" />
          </Stack>
          <Typography variant="body2" color="var(--muted)" sx={{ maxWidth: 720 }}>
            {tool.description}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
            <Chip
              label={TOOL_RUNTIME_LABEL[tool.runtime]}
              size="small"
              variant="outlined"
              sx={{ borderColor: 'var(--border)' }}
            />
            {tool.version ? (
              <Chip
                label={`v${tool.version}`}
                size="small"
                variant="outlined"
                sx={{ borderColor: 'var(--border)' }}
              />
            ) : null}
            {tool.tags.map((tag) => (
              <TagChip key={tag} label={tag} />
            ))}
          </Stack>
        </Box>
      </Stack>

      {/* 工具容器 / 占位：entry URL 需带部署 base 前缀（见 lib/paths.ts） */}
      {tool.entry ? (
        <ToolFrame src={getToolEntryUrl(tool)} title={tool.name} />
      ) : (
        <EmptyState
          icon="🚧"
          title="该工具尚未接入可运行产物"
          description={
            tool.status === 'online'
              ? '工具仍在接入中，请稍后再来。'
              : '该工具仍在研发中，敬请期待。'
          }
          actionLabel="返回工具箱"
          actionTo="/tools"
        />
      )}
    </Box>
  );
}
