#!/usr/bin/env node
/**
 * _src-tmp 同步检查器 —— 守住「仓库外源料镜像」与真源的一致性。
 *
 * 为什么需要它（这是本方案的关键配套）：
 *   `_src-tmp/` 是若干**仓库外源料库**的本地镜像，它的唯一用途是「让只有仓库权限的执行方
 *   （Trae）看得见源料」。它被 .gitignore 排除，**不在版本库里**，因此没有任何自动机制
 *   会发现它已过期。
 *
 *   而「保留在磁盘不清空」意味着镜像会长期存在 —— 一旦真源被改过而镜像没跟上，
 *   执行方就会**基于过期内容工作**，产出错误结果且无人察觉。所以必须显式校验。
 *
 * 判据铁律：**只比内容 sha1**，不比 mtime / 文件大小（大小仅作预筛）。
 *
 * ── 多源根（v2 新增） ──────────────────────────────────────────────
 *   源根用 SOURCES 声明。`name: null` 的源根落在 `_src-tmp/` **根**下（历史布局，保持不变，
 *   以免既有 57 个文件的路径发生 churn）；`name: 'X'` 的源根落在 `_src-tmp/X/` 下。
 *   `_manifest.json` 里每个源根单独成条（`sources[]`），因此**能区分多个源根**。
 *
 *   收集规则按源根分两种：
 *     - `mode: 'legacy'`  → 沿用 v1 规则（`内容/**` + `工具/*.{py,html}` + 根 `*.md`），
 *                            保证历史镜像逐字节不变。
 *     - 其余               → **白名单顶层条目** + **文本扩展名**过滤 + 单文件体积上限。
 *                            只靠「扩展名白名单」即可保证镜像内**零二进制大件**，
 *                            不需要（也不该）靠事后扫描去补救。
 *
 * 用法：
 *   node scripts/src-tmp-sync.mjs            # 检查（默认）
 *   node scripts/src-tmp-sync.mjs --refresh  # 重新拷贝 + 重建基准清单
 *   node scripts/src-tmp-sync.mjs --json     # 机器可读输出
 *
 * 退出码：0 = 一致；1 = 有差异（或真源缺失导致不可判）；2 = 用法错误。
 */

import { createHash } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
} from 'node:fs';
import { join, relative, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const DST = join(ROOT, '_src-tmp');
const MANIFEST = join(DST, '_manifest.json');

/** 镜像总体积上限（MB）—— 卡面 acceptance 的硬指标。 */
const MAX_TOTAL_MB = 40;

/** 单个文件体积上限：超过即判为「大件」跳过（镜像是让人读得懂生成链路，不是搬素材）。 */
const MAX_FILE_BYTES = 3 * 1024 * 1024;

/** 目录名一律不进入镜像。 */
const SKIP_DIRS = new Set(['__pycache__', '.git', 'node_modules', '.venv', 'venv', '.idea', '.vscode']);

/** 文本类扩展名白名单 —— 不在表内的一律不收（这是「零二进制大件」的**主判据**）。 */
const TEXT_EXT = new Set([
  '.md', '.markdown', '.txt', '.rst',
  '.html', '.htm', '.css', '.xml', '.svg',
  '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.vue',
  '.json', '.jsonc', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.env',
  '.py', '.sh', '.bash', '.bat', '.ps1',
  '.csv', '.tsv', '.log', '.srt', '.vtt',
  '.sql', '.mermaid', '.patch', '.diff',
]);

// ─────────────────────────── 源根声明 ───────────────────────────

const SOURCES = [
  {
    name: null,
    root: 'C:/Users/ZhuanZ1/Documents/WS/英文学习',
    desc: '英文学习方法论与生成脚本（《基本英文100》/ 龙英语本土化）',
    mode: 'legacy',
  },
  {
    name: '每日英语',
    root: 'D:/workspaces/每日英语',
    desc: 'movie-line-shadowing 素材源（含生成管线的 Python / 配置 / 词表 JSON）',
    mode: 'named',
    entries: ['tool', 'docs', '_qa', '_tts_logs'],
    rootFiles: false,
  },
  {
    name: '每日英语台词',
    root: 'D:/workspaces/每日英语台词',
    desc: '音频/素材侧审计现场（T-013 的核查对象：标签表 / 帧 OCR / 隔离片段 / 转写日志）',
    mode: 'named',
    entries: ['_audit', '_logs', '_taxonomy', '_orphan_voices', '_zh', 'tool', 'tool_phrase'],
    rootFiles: true,
  },
];

// ─────────────────────────── 收集规则 ───────────────────────────

function sha1Of(path) {
  return createHash('sha1').update(readFileSync(path)).digest('hex');
}

function walk(dir, onFile) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      walk(full, onFile);
    } else {
      onFile(full);
    }
  }
}

