import type { Tool } from '@/types';
import { publicUrl } from '@/lib/paths';

/**
 * 工具注册表（本地静态，唯一真相源）。
 *
 * P0 不走 Supabase；后续如需在线维护再迁移到 tools 表。
 * 分类规则：
 * - 「已上线」 = status === 'online'
 * - 「研发中」 = status in ('planned' | 'developing' | 'paused')
 *
 * 注意：`entry` 这里只写相对 `public/tools/` 的**裸路径**（如 'tools/x.html'），
 * 消费方请通过下面的 `getToolEntryUrl()` 取得带部署 base 前缀的完整 URL。
 */

/** 全部工具（按 order 升序的原始声明）。 */
export const TOOLS: Tool[] = [
  {
    id: 'shuangpin-practice',
    name: '双拼练习',
    description: '搜狗双拼键位练习：实时提示按键与拼音，统计速度与正确率，纯浏览器本地运行。',
    tags: ['输入法', '双拼', '练习'],
    status: 'online',
    runtime: 'client-only',
    entry: 'tools/shuangpin-practice.html',
    cover: '⌨️',
    version: '0.1.0',
    createdAt: '2026-10-11',
    order: 1,
  },
  {
    id: 'md-to-html-reader',
    name: 'Markdown 阅读器',
    description: '把 Markdown 文件夹构建成自包含单文件 HTML 阅读器，双击即用、离线可读。',
    tags: ['阅读器', '离线', 'Markdown'],
    status: 'online',
    runtime: 'client-only',
    entry: 'tools/md-to-html-reader.html',
    cover: '📖',
    version: '0.1.0',
    createdAt: '2025-01-10',
    order: 2,
  },
  {
    id: 'english-dict-reader',
    name: '英语句读器',
    description: '把英文句子清单做成可点词查音标/释义的自包含阅读器，悬停即查、无需联网。',
    tags: ['英语', '离线', '词典'],
    status: 'online',
    runtime: 'client-only',
    entry: 'tools/english-dict-reader.html',
    cover: '🔤',
    version: '0.1.0',
    createdAt: '2025-01-18',
    order: 3,
  },
  {
    id: 'daily-english',
    name: '每日英语跟读',
    description:
      '精听英文口语短视频：逐词高亮、变速循环跟读、录音与原声比对，专攻连读弱读。',
    tags: ['英语', '听力', '口语'],
    status: 'online',
    runtime: 'client-only',
    // 多文件工具（HTML + data.json + zh.json + voices/ + mp4 素材），
    // 由 scripts/sync-daily-english.mjs 从本地工作目录同步进 public/，
    // 目录层级刻意镜像本地，工具内部的相对路径才能原样成立。
    entry: 'tools/daily-english/tool/index.html',
    cover: '🎧',
    version: '0.1.0',
    createdAt: '2026-10-12',
    order: 4,
  },
  {
    id: 'logic-fallacy-cards',
    name: '逻辑谬误卡片',
    description: '公众号长文渲染为深色信息图卡（PNG），用于收藏与速查。',
    tags: ['信息图', '卡片', '认知'],
    status: 'online',
    runtime: 'light-backend',
    entry: 'tools/logic-fallacy-cards.html',
    cover: '🧩',
    version: '0.1.0',
    createdAt: '2025-02-01',
    order: 5,
  },
  {
    id: 'set-theory-cards',
    name: '集合论学习卡片',
    description: '数理基础学习卡片：集合、映射、可数性等核心概念图解。',
    tags: ['数学', '学习', '卡片'],
    status: 'planned',
    runtime: 'client-only',
    cover: '📐',
    eta: '2025-Q4',
    order: 6,
  },
  {
    id: 'intuition-zhika',
    name: '直觉之卡',
    description: '把抽象直觉训练拆成可翻阅的小卡片，建立长期记忆回路。',
    tags: ['认知', '学习', '卡片'],
    status: 'developing',
    runtime: 'client-only',
    cover: '💡',
    eta: '2026-Q1',
    order: 7,
  },
  {
    id: 'markdown-slide',
    name: 'Markdown 幻灯',
    description: '一份 Markdown 直接生成可演示的单文件幻灯片，离线分享。',
    tags: ['演示', '离线', 'Markdown'],
    status: 'planned',
    runtime: 'client-only',
    cover: '📊',
    eta: '2026-Q2',
    order: 8,
  },
];

/** 合法的在线状态集合（用于筛选）。 */
const ONLINE_STATUS = 'online' as const;

/**
 * 按 id 查找工具。
 * @param id 工具 id
 * @returns 匹配的 Tool，未找到返回 undefined
 */
export function getToolById(id: string): Tool | undefined {
  return TOOLS.find((tool) => tool.id === id);
}

/**
 * 取得工具 iframe 的完整访问 URL（带部署 base 前缀）。
 *
 * @param tool 工具条目
 * @returns 可直接用于 iframe `src` / `window.open` 的 URL；
 *          工具无 entry 时回退到 externalUrl，两者都无则返回空串。
 */
export function getToolEntryUrl(tool: Tool): string {
  if (tool.entry) {
    return publicUrl(tool.entry);
  }
  return tool.externalUrl ?? '';
}

/**
 * 获取全部已上线工具（status === 'online'），按 order 升序。
 */
export function getOnlineTools(): Tool[] {
  return TOOLS.filter((tool) => tool.status === ONLINE_STATUS).sort(sortByOrder);
}

/**
 * 获取全部研发中工具（planned | developing | paused），按 order 升序。
 */
export function getUpcomingTools(): Tool[] {
  return TOOLS.filter((tool) => tool.status !== ONLINE_STATUS).sort(sortByOrder);
}

/** 按 order 升序排序（order 缺失时排到最后）。 */
function sortByOrder(a: Tool, b: Tool): number {
  return (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
}

/** 工具状态的中文展示文案。 */
export const TOOL_STATUS_LABEL: Record<Tool['status'], string> = {
  online: '已上线',
  planned: '规划中',
  developing: '开发中',
  paused: '已暂停',
};

/** 工具运行形态的中文展示文案。 */
export const TOOL_RUNTIME_LABEL: Record<Tool['runtime'], string> = {
  'client-only': '浏览器本地',
  'light-backend': '轻后端交互',
};
