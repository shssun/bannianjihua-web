/**
 * scripts/comms.mjs —— 「只追加事件流」协作模型的校验 / 状态推导 CLI。
 *
 * 设计来源：docs/COMMS-REDESIGN.md（三文件 · 三写者 · 零重叠）。
 * 本脚本是 scripts/backlog.mjs（双文件交叉校验，1444 行）的**简化替代**：
 * 新模型把「共享可变状态」彻底去掉，状态不再被存储、而是被**推导**，
 * 因此校验器不再需要替两个写者守边界（无交叉校验 / 无幽灵 id / 无合成函数）。
 *
 * 三个文件、三个写者、零重叠：
 *   docs/TASKS.md      ← 唯一写者 = 我方。任务卡（priority/area/depends/size/spec/acceptance）。只追加、写出即冻结。
 *   docs/OWNER-LOG.md  ← 唯一写者 = 我方。我方事件流（dispatch/hold/claim/blocked/verify/reject/supersede/note）。
 *   docs/EXEC-LOG.md   ← 唯一写者 = 执行方。执行方事件流（claim/done/blocked/note）。
 *
 * 事件行格式（OWNER-LOG / EXEC-LOG 内）：
 *   <ISO8601-UTC> | <id> | <verb> | k=v | k=v | ...
 *   - ISO8601-UTC 必须带 Z 结尾，形如 2026-10-14T14:30:00Z
 *   - id 形如 T-024（^T-\d{3}$）；全局事件用 `-`（`-` 只允许配 `note`）
 *   - verb 必须落在**对应文件**的白名单内（白名单按文件区分）
 *   - k 匹配 ^[a-z_]+$，v 非空且不含 `|`
 *   - 分隔符 `|` 前后**恰好各一个空格**
 *   - 忽略的行：空行 / 以 `#` 开头 / 以 `>` 开头 / markdown 水平分隔线（3+ 个 - * _）
 *
 * 状态推导（唯一规则：看该 id 时间戳最新的**状态承载**事件；无事件 → todo）：
 *   dispatch / hold → todo        claim → doing        blocked → blocked
 *   done → done                   verify → verified     reject → doing
 *   supersede → superseded
 *   ⚠️ note 是**非状态承载**事件（下表无 note）—— 它不改变状态：
 *      推导状态时取「时间戳最新的**状态承载**事件」，note 仅用于展示。
 *   ⚠️ 无法解析的事件行**绝不允许静默跳过**：`status` 会在末尾打印警告并列出 `文件:行号`。
 *
 * 命令：
 *   check              事件行格式 + verb 白名单 + id 唯一/单调 + 终态不可逆 + 卡内禁字。失败 → exit 1。
 *   status             对 TASKS.md 每个 id 推导状态，打印对齐表格 + 汇总 + 「待我方验收」清单。
 *   append-only        对三个文件跑 `git diff`，检查是否删除/改写了任何非空行。有则 exit 1。
 *                      --base <ref>（默认 HEAD）。
 *   selftest           在 os.tmpdir() 造 fixture，断言全部校验/推导逻辑可被检出。
 *
 * 零依赖：仅使用 Node 内置模块（node:fs / node:path / node:process / node:os / node:child_process / node:url）。
 *        不引入任何第三方包。
 * ⚠️ 调用 git 一律用 execFileSync + `stdio: ['ignore','pipe','pipe']` —— 本机宿主沙箱下默认 stdio 会稳定抛 EBUSY。
 */
import { execFileSync } from 'node:child_process';
import {
  appendFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// 常量与路径
// ---------------------------------------------------------------------------

const TAG = '[comms]';
const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, '..');

const REL = Object.freeze({
  tasks: 'docs/TASKS.md',
  owner: 'docs/OWNER-LOG.md',
  exec: 'docs/EXEC-LOG.md',
});

/** 我方事件流 verb 白名单（含「我方自办任务」的 claim/blocked）。 */
const OWNER_VERBS = new Set(['dispatch', 'hold', 'claim', 'blocked', 'verify', 'reject', 'supersede', 'note']);
/** 执行方事件流 verb 白名单。 */
const EXEC_VERBS = new Set(['claim', 'done', 'blocked', 'note']);

/** 状态承载 verb → 推导状态（note 不在其中：非状态承载）。 */
const VERB_STATUS = Object.freeze({
  dispatch: 'todo',
  hold: 'todo',
  claim: 'doing',
  blocked: 'blocked',
  done: 'done',
  verify: 'verified',
  reject: 'doing',
  supersede: 'superseded',
});

/** 展示汇总时固定顺序（superseded 单列）。 */
const STATUS_ORDER = ['todo', 'doing', 'blocked', 'done', 'verified', 'superseded'];

/** TASKS.md 卡内禁止**作为字段**出现的字样（状态由日志推导，卡内不存储）。 */
const FORBIDDEN_WORDS = ['status', 'evidence', 'verdict', '轨迹'];
/**
 * 禁止字样检测：仅当其在卡内以「字段键」(key:) 形式出现时才判违规。
 * 这样 spec / acceptance 的正常散文里提到 `status`（如描述注册表的 `status: 'online'`
 * 属性、或「把 status 标为 blocked」）不会误报，而 `status: done` 这类**存储状态字段**
 * 会被准确检出。兼容列表项前缀（`-` / `*` / `1.`）与中英文冒号。
 */
const RE_FORBIDDEN_FIELD = new RegExp(
  `^\\s*(?:[-*]|\\d+[.)])?\\s*(${FORBIDDEN_WORDS.join('|')})\\s*(?:[:：]|$)`,
);

