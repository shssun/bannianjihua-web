#!/usr/bin/env node
/**
 * 一次性迁移：双文件契约（BACKLOG.md / EXEC-REPORT.md）
 *            -> 只追加事件流（TASKS.md / OWNER-LOG.md / EXEC-LOG.md）
 *
 * 只读旧文件，不删不改。默认 dry-run，加 --write 才落盘。
 *
 * 用法：
 *   node scripts/oneoff/migrate-comms.mjs            # dry-run，打印生成内容
 *   node scripts/oneoff/migrate-comms.mjs --write    # 落盘
 *   node scripts/oneoff/migrate-comms.mjs --write --apply-exec   # 同时把旧文件 git mv 进 docs/archive/
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';

const WRITE = process.argv.includes('--write');
const APPLY_EXEC = process.argv.includes('--apply-exec');

// ── 未终态任务（其余 18 项已 verified，归档留档）─────────────────────
const OPEN = ['T-001', 'T-013', 'T-014', 'T-015', 'T-023', 'T-024'];

// 迁移用的合成时间戳：T0 < T1 < T2，保证「最后一条事件」推导正确。
//   T0 我方 dispatch（历史）
//   T1 执行方迁移过来的事件 / 我方自办任务的 claim   ← 必须晚于 T0
//   T2 cutover 全局事件
// ⚠️ 必须是**真实当前时刻的过去**，绝不能凭空写一个看似合理的值 ——
//    把事件写到未来会让后续事件的排序全部错乱（本轮踩过一次）。
const T0 = '2026-10-14T14:19:00Z';
const T1 = '2026-10-14T14:20:00Z';
const T2 = '2026-10-14T14:21:00Z';

const HEAD_KEY = new Set(['priority', 'area', 'depends', 'size']);
const DROP_KEY = new Set(['owner', 'status', 'verdict']);
const CARD_RE = /^##\s+(T-\d{3})\s*·\s*(.+?)\s*$/;

// ⚠️ 必须归一化行尾：仓库工作区是 CRLF，而 JS 正则里 `.` 不匹配 `\r`，
//    会让 `^key: value$` 整行匹配失败、静默走兜底分支。
const read = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

// ── 切卡片 ────────────────────────────────────────────────────────
function splitCards(text) {
  const cards = [];
  let cur = null;
  for (const ln of text.split('\n')) {
    const m = ln.match(CARD_RE);
    if (m) {
      if (cur) cards.push(cur);
      cur = { id: m[1], title: m[2], body: [] };
    } else if (cur) {
      cur.body.push(ln);
    }
  }
  if (cur) cards.push(cur);
  return cards;
}

// ── BACKLOG 卡 -> TASKS 卡（剥掉 status/verdict/owner/轨迹）──────────
function toTaskCard(card) {
  const out = [];
  let mode = 'head';
  let sawAcceptance = false;
  for (const ln of card.body) {
    const kv = ln.match(/^([a-z_]+):\s?(.*)$/);
    if (kv && ln === ln.trimStart()) {
      const k = kv[1];
      if (DROP_KEY.has(k)) { mode = 'drop'; continue; }
      if (k === 'acceptance') { mode = 'acceptance'; sawAcceptance = true; out.push('acceptance:'); continue; }
      if (k === 'spec') { mode = 'spec'; out.push(`spec: ${kv[2]}`); continue; }
      if (HEAD_KEY.has(k)) { mode = 'head'; out.push(`${k}: ${kv[2]}`); continue; }
      mode = 'drop'; continue;
    }
    if (mode === 'drop') continue;
    // 我方轨迹行（恰好 2 空格缩进 + - <action> <ISO8601> | ...）
    if (/^\s{2,}-\s+(verify|reject|retract|resubmit)\s+\d{4}-/.test(ln)) continue;
    out.push(ln.replace(/\s+$/, ''));
  }
  // 去掉尾部空行
  while (out.length && out[out.length - 1] === '') out.pop();
  while (out.length && out[0] === '') out.shift();
  if (!sawAcceptance) throw new Error(`${card.id}: 未解析到 acceptance 段`);
  return `## ${card.id} · ${card.title}\n\n${out.join('\n')}\n`;
}

// ── EXEC-REPORT 块 -> EXEC-LOG 事件行 ─────────────────────────────
function toExecEvent(card) {
  let status_raw = null, status = null, evidence = null;
  for (const ln of card.body) {
    let m;
    if ((m = ln.match(/^status:\s*(\S+)\s*$/))) status = m[1];
    if ((m = ln.match(/^evidence:\s*(.*)$/))) evidence = m[1].trim();
  }
  if (!status || status === 'todo') return null;          // 未认领，无事件
  if (!evidence || /^（.*）$/.test(evidence)) return null; // 占位空 evidence
  // 把 evidence 的 ` | ` 拆成 kv 对
  const parts = evidence.split(/\s\|\s/).map((s) => s.replace(/\|/g, '/').trim()).filter(Boolean);
  const fixed = [];
  for (const p of parts) {
    if (!/^[a-z_]+\s*=/.test(p)) { fixed.push(`note=${p}`); continue; }
    fixed.push(p.replace(/^([a-z_]+)\s*=\s*/, '$1='));
  }
  // note 过长则截断（全文见归档）
  const outParts = [];
  for (const p of fixed) {
    if (p.startsWith('note=') && p.length > 800) {
      outParts.push(`note=${p.slice(5, 800)}…（全文见 docs/archive/EXEC-REPORT.md）`);
    } else outParts.push(p);
  }
  return `${T1} | ${card.id} | ${status} | migrated=1 | src=docs/archive/EXEC-REPORT.md | ${outParts.join(' | ')}`;
}

