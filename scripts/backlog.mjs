/**
 * scripts/backlog.mjs —— 「半年计划」交接清单的扫描 / 校验 / 验证 CLI（**双文件契约**）。
 *
 * 契约来源：docs/AI-HANDOFF.md §5（CLI 契约）、§3（evidence 主行 + 轨迹行规范）、§3.2、
 *           §5.3（解析边界）、**§7.3（双文件契约 —— 一个文件只有一个写者）**、§7.3.1（有效状态合成）、
 *           §7.3.2（打回闭环）、§7.3.3（改动判据）。
 * 本脚本严格按该契约实现；若本文与契约冲突，**以 docs/AI-HANDOFF.md 为准**。
 *
 * 双文件契约（§7.3）：
 *   - docs/BACKLOG.md      ← 唯一写者 = 我方。任务定义（priority/area/depends/size/spec/acceptance）+
 *                            我方的 verdict 字段 + 我方轨迹行（verify/reject）+ 我方自办任务（owner: 我方）
 *                            的 status/evidence。**不得出现执行方任务的 status/evidence**。
 *   - docs/EXEC-REPORT.md  ← 唯一写者 = 执行方。每个执行方任务的 status（todo/doing/done/blocked）+
 *                            evidence（单行）+ 执行方轨迹行（retract 等）。**status: verified 是硬错误**。
 *
 * 有效状态合成（§7.3.1）：
 *   if   BACKLOG.verdict === 'verified'  ->  verified   （终态，忽略 EXEC）
 *   elif BACKLOG.status 存在             ->  BACKLOG.status（我方自办任务）
 *   elif EXEC.status 存在                ->  EXEC.status
 *   else                                 ->  todo
 *
 * 用途：
 *   scan    —— 主入口：输出三块（① 待验证 ② 已打回待响应 ③ 疑似漏改状态）。
 *   list    —— 按**合成后**的有效状态 / priority 汇总（支持 --status= / --priority= 过滤）。
 *   show    —— 合并展示：定义来自 BACKLOG，status/evidence 来自 EXEC-REPORT，我方轨迹来自 BACKLOG。
 *   verify  —— 写 BACKLOG：执行方任务写 `verdict: verified`，我方自办任务写 `status: verified`；
 *              并向 BACKLOG 追加一行 `verify` 轨迹。
 *   reject  —— 写 BACKLOG：追加一行 `reject` 轨迹（不改 verdict），用于打回。
 *   check   —— 分文件校验 + 交叉校验（含 §7.3.3 的全部不变量）。
 *
 * 通用可选参数：--json（机器可读 JSON）；--file=<path>（BACKLOG，默认 docs/BACKLOG.md）；
 *              --exec=<path>（EXEC-REPORT，默认 docs/EXEC-REPORT.md）；--strict（未知键升 error）。
 * 退出码：0 成功；非 0 = 用法错误 / 校验不通过 / 目标项不存在 / 状态不允许。
 *
 * ⛔ 铁律一（docs/AI-HANDOFF.md §1.2）：`verified` 只有我方（团队）可以写，执行方永远不得写。
 *    本脚本的 `verify` 子命令即「我方」的验证留痕工具；`reject` 即「我方」的打回留痕工具。
 *
 * 零依赖：仅使用 Node 内置模块（node:fs / node:path / node:process）。不引入任何第三方包。
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const TAG = '[backlog]';
const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, '..');

const DEFAULT_BACKLOG_FILE = 'docs/BACKLOG.md';
const DEFAULT_EXEC_FILE = 'docs/EXEC-REPORT.md';

/** 我方自办任务的 owner 标记（§7.3：BACKLOG 里只有 owner: 我方 的块才允许带 status/evidence）。 */
const OWNER_LOCAL = '我方';

/** BACKLOG 中 status 的合法取值（我方自办任务用）。 */
const VALID_STATUS = ['todo', 'doing', 'blocked', 'done', 'verified'];
/** EXEC-REPORT 中 status 的合法取值（**没有 verified**，§7.3.1 硬错误）。 */
const VALID_EXEC_STATUS = ['todo', 'doing', 'blocked', 'done'];
const VALID_PRIORITY = ['P0', 'P1', 'P2', 'P3'];
const VALID_SIZE = ['S', 'M', 'L'];
/** verdict 只有两个值：pending（缺省）/ verified（§7.3.1）。 */
const VALID_VERDICT = ['pending', 'verified'];

/** BACKLOG 每块必填键（acceptance 单独判定「≥1 条」）。 */
const BACKLOG_REQUIRED_KEYS = ['priority', 'area', 'depends', 'size', 'spec'];
/** BACKLOG 已知键（含 status/evidence/verdict/owner，避免误报未知键）。 */
const BACKLOG_KNOWN_KEYS = new Set([
  ...BACKLOG_REQUIRED_KEYS,
  'acceptance',
  'status',
  'evidence',
  'verdict',
  'owner',
]);
/** EXEC-REPORT 每块必填键。 */
const EXEC_REQUIRED_KEYS = ['status', 'evidence'];
/** EXEC-REPORT 已知键。 */
const EXEC_KNOWN_KEYS = new Set(EXEC_REQUIRED_KEYS);

/** 轨迹行 action 取值（§3.2，大小写敏感、一律小写）。 */
const TRAJ_ACTIONS = new Set(['verify', 'reject', 'retract']);
/** 我方轨迹 action（写在 BACKLOG）。 */
const TRAJ_OWNER_ACTIONS = new Set(['verify', 'reject']);
/** 执行方轨迹 action（写在 EXEC-REPORT）。 */
const TRAJ_EXEC_ACTIONS = new Set(['retract']);