/** 时间戳排序 / 平票时的文件优先级：OWNER 先（我方拥有最终发言权）。 */
const FILE_RANK = { [REL.owner]: 0, [REL.exec]: 1 };

const RE_ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const RE_ID = /^(?:T-\d{3}|-)$/;
const RE_VERB = /^[a-z]+$/;
const RE_KV_KEY = /^[a-z_]+$/;
const RE_CARD = /^##\s+(T-\d{3})\s*·\s*(.*)$/;
const RE_HEADING = /^#{1,6}\s/;

// ---------------------------------------------------------------------------
// 基础工具
// ---------------------------------------------------------------------------

/**
 * 相对当前工作目录的 POSIX 路径（用于日志显示）。
 * @param {string} abs 绝对路径
 * @returns {string}
 */
function displayPath(abs) {
  return relative(process.cwd(), abs).split(sep).join('/');
}

/**
 * 打印错误并以指定退出码结束进程。
 * @param {string} msg 错误信息
 * @param {number} [code=2] 退出码
 * @returns {never}
 */
function fail(msg, code = 2) {
  console.error(`${TAG} ❌ ${msg}`);
  process.exitCode = code;
  throw new ExitSignal(code);
}

/** 用于在 fail() 时中断控制流但不立即退出进程（保留 exitCode）。 */
class ExitSignal extends Error {}

/**
 * 读取文本文件；文件不存在返回 null（不抛栈）。
 * @param {string} abs 绝对路径
 * @returns {string|null}
 */
function readText(abs) {
  try {
    return readFileSync(abs, 'utf8');
  } catch {
    return null;
  }
}

/** 按行切分，兼容 CRLF。 */
function splitLines(text) {
  return text.replace(/\r\n/g, '\n').split('\n');
}

/**
 * 是否为 markdown 水平分隔线（整行仅由 3 个及以上 `-` / `*` / `_` 组成，允许中间有空格）。
 * 例：`---`、`- - -`、`***`、`___`。用于把标题区与事件区之间的装饰线排除在事件解析之外。
 * @param {string} line 已 trim 的行
 * @returns {boolean}
 */
function isHorizontalRule(line) {
  const compact = line.replace(/\s+/g, '');
  if (compact === '') return false;
  return /^([-*_])\1{2,}$/.test(compact);
}

/**
 * 校验一个形如 `<ISO8601>Z` 的时间戳是否为**真实存在**的 UTC 时刻。
 * @param {string} ts
 * @returns {boolean}
 */
function isRealUtc(ts) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?Z$/.exec(ts);
  if (!m) return false;
  const [, Y, Mo, D, H, Mi, S] = m;
  const y = +Y;
  const mo = +Mo;
  const d = +D;
  const h = +H;
  const mi = +Mi;
  const s = +S;
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59 || s > 59) return false;
  const dt = new Date(Date.UTC(y, mo - 1, d, h, mi, s));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

/** 展示宽度（CJK 记 2）。 */
function strWidth(s) {
  let w = 0;
  for (const ch of String(s)) w += ch.codePointAt(0) > 0xff ? 2 : 1;
  return w;
}

/** 按展示宽度右侧补空格。 */
function padEndW(s, width) {
  const str = String(s);
  const cur = strWidth(str);
  return cur >= width ? str : str + ' '.repeat(width - cur);
}

/** 按展示宽度截断，超出补省略号。 */
function truncateW(s, max) {
  const str = String(s);
  if (strWidth(str) <= max) return str;
  let out = '';
  let w = 0;
  for (const ch of str) {
    const cw = ch.codePointAt(0) > 0xff ? 2 : 1;
    if (w + cw > max - 1) break;
    out += ch;
    w += cw;
  }
  return `${out}…`;
}

// ---------------------------------------------------------------------------
// 事件行解析
// ---------------------------------------------------------------------------

/**
 * 解析一行事件（已 trim 且非忽略行）。
 * 不做 verb 白名单判定（由调用方按文件区分）。
 * @param {string} line
 * @returns {{ok:true, event:{ts:string,id:string,verb:string,kv:Record<string,string>}} | {ok:false, error:string}}
 */
function parseEventLine(line) {
  const parts = line.split(' | ');
  if (parts.some((p) => p.includes('|'))) {
    return { ok: false, error: `事件行分隔符必须是「 | 」（前后各恰好一个空格）：${line}` };
  }
  if (parts.length < 3) {
    return { ok: false, error: `事件行至少需要 3 段（ts | id | verb）：${line}` };
  }
  const [ts, id, verb, ...kvs] = parts;
  if (!RE_ISO_UTC.test(ts) || !isRealUtc(ts)) {
    return { ok: false, error: `时间戳非法（需 ISO8601-UTC 且以 Z 结尾，如 2026-10-14T14:30:00Z）：${ts}` };
  }
  if (!RE_ID.test(id)) {
    return { ok: false, error: `id 非法（应为 T-\\d{3}，全局事件用 -）：${id}` };
  }
  if (!RE_VERB.test(verb)) {
    return { ok: false, error: `verb 非法（应为小写字母）：${verb}` };
  }
  /** @type {Record<string,string>} */
  const kv = {};
  for (const seg of kvs) {
    const idx = seg.indexOf('=');
    if (idx <= 0) {
      return { ok: false, error: `kv 段缺少「=」或键为空：${seg}` };
    }
    const k = seg.slice(0, idx);
    const v = seg.slice(idx + 1);
    if (!RE_KV_KEY.test(k)) {
      return { ok: false, error: `kv 键非法（应匹配 ^[a-z_]+$）：${k}` };
    }
    if (v === '') {
      return { ok: false, error: `kv 值不能为空：${seg}` };
    }
    kv[k] = v;
  }
  return { ok: true, event: { ts, id, verb, kv } };
}

