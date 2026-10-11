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
  /** 构建子路径前缀，默认 '/bannianjihua-web/'（GitHub Pages 项目站点） */
  readonly BASE_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