/**
 * v1 规则（单一源根时代）—— 原样保留，保证既有镜像逐字节不变。
 * 范围：`内容/**`、`工具/*.{py,html}`（跳过子目录与 .bak）、根目录 `*.md`。
 */
function collectLegacy(srcRoot) {
  const out = [];
  const push = (full, rel) => {
    out.push({ rel, sha1: sha1Of(full), size: statSync(full).size });
  };

  const contentRoot = join(srcRoot, '内容');
  if (existsSync(contentRoot)) {
    walk(contentRoot, (full) => push(full, relative(srcRoot, full).split('\\').join('/')));
  }

  const toolRoot = join(srcRoot, '工具');
  if (existsSync(toolRoot)) {
    for (const name of readdirSync(toolRoot).sort()) {
      const full = join(toolRoot, name);
      if (!statSync(full).isFile()) continue; // 跳过「样张/」等目录
      if (name.includes('.bak')) continue; // 跳过人工备份
      if (!/\.(py|html)$/i.test(name)) continue;
      push(full, `工具/${name}`);
    }
  }

  for (const name of readdirSync(srcRoot).sort()) {
    const full = join(srcRoot, name);
    if (statSync(full).isFile() && /\.md$/i.test(name)) push(full, name);
  }

  return out;
}

/**
 * 具名源根规则 —— 白名单顶层条目 + 文本扩展名过滤 + 单文件体积上限。
 * 返回 `{ items, skipped }`，`skipped` 只用于报告（便于人工确认「没漏掉该收的东西」）。
 */
function collectNamed(spec) {
  const items = [];
  const skipped = [];
  const seen = new Set();

  const consider = (full) => {
    const rel = relative(spec.root, full).split('\\').join('/');
    if (seen.has(rel)) return;
    seen.add(rel);
    if (rel.split('/').some((seg) => SKIP_DIRS.has(seg))) return;

    const st = statSync(full);
    const ext = extname(rel).toLowerCase();
    if (!TEXT_EXT.has(ext)) {
      skipped.push({ rel, size: st.size, why: 'non-text' });
      return;
    }
    if (st.size > MAX_FILE_BYTES) {
      skipped.push({ rel, size: st.size, why: 'too-big' });
      return;
    }
    items.push({ rel, sha1: sha1Of(full), size: st.size });
  };

  for (const entry of spec.entries || []) {
    const full = join(spec.root, entry);
    if (!existsSync(full)) continue;
    if (statSync(full).isDirectory()) walk(full, consider);
    else consider(full);
  }

  if (spec.rootFiles) {
    for (const name of readdirSync(spec.root).sort()) {
      const full = join(spec.root, name);
      if (statSync(full).isFile()) consider(full);
    }
  }

  items.sort((a, b) => (a.rel < b.rel ? -1 : 1));
  return { items, skipped };
}

/** 按清单里存的 spec 复现收集（check 侧使用，保证与 refresh 同一套规则）。 */
function collectFor(spec) {
  if (spec.mode === 'legacy') return { items: collectLegacy(spec.root), skipped: [] };
  return collectNamed(spec);
}

/**
 * 收集**镜像目录**里的文件（用于「镜像是否被直接改动」的比对）。
 * 与各 collect* 的区别：这里不做任何过滤 —— 镜像里**多出任何文件都是异常**，
 * 必须全收才能检出；只排除基准清单自己（_manifest.json）。
 */
function collectAt(root) {
  const out = [];
  walk(root, (full) => {
    const rel = relative(root, full).split('\\').join('/');
    if (rel === '_manifest.json') return;
    out.push({ rel, sha1: sha1Of(full), size: statSync(full).size });
  });
  return out;
}

function loadManifest() {
  if (!existsSync(MANIFEST)) return null;
  try {
    return JSON.parse(readFileSync(MANIFEST, 'utf8'));
  } catch {
    return null;
  }
}