/**
 * 解析一个事件流文件。
 * @param {string} abs 绝对路径
 * @param {string} rel 展示用相对路径（同时作为事件 file 标记）
 * @param {Set<string>} allowedVerbs 本文件允许的 verb 集合
 * @returns {{missing:boolean, errors:Array<{file:string,lineNo:number,msg:string}>, events:Array<object>}}
 */
function parseLogFile(abs, rel, allowedVerbs) {
  const text = readText(abs);
  if (text === null) return { missing: true, errors: [], events: [] };
  const errors = [];
  const events = [];
  splitLines(text).forEach((raw, i) => {
    const lineNo = i + 1;
    const line = raw.trim();
    if (line === '' || line.startsWith('#') || line.startsWith('>') || isHorizontalRule(line)) return;
    const parsed = parseEventLine(line);
    if (!parsed.ok) {
      errors.push({ file: rel, lineNo, msg: parsed.error });
      return;
    }
    const ev = { ...parsed.event, file: rel, lineNo };
    if (!allowedVerbs.has(ev.verb)) {
      errors.push({
        file: rel,
        lineNo,
        msg: `verb 不在本文件白名单内：「${ev.verb}」（允许：${[...allowedVerbs].join(' / ')}）`,
      });
      return;
    }
    events.push(ev);
  });
  return { missing: false, errors, events };
}

/**
 * 在一组事件中挑选「时间戳最新」的一条。
 * 平票规则（确定性）：时间戳相同 → OWNER-LOG 优先；同文件 → 行号更大者胜。
 * @param {Array<object>} events
 * @returns {object|null}
 */
function pickLatest(events) {
  let best = null;
  for (const ev of events) {
    if (best === null || isLater(ev, best)) best = ev;
  }
  return best;
}

/** a 是否比 b「更晚」（用于 pickLatest）。 */
function isLater(a, b) {
  const ta = Date.parse(a.ts);
  const tb = Date.parse(b.ts);
  if (ta !== tb) return ta > tb;
  const ra = FILE_RANK[a.file] ?? 99;
  const rb = FILE_RANK[b.file] ?? 99;
  if (ra !== rb) return ra < rb; // rank 小者（OWNER）优先
  return a.lineNo > b.lineNo;
}

// ---------------------------------------------------------------------------
// TASKS.md 解析
// ---------------------------------------------------------------------------

/**
 * 解析 TASKS.md 的任务卡。
 * @param {string} abs
 * @param {string} rel
 * @returns {{missing:boolean, cards:Array<{id:string,title:string,lineNo:number,body:Array<string>,bodyLines:Array<number>}>}}
 */
function parseTasksFile(abs, rel) {
  const text = readText(abs);
  if (text === null) return { missing: true, cards: [] };
  const cards = [];
  let cur = null;
  splitLines(text).forEach((raw, i) => {
    const lineNo = i + 1;
    const m = RE_CARD.exec(raw);
    if (m) {
      cur = { id: m[1], title: m[2].trim(), lineNo, body: [], bodyLines: [] };
      cards.push(cur);
      return;
    }
    if (RE_HEADING.test(raw)) {
      cur = null; // 任意其它标题结束当前卡
      return;
    }
    if (cur) {
      cur.body.push(raw);
      cur.bodyLines.push(lineNo);
    }
  });
  return { missing: false, cards };
}

// ---------------------------------------------------------------------------
// 路径规格
// ---------------------------------------------------------------------------

/**
 * 由根目录 + 三文件相对路径构造规格对象。
 * @param {string} root
 * @param {{tasks:string,owner:string,exec:string}} rels
 */
function makeSpec(root, rels) {
  return {
    tasksAbs: resolve(root, rels.tasks),
    tasksRel: rels.tasks,
    ownerAbs: resolve(root, rels.owner),
    ownerRel: rels.owner,
    execAbs: resolve(root, rels.exec),
    execRel: rels.exec,
  };
}

// ---------------------------------------------------------------------------
// check
// ---------------------------------------------------------------------------

/**
 * 执行全部校验。
 * @param {ReturnType<typeof makeSpec>} spec
 * @returns {{errors:Array<{file:string,lineNo:number,msg:string}>, warnings:string[], missing:string[]}}
 */
