/**
 * 通用工具产物同步器。
 *
 * 把「本地工作目录（工具源码的作战区，不进仓库）」**增量镜像**到
 * `public/` 下的站内目录（会被 git 跟踪并随构建进 dist）。
 * `npm run build` 前由 `prebuild` 自动执行。
 *
 * 为什么通用化
 * ----
 * 旧实现 `scripts/sync-daily-english.mjs` 把源目录/目标目录/白名单全部硬编码，
 * 每来一个多文件工具就要复制一份脚本、再去改 `package.json` 的 `prebuild` ——
 * 两个工具同时加就会在 package.json 里冲突，正是要避免的。
 * 现在改成「一工具一清单 + 一个通用器」：
 *   - 清单放 `scripts/sync/<id>.json`
 *   - `package.json` 里永远只有一条 `node scripts/check-tools.mjs && node scripts/sync-tools.mjs`
 *   - **新增多文件工具 = 新建一个清单文件，不改任何既有文件。**
 *
 * 设计要点（自旧脚本原样继承，勿回退）
 * ----
 * - **幂等判据 = 大小 + 内容 sha1 双判据**。⚠️ 绝不能只看大小：
 *   本站音轨为 edge-tts 合成的 MP3，时长量化在帧栅格上，同句重合成后
 *   **大小极可能不变、字节内容却不同**。曾因此漏拷 246 个音轨，其中 4 条
 *   是必须更新的（站上静默留了错句音频）。**大小相同 ≠ 内容相同。**
 *   需要强制全量重拷用 `--force`。
 * - **白名单**：include 显式列出的才带；exclude 再兜底，
 *   绝不把 `*.py` / `_qa/` / `__pycache__/` / `.part` 带进站点。
 * - **增量**：正常构建（素材没变）→ 拷贝 0 / 清理 0，瞬间完成。
 *   只做增量新增/覆盖，**绝不做「清空重拷」**（清空重拷会撞宿主的批量删除配额）。
 * - **只拷单个文件一律用 `copyFileSync`**：`cpSync` 覆盖已存在文件时会走
 *   「先删目标再拷」分支，中途失败会留下文件真空（实测踩到 ESRCH）。
 * - **rename 映射**：清单可给 `"rename": { "player.html": "index.html" }`，
 *   把源相对路径精确映射为目标相对路径（用于工具本体文件名不符合站内命名规范的场合）。
 *   ⚠️ `required` 仍按**源**相对路径判定，不按映射后的。
 * - **stripPrefix 前缀剥离**：清单可给 `"stripPrefix": "tool/"`，
 *   把匹配到的**源相对路径**去掉该前缀后再映射到目标路径。用于源目录比站内目录
 *   多一层（如 `tool/`）时把产物整体上移一层，使 URL 与其它工具保持一致。
 *   ⚠️ **顺序规则（重要）**：
 *     1. 先查 `rename`（其 key 是**源**相对路径语义）——
 *        命中则 rename 的值**直接作为目标**，**不再 stripPrefix**
 *        （因为 rename 的值已经是最终目标名）。
 *     2. `rename` 未命中时，才取 `srcRel` 并剥掉 `stripPrefix`。
 *   例：清单同时有 `"stripPrefix": "tool/"` 与 `"rename": {"player.html": "index.html"}`：
 *     - 源 `tool/index.html` → rename 未命中 → strip `tool/` → 目标 `index.html`
 *     - 源 `tool/player.html` → rename 命中 → 目标 `index.html`（不再 strip）
 *   ⚠️ `stripPrefix` 未配置 / 为空串 / 前缀不匹配时，行为与未配置**逐字节一致**。
 *   ⚠️ `required` 仍按**源**相对路径（strip **之前**）判定，与 `rename` 同理。
 * - **CI 友好**：源目录不存在 → 打印警告并继续（整体 exit 0），
 *   直接复用仓库里已提交的产物，不阻断构建。
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmdirSync,
  statSync,
  unlinkSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { isIncluded } from './lib/glob.mjs';

const TAG = '[sync-tools]';
const FORCE = process.argv.includes('--force');

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, '..');
const manifestDir = join(currentDir, 'sync');

/** 绝对路径 → POSIX 风格（跨平台一致的集合 key）。 */
function toPosix(p) {
  return p.split(sep).join('/');
}

