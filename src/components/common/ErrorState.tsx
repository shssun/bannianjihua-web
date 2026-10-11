import { Alert, AlertTitle, Button, Stack } from '@mui/material';
import { BACKEND_NOT_CONFIGURED } from '@/lib/errors';

interface ErrorStateProps {
  /** 错误/提示文案 */
  message?: string;
  /** 标题（默认「提示」） */
  title?: string;
  /** 是否展示「后端未配置」的前置说明 */
  hintBackend?: boolean;
  /** 可选重试按钮 */
  onRetry?: () => void;
  /** 可选重新加载按钮 */
  retryLabel?: string;
}

/**
 * 错误/降级提示组件。
 * 无后端时用于明确告知「后端未配置」，并保留页面其他内容正常渲染。
 */
export default function ErrorState({
  message,
  title = '提示',
  hintBackend = false,
  onRetry,
  retryLabel = '重试',
}: ErrorStateProps): JSX.Element {
  const description = message ?? (hintBackend ? BACKEND_NOT_CONFIGURED : '出现了一些问题。');

  return (
    <Alert severity={hintBackend ? 'info' : 'warning'} sx={{ borderRadius: 2 }}>
      <AlertTitle>{title}</AlertTitle>
      {description}
      {onRetry ? (
        <Stack direction="row" sx={{ mt: 1 }}>
          <Button size="small" variant="outlined" onClick={onRetry}>
            {retryLabel}
          </Button>
        </Stack>
      ) : null}
    </Alert>
  );
}