function runCheck(spec) {
  const errors = [];
  const warnings = [];
  const missing = [];

  const owner = parseLogFile(spec.ownerAbs, spec.ownerRel, OWNER_VERBS);
  const exec = parseLogFile(spec.execAbs, spec.execRel, EXEC_VERBS);
  const tasks = parseTasksFile(spec.tasksAbs, spec.tasksRel);

  if (owner.missing) missing.push(spec.ownerRel);
  if (exec.missing) missing.push(spec.execRel);
  if (tasks.missing) missing.push(spec.tasksRel);

  // 1. 事件行格式 + verb 白名单
  errors.push(...owner.errors, ...exec.errors);

  // 1b. 全局事件（id 位为 `-`）只允许配 verb=note；`-` 豁免任务级 id/终态规则
  for (const ev of [...owner.events, ...exec.events]) {
    if (ev.id === '-' && ev.verb !== 'note') {
      errors.push({
        file: ev.file,
        lineNo: ev.lineNo,
        msg: `全局事件（id = -）只允许配 verb=note，实际为「${ev.verb}」`,
      });
    }
  }

  // 2. TASKS.md id 唯一 + 数值严格单调递增（允许跳号）
  const seen = new Map();
  let prevNum = -Infinity;
  for (const card of tasks.cards) {
    const num = Number(card.id.slice(2));
    if (seen.has(card.id)) {
      errors.push({
        file: spec.tasksRel,
        lineNo: card.lineNo,
        msg: `id 重复：${card.id}（首次出现于第 ${seen.get(card.id)} 行）`,
      });
      continue;
    }
    seen.set(card.id, card.lineNo);
    if (num <= prevNum) {
      errors.push({
        file: spec.tasksRel,
        lineNo: card.lineNo,
        msg: `id 必须严格单调递增（允许跳号）：${card.id} 不大于前一个 ${prevNum}`,
      });
    }
    prevNum = num;
  }

  // 3. 终态不可逆：OWNER-LOG 出现 verify 后，两条日志中不得再有该 id 的更新事件
  checkVerifyIrreversible(owner.events, exec.events, spec.ownerRel, errors);

  // 4. TASKS.md 卡内不得把 status/evidence/verdict/轨迹 作为字段存储
  for (const card of tasks.cards) {
    card.body.forEach((line, k) => {
      const m = RE_FORBIDDEN_FIELD.exec(line);
      if (m) {
        errors.push({
          file: spec.tasksRel,
          lineNo: card.bodyLines[k],
          msg: `任务卡 ${card.id} 不得把「${m[1]}」作为字段（状态由日志推导，卡内不存储）：${line.trim()}`,
        });
      }
    });
  }

  // 5. 没有任何卡在日志里出现 → 只告警
  if (tasks.cards.length > 0) {
    const logIds = new Set([...owner.events, ...exec.events].map((e) => e.id));
    const appeared = tasks.cards.filter((c) => logIds.has(c.id));
    if (appeared.length === 0) {
      warnings.push('TASKS.md 中暂无任何任务出现在两条日志里（正常：尚未派发 / 认领）');
    }
  }

  return { errors, warnings, missing };
}

/**
 * 终态不可逆检查。
 * @param {Array<object>} ownerEvents
 * @param {Array<object>} execEvents
 * @param {string} ownerRel
 * @param {Array<object>} errors 收集器
 */
function checkVerifyIrreversible(ownerEvents, execEvents, ownerRel, errors) {
  const all = [...ownerEvents, ...execEvents];
  /** @type {Map<string, Array<object>>} */
  const byId = new Map();
  for (const ev of all) {
    if (!byId.has(ev.id)) byId.set(ev.id, []);
    byId.get(ev.id).push(ev);
  }
  for (const [id, evs] of byId) {
    const verifies = evs.filter((e) => e.verb === 'verify' && e.file === ownerRel);
    if (verifies.length === 0) continue;
    const vMin = Math.min(...verifies.map((e) => Date.parse(e.ts)));
    const vText = verifies.find((e) => Date.parse(e.ts) === vMin).ts;
    for (const ev of evs) {
      if (ev.verb === 'verify' && Date.parse(ev.ts) === vMin) continue; // 该 verify 自身
      if (Date.parse(ev.ts) > vMin) {
        errors.push({
          file: ev.file,
          lineNo: ev.lineNo,
          msg: `终态不可逆：${id} 已于 ${vText} verify，其后不得再出现任何事件（此条 verb=${ev.verb} @ ${ev.ts}）`,
        });
      }
    }
  }
}

