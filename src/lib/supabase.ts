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

/** Supabase 客户端单例；未配置时为 null。 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;