/** 任务二级标题：`^## (T-\d{3,})\s*·\s*(.+)$`（居中点仅作分隔，不切分标题内部）。 */
const TASK_HEADING = /^## (T-\d{3,})\s*·\s*(.+)$/;
/** 任意 Markdown 标题（用于结束当前任务块）。 */
const ANY_HEADING = /^#{1,6}\s/;
/** 顶级字段行：`键: 值`（键为字母/下划线/数字/连字符）。 */
const FIELD_LINE = /^([A-Za-z_][A-Za-z0-9_-]*):[ \t]?(.*)$/;
/** 代码围栏（``` 或 ~~~），围栏内不参与解析。 */
const FENCE_LINE = /^\s*(```|~~~)/;
/** ISO8601（含日期 + 时间，可选秒/毫秒 + 可选时区）。 */
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/;
/** 轨迹行形状：`<token> <ISO8601...> | ...`（用于识别被误缩进到 0 空格的轨迹行）。 */
const TRAJ_SHAPE = /^\S+ \d{4}-\d{2}-\d{2}T\S* \| /;
/** 轨迹行完整格式：`<action> <ISO8601> | <文本>`（action 与时间各 1 空格，时间与文本用 ` | `）。 */
const TRAJ_FULL = /^(\S+) (\S+) \| (.*)$/;

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
  console.error(msg);
  process.exit(code);
}

/**
 * 拆分文本为行，并剥离行尾的 `\r`（兼容 CRLF / LF，§5.3 #7）。
 * @param {string} raw 原始文本
 * @returns {{ lines: string[], isCRLF: boolean }}
 */
function splitLines(raw) {
  const isCRLF = raw.includes('\r\n');
  const lines = raw.split('\n').map((line) => (line.endsWith('\r') ? line.slice(0, -1) : line));
  return { lines, isCRLF };
}

/**
 * 生成本地时区、带偏移的 ISO8601 时间戳（格式与 docs/AI-HANDOFF.md §3 示例一致）。
 * @param {Date} [date=new Date()] 时间点
 * @returns {string} 形如 `2026-10-14T18:40:00+08:00`
 */
function localIso(date = new Date()) {
  const pad = (n, width = 2) => String(n).padStart(width, '0');
  const offsetMin = -date.getTimezoneOffset(); // 分钟，东为正
  const sign = offsetMin >= 0 ? '+' : '-';
  const absMin = Math.abs(offsetMin);
  const offset = `${sign}${pad(Math.floor(absMin / 60))}:${pad(absMin % 60)}`;
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${offset}`
  );
}

/**
 * 判定 evidence 主行是否为「空」。
 * 空 = 未填写 / 去除空白后为空 / 仍是初始占位文案（含「初始留空」）。
 * @param {string|undefined|null} value evidence 字段值
 * @returns {boolean}
 */
function isEvidenceEmpty(value) {
  if (value === undefined || value === null) {
    return true;
  }
  const text = String(value).trim();
  if (text === '') {
    return true;
  }
  if (text.includes('初始留空')) {
    return true;
  }
  return false;
}

/**
 * 解析一条轨迹行的正文（`- ` 之后的剩余内容）。
 * @param {string} body 形如 `verify 2026-10-14T18:40:00+08:00 | by=team-lead`
 * @returns {{ ok: boolean, action: string, iso: string, text: string }}
 */
function parseTrajectoryBody(body) {
  const match = TRAJ_FULL.exec(body);
  if (!match) {
    return { ok: false, action: '', iso: '', text: body };
  }
  return { ok: true, action: match[1], iso: match[2], text: match[3] };
}

/**
 * 读取某任务的字段值（不存在返回 undefined）。
 * @param {object} task 任务对象
 * @param {string} key 字段名
 * @returns {string|undefined}
 */
function fv(task, key) {
  if (!task || !task.fields[key]) {
    return undefined;
  }
  return task.fields[key].value;
}

// ---------------------------------------------------------------------------
// 解析（docs/AI-HANDOFF.md §5.3）
// ---------------------------------------------------------------------------

/**
 * 解析清单文本为任务数组（BACKLOG / EXEC-REPORT 通用）。
 * @param {string} raw 清单原始文本
 * @returns {Array<object>} 任务对象数组
 */
function parseTasks(raw) {
  const { lines } = splitLines(raw);
  /** @type {Array<object>} */
  const tasks = [];
  /** @type {object|null} */
  let current = null;
  let inFence = false;

  const flush = () => {
    if (current) {
      tasks.push(current);
      current = null;
    }
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const lineNo = i + 1;

    // §5.3 #8：代码围栏内一律不解析
    if (FENCE_LINE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      continue;
    }

    // 任务标题（二级标题 + `·`）
    const heading = TASK_HEADING.exec(line);
    if (heading) {
      flush();
      current = {
        id: heading[1],
        title: heading[2].trim(),
        startLine: lineNo,
        endLine: lineNo,
        fields: {},
        acceptance: [],
        trajectories: [],
        unknownKeys: [],
        indentIssues: [],
      };
      continue;
    }
    // 其它标题：结束当前任务块
    if (ANY_HEADING.test(line)) {
      flush();
      continue;
    }
    if (!current) {
      continue;
    }
    current.endLine = lineNo;

    if (line.trim() === '') {
      continue;
    }

    const indent = line.length - line.trimStart().length;
    const trimmed = line.trimStart();

    // 恰好缩进 2 空格的 `- ` = 轨迹行（§3.2 / §5.3 #5）
    if (indent === 2 && trimmed.startsWith('- ')) {
      current.trajectories.push({ raw: line, line: lineNo, body: trimmed.slice(2) });
      continue;
    }
    // 顶级 `- ` = acceptance；但若形状像轨迹行，则是被误缩进（§5.2：当前 0 空格）
    if (indent === 0 && trimmed.startsWith('- ')) {
      const text = trimmed.slice(2);
      if (TRAJ_SHAPE.test(text)) {
        current.trajectories.push({ raw: line, line: lineNo, body: text, badIndent: 0 });
      } else {
        current.acceptance.push({ text, line: lineNo });
      }
      continue;
    }
    // 其它缩进的 `- ` = 缩进错误（既非 0 也非 2）
    if (trimmed.startsWith('- ')) {
      current.trajectories.push({
        raw: line,
        line: lineNo,
        body: trimmed.slice(2),
        badIndent: indent,
      });
      continue;
    }
    // 顶级字段行
    if (indent === 0) {
      const field = FIELD_LINE.exec(trimmed);
      if (field) {
        const key = field[1];
        if (Object.prototype.hasOwnProperty.call(current.fields, key)) {
          current.fields[key].duplicate = true;
        } else {
          current.fields[key] = { key, value: field[2].trim(), line: lineNo };
        }
      }
      continue; // 其它顶级文本（引用块等）忽略
    }
    // 缩进的非 `- ` 行：疑似 evidence 主行换行 / 字段被误缩进 —— 记录待校验报错
    current.indentIssues.push({ line: lineNo, indent, text: trimmed });
  }

  flush();
  return tasks;
}

// ---------------------------------------------------------------------------
// 有效状态合成（docs/AI-HANDOFF.md §7.3.1）
// ---------------------------------------------------------------------------

/**
 * 按 §7.3.1 合成某任务的有效状态。
 * @param {object|undefined} backlogTask BACKLOG 中的任务对象
 * @param {object|undefined} execTask EXEC-REPORT 中的任务对象
 * @returns {string} 合成后的有效状态
 */
function effectiveStatus(backlogTask, execTask) {
  if (fv(backlogTask, 'verdict') === 'verified') {
    return 'verified';
  }
  const backlogStatus = fv(backlogTask, 'status');
  if (backlogStatus !== undefined) {
    return backlogStatus;
  }
  const execStatus = fv(execTask, 'status');
  if (execStatus !== undefined) {
    return execStatus;
  }
  return 'todo';
}

/**
 * 判断任务是否为我方自办任务（owner: 我方）。
 * @param {object|undefined} task BACKLOG 任务
 * @returns {boolean}
 */
function isOwnerLocal(task) {
  return fv(task, 'owner') === OWNER_LOCAL;
}

