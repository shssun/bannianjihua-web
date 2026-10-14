/**
 * scripts/backlog.mjs —— 「半年计划」待办交接清单（docs/BACKLOG.md）的扫描 / 校验 / 验证 CLI。
 *
 * 契约来源：docs/AI-HANDOFF.md §5（CLI 契约）、§3（evidence 主行 + 轨迹行规范）、§3.2、§5.3（解析边界）。
 * 本脚本严格按该契约实现；若本文与契约冲突，**以 docs/AI-HANDOFF.md 为准**。
 *
 * 用途：
 *   scan    —— 主入口：列出所有 status=done 但未 verified 的项（供我方独立验证）。
 *   list    —— 按 status / priority 汇总（支持 --status= / --priority= 过滤）。
 *   show    —— 打印某任务的全部字段（含轨迹行）。
 *   verify  —— 把某任务的 status 由 done 升级为 verified，并在 evidence 下追加一条 verify 轨迹行。
 *   check   —— 校验清单格式合法性（含 evidence / 轨迹行规则）。
 *
 * 通用可选参数：--json（输出机器可读 JSON）；--file=<path>（默认 docs/BACKLOG.md）；--strict。
 * 退出码：0 成功；非 0 = 用法错误 / 校验不通过 / 目标项不存在 / 状态不允许。
 *
 * ⛔ 铁律一（docs/AI-HANDOFF.md §1.2）：`verified` 只有我方（团队）可以写，执行方永远不得写。
 *    本脚本的 `verify` 子命令即「我方」的验证留痕工具，其职责就是执行 done → verified 这一步；
 *    普通执行方不应调用它。脚本本身不区分调用者身份，约束由协议与流程保证。
 *
 * 零依赖：仅使用 Node 内置模块（node:fs / node:path / node:process）。不引入任何第三方包。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const TAG = '[backlog]';
const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, '..');

const DEFAULT_FILE = 'docs/BACKLOG.md';

/** 合法取值集合（docs/AI-HANDOFF.md §5）。 */
const VALID_STATUS = ['todo', 'doing', 'blocked', 'done', 'verified'];
const VALID_PRIORITY = ['P0', 'P1', 'P2', 'P3'];
const VALID_SIZE = ['S', 'M', 'L'];

/** 必需键（缺任一即 error）。`acceptance` 是列表，单独判定。 */
const REQUIRED_KEYS = ['status', 'priority', 'area', 'depends', 'size', 'spec', 'evidence'];
/**
 * 已知键：必需键 + `acceptance`（列表头行 `acceptance:` 本身无值，
 * 其内容由紧随其后的顶级 `- ` 行承载，单独判定「至少 1 条」）。
 * 不在集合内的键视为未知键（默认 warn、--strict 升 error），保证不误报 `acceptance`。
 */
const KNOWN_KEYS = new Set([...REQUIRED_KEYS, 'acceptance']);

/** 轨迹行 action 取值（§3.2，大小写敏感、一律小写）。 */
const TRAJ_ACTIONS = new Set(['verify', 'reject', 'retract']);

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

// ---------------------------------------------------------------------------
// 解析（docs/AI-HANDOFF.md §5.3）
// ---------------------------------------------------------------------------

/**
 * 解析清单文本为任务数组。
 * @param {string} raw 清单原始文本
 * @returns {Array<object>} 任务对象数组
 */
