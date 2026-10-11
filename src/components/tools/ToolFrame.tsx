import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useThemeMode } from '@/contexts/ThemeContext';
import {
  clampFrameHeight,
  isResizeMessage,
  postThemeToFrame,
} from '@/lib/postMessage';
import LoadingState from '@/components/common/LoadingState';

interface ToolFrameProps {
  /** iframe 指向的静态 HTML 路径 */
  src: string;
  /** 工具名（用于 a11y 与提示） */
  title: string;
}

/** 加载超时：3 秒未收到 onLoad → 显示错误态兜底。 */
const LOAD_TIMEOUT_MS = 3000;

/**
 * 工具 iframe 容器。
 *
 * 职责：
 * - sandbox 隔离加载单文件工具；
 * - 加载态 / 错误态（3s 超时）；
 * - postMessage 主题同步（mode 变化即时广播）；
 * - postMessage 高度自适应（含上下限夹取）；
 * - 全屏（requestFullscreen）与新标签打开兜底。
 */
export default function ToolFrame({ src, title }: ToolFrameProps): JSX.Element {
  const { mode } = useThemeMode();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [timedOut, setTimedOut] = useState<boolean>(false);
  const [height, setHeight] = useState<number>(480);
  /** 通过 key 重挂载 iframe 实现「重新加载」。 */
  const [reloadKey, setReloadKey] = useState<number>(0);

  /** 向 iframe 广播当前主题（加载完成后 & 主题变化时）。 */
  const broadcastTheme = useCallback((): void => {
    const target = iframeRef.current?.contentWindow ?? null;
    postThemeToFrame(target, mode);
  }, [mode]);

  /** 监听工具上报的高度消息。 */
  useEffect(() => {
    function handleMessage(event: MessageEvent): void {
      // 仅处理来自本 iframe 的消息
      if (iframeRef.current && event.source !== iframeRef.current.contentWindow) {
        return;
      }
      if (isResizeMessage(event.data)) {
        setHeight(clampFrameHeight(event.data.height));
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  /** 主题变化时即时广播。 */
  useEffect(() => {
    if (loaded) {
      broadcastTheme();
    }
  }, [mode, loaded, broadcastTheme]);

  /** 加载超时兜底。 */
  useEffect(() => {
    if (loaded) {
      return;
    }
    const timer = window.setTimeout(() => {
      setTimedOut(true);
    }, LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [loaded, reloadKey]);

  const handleLoad = (): void => {
    setLoaded(true);
    setTimedOut(false);
    broadcastTheme();
  };

  const handleRetry = (): void => {
    setLoaded(false);
    setTimedOut(false);
    setReloadKey((prev) => prev + 1);
  };

  const handleFullscreen = (): void => {
    const node = iframeRef.current;
    if (node && typeof node.requestFullscreen === 'function') {
      void node.requestFullscreen().catch(() => {
        /* 用户拒绝 / 不支持时静默 */
      });
    }
  };

  const handleOpenNewTab = (): void => {
    window.open(src, '_blank', 'noopener,noreferrer');
  };

  return (
    <Box>
      {/* 工具操作条 */}
      <Stack
        direction="row"
        spacing={1}
        justifyContent="flex-end"
        sx={{ mb: 1.5 }}
        flexWrap="wrap"
        useFlexGap
      >
        <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={handleRetry}>
          重新加载
        </Button>
        <Button size="small" variant="outlined" startIcon={<FullscreenIcon />} onClick={handleFullscreen}>
          全屏
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<OpenInNewIcon />}
          onClick={handleOpenNewTab}
        >
          新标签打开
        </Button>
      </Stack>

      {/* 错误/超时兜底 */}
      {timedOut && !loaded ? (
        <Alert
          severity="warning"
          sx={{ mb: 1.5 }}
          action={
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={handleRetry}>
                重试
              </Button>
              <Button size="small" onClick={handleOpenNewTab}>
                新标签打开
              </Button>
            </Stack>
          }
        >
          <Typography variant="body2">
            工具加载超时或加载失败。你可以重试，或在新标签中直接打开该工具。
          </Typography>
        </Alert>
      ) : null}

      {/* 加载态覆盖层 */}
      {!loaded ? (
        <Box className="surface-card" sx={{ mb: -1 }}>
          <LoadingState label="正在加载工具…" />
        </Box>
      ) : null}

      {/* iframe 本体 */}
      <Box
        className="surface-card"
        sx={{
          overflow: 'hidden',
          display: loaded ? 'block' : 'none',
          bgcolor: 'var(--card)',
        }}
      >
        <iframe
          key={reloadKey}
          ref={iframeRef}
          src={src}
          title={title}
          onLoad={handleLoad}
          sandbox="allow-scripts allow-same-origin allow-downloads allow-popups"
          style={{
            width: '100%',
            height: `${height}px`,
            border: 'none',
            display: 'block',
            backgroundColor: 'transparent',
          }}
        />
      </Box>

      <Typography variant="caption" color="var(--muted)" sx={{ display: 'block', mt: 1.5 }}>
        该工具在 iframe 沙箱中本地运行，与主站样式隔离；如功能受限可点击「新标签打开」。
      </Typography>
    </Box>
  );
}
