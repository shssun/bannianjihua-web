/**
 * 把本地「每日英语」工作目录**增量同步**为站内自包含子应用
 * （`npm run build` 前由 `prebuild` 自动执行）。
 *
 * 背景
 * ----
 * 「每日英语跟读」工具在工作目录里的布局是：
 *
 *     D:/workspaces/每日英语/
 *     ├── *.mp4                  ← 视频素材（工具用 mediaUrl = '../' + 文件名 相对引用）
 *     └── tool/
 *         ├── index.html         ← 工具本体（单文件，原生 JS）
 *         ├── data.json          ← 转写数据
 *         ├── zh.json            ← 句子中文释义
 *         └── voices/            ← 多说话人音轨
 *
 * 工具内部的 `fetch('data.json')`、`mediaUrl('x.mp4') = '../x.mp4'` 全是**相对路径**。
 * 因此站内目录**必须镜像这一层级**，工具才能零改动运行：
 *
 *     public/tools/daily-english/
 *     ├── *.mp4
 *     └── tool/
 *         ├── index.html
 *         ├── data.json
 *         ├── zh.json
 *         └── voices/
 *
 * 即：源目录整体搬进 `public/tools/daily-english/`，相对关系原样保留。
 * 好处是**不需要改动工具任何一行代码**，也不会干扰本地素材加工流程
 * （另有 docs/批量处理规范.md 描述的脚本链路在读写同一个源目录）。
 *
 * 为什么是「增量」而不是「清空重拷」
 * ----
 * 最初的实现是 `rmSync(目标, {recursive:true})` + 全量重拷，简单但有两个问题：
 *   1. 每次构建都要删 270 个文件、重拷 ~9 MB —— 慢且毫无必要；
 *   2. 会撞上宿主环境的批量删除保护（`SAFE_DELETE_BULK_CONFIRM_REQUIRED`），
 *      该保护是**合理的**，不应绕过，应改设计。
 * 现改为无状态增量同步：期望集合 vs 现有集合求差集，
 * 只拷"缺失或大小变化"的文件，只删"不再属于期望集合"的孤儿文件。
 * 正常构建（素材没变）→ 拷贝 0 / 删除 0，瞬间完成。
 *
 * 设计要点
 * ----
 * - **白名单**：只处理 mp4 / 三个数据文件 / voices，绝不把 *.py、_qa/、
 *   __pycache__、docs/ 带进 dist。
 * - **幂等**：重复执行结果一致；以「大小 + 内容 sha1」判定是否需重拷。
 *   曾经只用「大小」，在 edge-tts 重做的音频上失效（MP3 时长被量化在帧栅格上，
 *   同长但不同内容），一次漏拷 246 个文件、其中 4 个内容必须更新。
 *   **大小相同 ≠ 内容相同。** 需要强制重拷用 `--force`。
 * - **CI 友好**：源目录不存在时（如 GitHub Actions 没有本地素材）打印警告后
 *   **以 0 退出**，直接复用仓库里已提交的产物，不阻断构建。
 * - 源目录可用环境变量 `DAILY_EN_DIR` 覆盖。
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

const TAG = '[sync-daily-english]';
const FORCE = process.argv.includes('--force');

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, '..');

/** 源：本地「每日英语」工作目录 */
const SOURCE_DIR = process.env.DAILY_EN_DIR
  ? resolve(process.env.DAILY_EN_DIR)
  : resolve('D:/workspaces/每日英语');

/** 目标：站内子应用目录（会被 git 跟踪并随构建进 dist） */
const TARGET_DIR = join(repoRoot, 'public', 'tools', 'daily-english');

/** 源目录下的 tool/ 子目录（工具本体与数据都在这里） */
const SOURCE_TOOL_DIR = join(SOURCE_DIR, 'tool');

/** 前端必需的文件（相对源目录的 tool/ 子目录）。缺失即失败。 */
const REQUIRED_TOOL_FILES = ['index.html', 'data.json', 'zh.json'];

/**
 * 绝对路径 → 相对**目标目录**的 POSIX 风格路径（用作集合 key，跨平台一致）。
 * 注意：只可用于目标目录内部的路径。源目录在别的盘符下，必须用 relToTool()。
 */
