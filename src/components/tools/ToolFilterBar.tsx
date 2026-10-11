import { Box, Stack, Typography } from '@mui/material';
import type { Tool } from '@/types';
import TagChip from '@/components/common/TagChip';

/** 状态筛选维度。 */
export type StatusFilter = 'all' | 'online' | 'upcoming';

interface ToolFilterBarProps {
  /** 全部标签（去重） */
  tags: string[];
  /** 当前状态筛选 */
  status: StatusFilter;
  /** 当前标签筛选（null 表示不限） */
  tag: string | null;
  /** 状态变化回调 */
  onStatusChange: (status: StatusFilter) => void;
  /** 标签变化回调 */
  onTagChange: (tag: string | null) => void;
}

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'online', label: '已上线' },
  { value: 'upcoming', label: '研发中' },
];

/**
 * 工具筛选栏：状态筛选 + 标签筛选。
 */
export default function ToolFilterBar({
  tags,
  status,
  tag,
  onStatusChange,
  onTagChange,
}: ToolFilterBarProps): JSX.Element {
  return (
    <Stack spacing={2} sx={{ mb: 3 }}>
      {/* 状态筛选 */}
      <Box>
        <Typography variant="caption" color="var(--muted)" sx={{ display: 'block', mb: 0.75 }}>
          状态
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {STATUS_OPTIONS.map((option) => (
            <TagChip
              key={option.value}
              label={option.label}
              size="medium"
              clickable
              selected={status === option.value}
              onClick={() => onStatusChange(option.value)}
            />
          ))}
        </Stack>
      </Box>

      {/* 标签筛选 */}
      {tags.length > 0 ? (
        <Box>
          <Typography variant="caption" color="var(--muted)" sx={{ display: 'block', mb: 0.75 }}>
            标签
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <TagChip
              label="不限"
              size="medium"
              clickable
              selected={tag === null}
              onClick={() => onTagChange(null)}
            />
            {tags.map((item) => (
              <TagChip
                key={item}
                label={item}
                size="medium"
                clickable
                selected={tag === item}
                onClick={() => onTagChange(item)}
              />
            ))}
          </Stack>
        </Box>
      ) : null}
    </Stack>
  );
}

/** 从工具列表提取去重标签集合。 */
export function collectTags(tools: Tool[]): string[] {
  const set = new Set<string>();
  tools.forEach((tool) => tool.tags.forEach((tag) => set.add(tag)));
  return Array.from(set).sort((a: string, b: string) => a.localeCompare(b, 'zh-Hans-CN'));
}