function mb(bytes) {
  return (bytes / 1024 / 1024).toFixed(2);
}

// ─────────────────────────── refresh ───────────────────────────

function refresh() {
  const sources = [];
  const items = [];

  for (const src of SOURCES) {
    const prefix = src.name ? `${src.name}/` : '';
    const available = existsSync(src.root);
    const spec = {
      name: src.name,
      root: src.root,
      desc: src.desc,
      mode: src.mode,
      entries: src.entries,
      rootFiles: src.rootFiles,
      prefix,
    };

    if (!available) {
      console.warn(`⚠ 真源不可访问，跳过：${src.root}`);
      sources.push({ ...spec, available: false, count: 0, bytes: 0, skipped: [] });
      continue;
    }

    const { items: list, skipped } = collectFor(spec);
    let bytes = 0;
    for (const it of list) {
      const from = join(src.root, it.rel);
      const to = join(DST, prefix + it.rel);
      mkdirSync(dirname(to), { recursive: true });
      copyFileSync(from, to);
      items.push({ rel: prefix + it.rel, sha1: it.sha1, size: it.size, src: src.name });
      bytes += it.size;
    }

    sources.push({
      ...spec,
      available: true,
      count: list.length,
      bytes,
      nonTextSkipped: skipped.filter((s) => s.why === 'non-text').length,
      tooBigSkipped: skipped.filter((s) => s.why === 'too-big').map((s) => s.rel),
    });
    console.log(
      `✓ ${src.name ?? '(根)'}  ${String(list.length).padStart(4)} 个文件  ${mb(bytes).padStart(7)} MB  ← ${src.root}`
    );
  }

  const total = items.reduce((a, b) => a + b.size, 0);
  writeFileSync(
    MANIFEST,
    JSON.stringify(
      { capturedAt: new Date().toISOString(), count: items.length, sources, items },
      null,
      2
    )
  );

  console.log('');
  console.log(`✓ 已刷新镜像：${items.length} 个文件，共 ${mb(total)} MB（上限 ${MAX_TOTAL_MB} MB）`);
  console.log(`  镜像：${DST}`);
  for (const s of sources) {
    if (!s.available) continue;
    if (s.tooBigSkipped.length) console.log(`  超限跳过（${s.name ?? '(根)'}）：${s.tooBigSkipped.join(', ')}`);
  }
  if (total / 1024 / 1024 >= MAX_TOTAL_MB) {
    console.error(`✗ 镜像总体积 ${mb(total)} MB 已超过上限 ${MAX_TOTAL_MB} MB —— 请收紧白名单/体积上限。`);
    process.exit(1);
  }
  process.exit(0);
}

// ─────────────────────────── check ───────────────────────────

function diff(aMap, bMap) {
  const changed = [];
  const added = [];
  const removed = [];
  for (const [rel, a] of aMap) {
    const b = bMap.get(rel);
    if (!b) added.push(rel);
    else if (b.sha1 !== a.sha1) changed.push(rel);
  }
  for (const rel of bMap.keys()) if (!aMap.has(rel)) removed.push(rel);
  return { changed, added, removed };
}