function parseBacklog(raw) {
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
        if (!KNOWN_KEYS.has(key)) {
          current.unknownKeys.push({ key, line: lineNo });
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
// 校验（docs/AI-HANDOFF.md §3 / §5.2 / §5.3）
// ---------------------------------------------------------------------------

/**
 * 校验任务数组的格式合法性。
 * @param {Array<object>} tasks 任务数组
 * @param {{ strict?: boolean }} [options] 选项（--strict 时未知键升为 error）
 * @returns {{ errors: string[], warnings: string[] }}
 */
function validate(tasks, options = {}) {
  const strict = options.strict === true;
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  // 重复 id（§5.3 #9）
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
    for (const key of REQUIRED_KEYS) {
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

    // 枚举值合法性
    const status = fields.status ? fields.status.value : undefined;
    if (status !== undefined && !VALID_STATUS.includes(status)) {
      errors.push(`${task.id}: status 非法值 "${status}"（合法：${VALID_STATUS.join('/')}）`);
    }
    const priority = fields.priority ? fields.priority.value : undefined;
    if (priority !== undefined && !VALID_PRIORITY.includes(priority)) {
      errors.push(`${task.id}: priority 非法值 "${priority}"（合法：${VALID_PRIORITY.join('/')}）`);
    }
    const size = fields.size ? fields.size.value : undefined;
    if (size !== undefined && !VALID_SIZE.includes(size)) {
      errors.push(`${task.id}: size 非法值 "${size}"（合法：${VALID_SIZE.join('/')}）`);
    }

    // acceptance 至少 1 条（§5.2）
    if (task.acceptance.length === 0) {
      errors.push(`${task.id}: acceptance 为空（至少 1 条）`);
    }

    // done/verified 必须非空 evidence 主行（§5.2 ①）
    if ((status === 'done' || status === 'verified') && isEvidenceEmpty(fields.evidence ? fields.evidence.value : undefined)) {
      errors.push(`${task.id}: status=${status} 但 evidence 主行缺失（${status} 必须有单行 evidence）`);
    }

    // 轨迹行校验（§5.2 ③④⑤）
    for (const traj of task.trajectories) {
      if (traj.badIndent !== undefined) {
        errors.push(
          `${task.id}: 轨迹行未缩进 —— "${traj.raw}" 必须恰好缩进 2 空格（当前 ${traj.badIndent} 空格）`,
        );
        continue;
      }
      validateTrajectory(task.id, traj, errors);
    }

    // 缩进内容行（可能为 evidence 主行换行，§5.2 ②）
    for (const issue of task.indentIssues) {
      errors.push(
        `${task.id}: 第 ${issue.line} 行缩进 ${issue.indent} 空格无法解析（可能是 evidence 主行换行或被误缩进）`,
      );
    }

    // 未知键：默认 warn，--strict 升 error（§5.3 #6）
    for (const unknown of task.unknownKeys) {
      if (strict) {
        errors.push(`${task.id}: 未知字段 ${unknown.key}（--strict 下视为错误）`);
      } else {
        warnings.push(`${task.id}: 未知字段 ${unknown.key}（前向兼容，忽略）`);
      }
    }
  }

  return { errors, warnings };
}

/**
 * 校验单条轨迹行。
 * @param {string} id 任务 id
 * @param {{ raw: string, body: string }} traj 轨迹行
 * @param {string[]} errors 错误收集数组
 * @returns {void}
 */
function validateTrajectory(id, traj, errors) {
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
 * 解析目标清单文件的绝对路径。
 * @param {object} opts 选项
 * @returns {string} 绝对路径
 */
function resolveFile(opts) {
  if (opts.file) {
    return resolve(process.cwd(), opts.file);
  }
  return resolve(repoRoot, DEFAULT_FILE);
}

/**
 * 读取并解析清单文件；文件不存在则报错退出。
 * @param {string} absFile 绝对路径
 * @returns {Array<object>} 任务数组
 */
function loadTasks(absFile) {
  let raw;
  try {
    raw = readFileSync(absFile, 'utf8');
  } catch (error) {
    fail(`${TAG} 无法读取清单文件：${displayPath(absFile)}（${error.message}）`, 2);
  }
  return parseBacklog(raw);
}

/**
 * 打印 check 失败信息（非 JSON 形态）。
 * @param {string} absFile 绝对路径
 * @param {Array<{taskId:string,message:string}|string>} errors 错误列表
 * @returns {void}
 */
function printCheckErrors(absFile, errors) {
  console.error(`✗ ${displayPath(absFile)} 格式校验失败（${errors.length} 项）：`);
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
}

/**
 * scan / list 前置校验：清单不合法就拒绝输出并以非 0 退出（绝不「猜着解析后照常输出」）。
 * @param {Array<object>} tasks 任务数组
 * @param {object} opts 选项
 * @param {string} absFile 绝对路径
 * @returns {string[]} 警告列表
 */
function ensureValidOrExit(tasks, opts, absFile) {
  const { errors, warnings } = validate(tasks, opts);
  if (errors.length > 0) {
    if (opts.json) {
      console.log(
        JSON.stringify({ ok: false, file: displayPath(absFile), errors, warnings }, null, 2),
      );
    } else {
      printCheckErrors(absFile, errors);
      console.error(`${TAG} 清单格式不合法，已拒绝执行（不猜测解析）。`);
    }
    process.exit(1);
  }
  return warnings;
}

// ---------------------------------------------------------------------------
// 子命令实现
// ---------------------------------------------------------------------------

/**
 * 子命令 scan：列出所有 done 且未 verified 的项。
 * @param {Array<object>} tasks 任务数组
 * @param {object} opts 选项
 * @param {string} absFile 绝对路径
 * @returns {void}
 */
function cmdScan(tasks, opts, absFile) {
  ensureValidOrExit(tasks, opts, absFile);

  const pending = tasks
    .filter((task) => task.fields.status && task.fields.status.value === 'done')
    .map((task) => ({
      id: task.id,
      priority: task.fields.priority ? task.fields.priority.value : '',
      area: task.fields.area ? task.fields.area.value : '',
      title: task.title,
    }));

  if (opts.json) {
    console.log(JSON.stringify({ pending }, null, 2));
    return;
  }

  console.log(`待验证（done，未 verified）：${pending.length} 项`);
  if (pending.length > 0) {
    const areaWidth = Math.max(...pending.map((item) => item.area.length));
    for (const item of pending) {
      console.log(`  ${item.id}  ${item.priority}  ${item.area.padEnd(areaWidth)}  ${item.title}`);
    }
  }
}

/**
 * 子命令 list：按 status / priority 汇总，支持过滤。
 * @param {Array<object>} tasks 任务数组
 * @param {object} opts 选项
 * @param {string} absFile 绝对路径
 * @returns {void}
 */
function cmdList(tasks, opts, absFile) {
  ensureValidOrExit(tasks, opts, absFile);

  if (opts.status && !VALID_STATUS.includes(opts.status)) {
    fail(`${TAG} --status 非法值 "${opts.status}"（合法：${VALID_STATUS.join('/')}）`, 2);
  }
  if (opts.priority && !VALID_PRIORITY.includes(opts.priority)) {
    fail(`${TAG} --priority 非法值 "${opts.priority}"（合法：${VALID_PRIORITY.join('/')}）`, 2);
  }

  const byStatus = {};
  for (const status of VALID_STATUS) {
    byStatus[status] = 0;
  }
  const byPriority = {};
  for (const priority of VALID_PRIORITY) {
    byPriority[priority] = 0;
  }
  for (const task of tasks) {
    const status = task.fields.status ? task.fields.status.value : '(缺失)';
    const priority = task.fields.priority ? task.fields.priority.value : '(缺失)';
    byStatus[status] = (byStatus[status] || 0) + 1;
    byPriority[priority] = (byPriority[priority] || 0) + 1;
  }

  const filtered = tasks.filter((task) => {
    const status = task.fields.status ? task.fields.status.value : undefined;
    const priority = task.fields.priority ? task.fields.priority.value : undefined;
    if (opts.status && status !== opts.status) {
      return false;
    }
    if (opts.priority && priority !== opts.priority) {
      return false;
    }
    return true;
  });

  const items = filtered.map((task) => ({
    id: task.id,
    status: task.fields.status ? task.fields.status.value : '',
    priority: task.fields.priority ? task.fields.priority.value : '',
    area: task.fields.area ? task.fields.area.value : '',
    title: task.title,
  }));

  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          total: tasks.length,
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
    console.log('按状态汇总：');
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
 * 子命令 show：打印某任务全部字段。
 * @param {Array<object>} tasks 任务数组
 * @param {object} opts 选项
 * @param {string} absFile 绝对路径
 * @param {string|undefined} id 任务 id
 * @returns {void}
 */
function cmdShow(tasks, opts, absFile, id) {
  if (!id) {
    fail(`${TAG} 用法：node scripts/backlog.mjs show <T-xxx>`, 2);
  }
  const task = tasks.find((item) => item.id === id);
  if (!task) {
    fail(`✗ 未找到任务 ${id}（${displayPath(absFile)}）`, 2);
  }

  const fieldValue = (key) => (task.fields[key] ? task.fields[key].value : '');
  const trajectories = task.trajectories.map((traj) => {
    const parsed = parseTrajectoryBody(traj.body);
    return {
      action: parsed.action,
      iso: parsed.iso,
      text: parsed.text,
      raw: traj.raw,
    };
  });

  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          id: task.id,
          title: task.title,
          status: fieldValue('status'),
          priority: fieldValue('priority'),
          area: fieldValue('area'),
          depends: fieldValue('depends'),
          size: fieldValue('size'),
          spec: fieldValue('spec'),
          acceptance: task.acceptance.map((item) => item.text),
          evidence: fieldValue('evidence'),
          trajectories,
        },
        null,
        2,
      ),
    );
    return;
  }

  const lines = [];
  lines.push(`${task.id} · ${task.title}`);
  const label = (key) => `  ${key.padEnd(10)}: ${fieldValue(key)}`;
  lines.push(label('status'));
  lines.push(label('priority'));
  lines.push(label('area'));
  lines.push(label('depends'));
  lines.push(label('size'));
  lines.push(label('spec'));
  lines.push(`  ${'acceptance'.padEnd(10)}:`);
  task.acceptance.forEach((item, index) => {
    lines.push(`    ${index + 1}. ${item.text}`);
  });
  lines.push(`  ${'evidence'.padEnd(10)}: ${fieldValue('evidence')}`);
  for (const traj of task.trajectories) {
    lines.push(`  ${traj.raw}`);
  }
  console.log(lines.join('\n'));
}

