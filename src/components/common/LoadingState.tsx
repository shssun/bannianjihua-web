import { Box, CircularProgress, Skeleton, Stack } from '@mui/material';

interface LoadingStateProps {
  /** 展示形态：spinner=居中转圈；skeleton=骨架屏 */
  variant?: 'spinner' | 'skeleton';
  /** 骨架屏行数 */
  rows?: number;
  /** 提示文案 */
  label?: string;
}

/**
 * 加载态组件：spinner 或骨架屏。
 */
export default function LoadingState({
  variant = 'spinner',
  rows = 3,
  label = '加载中…',
}: LoadingStateProps): JSX.Element {
  if (variant === 'skeleton') {
    return (
      <Stack spacing={1.5} sx={{ py: 2 }}>
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={72} />
        ))}
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        py: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
        color: 'var(--muted)',
      }}
      role="status"
      aria-live="polite"
    >
      <CircularProgress size={32} />
      <Box component="span">{label}</Box>
    </Box>
  );
}
