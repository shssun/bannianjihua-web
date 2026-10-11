import type { ThemeMode } from '@/types';

/**
 * iframe postMessage 协议（冻结）。
 *
 * - 主站 → 工具：{ type: 'theme', value: 'light' | 'dark' }
 * - 工具 → 主站：{ type: 'resize', height: number }
 *
 * 通信一律 window.postMessage(msg, '*')；接收端必须校验 msg.type 与数值合法性。
 */

/** 消息类型常量。 */
export const MSG_THEME = 'theme';
export const MSG_RESIZE = 'resize';

/** 主站 → 工具：主题消息。 */
export interface ThemeMessage {
  type: typeof MSG_THEME;
  value: ThemeMode;
}

/** 工具 → 主站：高度消息。 */
export interface ResizeMessage {
  type: typeof MSG_RESIZE;
  height: number;
}

/** 高度下限（避免工具上报过小导致内容被裁切）。 */
export const MIN_FRAME_HEIGHT = 320;

/** 高度上限（避免异常上报撑爆页面）。 */
export const MAX_FRAME_HEIGHT = 20000;

/** 判定是否为合法的 resize 消息。 */
export function isResizeMessage(data: unknown): data is ResizeMessage {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const candidate = data as Record<string, unknown>;
  return candidate.type === MSG_RESIZE && Number.isFinite(candidate.height);
}

/**
 * 向 iframe 发送主题消息。
 * @param target iframe 的 contentWindow
 * @param mode 当前主题模式
 */
export function postThemeToFrame(target: Window | null, mode: ThemeMode): void {
  if (!target) {
    return;
  }
  const message: ThemeMessage = { type: MSG_THEME, value: mode };
  try {
    target.postMessage(message, '*');
  } catch {
    /* 跨源/已卸载时静默失败 */
  }
}

/**
 * 将上报的高度夹取到合法区间。
 * @param height 原始高度
 */
export function clampFrameHeight(height: number): number {
  const normalized = Math.round(height);
  if (normalized < MIN_FRAME_HEIGHT) {
    return MIN_FRAME_HEIGHT;
  }
  if (normalized > MAX_FRAME_HEIGHT) {
    return MAX_FRAME_HEIGHT;
  }
  return normalized;
}
