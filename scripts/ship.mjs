/**
 * 一键发布：构建 → 提交 → 推送 → 等待部署 → 确认线上版本。
 *
 * 用法：
 *   npm run ship -- "feat: 新增某功能"
 *   npm run ship -- "fix: 修某问题" --site=https://example.com --timeout=420
 *
 * 参数：
 *   第一个非 --key=value 的参数串作为提交信息（必填）
 *   --site=<url>      站点地址，默认 GitHub Pages 项目站点
 *   --proxy=<url>     兜底代理（仅当 fetch 不通时用 curl 走代理）
 *   --timeout=<秒>    等待部署的超时，默认 300
 *   --no-wait         推送后不等待部署，直接结束
 *
 * 退出码：0 全部成功；1 任一步骤失败。
 *
 * 实现注意（跨平台）：
 *   - Windows 下 `npm` 是 `npm.cmd`，Node 20+ 不允许直接 spawn .cmd（会 EINVAL），
 *     因此统一用 `shell: true` 执行命令字符串。
 *   - 提交信息经**临时文件 + git commit -F** 传递，避免 shell 引号/特殊字符转义问题。
 *   - 等待部署优先用内置 fetch（实测 *.github.io 可直连）；curl 仅作代理兜底。
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readGitInfo } from './lib/git-info.mjs';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_SITE = 'https://shssun.github.io/bannianjihua-web';

// ---------- 参数解析 ----------
const rawArgs = process.argv.slice(2).filter((a) => a !== '--');
const flagArgs = rawArgs.filter((a) => /^--[\w-]+(=|$)/.test(a));
const messageParts = rawArgs.filter((a) => !/^--[\w-]+(=|$)/.test(a));

const flagList = flagArgs.flatMap((a) =>
  a.includes('=') ? [a] : [a, 'true'], // 支持 --no-wait 这类布尔开关
);
const pairs = [];
for (let i = 0; i < flagList.length; i += 2) pairs.push(flagList.slice(i, i + 2));
const flags = Object.fromEntries(pairs.map(([k, v]) => [k.slice(2), v]));

const commitMessage = messageParts.join(' ').trim();
const site = (flags.site || process.env.SITE_URL || DEFAULT_SITE).replace(/\/+$/, '');
const proxy = flags.proxy || process.env.SITE_PROXY || '';
const waitTimeoutSec = Number(flags.timeout ?? 300);
const shouldWait = flags['no-wait'] !== 'true';

if (!commitMessage) {
  console.error('\n✗ 缺少提交信息。用法：');
  console.error('    npm run ship -- "feat: 做了什么"\n');
  process.exit(1);
}

/** 执行命令（经 shell）；输出透传给用户。失败时抛出带详情的错误。 */
function runStep(command, { silent = false } = {}) {
  try {
    return execFileSync(command, {
      cwd: rootDir,
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      shell: true,
    });
  } catch (error) {
    // 把子进程真实的 stderr / stdout 带出来，避免"构建失败"却看不出原因
    const detail = [error?.stderr, error?.stdout]
      .map((s) => (s ? s.toString().trim() : ''))
      .filter(Boolean)
      .join('\n');
    if (detail) console.error(`\n${detail}`);
    else if (error?.message) console.error(`\n${error.message}`);
    throw error;
  }
}

const step = (n, total, label) => console.log(`\n[${n}/${total}] ${label}`);

// ---------- 1. 构建 ----------
step(1, 5, '构建…');
try {
  runStep('npm run build');
} catch {
  console.error('\n✗ 构建失败，已中止（未提交任何内容）。');
  process.exit(1);
}

// ---------- 2. 检查并提交 ----------
step(2, 5, '提交…');
let statusOut = '';
try {
  statusOut = runStep('git status --porcelain', { silent: true }) ?? '';
} catch {
  console.error('\n✗ 无法执行 git 命令。');
  console.error('   常见原因：当前目录不是 git 仓库，或运行环境限制子进程');
  console.error('   （受限沙箱/安全容器）。请在普通终端中重试。');
  process.exit(1);
}

if (!statusOut.trim()) {
  console.log('  没有需要提交的变更。');
  console.log('  （若只想确认线上版本，请用：npm run check:deploy）');
  process.exit(0);
}

console.log(`  变更文件数：${statusOut.trim().split('\n').length}`);

// 提交信息走临时文件，避开 shell 转义问题
const messageFile = join(tmpdir(), `ship-commit-${Date.now()}.txt`);
writeFileSync(messageFile, `${commitMessage}\n`, 'utf8');
try {
  runStep('git add -A');
  runStep(`git commit -F "${messageFile}"`);
} catch {
  console.error('\n✗ 提交失败，已中止（未推送）。');
  process.exit(1);
} finally {
  try {
    unlinkSync(messageFile);
  } catch {
    /* 临时文件清理失败不影响主流程 */
  }
}

const local = readGitInfo(rootDir);
const localCommit = local.commit;
console.log(`  已提交：${localCommit}`);

// ---------- 3. 推送 ----------
step(3, 5, '推送…');
const branch = local.branch && local.branch !== 'unknown' ? local.branch : 'main';
try {
  runStep(`git push origin ${branch}`);
} catch {
  console.error('\n✗ 推送失败。本地已提交，修好网络/凭据后执行 git push 即可。');
  process.exit(1);
}

if (!shouldWait) {
  console.log('\n✓ 已推送（--no-wait，未等待部署）。');
  process.exit(0);
}

// ---------- 4. 等待部署 ----------
step(4, 5, `等待 GitHub Actions 部署（超时 ${waitTimeoutSec}s）…`);

/** 取线上 version.json；fetch 优先，curl 经代理兜底。 */
async function fetchRemoteVersion() {
  const url = `${site}/version.json`;
  try {
    const res = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
    if (res.ok) return await res.json();
  } catch {
    /* 走兜底 */
  }
  if (proxy) {
    try {
      return JSON.parse(
        execFileSync('curl', ['-sS', '--max-time', '20', '-x', proxy, url], {
          encoding: 'utf8',
        }),
      );
    } catch {
      /* 忽略 */
    }
  }
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const deadline = Date.now() + waitTimeoutSec * 1000;
let deployed = null;

while (Date.now() < deadline) {
  const remote = await fetchRemoteVersion();
  if (remote?.commit === localCommit) {
    deployed = remote;
    break;
  }
  process.stdout.write('.');
  await sleep(10000);
}
process.stdout.write('\n');

// ---------- 5. 结果 ----------
step(5, 5, '结果');
if (deployed) {
  console.log(`  ✅ 已上线 ${deployed.commit}（${deployed.branch}）`);
  console.log(`     ${site}`);
  console.log(`     构建时间：${deployed.buildTime}`);
  process.exit(0);
}

console.log(`  ⚠️  ${waitTimeoutSec}s 内未确认部署完成。`);
console.log('     可能仍在构建中（可稍后执行 npm run check:deploy 复查），');
console.log('     或部署失败 —— 检查 https://github.com/shssun/bannianjihua-web/actions');
process.exitCode = 1;
