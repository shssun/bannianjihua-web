#!/usr/bin/env node
/**
 * movie-line-shadowing 去重数据生成器。
 *
 * 为什么需要它（与 sync-tools.mjs 的分工）
 * ────────────────────────────────────────
 * `scripts/sync-tools.mjs` 是**逐字节镜像器**：它只会把源文件原样拷到
 * `public/`，**无法改写文件内容**。而「影视台词跟读」工具的 3 个 JSON
 * （`tool/data.json` / `tool/zh.json` / `tool/voices/manifest.json`）需要
 * 从真源 386 条**去重为 368 条**（删 18 条重复版本 + 3 条去后缀改名）——
 * 这是**内容变换**，镜像器做不到。
 *
 * 若把这 3 个 JSON 留在同步清单的 `include` 里，`prebuild` 的
 * `sync-tools.mjs` 每次构建都会用**真源 386 条原样覆盖**仓库里的 368 条产物
 * （实测：拷贝 1 / 跳过 2264，恰好把 data.json 打回 386）。
 *
 * 因此采用分工：
 *   - **媒体（*.mp4 / voices/*.mp3）与 index.html** → 交给 `sync-tools.mjs` 逐字节镜像；
 *   - **这 3 个 JSON** → 由本脚本从真源读取、按固定去重规则生成，落盘到 `public/`。
 * 本脚本挂在 `package.json` 的 `prebuild`，在 `sync-tools.mjs` **之后**执行，
 * 且是**幂等**的（内容不变则不重写，避免无谓的 mtime churn）。
 *
 * 去重规则（老板已拍板，勿改）
 * ──────────────────────────────
 *   删除 18 条重复版本（保留不带后缀的主名版）；真源里若无该条则跳过。
 *   3 条独有条目去掉 `1`/`(1)` 后缀作为正式名（源名 → 目标名）。
 *
 * 用法：
 *   node scripts/gen-mls-data.mjs            # 生成（仅在内容变化时落盘）
 *   node scripts/gen-mls-data.mjs --check    # 只校验、不写盘；不一致则 exit 1
 */
import { existsSync, readFileSync, writeFileSync, renameSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

/** 真源目录（只读）。可用环境变量覆盖，便于 CI / 换机器。 */
const SRC = process.env.MOVIE_LINE_SRC || 'D:/workspaces/每日英语台词';

/** 仓库内目标目录。 */
const DEST = join(ROOT, 'public', 'tools', 'english', 'movie-line-shadowing');

/** 要删除的 18 条重复版本（源名，含后缀）。真源里不存在则自动跳过。 */
const REMOVE = new Set([
  '一切皆有可能(1).mp4',
  '久仰大名(1).mp4',
  '你怎么了(1).mp4',
  '你想得美(1).mp4',
  '加油1.mp4',
  '及时行乐(1).mp4',
  '在努力一点(1).mp4',
  '恕我直言(1).mp4',
  '我向你保证(1).mp4',
  '我对你一见钟情1.mp4',
  '我无能为力1.mp4',
  '振作起来(1).mp4',
  '改天吧(1).mp4',
  '时间不等人1.mp4',
  '时间会证明一切(1).mp4',
  '活在当下1.mp4',
  '祝贺你(1).mp4',
  '重新开始1.mp4',
  '随便看看1.mp4',
]);

/** 独有条目改名：源名 → 目标名。 */
const RENAME = new Map([
  ['你真美1.mp4', '你真美.mp4'],
  ['你鼓舞了我1.mp4', '你鼓舞了我.mp4'],
  ['我们扯平了1.mp4', '我们扯平了.mp4'],
  // ---- T-029 错别字修正（17 条）：真源 mp4 已同步改名，不留旧链接 ----
  // 英文 12 条
  ["don't ge me wrong.mp4", "don't get me wrong.mp4"],
  ["don't sett;e.mp4", "don't settle.mp4"],
  ['give me break.mp4', 'give me a break.mp4'],
  ['his bark is worse than hit bite.mp4', 'his bark is worse than his bite.mp4'],
  ['hold your hourses.mp4', 'hold your horses.mp4'],
  ['tahta makes two of us.mp4', 'that makes two of us.mp4'],
  ['the heart wants what the hearts wants.mp4', 'the heart wants what it wants.mp4'],
  ['what a conincidence.mp4', 'what a coincidence.mp4'],
  ['you are way of line.mp4', 'you are way out of line.mp4'],
  ['mind you own business.mp4', 'mind your own business.mp4'],
  // ⚠️ 尾部带空格的源名 → 去掉尾部空格（实为「it is what it is.mp4」前的空格）
  ['it is what it is .mp4', 'it is what it is.mp4'],
  ['what am i to you .mp4', 'what am i to you.mp4'],
  // 中文 5 条
  ['对我又什么好处.mp4', '对我有什么好处.mp4'],
  // ⚠️ 是「从头开始」不是「重新开始」：ASR 为 "From the beginning."，
  //    且真源/产物中已存在语义不同的「重新开始.mp4」(ASR "A fresh start.")，改重名会撞车。
  ['从新开始.mp4', '从头开始.mp4'],
  ['你出个价把.mp4', '你出个价吧.mp4'],
  ['你再开玩笑把.mp4', '你再开玩笑吧.mp4'],
  ['你是万一挑一.mp4', '你是万里挑一.mp4'],
  // ---- T-029 补做（3 条，卡面已列但首轮漏改；ASR 正字明文给出）----
  // 判据：ASR text 为 "I don't go Dutch on the first day." / "Do you remember me?" / "Try harder."
  ['do Dutch.mp4', 'go Dutch.mp4'],
  ['你还记得我妈.mp4', '你还记得我吗.mp4'],
  ['在努力一点.mp4', '再努力一点.mp4'],
]);

const CHECK_ONLY = process.argv.includes('--check');

/** 目标条数（386 - 18 = 368）。用于自检。 */
const EXPECTED_COUNT = 368;

const TAG = '[gen-mls-data]';

/** 读 JSON；失败即抛，避免静默产出残缺产物。 */
function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`读取/解析失败：${path}\n  ${error.message}`);
  }
}