/** check 命令入口。 */
function cmdCheck() {
  const spec = makeSpec(repoRoot, REL);
  const { errors, warnings, missing } = runCheck(spec);

  if (missing.length > 0) {
    for (const f of missing) {
      console.warn(`${TAG} ⚠️ ${f} 尚未建立 —— 跳过其相关校验`);
    }
  }
  for (const w of warnings) {
    console.warn(`${TAG} ⚠️ ${w}`);
  }

  if (errors.length > 0) {
    console.error(`${TAG} ❌ check 失败（${errors.length} 项）：`);
    for (const e of errors) {
      const loc = e.lineNo ? `${e.file}:${e.lineNo}` : e.file;
      console.error(`${loc}: ${e.msg}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`${TAG} ✅ 事件行格式与 verb 白名单合法（${REL.owner} / ${REL.exec}）`);
  console.log(`${TAG} ✅ TASKS.md 任务卡 id 唯一且严格单调递增`);
  console.log(`${TAG} ✅ 终态不可逆检查通过（verify 之后无更新事件）`);
  console.log(`${TAG} ✅ 任务卡内未把禁止字样用作字段（${FORBIDDEN_WORDS.join(' / ')}）`);
  console.log(`${TAG} ✅ check 通过`);
}

// ---------------------------------------------------------------------------
// status
// ---------------------------------------------------------------------------

/**
 * 推导状态并返回结构。
 * @param {ReturnType<typeof makeSpec>} spec
 * @returns {{missing:string[], rows:Array<object>, counts:Record<string,number>, pendingVerify:string[], parseErrors:Array<{file:string,lineNo:number,msg:string}>}}
 */
function runStatus(spec) {
  const owner = parseLogFile(spec.ownerAbs, spec.ownerRel, OWNER_VERBS);
  const exec = parseLogFile(spec.execAbs, spec.execRel, EXEC_VERBS);
  const tasks = parseTasksFile(spec.tasksAbs, spec.tasksRel);

  const missing = [];
  if (owner.missing) missing.push(spec.ownerRel);
  if (exec.missing) missing.push(spec.execRel);
  if (tasks.missing) missing.push(spec.tasksRel);

  const allEvents = [...owner.events, ...exec.events];
  /** @type {Map<string, Array<object>>} */
  const byId = new Map();
  for (const ev of allEvents) {
    if (!byId.has(ev.id)) byId.set(ev.id, []);
    byId.get(ev.id).push(ev);
  }

  const rows = [];
  const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0]));
  const pendingVerify = [];

  for (const card of tasks.cards) {
    const evs = byId.get(card.id) || [];
    const latest = pickLatest(evs);
    const latestStatusEv = pickLatest(evs.filter((e) => e.verb in VERB_STATUS));
    const status = latestStatusEv ? VERB_STATUS[latestStatusEv.verb] : 'todo';
    if (counts[status] !== undefined) counts[status] += 1;
    else counts[status] = 1;
    if (status === 'done') pendingVerify.push(card.id);
    rows.push({
      id: card.id,
      title: card.title,
      status,
      time: latest ? latest.ts : '-',
      note: latest && latest.kv.note ? latest.kv.note : '',
    });
  }

  return {
    missing,
    rows,
    counts,
    pendingVerify,
    parseErrors: [...owner.errors, ...exec.errors],
  };
}

/**
 * 由解析错误构造「无法解析」警告（供打印与测试）。无错误返回 null。
 * @param {Array<{file:string,lineNo:number,msg:string}>} parseErrors
 * @returns {{summary:string, locs:string[]}|null}
 */
function statusParseWarnings(parseErrors) {
  if (!parseErrors || parseErrors.length === 0) return null;
  return {
    summary: `${TAG} ⚠️ 有 ${parseErrors.length} 行事件无法解析，已跳过；推导出的状态可能不完整 —— 先跑 check`,
    locs: parseErrors.map((e) => (e.lineNo ? `${e.file}:${e.lineNo}` : e.file)),
  };
}

/**
 * 打印「无法解析」警告及具体 `文件:行号` 列表。
 * @param {Array<{file:string,lineNo:number,msg:string}>} parseErrors
 */
function printStatusParseWarnings(parseErrors) {
  const w = statusParseWarnings(parseErrors);
  if (w === null) return;
  console.warn(w.summary);
  for (const loc of w.locs) console.warn(`  ${loc}`);
}

/**
 * status 命令入口。
 * @param {ReturnType<typeof makeSpec>} [spec] 默认取仓库的三个规范文件
 */
function cmdStatus(spec = makeSpec(repoRoot, REL)) {
  const { missing, rows, counts, pendingVerify, parseErrors } = runStatus(spec);

  if (missing.length > 0) {
    for (const f of missing) {
      console.warn(`${TAG} ⚠️ ${f} 尚未建立`);
    }
    if (rows.length === 0) {
      console.log(`${TAG} 无任务卡可推导（TASKS.md 尚未建立或无卡片）。`);
      printStatusParseWarnings(parseErrors);
      return;
    }
  }

  if (rows.length === 0) {
    console.log(`${TAG} TASKS.md 中没有任何任务卡。`);
    printStatusParseWarnings(parseErrors);
    return;
  }

  console.log(`${TAG} status —— 由两条只追加日志推导（取该 id 时间戳最新事件；无事件 → todo）\n`);

  const idW = Math.max(2, ...rows.map((r) => strWidth(r.id)));
  const titleW = Math.min(36, Math.max(5, ...rows.map((r) => strWidth(r.title))));
  const statusW = Math.max(6, ...rows.map((r) => strWidth(r.status)));
  const timeW = Math.max(4, ...rows.map((r) => strWidth(r.time)));

  const header = [
    padEndW('ID', idW),
    padEndW('标题', titleW),
    padEndW('状态', statusW),
    padEndW('最后事件时间', timeW),
    '最后事件 note',
  ].join('  ');
  console.log(`  ${header}`);
  console.log(`  ${'-'.repeat(strWidth(header))}`);

  for (const r of rows) {
    const line = [
      padEndW(r.id, idW),
      padEndW(truncateW(r.title, titleW), titleW),
      padEndW(r.status, statusW),
      padEndW(r.time, timeW),
      r.note,
    ].join('  ');
    console.log(`  ${line}`);
  }

  const total = rows.length;
  const summary = STATUS_ORDER.filter((s) => counts[s] > 0 || ['todo', 'doing', 'blocked', 'done', 'verified'].includes(s))
    .map((s) => `${s} ${counts[s]}`)
    .join(' · ');
  console.log(`\n${TAG} 汇总：${summary}（共 ${total} 项）`);

  console.log(
    `${TAG} 待我方验收（done 但尚未 verify）：${pendingVerify.length ? pendingVerify.join('、') : '无'}`,
  );

  // bug A 修复：绝不静默跳过无法解析的事件行
  printStatusParseWarnings(parseErrors);
}

// ---------------------------------------------------------------------------
// append-only
// ---------------------------------------------------------------------------

/**
 * 从 git diff 文本中提取「被删除 / 改写」的非空行。
 * 仅统计 **hunk 内部**（首个 `@@` 之后）以 `-` 开头的行 —— 以避开文件头
 * `--- a/path`（它出现在首个 `@@` 之前）。这样即便被删内容本身以 `--` 开头
 * （diff 里表现为 `--- xxx`）也不会被误当成文件头。
 * @param {string} relPath
 * @param {string} diffText
 * @returns {Array<{file:string, line:string}>}
 */
function analyzeDiff(relPath, diffText) {
  const violations = [];
  let inHunk = false;
  for (const raw of diffText.replace(/\r\n/g, '\n').split('\n')) {
    if (raw.startsWith('@@')) {
      inHunk = true;
      continue;
    }
    if (!inHunk) continue; // 文件头区：diff --git / index / --- / +++
    if (!raw.startsWith('-')) continue; // 只关心删除（含改写时的旧行）
    const content = raw.slice(1);
    if (content.trim() === '') continue; // 空行不计
    violations.push({ file: relPath, line: content });
  }
  return violations;
}

/**
 * 对若干文件跑 git diff，检测删除 / 改写。
 * @param {{base:string, cwd:string, relFiles:string[]}} opts
 * @returns {{violations:Array<{file:string,line:string}>, errors:Array<{file:string,msg:string}>}}
 */
function runAppendOnly(opts) {
  const { base, cwd, relFiles } = opts;
  const violations = [];
  const errors = [];
  for (const rel of relFiles) {
    try {
      const out = execFileSync('git', ['diff', '--unified=0', base, '--', rel], {
        cwd,
        stdio: ['ignore', 'pipe', 'pipe'],
        encoding: 'utf8',
      });
      violations.push(...analyzeDiff(rel, out));
    } catch (e) {
      const msg = (e && (e.stderr || e.message)) ? String(e.stderr || e.message).trim() : String(e);
      errors.push({ file: rel, msg });
    }
  }
  return { violations, errors };
}

/** append-only 命令入口。 */
function cmdAppendOnly(argv) {
  let base = 'HEAD';
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--base') {
      base = argv[i + 1] ?? base;
      i += 1;
    } else if (a.startsWith('--base=')) {
      base = a.slice('--base='.length);
    }
  }

  const { violations, errors } = runAppendOnly({
    base,
    cwd: repoRoot,
    relFiles: [REL.tasks, REL.owner, REL.exec],
  });

  if (errors.length > 0) {
    console.error(`${TAG} ❌ git diff 执行失败（base=${base}）：`);
    for (const e of errors) console.error(`  ${e.file}: ${e.msg}`);
    process.exitCode = 1;
    return;
  }

  if (violations.length > 0) {
    console.error(`${TAG} ❌ 检测到非追加改动（删除或改写了已有非空行）—— 违反「只追加」铁律：`);
    for (const v of violations) {
      console.error(`  ${v.file}: 被删除/改写的行 → ${v.line}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`${TAG} ✅ 三个文件均为纯追加`);
}

// ---------------------------------------------------------------------------
// selftest
// ---------------------------------------------------------------------------

/** selftest 命令入口。 */
function cmdSelftest() {
  const tests = [];
  const test = (name, fn) => {
    try {
      fn();
      tests.push({ name, ok: true });
    } catch (e) {
      tests.push({ name, ok: false, err: e && e.message ? e.message : String(e) });
    }
  };
  const assert = (cond, msg) => {
    if (!cond) throw new Error(msg || '断言失败');
  };

  const tmpRoot = mkdtempSync(join(os.tmpdir(), 'comms-selftest-'));
  const p = (name) => join(tmpRoot, name);

  /**
   * 在 tmpRoot 下建一个三文件 fixture 目录。
   * @param {string} dirName
   * @param {{tasks?:string, owner?:string, exec?:string}} files
   * @returns {ReturnType<typeof makeSpec>}
   */
  const fixture = (dirName, files) => {
    const dir = p(dirName);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'TASKS.md'), files.tasks ?? '');
    writeFileSync(join(dir, 'OWNER-LOG.md'), files.owner ?? '');
    writeFileSync(join(dir, 'EXEC-LOG.md'), files.exec ?? '');
    return makeSpec(dir, { tasks: 'TASKS.md', owner: 'OWNER-LOG.md', exec: 'EXEC-LOG.md' });
  };

  const card = (id, title, extra = '') =>
    `## ${id} · ${title}\npriority: P0\narea: web\ndepends: -\nsize: M\nspec: 做点事\nacceptance:\n- 通过\n${extra}`;

  // ① 合法 churn（含应被忽略的注释行 / 引用行 / 空行）
  test('01 合法 churn 无错误', () => {
    const spec = fixture('s01', {
      tasks: `${card('T-001', '甲')}\n`,
      owner: [
        '2026-10-15T01:00:00Z | T-001 | dispatch | note=派活',
        '2026-10-15T04:10:33Z | T-001 | verify | result=4/4 | note=复验通过',
        '# 注释行应被忽略',
        '> 引用行应被忽略',
        '',
      ].join('\n'),
      exec: '2026-10-15T02:00:00Z | T-001 | claim | note=领取\n2026-10-15T03:00:00Z | T-001 | done | commit=abc\n',
    });
    const r = runCheck(spec);
    assert(r.errors.length === 0, `应无错误，实际：${JSON.stringify(r.errors)}`);
  });

  // ② 非法 verb（exec 文件里写了 owner-only 的 verify）
  test('02 非法 verb 被检出', () => {
    const spec = fixture('s02', {
      tasks: `${card('T-001', '甲')}\n`,
      owner: '',
      exec: '2026-10-15T02:00:00Z | T-001 | verify | note=不该出现在此处\n',
    });
    const r = runCheck(spec);
    assert(r.errors.some((e) => /verb/.test(e.msg)), `应检出 verb 非法：${JSON.stringify(r.errors)}`);
  });

  // ③ id 重复
  test('03 id 重复被检出', () => {
    const spec = fixture('s03', {
      tasks: `${card('T-001', '甲')}\n${card('T-001', '甲又一遍')}\n`,
      owner: '',
      exec: '',
    });
    const r = runCheck(spec);
    assert(r.errors.some((e) => /id 重复/.test(e.msg)), `应检出 id 重复：${JSON.stringify(r.errors)}`);
  });

  // ④ id 非递增
  test('04 id 非单调递增被检出', () => {
    const spec = fixture('s04', {
      tasks: `${card('T-002', '乙')}\n${card('T-001', '甲')}\n`,
      owner: '',
      exec: '',
    });
    const r = runCheck(spec);
    assert(r.errors.some((e) => /单调递增/.test(e.msg)), `应检出非递增：${JSON.stringify(r.errors)}`);
  });

  // ⑤ verify 后再写事件（终态不可逆）
  test('05 verify 后再写事件被检出', () => {
    const spec = fixture('s05', {
      tasks: `${card('T-001', '甲')}\n`,
      owner: '2026-10-15T04:10:33Z | T-001 | verify | result=4/4 | note=通过\n',
      exec: '2026-10-15T05:00:00Z | T-001 | done | commit=abc\n',
    });
    const r = runCheck(spec);
    assert(r.errors.some((e) => /终态不可逆/.test(e.msg)), `应检出终态不可逆：${JSON.stringify(r.errors)}`);
  });

  // ⑥ TASKS 卡把 status 作为字段存储 → 检出；仅在散文里提到 → 不误报
  test('06 任务卡 status: 字段被检出（散文提及不误报）', () => {
    const bad = fixture('s06', {
      tasks: `${card('T-001', '甲', 'status: done\n')}\n`,
      owner: '',
      exec: '',
    });
    const r1 = runCheck(bad);
    assert(
      r1.errors.some((e) => /作为字段/.test(e.msg) && /status/.test(e.msg)),
      `应检出禁止字段 status：${JSON.stringify(r1.errors)}`,
    );

    const prose = fixture('s06b', {
      tasks: `${card(
        'T-001',
        '甲',
        'acceptance:\n- 先实测当前状态，再把 `status` 标为 blocked（此处是散文提及，非字段）\n',
      )}\n`,
      owner: '',
      exec: '',
    });
    const r2 = runCheck(prose);
    assert(r2.errors.length === 0, `散文提及不应报错：${JSON.stringify(r2.errors)}`);
  });

  // ⑦ append-only：真实 git 仓库 —— 删除已有非空行应被检出（含以 `--` 开头、diff 里显示为 `---` 的行）
  test('07 append-only git 删除被检出', () => {
    const dir = p('s07');
    mkdirSync(dir, { recursive: true });
    const git = initGitRepo(dir, {
      'TASKS.md': 'a\nb\n-- c\nd\n',
      'OWNER-LOG.md': '# h\n',
      'EXEC-LOG.md': '# h\n',
    });
    assert(git !== null, 'git 不可用');
    writeFileSync(join(dir, 'TASKS.md'), 'a\nd\n'); // 删除 b 与 `-- c`
    const r = runAppendOnly({ base: 'HEAD', cwd: dir, relFiles: ['TASKS.md', 'OWNER-LOG.md', 'EXEC-LOG.md'] });
    assert(r.errors.length === 0, `不应有 git 错误：${JSON.stringify(r.errors)}`);
    assert(r.violations.some((v) => v.file === 'TASKS.md'), `应检出 TASKS.md 的删除：${JSON.stringify(r.violations)}`);
    assert(r.violations.some((v) => v.line.trim() === 'b'), `应检出被删行 b：${JSON.stringify(r.violations)}`);
    assert(r.violations.some((v) => v.line.trim() === '-- c'), `应检出被删行「-- c」：${JSON.stringify(r.violations)}`);
  });

  // ⑧ append-only：真实 git 仓库 —— 纯追加应通过
  test('08 append-only git 纯追加通过', () => {
    const dir = p('s08');
    mkdirSync(dir, { recursive: true });
    const git = initGitRepo(dir, { 'TASKS.md': 'a\nb\n', 'OWNER-LOG.md': '# h\n', 'EXEC-LOG.md': '# h\n' });
    assert(git !== null, 'git 不可用');
    appendFileSync(join(dir, 'TASKS.md'), 'c\n');
    const r = runAppendOnly({ base: 'HEAD', cwd: dir, relFiles: ['TASKS.md', 'OWNER-LOG.md', 'EXEC-LOG.md'] });
    assert(r.errors.length === 0 && r.violations.length === 0, `纯追加应通过：${JSON.stringify(r)}`);
  });

  // ⑨ status 推导（含 note 非状态承载）
  test('09 status 推导正确', () => {
    const spec = fixture('s09', {
      tasks: `${card('T-001', '甲')}\n${card('T-002', '乙')}\n${card('T-003', '丙')}\n${card('T-004', '丁')}\n`,
      owner: [
        '2026-10-15T01:00:00Z | T-001 | dispatch | note=派',
        '2026-10-15T01:01:00Z | T-001 | verify | note=验',
        '2026-10-15T01:02:00Z | T-003 | note | note=仅备注',
      ].join('\n'),
      exec: [
        '2026-10-15T01:00:30Z | T-001 | claim | note=领',
        '2026-10-15T01:00:40Z | T-001 | done | note=完',
        '2026-10-15T01:01:00Z | T-002 | claim | note=领',
        '2026-10-15T01:05:00Z | T-002 | done | note=完',
      ].join('\n'),
    });
    const r = runStatus(spec);
    const byId = Object.fromEntries(r.rows.map((x) => [x.id, x.status]));
    assert(byId['T-001'] === 'verified', `T-001 应为 verified，实际 ${byId['T-001']}`);
    assert(byId['T-002'] === 'done', `T-002 应为 done，实际 ${byId['T-002']}`);
    assert(byId['T-003'] === 'todo', `T-003 仅一条 note 应为 todo，实际 ${byId['T-003']}`);
    assert(byId['T-004'] === 'todo', `T-004 无事件应为 todo，实际 ${byId['T-004']}`);
    assert(r.pendingVerify.length === 1 && r.pendingVerify[0] === 'T-002', `待验收应为 [T-002]：${JSON.stringify(r.pendingVerify)}`);
  });

  // ⑩ 分隔符前后无空格 → 格式错误
  test('10 分隔符缺空格被检出', () => {
    const spec = fixture('s10', {
      tasks: `${card('T-001', '甲')}\n`,
      owner: '',
      exec: '2026-10-15T02:00:00Z|T-001|claim|note=x\n',
    });
    const r = runCheck(spec);
    assert(r.errors.some((e) => /分隔符/.test(e.msg)), `应检出分隔符错误：${JSON.stringify(r.errors)}`);
  });

  // ⑪ kv 值为空 → 格式错误
  test('11 kv 值为空被检出', () => {
    const spec = fixture('s11', {
      tasks: `${card('T-001', '甲')}\n`,
      owner: '',
      exec: '2026-10-15T02:00:00Z | T-001 | claim | note=\n',
    });
    const r = runCheck(spec);
    assert(r.errors.some((e) => /不能为空/.test(e.msg)), `应检出空值：${JSON.stringify(r.errors)}`);
  });

  // ⑫ 忽略行（# / > / 空行）不产生错误、也不产生事件
  test('12 忽略行不报错', () => {
    const spec = fixture('s12', {
      tasks: '',
      owner: '# 注释\n> 引用\n\n# 又一个注释\n',
      exec: '',
    });
    const r = runCheck(spec);
    assert(r.errors.length === 0, `忽略行不应报错：${JSON.stringify(r.errors)}`);
    assert(r.warnings.length === 0, `不应有告警（无卡片且仅注释行）：${JSON.stringify(r.warnings)}`);
  });

  // --- 输出 ---
  const total = tests.length;
  const passed = tests.filter((t) => t.ok).length;
  console.log(`${TAG} selftest —— 在系统临时目录构造 fixture：${displayPath(tmpRoot)}`);
  for (const t of tests) {
    if (t.ok) console.log(`  ✅ ${t.name}`);
    else console.log(`  ❌ ${t.name}\n     → ${t.err}`);
  }

  if (passed === total) {
    console.log(`${TAG} ✅ selftest ${passed}/${total}`);
  } else {
    console.error(`${TAG} ❌ selftest ${passed}/${total} —— 有 ${total - passed} 项失败`);
    process.exitCode = 1;
  }

  try {
    rmSync(tmpRoot, { recursive: true, force: true });
  } catch {
    /* 清理失败不影响结论 */
  }
}

