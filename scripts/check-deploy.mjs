/**
 * 对比本地 Git 版本与线上部署版本（`npm run check:deploy`）。
 *
 * 用途：push 之后一条命令确认"线上到底更新到哪一版"，不必再翻 Actions 页面、
 *       也不必反复 sleep 轮询部署状态。
 *
 * 用法：
 *   npm run check:deploy
 *   npm run check:deploy -- --site=https://example.com --proxy=http://127.0.0.1:7890
 *
 * 代理策略：显式 --proxy / 环境变量 SITE_PROXY 优先；未指定时先直连，
 *          失败再自动尝试本地常用代理 127.0.0.1:4780（国内访问 GitHub Pages 常用）。
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readGitInfo } from './lib/git-info.mjs';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

/** 默认线上地址（GitHub Pages 项目站点）。换域名后用 --site 覆盖。 */
const DEFAULT_SITE = 'https://shssun.github.io/bannianjihua-web';
const FALLBACK_PROXIES = ['http://127.0.0.1:4780'];

/** 解析 `--key=value` 形式的命令行参数。 */
function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    const m = /^--([^=]+)=(.*)$/.exec(arg);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const site = (args.site || process.env.SITE_URL || DEFAULT_SITE).replace(/\/+$/, '');
const explicitProxy = args.proxy || process.env.SITE_PROXY || '';

/** 本地 git 信息；完全无法判断时返回 null。 */
function localGitInfo() {
  const info = readGitInfo(rootDir);
  return info.commitFull === 'unknown' ? null : info;
}

/** 用 Node 内置 fetch 直连获取线上 version.json；失败返回 null。
 *
 * 实测：GitHub Pages（*.github.io，走 CDN）在国内通常可直连，
 * 只有 github.com 主站才需要代理。因此优先走这条路 —— 不依赖任何子进程。
 */
async function fetchViaNode(url) {
  try {
    const res = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
    if (!res.ok) return null; // 线上尚无 version.json 时是 404
    return await res.json();
  } catch {
    return null;
  }
}

/** 用 curl 经代理获取（fetch 直连失败时的兜底，例如站点被墙）。 */
function fetchViaCurl(url, proxy) {
  const base = ['-sS', '--max-time', '20', '-H', 'Cache-Control: no-cache', url];
  const args = proxy ? ['-x', proxy, ...base] : base;
  try {
    return JSON.parse(execFileSync('curl', args, { encoding: 'utf8' }));
  } catch {
    return null;
  }
}

/** 依次尝试各条通路，返回 { version, via } 或 null。 */
async function resolveRemote() {
  const url = `${site}/version.json`;

  // 1) Node fetch 直连
  const direct = await fetchViaNode(url);
  if (direct) return { version: direct, via: 'fetch 直连' };

  // 2) 显式代理 → curl
  if (explicitProxy) {
    const viaExplicit = fetchViaCurl(url, explicitProxy);
    if (viaExplicit) return { version: viaExplicit, via: `curl 经代理 ${explicitProxy}` };
  }

  // 3) 常见本地代理 → curl
  for (const proxy of FALLBACK_PROXIES) {
    const viaProxy = fetchViaCurl(url, proxy);
    if (viaProxy) return { version: viaProxy, via: `curl 经代理 ${proxy}` };
  }

  return null;
}

/**
 * 线上 commit 落后本地 HEAD 多少提交。
 *
 * ⚠️ 两处必须坚持的写法：
 *   1. **用 `execFileSync` 直接 exec git，不经 shell**。Windows 上 `execSync` 走 cmd.exe，
 *      而 `^` 是 cmd 的转义字符 —— 若写成 `cat-file -e <hash>^{commit}`，cmd 会把 `^`
 *      吃掉变成 `<hash>{commit}`，命令必然失败，于是本函数恒返回 null、
 *      结论被误报成「线上 commit 在本地不存在」。（cmd 下 `%` 同样危险）
 *   2. **先校验是十六进制 hash**，避免把外部字符串拼进命令。
 *
 * @param {string} remoteCommit 线上 version.json 里的 commit
 * @returns {string|null} 提交数；线上 commit 不在本机历史里、或本机 git 不可用时为 null
 */
function commitsOnlineBehind(remoteCommit) {
  if (!/^[0-9a-f]{4,40}$/i.test(remoteCommit)) {
    return null;
  }
  try {
    execFileSync('git', ['cat-file', '-e', `${remoteCommit}^{commit}`], {
      cwd: rootDir,
      stdio: 'ignore',
    });
    return execFileSync('git', ['rev-list', '--count', `${remoteCommit}..HEAD`], {
      cwd: rootDir,
      encoding: 'utf8',
    }).trim();
  } catch {
    return null;
  }
}

// ---- 输出 ----
const local = localGitInfo();
console.log(`\n站点: ${site}`);

console.log('\n--- 本地 ---');
let localVersion = '?';
try {
  const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
  localVersion = pkg.version ?? '?';
} catch {
  /* package.json 读不到就显示 ? */
}
if (local) {
  console.log(`  version : ${localVersion}`);
  console.log(`  commit  : ${local.commit} (${local.branch})`);
  if (local.subject && local.subject !== 'unknown') {
    console.log(`  subject : ${local.subject}`);
  }
} else {
  console.log('  ✗ 无法读取本地 git 版本（不是 git 仓库，或 .git 不可读）');
}

const remote = await resolveRemote();
console.log('\n--- 线上 ---');
if (!remote) {
  console.log('  ✗ 无法获取线上 version.json');
  console.log('    · 若线上是"加入版本标识之前"部署的，属预期（需先部署一次新版）');
  console.log('    · 也可能是网络不通，可用 --proxy=... 指定代理重试');
  process.exitCode = 1;
} else {
  const v = remote.version;
  console.log(`  (经由 ${remote.via})`);
  console.log(`  version : ${v.version ?? '?'}`);
  console.log(`  commit  : ${v.commit ?? '?'} (${v.branch ?? '?'})`);
  console.log(`  buildAt : ${v.buildTime ?? '?'}`);
  console.log(`  base    : ${v.base ?? '?'}`);
}

// ---- 结论 ----
if (remote && local) {
  const remoteCommit = remote.version?.commit;
  console.log('\n--- 结论 ---');
  if (remoteCommit === local.commit) {
    console.log('  ✅ 已同步：线上版本 = 本地 HEAD');
  } else {
    const behind = remoteCommit ? commitsOnlineBehind(remoteCommit) : null;
    console.log(`  ⚠️  不一致：本地 ${local.commit} vs 线上 ${remoteCommit ?? '?'}`);
    if (behind && behind !== '0') {
      console.log(`     线上落后本地 ${behind} 个提交 —— 可能仍在部署中（Actions 约需 1-2 分钟）`);
    } else if (behind === '0') {
      console.log('     提交数一致但 hash 不同 —— 可能线上是不同分支构建的产物');
    } else {
      console.log('     ⚠️ 无法判定落后几个提交 —— 线上 commit 不在本机历史里，或本机执行 git 失败');
      console.log('        （这是「本机查不到」，不是「线上有问题」；可自行核对 git log --all）');
    }
  }
}
console.log('');
