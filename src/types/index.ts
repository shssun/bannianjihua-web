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
  /** 唯一标识，用作路由 /tools/:id；同时等于工具目录名 */
  id: string;
  /** 工具名 */
  name: string;
  /**
   * 所属频道 id（二级目录名），对应 src/data/channels.ts 的 Channel.id。
   *
   * **必须与工具注册表文件所在目录名、以及工具产物目录名一致。**
   * 例：文件 `src/data/tools/english/dict-reader.ts` → `channel: 'english'`。
   * 构建期 `scripts/check-tools.mjs` 会强制校验这一点。
   */
  channel: string;
  /** 一句话描述（卡片展示） */
  description: string;
  /** 标签，如 ['阅读器', '离线', 'Markdown'] */
  tags: string[];
  /**
   * 所属「集合」id 列表（**多对多**，可选）。
   *
   * **频道 vs 集合是两个正交维度，不要混用**：
   * - `channel` = **科目维度**，**物理唯一**（等于工具注册表所在目录名与产物目录名，
   *   由 `scripts/check-tools.mjs` 强制校验）→ 回答「在哪个学科下看」；
   * - `collections` = **来源 / 主题维度**，**虚拟、多对多** → 回答「这东西从哪来的」。
   *
   * 典型场景：把某本书的方法做成工具时，它既属于「英语」频道，
   * 又属于「书籍」集合和「那一本书」的集合。物理上仍然只存在一份。
   *
   * 例：`collections: ['books', 'dragon-english-basic100']`
   *
   * id 取值见 `src/data/collections.ts`；构建期会校验每个 id 存在且数组内不重复。
   * 一本书产出的多个工具共享同一个「书」集合，从而天然表达「一本书 → N 个工具」。
   */
  collections?: string[];
  /** 状态：用于首页「已上线 / 研发中」分类 */
  status: ToolStatus;
  /** 运行形态 */
  runtime: ToolRuntime;
  /**
   * 工具产物的静态路径（相对 `public/` 的裸路径，不带前导斜杠），
   * 如 `'tools/general/md-to-html-reader/index.html'`。
   *
   * 消费方请用 `getToolEntryUrl()` 取得带部署 base 前缀的完整 URL。
   * 该字段必须写**完整显式路径**，任何地方都不许用 channel/id 去「拼」路径 ——
   * 这样目录层级变化对代码完全透明。
   */
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