/**
 * 子命令 check：校验清单格式合法性。
 * @param {Array<object>} tasks 任务数组
 * @param {object} opts 选项
 * @param {string} absFile 绝对路径
 * @returns {void}
 */
function cmdCheck(tasks, opts, absFile) {
  const { errors, warnings } = validate(tasks, opts);

  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          ok: errors.length === 0,
          file: displayPath(absFile),
          total: tasks.length,
          errors,
          warnings,
        },
        null,
        2,
      ),
    );
    process.exit(errors.length === 0 ? 0 : 1);
  }

  if (warnings.length > 0) {
    console.warn(`⚠ ${displayPath(absFile)} 有 ${warnings.length} 条警告（不影响合法性）：`);
    for (const warning of warnings) {
      console.warn(`  ! ${warning}`);
    }
  }

  if (errors.length > 0) {
    printCheckErrors(absFile, errors);
    console.error('退出码 1');
    process.exit(1);
  }

  console.log(`✓ ${displayPath(absFile)} 校验通过（${tasks.length} 项）`);
}

/**
 * 子命令 verify：done → verified（只允许从 done 升级），追加 verify 轨迹行。
 * 最小化改动：仅改目标任务 status 行 + 在其 evidence 块末尾追加轨迹行，其余字节不动。
 * @param {Array<object>} tasks 任务数组
 * @param {object} opts 选项
 * @param {string} absFile 绝对路径
 * @param {string|undefined} id 任务 id
 * @returns {void}
 */
