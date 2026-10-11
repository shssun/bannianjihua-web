import type { ReactNode } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

interface EmptyStateProps {
  /** 图标/表情占位 */
  icon?: ReactNode;
  title: string;
  description?: string;
  /** 可选操作按钮文案 */
  actionLabel?: string;
  /** 操作跳转目标 */
  actionTo?: string;
  /** 操作点击回调（与 actionTo 二选一） */
  onAction?: () => void;
}

/**
 * 空/占位状态：用于无数据、工具不存在等场景，避免白屏。
 */
export default function EmptyState({
  icon = '🗂️',
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
}: EmptyStateProps): JSX.Element {
  return (
    <Box
      sx={{
        py: 8,
        px: 2,
        textAlign: 'center',
        border: '1px dashed var(--border)',
        borderRadius: 3,
        bgcolor: 'var(--card)',
      }}
    >
      <Typography sx={{ fontSize: '2.4rem', mb: 1 }} aria-hidden>
        {icon}
      </Typography>
      <Typography variant="h3" sx={{ fontSize: '1.15rem', mb: 0.5 }}>
        {title}
      </Typography>
      {description ? (
        <Typography variant="body2" color="var(--muted)" sx={{ mb: 2 }}>
          {description}
        </Typography>
      ) : null}

      {actionLabel && (actionTo || onAction) ? (
        <Stack direction="row" justifyContent="center">
          <Button
            variant="contained"
            {...(actionTo ? { component: RouterLink, to: actionTo } : { onClick: onAction })}
          >
            {actionLabel}
          </Button>
        </Stack>
      ) : null}
    </Box>
  );
}
