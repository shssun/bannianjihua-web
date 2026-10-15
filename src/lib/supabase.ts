import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase 客户端单例 + 配置守卫。
 *
 * 设计要点：
 * - 仅在**此处**创建一次客户端；任何组件 / service 不得自行 createClient。
 * - 未配置 env 时 `supabase === null`，`isSupabaseConfigured === false`，
 *   全站据此进入本地 fallback 降级路径，**绝不崩溃**。
 */

const url: string | undefined = import.meta.env.VITE_SUPABASE_URL;
const anonKey: string | undefined = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** 是否已配置 Supabase（唯一降级开关）。 */
export const isSupabaseConfigured: boolean = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  // T-026：降级必须可识别。env 缺失时在控制台明确告警，
  // 与 UI 上的「未配置 / 演示数据」提示呼应，避免静默兜底。
  console.warn(
    '[supabase] 未配置 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY：' +
      '留言板等后端功能将使用本地演示数据（fallback），提交不会落库。',
  );
}

/** Supabase 客户端单例；未配置时为 null。 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;