/**
 * 在指定目录初始化一个 git 仓库并提交初始文件，返回 git 调用函数（git 不可用则返回 null）。
 * @param {string} dir
 * @param {Record<string,string>} files
 * @returns {((args:string[])=>string)|null}
 */
function initGitRepo(dir, files) {
  try {
    for (const [name, content] of Object.entries(files)) {
      writeFileSync(join(dir, name), content);
    }
    const git = (args) =>
      execFileSync('git', args, { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
    git(['init', '-q']);
    git(['add', '-A']);
    git(['-c', 'user.email=selftest@local', '-c', 'user.name=selftest', 'commit', '-q', '-m', 'base']);
    return git;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 入口
// ---------------------------------------------------------------------------

const USAGE = `${TAG} 用法：node scripts/comms.mjs <cmd>
  check                     校验三文件（事件格式 / verb 白名单 / id 唯一且单调 / 终态不可逆 / 卡内禁字）
  status                    由两条日志推导每个任务的状态，打印表格 + 汇总 + 待验收清单
  append-only [--base ref]  检查三文件是否纯追加（默认 base=HEAD），有删除/改写 → exit 1
  selftest                  在系统临时目录自测（全部通过 exit 0）`;

/**
 * 主入口。
 * @param {string[]} argv
 */
function main(argv) {
  const cmd = argv[0];
  try {
    switch (cmd) {
      case 'check':
        cmdCheck();
        return;
      case 'status':
        cmdStatus();
        return;
      case 'append-only':
        cmdAppendOnly(argv.slice(1));
        return;
      case 'selftest':
        cmdSelftest();
        return;
      case undefined:
      case '-h':
      case '--help':
      case 'help':
        console.log(USAGE);
        return;
      default:
        fail(`未知命令：${cmd}\n${USAGE}`, 2);
    }
  } catch (e) {
    if (e instanceof ExitSignal) return; // exitCode 已设置
    console.error(`${TAG} ❌ 未预期错误：${e && e.stack ? e.stack : e}`);
    process.exitCode = 2;
  }
}

main(process.argv.slice(2));
