#!/usr/bin/env node
/**
 * _src-tmp 同步检查器 —— 守住「仓库外源料镜像」与真源的一致性。
 *
 * 为什么需要它（这是本方案的关键配套）：
 *   `_src-tmp/` 是仓库外源料库 `C:/Users/ZhuanZ1/Documents/WS/英文学习/` 的**本地镜像**，
 *   它的唯一用途是「让只有仓库权限的执行方（Trae）看得见源料」。它被 .gitignore 排除，
 *   **不在版本库里**，因此没有任何自动机制会发现它已过期。
 *
 *   而「保留在磁盘不清空」意味着镜像会长期存在 —— 一旦真源被改过而镜像没跟上，
 *   执行方就会**基于过期内容工作**，产出错误结果且无人察觉。所以必须显式校验。
 *
 * 判据铁律：**只比内容 sha1**，不比 mtime / 文件大小（大小仅作预筛）。
 *
 * 用法：
 *   node scripts/src-tmp-sync.mjs            # 检查（默认）
 *   node scripts/src-tmp-sync.mjs --refresh  # 重新拷贝 + 重建基准清单
 *   node scripts/src-tmp-sync.mjs --json     # 机器可读输出
 *
 * 退出码：0 = 一致；1 = 有差异（或真源缺失）；2 = 用法错误。
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const DST = join(ROOT, '_src-tmp');
const MANIFEST = join(DST, '_manifest.json');

/** 真源目录。若机器上没有（例如换机器 / CI），本脚本会明确报「不可校验」而非静默通过。 */
const SRC = 'C:/Users/ZhuanZ1/Documents/WS/英文学习';

/** 纳入镜像的范围：内容 md、生成脚本（py）、工具内 html；排除样张与 .bak 备份。 */
function collect(srcRoot) {
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
      if (!statSync(full).isFile()) continue;          // 跳过「样张/」等目录
      if (name.includes('.bak')) continue;              // 跳过人工备份
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

function walk(dir, onFile) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, onFile);
    else onFile(full);
  }
}

/**
 * 收集**镜像目录**里的文件（用于「镜像是否被直接改动」的比对）。
 * 与 collect() 的区别：这里不做「只收 py/html/md」的过滤 —— 镜像里**多出任何文件都是异常**，
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

function sha1Of(path) {
  return createHash('sha1').update(readFileSync(path)).digest('hex');
}

function loadManifest() {
  if (!existsSync(MANIFEST)) return null;
  try {
    return JSON.parse(readFileSync(MANIFEST, 'utf8'));
  } catch {
    return null;
  }
}

function refresh() {
  if (!existsSync(SRC)) {
    console.error(`✗ 真源不存在，无法刷新：${SRC}`);
    process.exit(1);
  }
  const items = collect(SRC);
  mkdirSync(DST, { recursive: true });
  for (const it of items) {
    const from = join(SRC, it.rel);
    const to = join(DST, it.rel);
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
  }
  writeFileSync(
    MANIFEST,
    JSON.stringify({ source: SRC, capturedAt: new Date().toISOString(), count: items.length, items }, null, 2)
  );
  console.log(`✓ 已刷新镜像：${items.length} 个文件（${(items.reduce((a, b) => a + b.size, 0) / 1024).toFixed(1)} KB）`);
  console.log(`  真源：${SRC}`);
  console.log(`  镜像：${DST}`);
  process.exit(0);
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

  const sourceAvailable = existsSync(SRC);
  const currentSrc = sourceAvailable ? collect(SRC) : [];
  const currentDst = existsSync(DST) ? collectAt(DST) : [];

  const diff = (aMap, bMap) => {
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
  };

  const srcMap = new Map(currentSrc.map((i) => [i.rel, i]));
  const dstMap = new Map(currentDst.map((i) => [i.rel, i]));

  // 镜像 vs 基准：镜像是否被直接改动（不受真源可用性影响，任何时候都能查）
  const dstVsBase = diff(dstMap, baseline);
  const dstDirty =
    dstVsBase.changed.length > 0 || dstVsBase.added.length > 0 || dstVsBase.removed.length > 0;

  // 真源 vs 基准：真源是否已前进（需真源可访问才判得了）
  const srcVsBase = sourceAvailable ? diff(srcMap, baseline) : null;
  const srcStale = srcVsBase
    ? srcVsBase.changed.length > 0 || srcVsBase.added.length > 0 || srcVsBase.removed.length > 0
    : null;

  const ok = !dstDirty && srcStale !== true;

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          ok,
          sourceAvailable,
          mirrorDirty: dstDirty,
          sourceStale: srcStale,
          mirrorVsBaseline: dstVsBase,
          sourceVsBaseline: srcVsBase,
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
      `✓ 镜像完好且与真源一致（${currentDst.length} 个文件，基准捕获于 ${manifest.capturedAt}）` +
        (sourceAvailable ? '' : ' —— 注意：真源不可访问，只验了镜像未被改动')
    );
    process.exit(0);
  }

  console.error('✗ _src-tmp 镜像有问题：');
  if (dstDirty) {
    console.error('  【镜像被直接改动】—— 有人往镜像里写了东西（它不该被写入）：');
    if (dstVsBase.changed.length) console.error(`    改动 ${dstVsBase.changed.length}：\n      ` + dstVsBase.changed.join('\n      '));
    if (dstVsBase.added.length) console.error(`    新增 ${dstVsBase.added.length}：\n      ` + dstVsBase.added.join('\n      '));
    if (dstVsBase.removed.length) console.error(`    删除 ${dstVsBase.removed.length}：\n      ` + dstVsBase.removed.join('\n      '));
  }
  if (srcStale) {
    console.error('  【真源已前进，镜像过期】—— 执行方可能正基于旧内容工作：');
    if (srcVsBase.changed.length) console.error(`    变更 ${srcVsBase.changed.length}：\n      ` + srcVsBase.changed.join('\n      '));
    if (srcVsBase.added.length) console.error(`    新增 ${srcVsBase.added.length}：\n      ` + srcVsBase.added.join('\n      '));
    if (srcVsBase.removed.length) console.error(`    删除 ${srcVsBase.removed.length}：\n      ` + srcVsBase.removed.join('\n      '));
  }
  if (dstDirty) {
    console.error('\n  镜像被改动说明有产出写错了位置。若那些改动是该保留的，');
    console.error('  应把它移进项目正式目录（public/tools/... 或 src/data/tools/...），再 --refresh 覆盖镜像。');
  } else {
    console.error('\n  修复：node scripts/src-tmp-sync.mjs --refresh');
  }
  process.exit(1);
}

const arg = process.argv[2];
if (arg === '--refresh') refresh();
else if (arg === '--json') check(true);
else if (arg === undefined || arg === '--check') check(false);
else {
  console.error(`未知参数：${arg}\n用法：node scripts/src-tmp-sync.mjs [--refresh|--json]`);
  process.exit(2);
}