/**
 * 取某任务「当前所在文件」的 evidence（我方自办任务在 BACKLOG，其余在 EXEC）。
 * @param {object|undefined} backlogTask BACKLOG 任务
 * @param {object|undefined} execTask EXEC 任务
 * @returns {string|undefined}
 */
function evidenceOf(backlogTask, execTask) {
  if (isOwnerLocal(backlogTask)) {
    return fv(backlogTask, 'evidence');
  }
  return fv(execTask, 'evidence');
}

// ---------------------------------------------------------------------------
// 校验（docs/AI-HANDOFF.md §3 / §5.2 / §5.3 / §7.3.3）
// ---------------------------------------------------------------------------

/**
 * 校验单条轨迹行（§3.2）。
 * @param {string} id 任务 id
 * @param {{ raw: string, body: string, badIndent?: number }} traj 轨迹行
 * @param {string[]} errors 错误收集数组
 * @returns {void}
 */
function validateTrajectory(id, traj, errors) {
  if (traj.badIndent !== undefined) {
    errors.push(
      `${id}: 轨迹行未缩进 —— "${traj.raw}" 必须恰好缩进 2 空格（当前 ${traj.badIndent} 空格）`,
    );
    return;
  }
  const parsed = parseTrajectoryBody(traj.body);
  if (!parsed.ok) {
    if (!traj.body.includes(' | ')) {
      errors.push(`${id}: 轨迹行缺少 " | " 分隔 —— ${traj.raw}`);
      return;
    }
    const head = traj.body.split(' | ')[0].trim();
    const tokens = head.split(/\s+/).filter(Boolean);
    if (tokens.length < 2) {
      errors.push(`${id}: 轨迹行缺少 ISO8601 时间 —— ${traj.raw}`);
      return;
    }
    errors.push(`${id}: 轨迹行格式非法（应为 "<action> <ISO8601> | <文本>"）—— ${traj.raw}`);
    return;
  }
  if (!TRAJ_ACTIONS.has(parsed.action)) {
    errors.push(
      `${id}: 轨迹行 action 非法 "${parsed.action}"（只允许 verify/reject/retract，小写）—— ${traj.raw}`,
    );
  }
  if (!ISO_RE.test(parsed.iso)) {
    errors.push(`${id}: 轨迹行时间非 ISO8601 "${parsed.iso}" —— ${traj.raw}`);
  }
}

/**
 * 校验 BACKLOG 任务数组（§7.3.3：定义齐全；不得出现 status/evidence 除非 owner: 我方；verdict 合法）。
 * @param {Array<object>} tasks 任务数组
 * @param {{ strict?: boolean }} [options] 选项
 * @returns {{ errors: string[], warnings: string[] }}
 */
function validateBacklog(tasks, options = {}) {
  const strict = options.strict === true;
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  const seenIds = new Map();
  for (const task of tasks) {
    if (seenIds.has(task.id)) {
      errors.push(`${task.id}: 任务 id 重复（该 id 已在第 ${seenIds.get(task.id)} 行出现）`);
    } else {
      seenIds.set(task.id, task.startLine);
    }
  }

  for (const task of tasks) {
    const { fields } = task;

    // 必需键缺失
    for (const key of BACKLOG_REQUIRED_KEYS) {
      if (!fields[key]) {
        errors.push(`${task.id}: 缺少必填字段 ${key}`);
      }
    }
    // 字段重复
    for (const key of Object.keys(fields)) {
      if (fields[key].duplicate) {
        errors.push(`${task.id}: 字段 ${key} 重复出现`);
      }
    }

    // acceptance 至少 1 条
    if (task.acceptance.length === 0) {
      errors.push(`${task.id}: acceptance 为空（至少 1 条）`);
    }

    // priority / size 枚举
    const priority = fv(task, 'priority');
    if (priority !== undefined && !VALID_PRIORITY.includes(priority)) {
      errors.push(`${task.id}: priority 非法值 "${priority}"（合法：${VALID_PRIORITY.join('/')}）`);
    }
    const size = fv(task, 'size');
    if (size !== undefined && !VALID_SIZE.includes(size)) {
      errors.push(`${task.id}: size 非法值 "${size}"（合法：${VALID_SIZE.join('/')}）`);
    }

    const owner = fv(task, 'owner');
    const ownerOk = owner === OWNER_LOCAL;
    if (owner !== undefined && !ownerOk) {
      warnings.push(`${task.id}: owner 取值 "${owner}" 非预期（本项目仅用 "owner: 我方" 标记我方自办任务）`);
    }

    const status = fv(task, 'status');
    const evidence = fv(task, 'evidence');
    const verdict = fv(task, 'verdict');

    // §7.3.3 不变量：BACKLOG 里不得出现执行方任务的 status/evidence
    if (!ownerOk) {
      if (fields.status) {
        errors.push(
          `${task.id}: BACKLOG 中出现 status（BACKLOG 只归我方：执行方任务的状态请写在 docs/EXEC-REPORT.md；` +
            `本块若为我方自办任务请显式标注 "owner: 我方"）`,
        );
      }
      if (fields.evidence) {
        errors.push(
          `${task.id}: BACKLOG 中出现 evidence（同理：执行方证据请写在 docs/EXEC-REPORT.md；` +
            `本块若为我方自办任务请显式标注 "owner: 我方"）`,
        );
      }
    }

    // owner: 我方 的 status 合法性
    if (status !== undefined && !VALID_STATUS.includes(status)) {
      errors.push(`${task.id}: status 非法值 "${status}"（合法：${VALID_STATUS.join('/')}）`);
    }
    // owner: 我方 的 done/verified 需非空 evidence
    if (ownerOk && (status === 'done' || status === 'verified') && isEvidenceEmpty(evidence)) {
      errors.push(`${task.id}: owner=我方 且 status=${status} 但 evidence 主行缺失（必须有单行 evidence）`);
    }

    // verdict 合法性
    if (verdict !== undefined && !VALID_VERDICT.includes(verdict)) {
      errors.push(`${task.id}: verdict 非法值 "${verdict}"（合法：${VALID_VERDICT.join('/')}）`);
    }
    // verdict 与 status 不应同时出现（§7.3.1：前者给执行方任务，后者给我方自办任务）
    if (verdict !== undefined && status !== undefined) {
      errors.push(`${task.id}: verdict 与 status 同时出现（执行方任务用 verdict、我方自办任务用 status，二选一）`);
    }

    // 轨迹行校验（我方 verify/reject 写在 BACKLOG）
    for (const traj of task.trajectories) {
      validateTrajectory(task.id, traj, errors);
    }

    // 缩进内容行（可能为 evidence 主行换行）
    for (const issue of task.indentIssues) {
      errors.push(
        `${task.id}: 第 ${issue.line} 行缩进 ${issue.indent} 空格无法解析（可能是 evidence 主行换行或被误缩进）`,
      );
    }

    // 未知键：默认 warn，--strict 升 error
    for (const key of Object.keys(fields)) {
      if (!BACKLOG_KNOWN_KEYS.has(key)) {
        if (strict) {
          errors.push(`${task.id}: 未知字段 ${key}（--strict 下视为错误）`);
        } else {
          warnings.push(`${task.id}: 未知字段 ${key}（前向兼容，忽略）`);
        }
      }
    }
  }

  return { errors, warnings };
}

