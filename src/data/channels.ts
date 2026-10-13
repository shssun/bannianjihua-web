/**
 * 频道定义（工具树的二级目录 = 学科大类）。
 *
 * 层级模型（三级，深度上限 3，`public/tools/` 本身不计入）：
 *   L1 容器：`public/tools/`
 *   L2 频道：`english` / `math` / `cognition` / `general`   ← 本文件
 *   L3 工具：具体工具的英文 kebab slug（必须体现适用范围）
 *
 * 频道的增删**极少发生**，因此允许保留这一个汇总文件；
 * 而「工具」必须一工具一文件（见 `src/data/tools/index.ts`），以杜绝并行冲突。
 *
 * 工具数量等派生统计请在页面里计算，不要在本文件里存冗余字段。
 */

/** 频道（学科大类）。 */
export interface Channel {
  /** 频道 id，同时也是 L2 目录名，如 'english'（小写英文单词） */
  id: string;
  /** 频道中文名，如 '英语' */
  name: string;
  /** 封面/图标（emoji） */
  cover: string;
  /** 一句话描述（频道页副标题） */
  description: string;
  /** 展示顺序（升序） */
  order: number;
}

/** 全部频道（按 order 升序的原始声明）。 */
export const CHANNELS: Channel[] = [
  { id: 'english', name: '英语', cover: '🔤', description: '听力、跟读、词汇', order: 1 },
  { id: 'math', name: '数学', cover: '📐', description: '数理基础概念', order: 2 },
  { id: 'cognition', name: '认知', cover: '🧩', description: '思维与逻辑训练', order: 3 },
  { id: 'general', name: '通用', cover: '🧰', description: '不属于学科的实用小工具', order: 9 },
];

/**
 * 按 id 查找频道。
 * @param id 频道 id
 * @returns 匹配的 Channel，未找到返回 undefined
 */
export function getChannelById(id: string): Channel | undefined {
  return CHANNELS.find((channel) => channel.id === id);
}

/** 按 order 升序排序后的频道列表（返回副本，避免污染源数组）。 */
export function getSortedChannels(): Channel[] {
  return [...CHANNELS].sort((a, b) => a.order - b.order);
}
