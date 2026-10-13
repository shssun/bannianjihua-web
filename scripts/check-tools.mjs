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
 *   | id 未占用保留字（channel）                     | error |
 *   | 注册表文件所在目录名 == channel                | error |
 *   | 注册表文件名字 == 对象里的 id                  | error |
 *   | 有 entry 时 public/<entry> 真实存在            | error |
 *   | 有 entry 时文件名以 index.html 结尾            | warn  |
 *   | 同频道内 order 重复                            | warn  |
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';
import { loadChannelIds, loadToolRegistry } from './lib/registry.mjs';

const TAG = '[check-tools]';
const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, '..');

/** 保留 id：与路由段冲突，不允许用作工具 id。 */
const RESERVED_IDS = new Set(['channel']);

/** @type {string[]} */
const errors = [];
/** @type {string[]} */
const warnings = [];

/** 相对仓库根的 POSIX 路径（用于日志）。 */
function rel(abs) {
  return relative(repoRoot, abs).split('\\').join('/');
}

const channelIds = new Set(loadChannelIds(repoRoot));
const tools = loadToolRegistry(repoRoot);

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
console.log(`${TAG} 频道 ${channelIds.size} 个 · 工具 ${tools.length} 个`);

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