/**
 * 递归列出目录下所有文件（绝对路径）。
 * 跳过 `__pycache__`（Python 缓存，任何情况下都不进站点）。
 */
function walkFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__pycache__') {
        continue;
      }
      walkFiles(full, out);
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

/** 自底向上删除空目录（失败静默忽略）。 */
function pruneEmptyDirs(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const full = join(dir, entry.name);
    pruneEmptyDirs(full);
    try {
      if (readdirSync(full).length === 0) {
        rmdirSync(full);
      }
    } catch {
      /* 非空 / 被占用 → 保留，无妨 */
    }
  }
}

/** 人类可读体积。 */
function human(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

/** 文件内容指纹（sha1 十六进制）——判定是否需要重拷的权威依据。 */
function fileSha1(abs) {
  return createHash('sha1').update(readFileSync(abs)).digest('hex');
}

// ---------------------------------------------------------------- 主流程

if (!existsSync(manifestDir)) {
  console.warn(`${TAG} 未找到脚本清单目录：${manifestDir}，跳过同步。`);
  process.exit(0);
}

const manifestFiles = readdirSync(manifestDir)
  .filter((name) => name.endsWith('.json'))
  .sort();

if (manifestFiles.length === 0) {
  console.log(`${TAG} 没有任何同步清单（scripts/sync/*.json），跳过。`);
  process.exit(0);
}

let totalCopied = 0;
let totalSkipped = 0;
let totalRemoved = 0;
let failures = 0;

for (const manifestName of manifestFiles) {
  const manifestPath = join(manifestDir, manifestName);
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    console.error(`${TAG} 清单解析失败：${manifestName}\n  ${error.message}`);
    failures += 1;
    continue;
  }

  const { id, dest } = manifest;
  if (!id || !dest) {
    console.error(`${TAG} 清单缺少 id / dest 字段：${manifestName}`);
    failures += 1;
    continue;
  }

  // 源目录：支持用环境变量覆盖（CI / 换机器时方便）
  const srcRaw =
    manifest.srcEnv && process.env[manifest.srcEnv]
      ? process.env[manifest.srcEnv]
      : manifest.src;
  if (!srcRaw) {
    console.error(`${TAG} 清单缺少 src 字段：${manifestName}`);
    failures += 1;
    continue;
  }
  const srcDir = resolve(srcRaw);
  const destDir = join(repoRoot, ...dest.split('/'));
  const include = Array.isArray(manifest.include) ? manifest.include : [];
  const exclude = Array.isArray(manifest.exclude) ? manifest.exclude : [];
  const required = Array.isArray(manifest.required) ? manifest.required : [];
  const rename = manifest.rename && typeof manifest.rename === 'object' ? manifest.rename : {};
  // 前缀剥离：把匹配到的**源**相对路径去掉该前缀后再映射（空串 / 未配置 = 不剥离）
  const stripPrefix = typeof manifest.stripPrefix === 'string' ? manifest.stripPrefix : '';

  console.log(`${TAG} ── ${id}  (${manifestName})`);

  // 源目录不存在 → 复用仓库中已提交的产物，不阻断构建
  if (!existsSync(srcDir)) {
    console.warn(`${TAG}   源目录不存在：${srcDir}`);
    if (existsSync(destDir)) {
      console.warn(`${TAG}   复用仓库中已提交的 ${dest}，跳过同步。`);
    } else {
      console.warn(
        `${TAG}   且仓库中也没有该目录 —— 该工具将 404。` +
          `请设置 ${manifest.srcEnv ?? 'src'} 指向素材目录，或先提交一次同步产物。`,
      );
    }
    continue;
  }

  // ---- 1) 期望集合（白名单） ----
  const expected = new Map();
  const seenSrc = new Set();
  for (const abs of walkFiles(srcDir)) {
    if (abs.endsWith('.part')) {
      continue; // TTS 原子写盘中间态，绝不带走
    }
    const srcRel = toPosix(relative(srcDir, abs));
    if (!isIncluded(srcRel, include, exclude)) {
      continue;
    }
    seenSrc.add(srcRel); // ⚠️ required 按 strip **之前**的源相对路径判定
    // 顺序规则：rename 命中 → 其值即最终目标（不再 strip）；
    //           rename 未命中 → 取 srcRel，再剥掉 stripPrefix。
    let dstRel;
    if (Object.prototype.hasOwnProperty.call(rename, srcRel)) {
      dstRel = rename[srcRel];
    } else if (stripPrefix && srcRel.startsWith(stripPrefix)) {
      dstRel = srcRel.slice(stripPrefix.length);
    } else {
      dstRel = srcRel;
    }
    expected.set(dstRel, abs); // key = 目标相对路径
  }

  const missingRequired = required.filter((rel) => !seenSrc.has(rel));
  if (missingRequired.length > 0) {
    console.error(
      `${TAG}   缺少必需文件：${missingRequired.join('、')}（应在 ${srcDir}）`,
    );
    failures += 1;
    continue;
  }
  if (expected.size === 0) {
    console.error(
      `${TAG}   include 未匹配到任何文件，疑似清单配置错误：${include.join(', ')}`,
    );
    failures += 1;
    continue;
  }

  // ---- 2) 清理孤儿（目标中不再属于期望集合的文件） ----
  let removed = 0;
  if (existsSync(destDir)) {
    for (const abs of walkFiles(destDir)) {
      if (expected.has(toPosix(relative(destDir, abs)))) {
        continue;
      }
      unlinkSync(abs); // 逐个删除，不做批量递归删除
      removed += 1;
    }
    if (removed > 0) {
      pruneEmptyDirs(destDir);
    }
  }

  // ---- 3) 拷贝差异（大小 + 内容指纹双判据） ----
  let copied = 0;
  let skipped = 0;
  for (const [rel, src] of expected) {
    const dst = join(destDir, ...rel.split('/'));
    if (!FORCE && existsSync(dst)) {
      const sameSize = statSync(dst).size === statSync(src).size;
      if (sameSize && fileSha1(dst) === fileSha1(src)) {
        skipped += 1;
        continue;
      }
    }
    mkdirSync(dirname(dst), { recursive: true });
    copyFileSync(src, dst); // 只拷单文件，用 copyFileSync 而非 cpSync
    copied += 1;
  }

  // ---- 4) 校验（绝不允许静默产出残缺站点） ----
  const mismatched = [];
  for (const [rel, src] of expected) {
    const dst = join(destDir, ...rel.split('/'));
    if (!existsSync(dst)) {
      mismatched.push(`${rel}（目标缺失）`);
      continue;
    }
    if (fileSha1(src) !== fileSha1(dst)) {
      mismatched.push(
        `${rel}（源 ${statSync(src).size}B / 目标 ${statSync(dst).size}B，内容指纹不一致）`,
      );
    }
  }
  for (const abs of walkFiles(destDir)) {
    if (abs.endsWith('.part')) {
      mismatched.push(`${toPosix(relative(destDir, abs))}（.part 残留）`);
    }
  }
  if (mismatched.length > 0) {
    console.error(`${TAG}   校验失败，共 ${mismatched.length} 项与源不一致：`);
    for (const item of mismatched.slice(0, 20)) {
      console.error(`${TAG}     - ${item}`);
    }
    if (mismatched.length > 20) {
      console.error(`${TAG}     …（其余 ${mismatched.length - 20} 项省略）`);
    }
    failures += 1;
    continue;
  }

  const actualFiles = walkFiles(destDir);
  const totalBytes = actualFiles.reduce((sum, abs) => sum + statSync(abs).size, 0);
  console.log(`${TAG}   → ${dest}`);
  console.log(
    `${TAG}     本次 拷贝 ${copied} / 跳过 ${skipped} / 清理孤儿 ${removed}` +
      `${FORCE ? '（--force 全量）' : ''}`,
  );
  console.log(`${TAG}     合计 ${String(actualFiles.length).padStart(4)} 个 ${human(totalBytes)}`);

  totalCopied += copied;
  totalSkipped += skipped;
  totalRemoved += removed;
}

console.log(
  `${TAG} 汇总：拷贝 ${totalCopied} / 跳过 ${totalSkipped} / 清理孤儿 ${totalRemoved} / 失败 ${failures}`,
);
process.exit(failures > 0 ? 1 : 0);
