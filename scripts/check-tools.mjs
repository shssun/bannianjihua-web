/**
 * 构建期校验：把「工具目录规约」变成硬约束。
 *
 * 接入方式：`npm run build` 的 `prebuild` 第一步执行本脚本（见 package.json）。
 * 不依赖人的自觉，靠**构建失败**兜住并行开发最容易踩的坑。
 *
 * 校验项（error = 退出码 1，warn = 仅提示）：
 *   | 校验项                                        | 级别 |
 *   | id 全局唯一                                   | error |
 *   | channel 存在于 CHANNELS                        | error |
 *   | id 未占用保留字（channel / collection）        | error |
 *   | 注册表文件所在目录名 == channel                | error |
 *   | 注册表文件名字 == 对象里的 id                  | error |
 *   | 有 entry 时 public/<entry> 真实存在            | error |
 *   | collections[] 里的每个 id 存在于 COLLECTIONS   | error |
 *   | collections[] 内部无重复 id                     | error |
 *   | icap 是字符串数组                              | error |
 *   | icap[] 里的每个值存在于 ICAP_LEVELS            | error |
 *   | icap[] 内部无重复值                            | error |
 *   | path[].toolId 存在于工具注册表                 | error |
 *   | path[].toolId 属于本集合                       | error |
 *   | path 缺口步必须有 todo                         | error |
 *   | collections.ts 结构化解析成功（否则上述失效）  | error |
 *   | 有 entry 时文件名以 index.html 结尾            | warn  |
 *   | 同频道内 order 重复                            | warn  |
 *   | 未解析到任何集合（集合/路径校验未生效）        | warn  |
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';
import { loadChannelIds, loadCollectionIds, loadCollections, loadIcapLevelIds, loadToolRegistry } from './lib/registry.mjs';

const TAG = '[check-tools]';
const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, '..');

/**
 * 保留 id：与路由段冲突，不允许用作工具 id。
 *
 * 路由表（`src/router.tsx`）里 `tools/channel/:channel` 与
 * `tools/collection/:collection` 都是**静态段优先于** `tools/:id` 的动态段，
 * 因此 `channel` 与 `collection` 这两个词一旦被用作工具 id，
 * 该工具页将永远无法访问（会被同名静态路由吃掉）。
 *
 * 新增保留字时，必须同时更新本集合与 `docs/TOOLS-LAYOUT.md`。
 */
const RESERVED_IDS = new Set(['channel', 'collection']);

/** @type {string[]} */
const errors = [];
/** @type {string[]} */
const warnings = [];

/** 相对仓库根的 POSIX 路径（用于日志）。 */
function rel(abs) {
  return relative(repoRoot, abs).split('\\').join('/');
}

const channelIds = new Set(loadChannelIds(repoRoot));
const collectionIds = new Set(loadCollectionIds(repoRoot));
const icapIds = new Set(loadIcapLevelIds(repoRoot));
const tools = loadToolRegistry(repoRoot);
// 结构化读取集合（含 path 学习路径）。
// ⚠️ 解析失败必须报错：静默当成「没有集合」会让下面的集合 / 路径校验**整段失效**，
//    构建照样通过 —— 这是本项目最忌讳的「假绿」。
let collections = [];
try {
  collections = loadCollections(repoRoot);
} catch (error) {
  errors.push(`src/data/collections.ts: 结构化解析失败 —— ${error.message}`);
}
if (collections.length === 0) {
  warnings.push(
    'src/data/collections.ts: 未解析到任何集合 —— 集合与学习路径的校验本次**未生效**',
  );
}

// ---- id 唯一性（分组报告，避免同一冲突刷屏） ----
const idToFiles = new Map();
for (const tool of tools) {
  const id = tool.object.id ?? tool.id;
  if (!idToFiles.has(id)) {
    idToFiles.set(id, []);
  }
  idToFiles.get(id).push(tool);
}
for (const [id, list] of idToFiles) {
  if (list.length > 1) {
    errors.push(
      `id 重复："${id}" 出现在多个注册表文件：${list.map((t) => rel(t.file)).join('、')}`,
    );
  }
}

