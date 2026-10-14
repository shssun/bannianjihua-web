/**
 * 构建期注册表读取工具。
 *
 * 前端注册表是 TS + `import.meta.glob`（Vite 专有），Node 构建脚本无法直接 import。
 * 因此这里用「目录扫描 + 纯字面量解析」的方式读取同一份真相源：
 *   - 扫描 `src/data/tools/<channel>/<tool>.ts`
 *   - 目录名 = `channel`，文件名 = `id`
 *   - 解析文件内的对象字面量（要求是纯字面量，见 `src/data/tools/index.ts` 的约束）
 *
 * 这样脚本与前端读到的是同一批文件，不会出现两份数据源。
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * 从工具注册表文件源码中解析出对象字面量。
 *
 * 期望形如：
 *   import type { Tool } from '@/types';
 *   const tool: Tool = { id: 'x', ... };
 *   export default tool;
 *
 * @param {string} text 文件源码
 * @returns {Record<string, unknown>} 工具对象
 */
export function parseToolLiteral(text) {
  const marker = text.lastIndexOf('export default');
  if (marker === -1) {
    throw new Error('缺少 `export default` 导出');
  }
  // 对象字面量的右花括号：`export default` 之前的最后一个 `}`
  const end = text.lastIndexOf('}', marker);
  if (end === -1) {
    throw new Error('找不到对象字面量的结尾 `}`');
  }
  // 左花括号：`end` 之前的最后一个 `{`。
  // 因为工具对象是**扁平字面量**（数组用 `[]`、无嵌套对象），
  // 对象内部不会再出现 `{`，所以这就是对象的起始花括号
  // （不会误取到上面 `import type { Tool }` 的括号）。
  const start = text.lastIndexOf('{', end);
  if (start === -1 || end < start) {
    throw new Error('找不到对象字面量');
  }
  const literal = text.slice(start, end + 1);
  // 对象必须是纯字面量（字符串/数字/布尔/数组），因此可用 Function 安全求值，
  // 不会执行任何外部引用或副作用。
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${literal});`)();
}

/**
 * 加载全部工具注册表条目。
 * @param {string} repoRoot 仓库根目录
 * @returns {Array<{ channel: string; id: string; file: string; object: Record<string, unknown> }>}
 */
export function loadToolRegistry(repoRoot) {
  const toolsDir = join(repoRoot, 'src', 'data', 'tools');
  if (!existsSync(toolsDir)) {
    return [];
  }

  const result = [];
  for (const channelEntry of readdirSync(toolsDir, { withFileTypes: true })) {
    if (!channelEntry.isDirectory()) {
      continue;
    }
    const channelDir = join(toolsDir, channelEntry.name);
    for (const fileEntry of readdirSync(channelDir, { withFileTypes: true })) {
      if (!fileEntry.isFile() || !fileEntry.name.endsWith('.ts')) {
        continue;
      }
      const file = join(channelDir, fileEntry.name);
      const id = fileEntry.name.replace(/\.ts$/, '');
      let object;
      try {
        object = parseToolLiteral(readFileSync(file, 'utf8'));
      } catch (error) {
        throw new Error(`解析工具注册表文件失败：${file}\n  ${error.message}`);
      }
      result.push({ channel: channelEntry.name, id, file, object });
    }
  }

  return result.sort((a, b) =>
    `${a.channel}/${a.id}`.localeCompare(`${b.channel}/${b.id}`),
  );
}

/**
 * 从一个「声明式数组文件」里读出全部 `id: '...'` 字面量。
 *
 * 用于 `channels.ts` / `collections.ts` —— 它们都是「一个汇总文件里放一个
 * 对象数组」，且**极少变更**，所以不值得为它们做结构化解析。
 *
 * 只匹配**带单引号的 id 字面量**，因此：
 * - interface 里的 `id: string`（不带引号）不会被误收；
 * - 反向引用字段（如集合的 `parentId: 'books'`）不会被误收 ——
 *   `\b` 要求 `id` 前面是词边界，而 `parentId` 里 `I` 前是词字符 `t`；
 *   且正则大小写敏感，`Id` 也不等于 `id`。
 *
 * @param {string} file 文件绝对路径
 * @returns {string[]} 声明顺序的 id 列表
 */
function loadDeclaredIds(file) {
  const text = readFileSync(file, 'utf8');
  const ids = [];
  const re = /\bid\s*:\s*'([^']+)'/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    ids.push(match[1]);
  }
  return ids;
}

/**
 * 读取频道 id 列表（解析 `src/data/channels.ts`）。
 * @param {string} repoRoot 仓库根目录
 * @returns {string[]}
 */
export function loadChannelIds(repoRoot) {
  return loadDeclaredIds(join(repoRoot, 'src', 'data', 'channels.ts'));
}

/**
 * 读取集合 id 列表（解析 `src/data/collections.ts`）。
 *
 * 集合是**来源 / 主题**维度的虚拟归口，与物理唯一的频道正交。
 * 文件不存在时返回空数组（在集合机制引入前的老提交上仍可运行）。
 *
 * @param {string} repoRoot 仓库根目录
 * @returns {string[]}
 */
export function loadCollectionIds(repoRoot) {
  const file = join(repoRoot, 'src', 'data', 'collections.ts');
  if (!existsSync(file)) {
    return [];
  }
  return loadDeclaredIds(file);
}

/**
 * 读取 ICAP 层级 id 列表（解析 `src/data/icap.ts`）。
 *
 * ICAP 是**认知投入**维度的虚拟归口，与物理唯一的频道、来源维度的集合均正交。
 * 与 `loadCollectionIds` 同理：层级是固定四层、表结构一致，故复用同一套
 * 「单引号 id 字面量」正则解析；文件不存在时返回空数组。
 *
 * @param {string} repoRoot 仓库根目录
 * @returns {string[]}
 */
export function loadIcapLevelIds(repoRoot) {
  const file = join(repoRoot, 'src', 'data', 'icap.ts');
  if (!existsSync(file)) {
    return [];
  }
  return loadDeclaredIds(file);
}

/**
 * 解析 `src/data/collections.ts` 里的 `COLLECTIONS` 数组字面量（含 `path` 嵌套对象）。
 *
 * `loadDeclaredIds` 的正则只够取平的 id 列表，看不到 `path[].toolId`，
 * 所以这里做一次「字符串感知的括号配对」后整体求值 ——
 * 字面量是纯数据（字符串 / 数字 / 数组 / 嵌套对象），`Function` 求值无副作用。
 *
 * ⚠️ 定位锚点必须是 `export const COLLECTIONS`：文件头 JSDoc 里也出现过
 * `COLLECTIONS` 字样，用 `indexOf('COLLECTIONS')` 会命中注释。
 *
 * @param {string} repoRoot 仓库根目录
 * @returns {Array<Record<string, unknown>>} 解析失败返回空数组
 */
export function loadCollections(repoRoot) {
  const file = join(repoRoot, 'src', 'data', 'collections.ts');
  if (!existsSync(file)) {
    return [];
  }
  const text = readFileSync(file, 'utf8');
  const marker = text.indexOf('export const COLLECTIONS');
  if (marker === -1) {
    return [];
  }
  const start = text.indexOf('[', text.indexOf('=', marker));
  if (start === -1) {
    return [];
  }
  let depth = 0;
  let quote = '';
  let end = -1;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\') {
        i += 1;
      } else if (ch === quote) {
        quote = '';
      }
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '[' || ch === '{') {
      depth += 1;
    } else if (ch === ']' || ch === '}') {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) {
    return [];
  }
  try {
    // eslint-disable-next-line no-new-func
    const parsed = Function(`"use strict"; return (${text.slice(start, end + 1)});`)();
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
