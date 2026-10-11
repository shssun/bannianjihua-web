/// <reference types="vite/client" />

/**
 * import.meta.env 环境变量类型声明。
 * 全部变量均为可选，缺失时进入降级路径而非崩溃。
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  /** 字符串布尔："true" / "false"，默认 "false" */
  readonly VITE_TURNSTILE_ENABLED?: string;
  readonly BASE_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
