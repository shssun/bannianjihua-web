/**
 * 通用工具函数：日期格式化、className 合并、安全 localStorage。
 */

/** localStorage 命名空间前缀。 */
export const STORAGE_PREFIX = 'bannianjihua:';

/**
 * 合并 className（过滤 falsy 值）。
 * @example cn('a', cond && 'b', undefined) // => 'a b'
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * 格式化 ISO 时间为中文日期字符串。
 * @param iso ISO 时间字符串，可为空
 * @param withTime 是否包含时分
 * @returns 如 '2025年03月08日'
 */
export function formatDate(iso?: string | null, withTime = false): string {
  if (!iso) {
    return '—';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  if (!withTime) {
    return `${y}年${m}月${d}日`;
  }
  const hh = `${date.getHours()}`.padStart(2, '0');
  const mm = `${date.getMinutes()}`.padStart(2, '0');
  return `${y}年${m}月${d}日 ${hh}:${mm}`;
}

/** 读取 localStorage（安全，异常时返回 fallback）。 */
export function safeGetItem(key: string, fallback: string | null = null): string | null {
  try {
    if (typeof window === 'undefined') {
      return fallback;
    }
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

/** 写入 localStorage（安全，异常时静默失败）。 */
export function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
  } catch {
    /* 隐私模式 / 配额满时静默失败 */
  }
}

/**
 * 生成简易唯一 ID（不依赖 crypto，降级安全）。
 * 优先使用 crypto.randomUUID。
 */
export function uuid(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* 忽略，走降级分支 */
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** 截断文本，超出长度追加省略号。 */
export function truncate(text: string, max = 120): string {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max).trimEnd()}…`;
}