/**
 * 校验 EXEC-REPORT 任务数组（§7.3.3：每块必须含 status/evidence；status: verified 是硬错误）。
 * @param {Array<object>} tasks 任务数组
 * @param {{ strict?: boolean }} [options] 选项
 * @returns {{ errors: string[], warnings: string[] }}
 */
function validateExec(tasks, options = {}) {
  const strict = options.strict === true;
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  const seenIds = new Map();
  for (const task of tasks) {
    if (seenIds.has(task.id)) {
      errors.push(`${task.id}: 任务 id 重复（该 id 已在第 ${seenIds.get(task.id)} 行出现）`);
    } else {
      seenIds.set(task.id, task.startLine);
    }
  }

  for (const task of tasks) {
    const { fields } = task;

    // 必填键
    for (const key of EXEC_REQUIRED_KEYS) {
      if (!fields[key]) {
        errors.push(`${task.id}: 缺少必填字段 ${key}（EXEC-REPORT 每块必须有 status 与 evidence）`);
      }
    }
    // 字段重复
    for (const key of Object.keys(fields)) {
      if (fields[key].duplicate) {
        errors.push(`${task.id}: 字段 ${key} 重复出现`);
      }
    }

    const status = fv(task, 'status');
    if (status !== undefined) {
      if (status === 'verified') {
        errors.push(`${task.id}: EXEC-REPORT 中不允许 status: verified（verified 只能由我方以 verdict 表达，§7.3.1）`);
      } else if (!VALID_EXEC_STATUS.includes(status)) {
        errors.push(
          `${task.id}: status 非法值 "${status}"（合法：${VALID_EXEC_STATUS.join('/')}；verified 是硬错误）`,
        );
      }
    }

    // done/blocked 必须有非空 evidence
    if ((status === 'done' || status === 'blocked') && isEvidenceEmpty(fv(task, 'evidence'))) {
      errors.push(`${task.id}: status=${status} 但 evidence 主行缺失/为空（${status} 必须有单行 evidence）`);
    }

    // 轨迹行校验（执行方 retract 等写在这里，格式同 §3.2）
    for (const traj of task.trajectories) {
      validateTrajectory(task.id, traj, errors);
    }
    for (const issue of task.indentIssues) {
      errors.push(
        `${task.id}: 第 ${issue.line} 行缩进 ${issue.indent} 空格无法解析（可能是 evidence 主行换行或被误缩进）`,
      );
    }

    // 未知键
    for (const key of Object.keys(fields)) {
      if (!EXEC_KNOWN_KEYS.has(key)) {
        if (strict) {
          errors.push(`${task.id}: 未知字段 ${key}（--strict 下视为错误）`);
        } else {
          warnings.push(`${task.id}: 未知字段 ${key}（前向兼容，忽略）`);
        }
      }
    }
  }

  return { errors, warnings };
}

/**
 * 交叉校验两文件（§7.3.3：EXEC-REPORT 的 id 必须都在 BACKLOG 里存在）。
 * @param {Array<object>} backlogTasks BACKLOG 任务
 * @param {Array<object>} execTasks EXEC 任务
 * @returns {{ errors: string[], warnings: string[] }}
 */
function crossValidate(backlogTasks, execTasks) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  const backlogIds = new Set(backlogTasks.map((task) => task.id));

  // 方向一（硬规则）：EXEC 的 id 必须都在 BACKLOG 里存在
  for (const task of execTasks) {
    if (!backlogIds.has(task.id)) {
      errors.push(`${task.id}: EXEC-REPORT 中的 id 在 BACKLOG 里不存在（两文件靠 id 关联，§7.3）`);
    }
  }

  // 方向二（软提示）：执行方任务应有 EXEC 块；我方自办任务不应有 EXEC 块
  const execIds = new Set(execTasks.map((task) => task.id));
  for (const task of backlogTasks) {
    const ownerOk = isOwnerLocal(task);
    if (ownerOk && execIds.has(task.id)) {
      warnings.push(`${task.id}: 我方自办任务（owner: 我方）不应在 EXEC-REPORT 中出现（其状态写在 BACKLOG）`);
    }
    if (!ownerOk && !execIds.has(task.id)) {
      warnings.push(`${task.id}: BACKLOG 中的执行方任务在 EXEC-REPORT 里没有对应块（状态缺省按 todo 合成）`);
    }
  }

  return { errors, warnings };
}

// ---------------------------------------------------------------------------
// 参数解析
// ---------------------------------------------------------------------------

/**
 * 解析命令行参数。
 * @param {string[]} argv process.argv.slice(2)
 * @returns {{ opts: object, positionals: string[] }}
 */
function parseArgs(argv) {
  const opts = {
    json: false,
    strict: false,
    help: false,
    file: null,
    exec: null,
    status: null,
    priority: null,
  };
  /** @type {string[]} */
  const positionals = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') {
      opts.json = true;
    } else if (arg === '--strict') {
      opts.strict = true;
    } else if (arg === '--help' || arg === '-h') {
      opts.help = true;
    } else if (arg === '--file') {
      opts.file = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--file=')) {
      opts.file = arg.slice('--file='.length);
    } else if (arg === '--exec') {
      opts.exec = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--exec=')) {
      opts.exec = arg.slice('--exec='.length);
    } else if (arg === '--status') {
      opts.status = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--status=')) {
      opts.status = arg.slice('--status='.length);
    } else if (arg === '--priority') {
      opts.priority = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--priority=')) {
      opts.priority = arg.slice('--priority='.length);
    } else if (arg.startsWith('-')) {
      fail(`${TAG} 未知参数：${arg}`, 2);
    } else {
      positionals.push(arg);
    }
  }
  return { opts, positionals };
}

/**
 * 解析两个清单文件的绝对路径。
 * @param {object} opts 选项
 * @returns {{ backlog: string, exec: string }}
 */
function resolveFiles(opts) {
  const backlog = opts.file
    ? resolve(process.cwd(), opts.file)
    : resolve(repoRoot, DEFAULT_BACKLOG_FILE);
  const exec = opts.exec
    ? resolve(process.cwd(), opts.exec)
    : resolve(repoRoot, DEFAULT_EXEC_FILE);
  return { backlog, exec };
}

/**
 * 读取并解析清单文件；文件不存在则返回 null（由调用方决定如何报错，绝不抛异常）。
 * @param {string} absFile 绝对路径
 * @returns {Array<object>|null} 任务数组或 null
 */