// ── 主流程 ───────────────────────────────────────────────────────
// ⚠️ 归档后 `docs/BACKLOG.md` 已是跳转说明（不是卡片源），必须显式指向归档件
const BL = existsSync('docs/archive/BACKLOG.md') ? 'docs/archive/BACKLOG.md' : 'docs/BACKLOG.md';
const EX = existsSync('docs/archive/EXEC-REPORT.md') ? 'docs/archive/EXEC-REPORT.md' : 'docs/EXEC-REPORT.md';

const backlog = read(BL);
const execrep = read(EX);

const blCards = splitCards(backlog);
const exCards = splitCards(execrep);
const blById = new Map(blCards.map((c) => [c.id, c]));
const exById = new Map(exCards.map((c) => [c.id, c]));

// 缺失检查（阳性对照：先把「找不到」这件事验出来）
const missing = OPEN.filter((id) => !blById.has(id));
if (missing.length) throw new Error(`BACKLOG 里找不到这些卡：${missing.join(', ')}`);
console.log(`[migrate] BACKLOG 解析到 ${blCards.length} 张卡；取未终态 ${OPEN.length} 张`);
console.log(`[migrate] EXEC-REPORT 解析到 ${exCards.length} 个块`);
console.log(`[migrate] 未在 EXEC-REPORT 出现的未终态任务：` +
  OPEN.filter((id) => !exById.has(id)).join(', ') || '(无)');

// 1) TASKS.md
const taskCards = OPEN.map((id) => toTaskCard(blById.get(id))).join('\n');
const tasksMd = `# 任务卡（TASKS.md）

> **唯一写者：team-lead（我方）。执行方只读，一个字都不要改。**
>
> **三条铁律**
> 1. **只追加，不修改。** 任何人不得删除、改写、重排已有行。
> 2. **不写别人的文件。** 我方只碰本文件 + \`docs/OWNER-LOG.md\`；执行方只碰 \`docs/EXEC-LOG.md\`。
> 3. **任务 id 单调递增、永不复用。** 改需求 = 追加一张**新卡**，旧卡在 \`OWNER-LOG.md\` 写一条 \`supersede\`；**绝不原地改旧卡**。
>
> **状态不存储，只推导**：取两条日志中该 id **时间戳最新**的一条事件（见 \`docs/AI-HANDOFF.md\` §7）。
>
> 通道切换：\`${T2}\` 起生效。此前 18 项已验证任务的定义与验收记录见
> \`docs/archive/BACKLOG.md\`（不删，可追溯）。

---

${taskCards}`;

