import { Chip } from '@mui/material';
import type { ToolStatus } from '@/types';
import { TOOL_STATUS_LABEL } from '@/data/tools';

interface StatusBadgeProps {
  status: ToolStatus;
  size?: 'small' | 'medium';
}

/** 状态 → MUI Chip 颜色映射。 */
const STATUS_COLOR: Record<ToolStatus, 'success' | 'info' | 'warning' | 'default'> = {
  online: 'success',
  developing: 'info',
  planned: 'default',
  paused: 'warning',
};

/**
 * 状态徽章：展示工具状态（已上线 / 研发中 等）。
 */
export default function StatusBadge({ status, size = 'small' }: StatusBadgeProps): JSX.Element {
  return (
    <Chip
      label={TOOL_STATUS_LABEL[status]}
      color={STATUS_COLOR[status]}
      size={size}
      variant={status === 'online' ? 'filled' : 'outlined'}
      sx={{ fontWeight: 600 }}
    />
  );
}