function cmdVerify(tasks, opts, absFile, id) {
  if (!id) {
    fail(`${TAG} 用法：node scripts/backlog.mjs verify <T-xxx>`, 2);
  }
  const task = tasks.find((item) => item.id === id);
  if (!task) {
    fail(`✗ 未找到任务 ${id}（${displayPath(absFile)}）`, 2);
  }

  const status = task.fields.status ? task.fields.status.value : undefined;
  if (status !== 'done') {
    fail(
      `✗ ${id} 当前 status=${status === undefined ? '(缺失)' : status}，只允许 done → verified（未修改文件）`,
      3,
    );
  }
  if (!task.fields.status) {
    fail(`✗ ${id} 缺少 status 字段（未修改文件）`, 3);
  }

  // 保留原始行尾，做到「只改必要字节」
  const raw = readFileSync(absFile, 'utf8');
  const isCRLF = raw.includes('\r\n');
  const lines = raw.split('\n'); // 各行可能带行尾 \r

  const statusIdx = task.fields.status.line - 1;
  const statusBody = lines[statusIdx].endsWith('\r')
    ? lines[statusIdx].slice(0, -1)
    : lines[statusIdx];
  const statusCR = lines[statusIdx].endsWith('\r') ? '\r' : '';
  const newStatusBody = statusBody.replace(/^([ \t]*status:[ \t]*).*$/, '$1verified');
  if (newStatusBody === statusBody) {
    fail(`✗ ${id} 无法定位 status 行，未修改文件`, 3);
  }

  // 轨迹行插入点：evidence 块的最后一条轨迹行之后；无轨迹则紧随 evidence 主行之后
  let insertIdx = -1;
  if (task.trajectories.length > 0) {
    insertIdx = Math.max(...task.trajectories.map((traj) => traj.line)) - 1;
  } else if (task.fields.evidence) {
    insertIdx = task.fields.evidence.line - 1;
  }
  if (insertIdx < 0) {
    fail(`✗ ${id} 无法定位 evidence 块，未修改文件`, 3);
  }

  const trajText = `  - verify ${localIso()} | by=backlog.mjs`;
  const newTrajLine = isCRLF ? `${trajText}\r` : trajText;

  const out = lines.slice();
  out[statusIdx] = newStatusBody + statusCR;
  out.splice(insertIdx + 1, 0, newTrajLine);
  writeFileSync(absFile, out.join('\n'), 'utf8');

  if (opts.json) {
    console.log(
      JSON.stringify({ ok: true, id, status: 'verified', appended: trajText }, null, 2),
    );
    return;
  }
  console.log(`✓ ${id} → verified`);
  console.log(`  已在 evidence 追加：${trajText}`);
}