function tryLoadTasks(absFile) {
  if (!existsSync(absFile)) {
    return null;
  }
  let raw;
  try {
    raw = readFileSync(absFile, 'utf8');
  } catch (error) {
    fail(`${TAG} 无法读取清单文件：${displayPath(absFile)}（${error.message}）`, 2);
  }
  return parseTasks(raw);
}

/**
 * 读取 BACKLOG；缺失则报错退出（BACKLOG 是必需的）。
 * @param {string} absFile 绝对路径
 * @returns {Array<object>} 任务数组
 */
function loadBacklogOrExit(absFile) {
  const tasks = tryLoadTasks(absFile);
  if (tasks === null) {
    fail(`${TAG} 找不到 BACKLOG 文件：${displayPath(absFile)}`, 2);
  }
  return tasks;
}

/**
 * 读取 EXEC-REPORT；缺失返回空数组，并打印清晰警告（不崩）。
 * @param {string} absFile 绝对路径
 * @param {{ json?: boolean }} [options] 选项
 * @returns {Array<object>} 任务数组（缺失时为空数组）
 */
function loadExecOrWarn(absFile, options = {}) {
  const tasks = tryLoadTasks(absFile);
  if (tasks === null) {
    if (!options.json) {
      console.warn(
        `${TAG} ⚠️ 找不到执行方状态文件：${displayPath(absFile)} —— 已按「无 EXEC-REPORT」继续` +
          `（执行方任务的有效状态将退化为 todo）。请确认该文件已创建。`,
      );
    }
    return [];
  }
  return tasks;
}

/**
 * 打印某文件的校验错误。
 * @param {string} label 显示名
 * @param {string[]} errors 错误列表
 * @returns {void}
 */
function printCheckErrors(label, errors) {
  console.error(`✗ ${label} 格式校验失败（${errors.length} 项）：`);
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
}

/**
 * scan / list 前置校验：任一文件不合法就拒绝输出并以非 0 退出（绝不「猜着解析后照常输出」）。
 * @param {Array<object>} backlogTasks BACKLOG 任务
 * @param {Array<object>} execTasks EXEC 任务
 * @param {object} opts 选项
 * @param {{ backlog: string, exec: string }} files 文件路径
 * @returns {void}
 */
function ensureAllValidOrExit(backlogTasks, execTasks, opts, files) {
  const b = validateBacklog(backlogTasks, opts);
  const e = validateExec(execTasks, opts);
  const c = crossValidate(backlogTasks, execTasks);
  const errors = [...b.errors, ...e.errors, ...c.errors];
  if (errors.length === 0) {
    return;
  }
  const warnings = [...b.warnings, ...e.warnings, ...c.warnings];
  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          backlog: { file: displayPath(files.backlog), errors: b.errors, warnings: b.warnings },
          exec: { file: displayPath(files.exec), errors: e.errors, warnings: e.warnings },
          cross: { errors: c.errors, warnings: c.warnings },
        },
        null,
        2,
      ),
    );
  } else {
    if (b.errors.length > 0) {
      printCheckErrors(displayPath(files.backlog), b.errors);
    }
    if (e.errors.length > 0) {
      printCheckErrors(displayPath(files.exec), e.errors);
    }
    if (c.errors.length > 0) {
      console.error(`✗ 交叉校验失败（${c.errors.length} 项）：`);
      for (const err of c.errors) {
        console.error(`  - ${err}`);
      }
    }
    if (warnings.length > 0) {
      console.warn(`${TAG} 另有 ${warnings.length} 条警告（不影响校验结论）。`);
    }
    console.error(`${TAG} 清单格式不合法，已拒绝执行（不猜测解析）。`);
  }
  process.exit(1);
}

/**
 * 构造 scan / list 用的任务简报。
 * @param {object} backlogTask BACKLOG 任务
 * @returns {{ id: string, priority: string, area: string, title: string }}
 */
function brief(backlogTask) {
  return {
    id: backlogTask.id,
    priority: fv(backlogTask, 'priority') || '',
    area: fv(backlogTask, 'area') || '',
    title: backlogTask.title,
  };
}

/**
 * 判断任务是否含指定的我方轨迹 action。
 * @param {object} task 任务
 * @param {string} action 轨迹 action
 * @returns {boolean}
 */
function hasTrajectory(task, action) {
  return task.trajectories.some((traj) => {
    const parsed = parseTrajectoryBody(traj.body);
    return parsed.ok && parsed.action === action;
  });
}

// ---------------------------------------------------------------------------
// 子命令实现
// ---------------------------------------------------------------------------

/**
 * 子命令 scan：输出三块（§7.3.3）。
 *   ① 待验证（合成的有效状态为 done）
 *   ② 已打回待响应（BACKLOG 有 reject 轨迹，但有效状态仍是 done —— 执行方尚未改回 doing）
 *   ③ 疑似漏改状态（doing 但 evidence 已填）
 * @param {Array<object>} backlogTasks BACKLOG 任务
 * @param {Array<object>} execTasks EXEC 任务
 * @param {object} opts 选项
 * @param {{ backlog: string, exec: string }} files 文件路径
 * @returns {void}
 */
function cmdScan(backlogTasks, execTasks, opts, files) {
  ensureAllValidOrExit(backlogTasks, execTasks, opts, files);

  const execById = new Map(execTasks.map((task) => [task.id, task]));

  const pending = [];
  const rejected = [];
  const staleDoing = [];

  for (const task of backlogTasks) {
    const execTask = execById.get(task.id);
    const eff = effectiveStatus(task, execTask);
    if (eff === 'done') {
      if (hasTrajectory(task, 'reject')) {
        rejected.push(brief(task));
      } else {
        pending.push(brief(task));
      }
    }
    if (eff === 'doing' && !isEvidenceEmpty(evidenceOf(task, execTask))) {
      staleDoing.push(brief(task));
    }
  }

  if (opts.json) {
    console.log(JSON.stringify({ pending, rejected, staleDoing }, null, 2));
    return;
  }

  const printList = (items) => {
    if (items.length === 0) {
      return;
    }
    const areaWidth = Math.max(...items.map((item) => item.area.length));
    for (const item of items) {
      console.log(`  ${item.id}  ${item.priority}  ${item.area.padEnd(areaWidth)}  ${item.title}`);
    }
  };

  console.log(`待验证（合成 done，未 verified）：${pending.length} 项`);
  printList(pending);

  console.log(`\n已打回待响应（BACKLOG 有 reject 轨迹，但执行方 status 仍是 done）：${rejected.length} 项`);
  printList(rejected);
  if (rejected.length > 0) {
    console.log('   → 请执行方在 docs/EXEC-REPORT.md 把 status 改回 doing，修完再写 done。');
  }

  console.log(`\n疑似漏改状态（doing 但 evidence 已填，可能已完成）：${staleDoing.length} 项`);
  printList(staleDoing);
  if (staleDoing.length > 0) {
    console.log('   → 请核对该项制品是否已提交；若已完成，可补正 status 为 done 后验证。');
  }
}