function toRel(abs) {
  return relative(TARGET_DIR, abs).split(sep).join('/');
}

/**
 * 绝对路径 → 相对**源 tool/ 目录**的 POSIX 风格路径，再补上 'tool/' 前缀，
 * 得到它在目标目录里的位置。
 *
 * 例：D:/.../每日英语/tool/voices/x/s00_aria.mp3 → 'tool/voices/x/s00_aria.mp3'
 */
function relToTool(abs) {
  return `tool/${relative(SOURCE_TOOL_DIR, abs).split(sep).join('/')}`;
}

/**
 * 递归列出目录下所有文件（绝对路径）。
 * 跳过 __pycache__ 目录（Python 缓存，任何情况下都不该进站点）。
 * @param {string} dir
 * @param {string[]} [out]
 * @returns {string[]}
 */
function walkFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__pycache__') continue;
      walkFiles(full, out);
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

/** 自底向上删除空目录（仅目标目录内部，失败静默忽略）。 */
function pruneEmptyDirs(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = join(dir, entry.name);
    pruneEmptyDirs(full);
    try {
      if (readdirSync(full).length === 0) rmdirSync(full);
    } catch {
      /* 非空 / 被占用 → 保留，无妨 */
    }
  }
}

/** 人类可读体积。 */
function human(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

/**
 * 文件内容指纹（sha1 十六进制）。
 *
 * 为什么不能只用「大小」判断是否需要重拷：
 * 本站音轨是 edge-tts 合成的 MP3，时长被量化在 MP3 帧栅格上（约 24ms 一帧），
 * 因此**同一句话重新合成后，大小极可能完全不变、而字节内容不同**。
 * 这不是理论：clear 音轨全量重做 255 条后，只有 9 条大小发生变化，
 * 其余 246 条被「大小相同即跳过」漏掉，其中 **4 条恰好是内容必须更新的**
 * （念的是订正前的旧句子），站点上静默留了错句音频。
 * 结论：**大小相同 ≠ 内容相同。** 判定与校验都必须比内容指纹。
 */
function fileSha1(abs) {
  return createHash('sha1').update(readFileSync(abs)).digest('hex');
}

// ---------------------------------------------------------------- 前置检查

if (!existsSync(SOURCE_DIR)) {
  console.warn(`${TAG} 源目录不存在：${SOURCE_DIR}`);
  if (existsSync(TARGET_DIR)) {
    console.warn(`${TAG} 复用仓库中已有的 public/tools/daily-english/，跳过同步。`);
  } else {
    console.warn(
      `${TAG} 且仓库中也没有该目录 —— 工具将 404。` +
        `请设置 DAILY_EN_DIR 指向素材目录，或先提交一次同步产物。`,
    );
  }
  process.exit(0);
}

// ---------------------------------------------------------------- 1) 期望集合

/** @type {Map<string, string>} relPosix -> 源绝对路径 */
const expected = new Map();

// 素材 mp4：只取源目录**顶层**（工具约定素材平铺在工作目录根，见批量处理规范 §2）
const mp4Files = readdirSync(SOURCE_DIR, { withFileTypes: true })
  .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.mp4'))
  .map((e) => e.name);

if (mp4Files.length === 0) {
  console.error(`${TAG} 源目录顶层没有任何 .mp4，疑似路径错误：${SOURCE_DIR}`);
  process.exit(1);
}
let mp4Bytes = 0;
for (const name of mp4Files) {
  const abs = join(SOURCE_DIR, name);
  expected.set(name, abs);
  mp4Bytes += statSync(abs).size;
}

// 工具三件套
const missing = [];
for (const name of REQUIRED_TOOL_FILES) {
  const abs = join(SOURCE_TOOL_DIR, name);
  if (existsSync(abs)) expected.set(`tool/${name}`, abs);
  else missing.push(name);
}
if (missing.length > 0) {
  console.error(`${TAG} 缺少必需文件：${missing.join('、')}（应在 ${SOURCE_TOOL_DIR}）`);
  process.exit(1);
}

// 多说话人音轨（递归；排除 TTS 的 .part 中间态）
const voicesSrc = join(SOURCE_TOOL_DIR, 'voices');
let voiceCount = 0;
if (existsSync(voicesSrc)) {
  for (const abs of walkFiles(voicesSrc)) {
    if (abs.endsWith('.part')) continue; // TTS 原子写盘中间态，绝不带走
    expected.set(relToTool(abs), abs);
    voiceCount += 1;
  }
} else {
  console.warn(`${TAG} 未找到 tool/voices —— 站内版将没有「换个人说」音轨（功能自动降级）`);
}

// ---------------------------------------------------------------- 2) 清理孤儿

let removed = 0;
if (existsSync(TARGET_DIR)) {
  for (const abs of walkFiles(TARGET_DIR)) {
    if (expected.has(toRel(abs))) continue;
    unlinkSync(abs); // 逐个删除，不做批量递归删除
    removed += 1;
  }
  if (removed > 0) pruneEmptyDirs(TARGET_DIR);
}

// ---------------------------------------------------------------- 3) 拷贝差异
//
// 用 copyFileSync 而非 cpSync：我们只拷单个文件，不需要 cpSync 的树遍历能力；
// 且在宿主环境的 fs shim 下，cpSync 覆盖已存在文件时会走「先删目标再拷」的分支，
// 一旦中途失败就会**留下文件的真空**（实测踩到 ESRCH）。copyFileSync 直接覆盖，更可靠。
let copied = 0;
let skipped = 0;
for (const [rel, src] of expected) {
  const dst = join(TARGET_DIR, ...rel.split('/'));
  if (!FORCE && existsSync(dst)) {
    // 大小不同 ⇒ 内容必然不同，直接重拷；
    // 大小相同还不够，必须再比内容指纹（理由见 fileSha1 的注释）。
    const sameSize = statSync(dst).size === statSync(src).size;
    if (sameSize && fileSha1(dst) === fileSha1(src)) {
      skipped += 1;
      continue;
    }
  }
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
  copied += 1;
}

// ---------------------------------------------------------------- 4) 校验
//
// 逐文件确认「存在且内容与源一致」。这一步不是形式主义：
// 它曾在一次真实的 shim 故障中抓出 "声称同步成功、实际丢了 256 个文件"，
// 以及 cpSync 留下的文件真空。绝不允许静默产出残缺站点。
//
// 校验**必须比内容指纹**，不能只比大小 —— 「大小相同、内容不同」这类漏拷
// 会静默通过，且已真实发生过一次（4 条音轨在站点上留着错句音频）。

const mismatched = [];
for (const [rel, src] of expected) {
  const dst = join(TARGET_DIR, ...rel.split('/'));
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

// .part 残留同样不允许
for (const abs of walkFiles(TARGET_DIR)) {
  if (abs.endsWith('.part')) mismatched.push(`${toRel(abs)}（.part 残留）`);
}

if (mismatched.length > 0) {
  console.error(`${TAG} 校验失败，共 ${mismatched.length} 项与源不一致：`);
  for (const item of mismatched.slice(0, 20)) console.error(`${TAG}   - ${item}`);
  if (mismatched.length > 20) console.error(`${TAG}   …（其余 ${mismatched.length - 20} 项省略）`);
  process.exit(1);
}

const actualFiles = walkFiles(TARGET_DIR);
const totalBytes = actualFiles.reduce((sum, abs) => sum + statSync(abs).size, 0);

// ---------------------------------------------------------------- 输出

console.log(`${TAG} 源   ：${SOURCE_DIR}`);
console.log(`${TAG} 目标 ：public/tools/daily-english`);
console.log(`${TAG}   素材 mp4   ${String(mp4Files.length).padStart(4)} 个   ${human(mp4Bytes)}`);
console.log(`${TAG}   音轨文件   ${String(voiceCount).padStart(4)} 个   (mp3 + manifest.json)`);
console.log(
  `${TAG}   本次 拷贝 ${copied} / 跳过 ${skipped} / 清理孤儿 ${removed}${FORCE ? '（--force 全量）' : ''}`,
);
console.log(`${TAG}   合计       ${String(actualFiles.length).padStart(4)} 个   ${human(totalBytes)}`);
console.log(`${TAG} 完成`);