// ---------------------------------------------------------------------------
// 入口
// ---------------------------------------------------------------------------

const USAGE = [
  '用法：node scripts/backlog.mjs <scan|list|show|verify|check> [参数]',
  '',
  '  scan              列出所有 done 但未 verified 的项（主入口）',
  '  list              按 status / priority 汇总（--status= / --priority= 过滤）',
  '  show <T-xxx>      打印某任务全部字段（含轨迹行）',
  '  verify <T-xxx>    将 status 由 done 升级为 verified，并追加 verify 轨迹行',
  '  check             校验清单格式合法性',
  '',
  '通用参数：',
  '  --json            输出机器可读 JSON',
  '  --file=<path>     指定清单文件（默认 docs/BACKLOG.md）',
  '  --strict          未知字段由 warn 升为 error',
  '',
  '契约来源：docs/AI-HANDOFF.md §5。⛔ verified 只有我方（团队）可以写。',
].join('\n');

/**
 * 主入口。
 * @returns {void}
 */
function main() {
  const { opts, positionals } = parseArgs(process.argv.slice(2));
  const command = positionals[0];

  if (opts.help || !command) {
    // help / 无子命令都打印用法；无子命令时按用法错误处理
    if (!command && !opts.help) {
      console.error(USAGE);
      process.exit(2);
    }
    console.log(USAGE);
    process.exit(0);
  }

  const absFile = resolveFile(opts);
  const tasks = loadTasks(absFile);

  switch (command) {
    case 'scan':
      cmdScan(tasks, opts, absFile);
      break;
    case 'list':
      cmdList(tasks, opts, absFile);
      break;
    case 'show':
      cmdShow(tasks, opts, absFile, positionals[1]);
      break;
    case 'verify':
      cmdVerify(tasks, opts, absFile, positionals[1]);
      break;
    case 'check':
      cmdCheck(tasks, opts, absFile);
      break;
    default:
      fail(`${TAG} 未知子命令：${command}\n${USAGE}`, 2);
  }
}

main();