function check(asJson) {
  const manifest = loadManifest();
  if (!manifest) {
    const msg = `镜像基准清单缺失（${MANIFEST}）—— 请先跑 --refresh 建立基准。`;
    if (asJson) console.log(JSON.stringify({ ok: false, reason: 'manifest-missing', message: msg }));
    else console.error(`✗ ${msg}`);
    process.exit(1);
  }

  // 三方比对：① 真源现在的内容  ② 基准清单（上次刷新时的真源）  ③ 镜像磁盘上的内容
  //   - ① vs ② 不等 → 真源被改过，镜像过期
  //   - ③ vs ② 不等 → 镜像被直接改过（脏镜像：有人往这里面写东西了）
  // 两个方向都必须查，否则「镜像被改」会被漏掉（反证测试实测过这个漏洞）。
  const baseline = new Map(manifest.items.map((i) => [i.rel, i]));
  const currentDst = existsSync(DST) ? collectAt(DST) : [];
  const dstMap = new Map(currentDst.map((i) => [i.rel, i]));

  // ③ vs ②：镜像是否被直接改动（不受真源可用性影响，任何时候都能查）
  const dstVsBase = diff(dstMap, baseline);
  const dstDirty =
    dstVsBase.changed.length > 0 || dstVsBase.added.length > 0 || dstVsBase.removed.length > 0;

  // ① vs ②：逐源根判定真源是否已前进（需该源根可访问才判得了）
  const sourceList = Array.isArray(manifest.sources) ? manifest.sources : [];
  const perSource = [];
  let anyStale = false;
  let checkedCount = 0;

  for (const spec of sourceList) {
    const label = spec.name ?? '(根)';
    const baseForSrc = new Map(
      manifest.items.filter((i) => i.src === spec.name).map((i) => [i.rel, i])
    );
    if (!existsSync(spec.root)) {
      perSource.push({ name: label, root: spec.root, available: false, stale: null, baselineCount: baseForSrc.size });
      continue;
    }
    const { items } = collectFor(spec);
    const nowMap = new Map(items.map((i) => [spec.prefix + i.rel, i]));
    const d = diff(nowMap, baseForSrc);
    const stale = d.changed.length > 0 || d.added.length > 0 || d.removed.length > 0;
    if (stale) anyStale = true;
    checkedCount += 1;
    perSource.push({
      name: label,
      root: spec.root,
      available: true,
      stale,
      baselineCount: baseForSrc.size,
      nowCount: nowMap.size,
      changed: d.changed,
      added: d.added,
      removed: d.removed,
    });
  }

  const srcStale = checkedCount === 0 ? null : anyStale;
  const ok = !dstDirty && srcStale !== true;

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          ok,
          mirrorDirty: dstDirty,
          sourceStale: srcStale,
          mirrorVsBaseline: dstVsBase,
          perSource,
          baselineAt: manifest.capturedAt,
        },
        null,
        2
      )
    );
    process.exit(ok ? 0 : 1);
  }

  if (ok) {
    console.log(
      `✓ 镜像完好且与全部真源一致（镜像 ${currentDst.length} 个文件；已比对真源 ${checkedCount}/${sourceList.length} 个源根，基准捕获于 ${manifest.capturedAt}）`
    );
    for (const s of perSource) {
      console.log(
        `    ${s.available ? '·' : '⚠'} ${s.name.padEnd(10)} ${s.available ? `${s.nowCount} 个文件` : '真源不可访问（只验了镜像未被改动）'}`
      );
    }
    process.exit(0);
  }

  console.error('✗ _src-tmp 镜像有问题：');
  if (dstDirty) {
    console.error('  【镜像被直接改动】—— 有人往镜像里写了东西（它不该被写入）：');
    if (dstVsBase.changed.length) console.error(`    改动 ${dstVsBase.changed.length}：\n      ` + dstVsBase.changed.join('\n      '));
    if (dstVsBase.added.length) console.error(`    新增 ${dstVsBase.added.length}：\n      ` + dstVsBase.added.join('\n      '));
    if (dstVsBase.removed.length) console.error(`    删除 ${dstVsBase.removed.length}：\n      ` + dstVsBase.removed.join('\n      '));
  }
  for (const s of perSource) {
    if (!s.stale) continue;
    console.error(`  【真源已前进，镜像过期】源根「${s.name}」（${s.root}）—— 执行方可能正基于旧内容工作：`);
    if (s.changed.length) console.error(`    变更 ${s.changed.length}：\n      ` + s.changed.join('\n      '));
    if (s.added.length) console.error(`    新增 ${s.added.length}：\n      ` + s.added.join('\n      '));
    if (s.removed.length) console.error(`    删除 ${s.removed.length}：\n      ` + s.removed.join('\n      '));
  }
  if (dstDirty) {
    console.error('\n  镜像被改动说明有产出写错了位置。若那些改动是该保留的，');
    console.error('  应把它移进项目正式目录（public/tools/... 或 src/data/tools/...），再 --refresh 覆盖镜像。');
  } else {
    console.error('\n  修复：node scripts/src-tmp-sync.mjs --refresh');
  }
  process.exit(1);
}

// ─────────────────────────── 入口 ───────────────────────────

const arg = process.argv[2];
if (arg === '--refresh') refresh();
else if (arg === '--json') check(true);
else if (arg === undefined || arg === '--check') check(false);
else {
  console.error(`未知参数：${arg}\n用法：node scripts/src-tmp-sync.mjs [--refresh|--json]`);
  process.exit(2);
}