// ---- 逐条校验 ----
for (const tool of tools) {
  const { channel: dirChannel, id: fileId, object, file } = tool;
  const where = rel(file);
  const objId = object.id;
  const objChannel = object.channel;

  if (objId !== fileId) {
    errors.push(`${where}: 对象里 id="${objId}" 与文件名 "${fileId}.ts" 不一致`);
  }
  if (objChannel !== dirChannel) {
    errors.push(`${where}: channel="${objChannel}" 与所在目录 "${dirChannel}/" 不一致`);
  } else if (!channelIds.has(objChannel)) {
    errors.push(`${where}: channel="${objChannel}" 不在 CHANNELS 中（见 src/data/channels.ts）`);
  }
  if (RESERVED_IDS.has(objId)) {
    errors.push(`${where}: id="${objId}" 是保留字（与路由段冲突），请改名`);
  }

  // ---- collections[]：属于「来源 / 主题」维度的虚拟归口，多对多 ----
  // 频道（channel）是物理唯一的科目归属；集合是额外的展示归口，
  // 因此这里只校验「引用有效」与「不自我重复」，不限制数量、也不要求每工具必填。
  if (object.collections !== undefined) {
    if (!Array.isArray(object.collections)) {
      errors.push(`${where}: collections 必须是字符串数组（当前是 ${typeof object.collections}）`);
    } else {
      const seenCollections = new Set();
      for (const cid of object.collections) {
        if (typeof cid !== 'string' || cid.length === 0) {
          errors.push(`${where}: collections 里存在非字符串或空字符串项：${JSON.stringify(cid)}`);
          continue;
        }
        if (seenCollections.has(cid)) {
          errors.push(`${where}: collections 里 "${cid}" 重复`);
        }
        seenCollections.add(cid);
        if (!collectionIds.has(cid)) {
          errors.push(
            `${where}: collections 里的 "${cid}" 不在 COLLECTIONS 中（见 src/data/collections.ts）`,
          );
        }
      }
    }
  }

  // ---- icap[]：属于「认知投入」维度的虚拟归口，多对多 ----
  // 与 collections 完全同构：只校验「引用有效」与「不自我重复」，
  // 不限制数量、也不要求每工具必填。
  // ⚠️ 命中的是工具的**设计意图**（Tool.icap），不是学习者的实际层级。
  if (object.icap !== undefined) {
    if (!Array.isArray(object.icap)) {
      errors.push(`${where}: icap 必须是字符串数组（当前是 ${typeof object.icap}）`);
    } else {
      const seenIcap = new Set();
      for (const level of object.icap) {
        if (typeof level !== 'string' || level.length === 0) {
          errors.push(`${where}: icap 里存在非字符串或空字符串项：${JSON.stringify(level)}`);
          continue;
        }
        if (seenIcap.has(level)) {
          errors.push(`${where}: icap 里 "${level}" 重复`);
        }
        seenIcap.add(level);
        if (!icapIds.has(level)) {
          errors.push(
            `${where}: icap 里的 "${level}" 不在 ICAP_LEVELS 中（见 src/data/icap.ts）`,
          );
        }
      }
    }
  }

  if (object.entry) {
    const entryRel = String(object.entry);
    const entryAbs = join(repoRoot, 'public', ...entryRel.split('/'));
    if (!existsSync(entryAbs)) {
      errors.push(`${where}: entry "${entryRel}" 指向的文件不存在（public/${entryRel}）`);
    }
    if (!entryRel.endsWith('/index.html')) {
      warnings.push(
        `${where}: entry "${entryRel}" 未以 /index.html 结尾（规约建议单文件工具统一命名 index.html）`,
      );
    }
  }
}

// ---- collections[].path：ICAP 学习路径编排 ----
// 路径只能引用**属于本集合**的工具，否则「路径」会串到别的集合的工具上，
// 学习者点进去会发现上下文不对。缺口步（无 toolId）必须写 todo 说明原因。
const toolObjectById = new Map();
for (const tool of tools) {
  toolObjectById.set(tool.object.id ?? tool.id, tool.object);
}
const pathCollections = collections.filter((collection) => Array.isArray(collection.path));
for (const collection of pathCollections) {
  const cid = collection.id;
  if (typeof cid !== 'string') {
    errors.push('src/data/collections.ts: 配了 path 的集合缺少 string 类型的 id');
    continue;
  }
  const seenPathTools = new Set();
  collection.path.forEach((step, index) => {
    const at = `src/data/collections.ts: 集合 "${cid}" 路径第 ${index + 1} 步`;
    if (typeof step !== 'object' || step === null) {
      errors.push(`${at} 必须是对象`);
      return;
    }
    if (typeof step.label !== 'string' || step.label.length === 0) {
      errors.push(`${at} 缺少 label`);
    }
    if (step.toolId === undefined) {
      if (typeof step.todo !== 'string' || step.todo.length === 0) {
        errors.push(`${at}（${step.label ?? '?'}）没有 toolId，必须给 todo 说明缺口`);
      }
      return;
    }
    if (typeof step.toolId !== 'string' || step.toolId.length === 0) {
      errors.push(`${at} 的 toolId 必须是非空字符串`);
      return;
    }
    if (seenPathTools.has(step.toolId)) {
      errors.push(`${at} 的 toolId "${step.toolId}" 在同一条路径里重复`);
    }
    seenPathTools.add(step.toolId);
    const target = toolObjectById.get(step.toolId);
    if (!target) {
      errors.push(`${at} 的 toolId "${step.toolId}" 不在工具注册表中`);
      return;
    }
    const owned = Array.isArray(target.collections) ? target.collections : [];
    if (!owned.includes(cid)) {
      errors.push(
        `${at} 引用了工具 "${step.toolId}"，但该工具的 collections 里没有 "${cid}"`,
      );
    }
  });
}

// ---- 同频道 order 重复 ----
const byChannel = new Map();
for (const tool of tools) {
  const order = tool.object.order;
  if (order === undefined || order === null) {
    continue;
  }
  const list = byChannel.get(tool.channel) ?? [];
  list.push({ id: tool.object.id, order, file: tool.file });
  byChannel.set(tool.channel, list);
}
for (const [channel, list] of byChannel) {
  const seen = new Map();
  for (const item of list) {
    if (seen.has(item.order)) {
      warnings.push(
        `频道 "${channel}" 内 order=${item.order} 重复：${seen.get(item.order)} 与 ${item.id}`,
      );
    } else {
      seen.set(item.order, item.id);
    }
  }
}

// ---- 汇总输出 ----
console.log(
  `${TAG} 频道 ${channelIds.size} 个 · 集合 ${collectionIds.size} 个 · ICAP ${icapIds.size} 层 · 工具 ${tools.length} 个 · 路径 ${pathCollections.length} 个`,
);

if (warnings.length > 0) {
  console.warn(`${TAG} ${warnings.length} 条警告：`);
  for (const w of warnings) {
    console.warn(`${TAG}   ⚠ ${w}`);
  }
}

if (errors.length > 0) {
  console.error(`${TAG} ${errors.length} 项校验失败：`);
  for (const e of errors) {
    console.error(`${TAG}   ✗ ${e}`);
  }
  console.error(`${TAG} 校验未通过，已中止构建。`);
  process.exit(1);
}

console.log(`${TAG} 校验通过 ✓`);