/**
 * 子命令 list：按**合成后**的有效状态 / priority 汇总，支持过滤。
 * @param {Array<object>} backlogTasks BACKLOG 任务
 * @param {Array<object>} execTasks EXEC 任务
 * @param {object} opts 选项
 * @param {{ backlog: string, exec: string }} files 文件路径
 * @returns {void}
 */
function cmdList(backlogTasks, execTasks, opts, files) {
  ensureAllValidOrExit(backlogTasks, execTasks, opts, files);

  if (opts.status && !VALID_STATUS.includes(opts.status)) {
    fail(`${TAG} --status 非法值 "${opts.status}"（合法：${VALID_STATUS.join('/')}）`, 2);
  }
  if (opts.priority && !VALID_PRIORITY.includes(opts.priority)) {
    fail(`${TAG} --priority 非法值 "${opts.priority}"（合法：${VALID_PRIORITY.join('/')}）`, 2);
  }

  const execById = new Map(execTasks.map((task) => [task.id, task]));

  const byStatus = {};
  for (const status of VALID_STATUS) {
    byStatus[status] = 0;
  }
  const byPriority = {};
  for (const priority of VALID_PRIORITY) {
    byPriority[priority] = 0;
  }

  const rows = backlogTasks.map((task) => {
    const eff = effectiveStatus(task, execById.get(task.id));
    return { task, status: eff, priority: fv(task, 'priority') || '(缺失)' };
  });

  for (const row of rows) {
    byStatus[row.status] = (byStatus[row.status] || 0) + 1;
    byPriority[row.priority] = (byPriority[row.priority] || 0) + 1;
  }

  const filtered = rows.filter((row) => {
    if (opts.status && row.status !== opts.status) {
      return false;
    }
    if (opts.priority && row.priority !== opts.priority) {
      return false;
    }
    return true;
  });

  const items = filtered.map((row) => ({
    id: row.task.id,
    status: row.status,
    priority: fv(row.task, 'priority') || '',
    area: fv(row.task, 'area') || '',
    title: row.task.title,
  }));

  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          total: backlogTasks.length,
          byStatus,
          byPriority,
          filter: { status: opts.status, priority: opts.priority },
          items,
        },
        null,
        2,
      ),
    );
    return;
  }

  const hasFilter = Boolean(opts.status || opts.priority);
  if (!hasFilter) {
    console.log('按状态汇总（合成后）：');
    for (const status of VALID_STATUS) {
      console.log(`  ${status.padEnd(9)}${byStatus[status]}`);
    }
    console.log('按优先级汇总：');
    const priorityLine = VALID_PRIORITY.map((p) => `${p}  ${byPriority[p]}`).join('    ');
    console.log(`  ${priorityLine}`);
    return;
  }

  if (opts.status && opts.priority) {
    console.log(`筛选 status=${opts.status} · priority=${opts.priority}：${items.length} 项`);
  } else if (opts.status) {
    console.log(`按状态筛选 status=${opts.status}：${items.length} 项`);
  } else {
    console.log(`按优先级筛选 priority=${opts.priority}：${items.length} 项`);
  }
  if (items.length > 0) {
    const areaWidth = Math.max(...items.map((item) => item.area.length));
    for (const item of items) {
      console.log(`  ${item.id}  ${item.priority}  ${item.area.padEnd(areaWidth)}  ${item.title}`);
    }
  }
}

/**
 * 子命令 show：合并展示（定义来自 BACKLOG，status/evidence 来自 EXEC-REPORT，我方轨迹来自 BACKLOG）。
 * @param {Array<object>} backlogTasks BACKLOG 任务
 * @param {Array<object>} execTasks EXEC 任务
 * @param {object} opts 选项
 * @param {{ backlog: string, exec: string }} files 文件路径
 * @param {string|undefined} id 任务 id
 * @returns {void}
 */
function cmdShow(backlogTasks, execTasks, opts, files, id) {
  if (!id) {
    fail(`${TAG} 用法：node scripts/backlog.mjs show <T-xxx>`, 2);
  }
  const task = backlogTasks.find((item) => item.id === id);
  if (!task) {
    fail(`✗ 未找到任务 ${id}（${displayPath(files.backlog)}）`, 2);
  }
  const execTask = execTasks.find((item) => item.id === id);
  const ownerOk = isOwnerLocal(task);

  const statusSource = ownerOk ? 'BACKLOG' : 'EXEC-REPORT';
  const status = ownerOk ? fv(task, 'status') : fv(execTask, 'status');
  const evidence = evidenceOf(task, execTask);
  const verdict = fv(task, 'verdict');
  const eff = effectiveStatus(task, execTask);

  const mapTraj = (t) => {
    const parsed = parseTrajectoryBody(t.body);
    return { action: parsed.action, iso: parsed.iso, text: parsed.text, raw: t.raw };
  };
  const ownerTrajs = task.trajectories.map(mapTraj);
  const execTrajs = execTask ? execTask.trajectories.map(mapTraj) : [];

  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          id: task.id,
          title: task.title,
          effectiveStatus: eff,
          owner: fv(task, 'owner') || null,
          verdict: verdict === undefined ? null : verdict,
          status: status === undefined ? null : status,
          statusSource,
          priority: fv(task, 'priority') || '',
          area: fv(task, 'area') || '',
          depends: fv(task, 'depends') || '',
          size: fv(task, 'size') || '',
          spec: fv(task, 'spec') || '',
          acceptance: task.acceptance.map((item) => item.text),
          evidence: evidence === undefined ? '' : evidence,
          ownerTrajectories: ownerTrajs,
          execTrajectories: execTrajs,
        },
        null,
        2,
      ),
    );
    return;
  }

  const lines = [];
  lines.push(`${task.id} · ${task.title}`);
  lines.push(`  ${'effective'.padEnd(10)}: ${eff}`);
  lines.push(`  ${'source'.padEnd(10)}: status/evidence 来自 ${statusSource}`);
  if (fv(task, 'owner') !== undefined) {
    lines.push(`  ${'owner'.padEnd(10)}: ${fv(task, 'owner')}`);
  }
  if (verdict !== undefined) {
    lines.push(`  ${'verdict'.padEnd(10)}: ${verdict}`);
  }
  lines.push(`  ${'status'.padEnd(10)}: ${status === undefined ? '' : status}`);
  lines.push(`  ${'priority'.padEnd(10)}: ${fv(task, 'priority') || ''}`);
  lines.push(`  ${'area'.padEnd(10)}: ${fv(task, 'area') || ''}`);
  lines.push(`  ${'depends'.padEnd(10)}: ${fv(task, 'depends') || ''}`);
  lines.push(`  ${'size'.padEnd(10)}: ${fv(task, 'size') || ''}`);
  lines.push(`  ${'spec'.padEnd(10)}: ${fv(task, 'spec') || ''}`);
  lines.push(`  ${'acceptance'.padEnd(10)}:`);
  task.acceptance.forEach((item, index) => {
    lines.push(`    ${index + 1}. ${item.text}`);
  });
  lines.push(`  ${'evidence'.padEnd(10)}: ${evidence === undefined ? '' : evidence}`);
  lines.push(`  ${'-- 我方轨迹（BACKLOG）--'.padEnd(10)}:`);
  if (ownerTrajs.length === 0) {
    lines.push('    (无)');
  } else {
    for (const traj of task.trajectories) {
      lines.push(`  ${traj.raw}`);
    }
  }
  lines.push(`  ${'-- 执行方轨迹（EXEC-REPORT）--'.padEnd(10)}:`);
  if (execTrajs.length === 0) {
    lines.push('    (无)');
  } else {
    for (const traj of execTask.trajectories) {
      lines.push(`  ${traj.raw}`);
    }
  }
  console.log(lines.join('\n'));
}

