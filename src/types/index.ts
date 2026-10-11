/**
 * 全局 TypeScript 类型定义（跨文件契约的唯一真相源）。
 *
 * 命名规范：类型 PascalCase；常量 UPPER_SNAKE。
 */

// ---------------- 工具 ----------------

/** 工具状态：online=已上线；planned/developing/paused=研发中。 */
export type ToolStatus = 'online' | 'planned' | 'developing' | 'paused';

/** 工具运行形态：默认 100% 浏览器端；依赖非浏览器能力的标 light-backend。 */
export type ToolRuntime = 'client-only' | 'light-backend';

/** 工具注册表条目。 */
export interface Tool {
  /** 唯一标识，用作路由 /tools/:id */
  id: string;
  /** 工具名 */
  name: string;
  /** 一句话描述（卡片展示） */
  description: string;
  /** 标签，如 ['阅读器', '离线', 'Markdown'] */
  tags: string[];
  /** 状态：用于首页「已上线 / 研发中」分类 */
  status: ToolStatus;
  /** 运行形态 */
  runtime: ToolRuntime;
  /** iframe 指向的静态 HTML 路径，如 '/tools/md-to-html-reader.html' */
  entry?: string;
  /** 外部兜底跳转（新标签打开） */
  externalUrl?: string;
  /** 卡片封面 / 图标（emoji 或图片 URL） */
  cover?: string;
  /** 版本号 */
  version?: string;
  /** 创建时间（ISO） */
  createdAt?: string;
  /** 研发中工具的预计时间，如 '2025-Q4' */
  eta?: string;
  /** 手动排序（升序） */
  order?: number;
}

// ---------------- 文章 ----------------

/** 文章实体（前端 camelCase，DB 为 snake_case，转换在 service 层完成）。 */
export interface Post {
  /** uuid */
  id: string;
  /** 唯一 slug */
  slug: string;
  title: string;
  excerpt: string;
  /** 对应 DB content_md */
  contentMd: string;
  tags: string[];
  cover?: string;
  published: boolean;
  /** 发布时间（ISO） */
  publishedAt: string;
  /** 创建时间（ISO） */
  createdAt: string;
}

/** 文章摘要（列表展示用）。 */
export type PostSummary = Pick<
  Post,
  'id' | 'slug' | 'title' | 'excerpt' | 'tags' | 'cover' | 'publishedAt'
>;

// ---------------- 留言 ----------------

/** 留言实体。 */
export interface Message {
  id: string;
  /** 昵称，<= 30 */
  nickname: string;
  /** 内容，1..500 */
  content: string;
  /** 发布时间（ISO） */
  createdAt: string;
  /** 可见状态 */
  status: 'visible' | 'hidden';
}

/** 留言提交入参。 */
export interface MessageInput {
  nickname: string;
  content: string;
  /** 蜜罐字段，非空即判机器人并静默丢弃 */
  honeypot?: string;
  /** 可选：Turnstile token */
  turnstileToken?: string;
}

// ---------------- 统一返回 ----------------

/**
 * 统一 service 返回结构。所有 service 方法**绝不抛异常**，
 * 失败/未配置时通过 `error` / `fallback` 表达。
 */
export interface APIResult<T> {
  data: T | null;
  error: string | null;
  /** 数据是否来自本地兜底（用于 UI 标注「演示数据」） */
  fallback?: boolean;
}

// ---------------- 主题 ----------------

/** 主题模式。 */
export type ThemeMode = 'light' | 'dark';
