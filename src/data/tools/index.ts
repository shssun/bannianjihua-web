import type { Tool, ICAPLevel } from '@/types';
import { publicUrl } from '@/lib/paths';

/**
 * 工具注册表汇总器（**自动收集**，几乎不需要改动）。
 *
 * 设计目标：新增一个工具 = **只新建文件，不改任何既有文件**，
 * 从而让多个工具可以并行开发而不会在同一个数组里产生 merge 冲突。
 *
 * 收集规则：用 Vite 的 glob 导入收集「<频道目录>/<工具文件>.ts」这一层级的模块。
 * 模式只匹配「一层目录下的一层文件」，因此：
 * - 不会误收本文件 index.ts，也不会收 src/data/channels.ts；
 * - 目录结构本身就是过滤器 —— 频道目录名 = 工具的 `channel`，文件名 = 工具 `id`。
 *
 * 每个工具文件形如：
 * ```ts
 * import type { Tool } from '@/types';
 * const tool: Tool = { id: 'dict-reader', channel: 'english', ... };
 * export default tool;
 * ```
 *
 * ⚠️ 约束：工具文件里的对象必须是**纯字面量**（字符串/数字/布尔/数组），
 * 不要写函数、模板字符串或变量引用 —— 构建期校验脚本
 * `scripts/check-tools.mjs` 会直接解析该字面量。
 */

/** 自动收集 `src/data/tools/<channel>/<tool>.ts` 的 default 导出。 */
const modules = import.meta.glob<{ default: Tool }>('./*/*.ts', { eager: true });

/** 全部工具（未排序；需要顺序时使用下方查询函数）。 */
export const TOOLS: Tool[] = Object.values(modules).map((mod) => mod.default);

/** 合法的「已上线」状态。 */
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
 * 获取某个频道下的全部工具，按 order 升序。
 * @param channelId 频道 id（对应 src/data/channels.ts 的 Channel.id）
 */
export function getToolsByChannel(channelId: string): Tool[] {
  return TOOLS.filter((tool) => tool.channel === channelId).sort(sortByOrder);
}

/**
 * 获取某个集合下的全部工具，按 order 升序。
 *
 * 集合是**来源 / 主题**维度的虚拟归口（见 `src/data/collections.ts`），
 * 与物理唯一的 `channel` 正交 —— 同一个工具可以同时出现在
 * 它的频道页和任意多个集合页里，物理上只有一份产物。
 *
 * @param collectionId 集合 id（对应 src/data/collections.ts 的 Collection.id）
 */
export function getToolsByCollection(collectionId: string): Tool[] {
  return TOOLS.filter((tool) => tool.collections?.includes(collectionId)).sort(sortByOrder);
}

/**
 * 获取某个 ICAP 认知层级下的全部工具，按 order 升序。
 *
 * ICAP 是**认知投入**维度的虚拟归口（见 `src/data/icap.ts`），
 * 与物理唯一的 `channel`、来源维度的 `collections` 均正交。
 *
 * ⚠️ 命中的是工具的**设计意图**（`Tool.icap`），不是学习者的实际层级 ——
 * 实际层级取决于学习者是否真的产出了「超出所给材料之物」。
 *
 * @param level ICAP 层级 id（对应 src/data/icap.ts 的 IcapLevel.id）
 */
export function getToolsByIcap(level: ICAPLevel): Tool[] {
  return TOOLS.filter((tool) => tool.icap?.includes(level)).sort(sortByOrder);
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

/**
 * 取得工具产物的完整访问 URL（带部署 base 前缀）。
 *
 * @param tool 工具条目
 * @returns 可直接用于 `<a href>` / `window.open` 的 URL；
 *          工具无 entry 时回退到 externalUrl，两者都无则返回空串。
 */
export function getToolEntryUrl(tool: Tool): string {
  if (tool.entry) {
    return publicUrl(tool.entry);
  }
  return tool.externalUrl ?? '';
}