/**
 * 子命令 check：分文件校验 + 交叉校验。
 * @param {Array<object>} backlogTasks BACKLOG 任务
 * @param {Array<object>|null} execTasks EXEC 任务（null = 文件缺失）
 * @param {object} opts 选项
 * @param {{ backlog: string, exec: string }} files 文件路径
 * @returns {void}
 */
function cmdCheck(backlogTasks, execTasks, opts, files) {
  const b = validateBacklog(backlogTasks, opts);
  const e = validateExec(execTasks || [], opts);
  const c = crossValidate(backlogTasks, execTasks || []);

  const errors = [...b.errors, ...e.errors, ...c.errors];
  if (execTasks === null) {
    errors.push(
      `${displayPath(files.exec)}: 找不到执行方状态文件（EXEC-REPORT 是双文件契约的必需文件，§7.3）`,
    );
  }
  const warnings = [...b.warnings, ...e.warnings, ...c.warnings];
  const ok = errors.length === 0;

  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          ok,
          backlog: {
            file: displayPath(files.backlog),
            total: backlogTasks.length,
            errors: b.errors,
            warnings: b.warnings,
          },
          exec: {
            file: displayPath(files.exec),
            total: execTasks === null ? 0 : execTasks.length,
            missing: execTasks === null,
            errors: e.errors,
            warnings: e.warnings,
          },
          cross: { errors: c.errors, warnings: c.warnings },
        },
        null,
        2,
      ),
    );
    process.exit(ok ? 0 : 1);
  }

  if (warnings.length > 0) {
    console.warn(`⚠ 共 ${warnings.length} 条警告（不影响合法性）：`);
    for (const warning of warnings) {
      console.warn(`  ! ${warning}`);
    }
  }

  if (!ok) {
    if (b.errors.length > 0) {
      printCheckErrors(displayPath(files.backlog), b.errors);
    }
    if (e.errors.length > 0) {
      printCheckErrors(displayPath(files.exec), e.errors);
    }
    if (c.errors.length > 0) {
      console.error(`✗ 交叉校验失败（${c.errors.length} 项）：`);
      for (const err of c.errors) {
        console.error(`  - ${err}`);
      }
    }
    if (execTasks === null) {
      console.error(`✗ ${displayPath(files.exec)}: 找不到执行方状态文件（EXEC-REPORT 是双文件契约的必需文件，§7.3）`);
    }
    console.error('退出码 1');
    process.exit(1);
  }

  console.log(`✓ ${displayPath(files.backlog)} 校验通过（${backlogTasks.length} 项）`);
  console.log(`✓ ${displayPath(files.exec)} 校验通过（${execTasks.length} 项）`);
}

/**
 * 在指定 id 的任务块里，找到「插入轨迹行」的位置（1-based 行号；insertAt = 该行号即插在其后）。
 * @param {object} task 任务
 * @returns {number} 1-based 行号
 */
function trajectoryInsertLine(task) {
  let maxLine = 0;
  for (const traj of task.trajectories) {
    maxLine = Math.max(maxLine, traj.line);
  }
  for (const item of task.acceptance) {
    maxLine = Math.max(maxLine, item.line);
  }
  return maxLine;
}

/**
 * 子命令 verify：写 BACKLOG。执行方任务写 `verdict: verified`；我方自办任务写 `status: verified`；
 * 并向 BACKLOG 追加一行 `verify` 轨迹（§7.3.3）。只允许从合成的有效状态 done 升级。
 * @param {Array<object>} backlogTasks BACKLOG 任务
 * @param {Array<object>} execTasks EXEC 任务
 * @param {object} opts 选项
 * @param {{ backlog: string, exec: string }} files 文件路径
 * @param {string|undefined} id 任务 id
 * @returns {void}
 */
function cmdVerify(backlogTasks, execTasks, opts, files, id) {
  if (!id) {
    fail(`${TAG} 用法：node scripts/backlog.mjs verify <T-xxx>`, 2);
  }
  const task = backlogTasks.find((item) => item.id === id);
  if (!task) {
    fail(`✗ 未找到任务 ${id}（${displayPath(files.backlog)}）`, 2);
  }
  const execTask = execTasks.find((item) => item.id === id);
  const eff = effectiveStatus(task, execTask);
  if (eff !== 'done') {
    fail(`✗ ${id} 当前有效状态=${eff}，只允许 done → verified（未修改文件）`, 3);
  }

  const ownerOk = isOwnerLocal(task);
  const absFile = files.backlog;
  const raw = readFileSync(absFile, 'utf8');
  const isCRLF = raw.includes('\r\n');
  const lines = raw.split('\n'); // 各行可能带行尾 \r

  const out = lines.slice();

  // 先追加 verify 轨迹行（插在最后一个轨迹行/acceptance 行之后），再改 status/verdict。
  // 原因：执行方任务「无 verdict」时会在 priority 行前插入新行，使其后所有行号 +1；
  // 若先改 status/verdict 再用原始行号插轨迹，会把轨迹插早一行（off-by-one）。
  const insertAfterLine = trajectoryInsertLine(task); // 1-based
  if (insertAfterLine <= 0) {
    fail(`✗ ${id} 无法定位轨迹行插入点，未修改文件`, 3);
  }
  const trajText = `  - verify ${localIso()} | by=backlog.mjs`;
  out.splice(insertAfterLine, 0, isCRLF ? `${trajText}\r` : trajText);

  // 以下被改的字段行都在 insertAfterLine 之前，故其行号不受上面插入的影响。
  let appendedLabel;

  if (ownerOk) {
    // 我方自办任务：把 status 行改成 verified
    const statusField = task.fields.status;
    if (!statusField) {
      fail(`✗ ${id} 缺少 status 字段（owner=我方 的任务应有 status，未修改文件）`, 3);
    }
    const idx = statusField.line - 1;
    const body = out[idx].endsWith('\r') ? out[idx].slice(0, -1) : out[idx];
    const cr = out[idx].endsWith('\r') ? '\r' : '';
    const newBody = body.replace(/^([ \t]*status:[ \t]*).*$/, '$1verified');
    if (newBody === body) {
      fail(`✗ ${id} 无法定位 status 行，未修改文件`, 3);
    }
    out[idx] = newBody + cr;
    appendedLabel = 'status → verified';
  } else {
    // 执行方任务：加 verdict: verified（已有 verdict 行则替换其值）
    if (task.fields.verdict) {
      const idx = task.fields.verdict.line - 1;
      const body = out[idx].endsWith('\r') ? out[idx].slice(0, -1) : out[idx];
      const cr = out[idx].endsWith('\r') ? '\r' : '';
      out[idx] = body.replace(/^([ \t]*verdict:[ \t]*).*$/, '$1verified') + cr;
    } else {
      const priorityField = task.fields.priority;
      if (!priorityField) {
        fail(`✗ ${id} 缺少 priority 字段，无法定位 verdict 插入点（未修改文件）`, 3);
      }
      const idx = priorityField.line - 1;
      const cr = out[idx].endsWith('\r') ? '\r' : '';
      out.splice(idx, 0, `verdict: verified${cr}`);
    }
    appendedLabel = 'verdict → verified';
  }

  writeFileSync(absFile, out.join('\n'), 'utf8');

  if (opts.json) {
    console.log(
      JSON.stringify({ ok: true, id, file: displayPath(absFile), change: appendedLabel, appended: trajText }, null, 2),
    );
    return;
  }
  console.log(`✓ ${id} → verified（写 ${displayPath(absFile)}：${appendedLabel}）`);
  console.log(`  已在 BACKLOG 追加：${trajText}`);
}