/** 把去重规则应用到某个「以 file/源名为键」的映射上，返回新映射（保持插入顺序）。 */
function applyRules(entries) {
  const out = {};
  for (const key of Object.keys(entries)) {
    if (REMOVE.has(key)) continue;
    const nextKey = RENAME.has(key) ? RENAME.get(key) : key;
    out[nextKey] = entries[key];
  }
  return out;
}

/**
 * 生成 3 个产物的内容。
 * @returns {{data: object, zh: object, manifest: object, files: Set<string>}}
 */
function build() {
  const dataSrc = `${SRC}/tool/data.json`;
  const zhSrc = `${SRC}/tool/zh.json`;
  const manifestSrc = `${SRC}/tool/voices/manifest.json`;
  for (const p of [dataSrc, zhSrc, manifestSrc]) {
    if (!existsSync(p)) {
      throw new Error(`真源缺失：${p}（请设置 MOVIE_LINE_SRC 指向真源目录）`);
    }
  }
  /* 注：真源缺失的情形由 main() 在调用本函数前拦下（CI 里真源不在），
     见 main() 的 sourceAvailable 分支 —— 那里会跳过生成、复用已提交产物。 */

  // ---- data.json：删重复 + 去后缀改名（file 与 filenameText 同步改） ----
  const data = readJson(dataSrc);
  const items = (data.items || [])
    .filter((it) => !REMOVE.has(it.file))
    .map((it) => {
      if (RENAME.has(it.file)) {
        const nextFile = RENAME.get(it.file);
        return {
          ...it,
          file: nextFile,
          filenameText: nextFile.replace(/\.mp4$/, ''),
        };
      }
      return it;
    });
  const dataOut = { ...data, items };
  const files = new Set(items.map((it) => it.file));

  // ---- zh.json：保留 _ 前缀元数据键；句子映射用同一规则过滤/改名 ----
  const zhSrcObj = readJson(zhSrc);
  const zhOut = {};
  for (const key of Object.keys(zhSrcObj)) {
    if (key.startsWith('_')) {
      zhOut[key] = zhSrcObj[key];
    }
  }
  const zhEntries = {};
  for (const key of Object.keys(zhSrcObj)) {
    if (key.startsWith('_')) continue;
    zhEntries[key] = zhSrcObj[key];
  }
  Object.assign(zhOut, applyRules(zhEntries));

  // ---- voices/manifest.json：items 用同一规则过滤/改名；其余字段原样保留 ----
  const manifestSrcObj = readJson(manifestSrc);
  const manifestOut = {
    ...manifestSrcObj,
    items: applyRules(manifestSrcObj.items || {}),
  };

  return { data: dataOut, zh: zhOut, manifest: manifestOut, files };
}

/** 序列化为产物文本（统一 2 空格缩进 + 结尾换行，UTF-8 无 BOM）。 */
function serialize(obj) {
  return `${JSON.stringify(obj, null, 2)}\n`;
}

/**
 * 幂等落盘：内容一致则不动（避免每次构建都改 mtime，触发 git churn）。
 * 用「临时文件 + rename」原子替换，避免进程被中断时留下半截文件。
 * @returns {boolean} 是否真正重写了文件
 */