// 2) EXEC-LOG.md
const execEvents = OPEN.map((id) => (exById.has(id) ? toExecEvent(exById.get(id)) : null)).filter(Boolean);
const execLogMd = `# 执行方事件流（EXEC-LOG.md）

> **唯一写者：执行方（外部 AI 工具）。我方只读。**
>
> 一行一条事件，格式固定：
> \`\`\`
> <ISO8601-UTC> | <id> | <verb> | k=v | k=v | ...
> \`\`\`
> - \`<id>\` 形如 \`T-024\`；全局事件用 \`-\`
> - \`<verb>\` 白名单：\`claim\` \`done\` \`blocked\` \`note\`
> - 分隔符 \`|\` 前后**恰好各一个空格**
>
> **每次只做一件事：往本文件末尾追加一行。** 不要改任何已有行，不要动别人的文件。
> 完成后追加 \`done\`，附 \`commit=\` / \`files=\` / \`checks=\` / \`note=\`。
> 任务定义在 \`docs/TASKS.md\`（只读）；通道切换前的历史见 \`docs/archive/EXEC-REPORT.md\`。

---

${execEvents.join('\n')}
`;

// 3) OWNER-LOG.md
const ownerLines = [];
for (const id of OPEN) {
  const c = blById.get(id);
  const prio = (c.body.find((l) => l.startsWith('priority:')) || 'priority=?').split(':')[1].trim();
  ownerLines.push(`${T0} | ${id} | dispatch | migrated=1 | priority=${prio} | title=${c.title.replace(/\|/g, '/')}`);
}
ownerLines.push(`${T1} | T-023 | claim | note=我方自办：按需镜像「每日英语」源料进 _src-tmp/（执行方请跳过）`);
ownerLines.push(`${T2} | - | note | kind=cutover | detail=沟通通道由 BACKLOG.md/EXEC-REPORT.md 切换为 TASKS.md/OWNER-LOG.md/EXEC-LOG.md`);

const ownerLogMd = `# 我方事件流（OWNER-LOG.md）

> **唯一写者：team-lead（我方）。**
>
> 一行一条事件，格式同 \`docs/EXEC-LOG.md\`。
> \`<verb>\` 白名单：\`dispatch\` \`hold\` \`claim\` \`blocked\` \`verify\` \`reject\` \`supersede\` \`note\`
> 全局事件 id 位写 \`-\`。
>
> \`migrated=1\` 表示该行由旧双文件契约迁移而来，时间戳是**迁移时刻**而非原始时刻；
> 原始记录见 \`docs/archive/BACKLOG.md\`。

## 归档（18 项已验证任务）

> T-002 ~ T-022 中状态为 verified 的 18 项，定义 / evidence / 我方验收轨迹见 \`docs/archive/BACKLOG.md\`。
> 本文件不再复制它们的内容 —— **一个事实只有一个家**。

## 事件

${ownerLines.join('\n')}
`;

// ── 输出 ─────────────────────────────────────────────────────────
const outputs = [
  ['docs/TASKS.md', tasksMd],
  ['docs/OWNER-LOG.md', ownerLogMd],
  ['docs/EXEC-LOG.md', execLogMd],
];

for (const [p, content] of outputs) {
  console.log(`\n${'='.repeat(72)}\n=== ${p}  (${Buffer.byteLength(content, 'utf8')} B / ${content.split('\n').length} 行)\n${'='.repeat(72)}`);
  console.log(content);
}

if (!WRITE) {
  console.log('\n[migrate] dry-run 结束。加 --write 落盘。');
  process.exit(0);
}

for (const [p, content] of outputs) {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, 'utf8');
  console.log(`[migrate] 写入 ${p}`);
}

if (APPLY_EXEC) {
  mkdirSync('docs/archive', { recursive: true });
  for (const f of ['docs/BACKLOG.md', 'docs/EXEC-REPORT.md', 'docs/EXEC-COMMS.md']) {
    if (!existsSync(f)) { console.log(`[migrate] 跳过（不存在）${f}`); continue; }
    execFileSync('git', ['mv', f, f.replace('docs/', 'docs/archive/')], {
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    });
    console.log(`[migrate] git mv ${f} -> docs/archive/`);
  }
}