/**
 * 子命令 reject：写 BACKLOG，追加一行 `reject` 轨迹（不改 verdict，§7.3.2 / §7.3.3）。
 * @param {Array<object>} backlogTasks BACKLOG 任务
 * @param {object} opts 选项
 * @param {{ backlog: string, exec: string }} files 文件路径
 * @param {string|undefined} id 任务 id
 * @param {string} reason 打回原因
 * @returns {void}
 */
function cmdReject(backlogTasks, opts, files, id, reason) {
  if (!id) {
    fail(`${TAG} 用法：node scripts/backlog.mjs reject <T-xxx> [原因]`, 2);
  }
  const task = backlogTasks.find((item) => item.id === id);
  if (!task) {
    fail(`✗ 未找到任务 ${id}（${displayPath(files.backlog)}）`, 2);
  }

  const absFile = files.backlog;
  const raw = readFileSync(absFile, 'utf8');
  const isCRLF = raw.includes('\r\n');
  const lines = raw.split('\n');

  const insertAfterLine = trajectoryInsertLine(task);
  if (insertAfterLine <= 0) {
    fail(`✗ ${id} 无法定位轨迹行插入点，未修改文件`, 3);
  }
  const text = reason && reason.trim() ? reason.trim() : 'acceptance 未通过（详见验收报告）';
  const safeText = text.replace(/\r?\n/g, ' '); // 自由文本不得换行（§3.2）
  const trajText = `  - reject ${localIso()} | by=backlog.mjs | ${safeText}`;
  const newTrajLine = isCRLF ? `${trajText}\r` : trajText;

  const out = lines.slice();
  out.splice(insertAfterLine, 0, newTrajLine);
  writeFileSync(absFile, out.join('\n'), 'utf8');

  if (opts.json) {
    console.log(JSON.stringify({ ok: true, id, file: displayPath(absFile), appended: trajText }, null, 2));
    return;
  }
  console.log(`✓ ${id} 已打回（${displayPath(absFile)} 追加 reject 轨迹，verdict 不变）`);
  console.log(`  已在 BACKLOG 追加：${trajText}`);
}

// ---------------------------------------------------------------------------
// 入口
// ---------------------------------------------------------------------------

const USAGE = [
  '用法：node scripts/backlog.mjs <scan|list|show|verify|reject|check> [参数]',
  '',
  '双文件契约（协议 §7.3）：BACKLOG 归我方、EXEC-REPORT 归执行方，一个文件一个写者。',
  '',
  '  scan              输出三块：① 待验证 ② 已打回待响应 ③ 疑似漏改状态（主入口）',
  '  list              按**合成后**的有效状态 / priority 汇总（--status= / --priority= 过滤）',
  '  show <T-xxx>      合并展示（定义来自 BACKLOG，status/evidence 来自 EXEC-REPORT）',
  '  verify <T-xxx>    升级为 verified（执行方任务写 verdict、我方任务写 status），写 BACKLOG',
  '  reject <T-xxx>    追加 reject 轨迹到 BACKLOG（打回，不改 verdict）',
  '  check             分文件校验 + 交叉校验',
  '',
  '通用参数：',
  '  --json            输出机器可读 JSON',
  '  --file=<path>     指定 BACKLOG 文件（默认 docs/BACKLOG.md）',
  '  --exec=<path>     指定 EXEC-REPORT 文件（默认 docs/EXEC-REPORT.md）',
  '  --strict          未知字段由 warn 升为 error',
  '',
  '契约来源：docs/AI-HANDOFF.md §3 / §5 / §7.3。⛔ verified 只有我方（团队）可以写。',
].join('\n');

/**
 * 主入口。
 * @returns {void}
 */
function main() {
  const { opts, positionals } = parseArgs(process.argv.slice(2));
  const command = positionals[0];

  if (opts.help || !command) {
    if (!command && !opts.help) {
      console.error(USAGE);
      process.exit(2);
    }
    console.log(USAGE);
    process.exit(0);
  }

  const files = resolveFiles(opts);
  const backlogTasks = loadBacklogOrExit(files.backlog);

  switch (command) {
    case 'scan': {
      const execTasks = loadExecOrWarn(files.exec, opts);
      cmdScan(backlogTasks, execTasks, opts, files);
      break;
    }
    case 'list': {
      const execTasks = loadExecOrWarn(files.exec, opts);
      cmdList(backlogTasks, execTasks, opts, files);
      break;
    }
    case 'show': {
      const execTasks = loadExecOrWarn(files.exec, opts);
      cmdShow(backlogTasks, execTasks, opts, files, positionals[1]);
      break;
    }
    case 'verify': {
      const execTasks = loadExecOrWarn(files.exec, opts);
      cmdVerify(backlogTasks, execTasks, opts, files, positionals[1]);
      break;
    }
    case 'reject': {
      cmdReject(backlogTasks, opts, files, positionals[1], positionals.slice(2).join(' '));
      break;
    }
    case 'check': {
      const execTasks = tryLoadTasks(files.exec);
      cmdCheck(backlogTasks, execTasks, opts, files);
      break;
    }
    default:
      fail(`${TAG} 未知子命令：${command}\n${USAGE}`, 2);
  }
}

main();