function writeIfChanged(path, text) {
  if (existsSync(path) && readFileSync(path, 'utf8') === text) {
    return false;
  }
  if (CHECK_ONLY) {
    return true; // 内容不同，但 --check 下不写盘，交由调用方判定失败
  }
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, text, 'utf8');
  renameSync(tmp, path);
  return true;
}

function main() {
  console.log(`${TAG} 真源：${SRC}`);

  // ---- 真源不可用时：跳过生成，复用仓库中已提交的产物（不阻断构建） ----
  // ⚠️ CI（GitHub Actions）里 `D:/workspaces/每日英语台词/` 并不存在，
  //    若在此抛错会让 `prebuild` 失败、整个 build 挂掉（实测 32c9e83 与
  //    7e99bb5 两次部署均因此 failure）。这与 `sync-tools.mjs` 对缺失源
  //    的既有设计一致：媒体复用仓库产物，这里同理复用三个 JSON。
  const dataSrc = `${SRC}/tool/data.json`;
  const zhSrc = `${SRC}/tool/zh.json`;
  const manifestSrc = `${SRC}/tool/voices/manifest.json`;
  const sourceAvailable = [dataSrc, zhSrc, manifestSrc].every((p) => existsSync(p));
  if (!sourceAvailable) {
    console.warn(`${TAG}   真源不可用（${SRC} 下缺 data.json / zh.json / voices/manifest.json）`);
    const allInRepo = [
      join(DEST, 'tool', 'data.json'),
      join(DEST, 'tool', 'zh.json'),
      join(DEST, 'tool', 'voices', 'manifest.json'),
    ].every((p) => existsSync(p));
    if (allInRepo) {
      console.warn(`${TAG}   复用仓库中已提交的 3 个 JSON，跳过生成。`);
      if (CHECK_ONLY) {
        console.error(`${TAG} --check：真源不可用，无法校验。`);
        process.exit(1);
      }
      return;
    }
    console.error(`${TAG}   且仓库中也没有这 3 个 JSON —— 该工具将无法工作。`);
    console.error(`${TAG}   请设置 MOVIE_LINE_SRC 指向真源目录，或先提交一次生成产物。`);
    process.exit(1);
  }

  const { data, zh, manifest, files } = build();

  // ---- 自检：条数 / 键集合一致性（任何一项不过 → 立刻失败，不产出残缺产物） ----
  const errors = [];
  if (data.items.length !== EXPECTED_COUNT) {
    errors.push(`data.json 条目数 ${data.items.length} != 期望 ${EXPECTED_COUNT}`);
  }
  if (files.size !== data.items.length) {
    errors.push(`data.json 存在重复 file（${data.items.length} 条 / ${files.size} 唯一）`);
  }
  const zhKeys = Object.keys(zh).filter((k) => !k.startsWith('_'));
  const zhOnly = zhKeys.filter((k) => !files.has(k));
  const dataOnly = [...files].filter((f) => !zhKeys.includes(f));
  if (zhOnly.length || dataOnly.length) {
    errors.push(
      `zh.json 与 data.json 键不一致：zh-only ${zhOnly.length} / data-only ${dataOnly.length}`,
    );
  }
  const manifestKeys = Object.keys(manifest.items);
  const manifestExtra = manifestKeys.filter((k) => !files.has(k));
  if (manifestExtra.length) {
    errors.push(`manifest items 含 data.json 之外的键：${manifestExtra.length}`);
  }
  if (errors.length) {
    for (const e of errors) console.error(`${TAG}   ✗ ${e}`);
    process.exit(1);
  }

  // ---- 落盘 ----
  const targets = [
    [join(DEST, 'tool', 'data.json'), serialize(data)],
    [join(DEST, 'tool', 'zh.json'), serialize(zh)],
    [join(DEST, 'tool', 'voices', 'manifest.json'), serialize(manifest)],
  ];
  let changed = 0;
  for (const [path, text] of targets) {
    if (writeIfChanged(path, text)) {
      changed += 1;
      console.log(`${TAG}   ${CHECK_ONLY ? '需更新' : '已写入'} ${path}`);
    } else {
      console.log(`${TAG}   未变化 ${path}`);
    }
  }

  const withVoice = [...files].filter((f) => manifestKeys.includes(f)).length;
  console.log(
    `${TAG} 校验通过：data ${data.items.length} / zh ${zhKeys.length} / manifest ${manifestKeys.length}` +
      `（有音轨 ${withVoice} / 无音轨 ${files.size - withVoice}）`,
  );

  if (CHECK_ONLY && changed > 0) {
    console.error(`${TAG} --check：有 ${changed} 个文件与真源规则产物不一致。`);
    process.exit(1);
  }
  console.log(`${TAG} 完成${CHECK_ONLY ? '（check 模式，未写盘）' : `，重写 ${changed} 个文件`}。`);
}

main();
