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
import { execFileSync, execSync } from 'node:child_process';
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

/** 用 curl 取线上 version.json；成功返回解析后的对象，失败返回 null。 */
function fetchRemoteVersion(proxy) {
  const curlArgs = [
    '-sS',
    '--max-time',
    '20',
    '-H',
    'Cache-Control: no-cache',
    `${site}/version.json`,
  ];
  const withProxy = proxy ? ['-x', proxy, ...curlArgs] : curlArgs;

  try {
    const raw = execFileSync('curl', withProxy, { encoding: 'utf8' });
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** 依次尝试各个代理方案，返回 { version, usedProxy } 或 null。 */
function resolveRemote() {
  if (explicitProxy) {
    const version = fetchRemoteVersion(explicitProxy);
    return version ? { version, usedProxy: explicitProxy } : null;
  }

  // 先直连
  const direct = fetchRemoteVersion('');
  if (direct) return { version: direct, usedProxy: null };

  // 再逐个尝试常见本地代理
  for (const proxy of FALLBACK_PROXIES) {
    const version = fetchRemoteVersion(proxy);
    if (version) return { version, usedProxy: proxy };
  }
  return null;
}

/** 本地相对线上落后多少提交（线上 commit 在本地存在时才有意义）。 */
function commitsBehind(remoteCommit) {
  try {
    execSync(`git cat-file -e ${remoteCommit}^{commit}`, {
      cwd: rootDir,
      stdio: 'ignore',
    });
    return execSync(`git rev-list --count ${remoteCommit}..HEAD`, { cwd: rootDir })
      .toString()
      .trim();
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

const remote = resolveRemote();
console.log('\n--- 线上 ---');
if (!remote) {
  console.log('  ✗ 无法获取线上 version.json');
  console.log('    · 若线上是"加入版本标识之前"部署的，属预期（需先部署一次新版）');
  console.log('    · 也可能是网络/代理不通，可用 --proxy=... 指定代理重试');
  process.exitCode = 1;
} else {
  const v = remote.version;
  if (remote.usedProxy) console.log(`  (经由代理 ${remote.usedProxy})`);
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
    const behind = remoteCommit ? commitsBehind(remoteCommit) : null;
    console.log(`  ⚠️  不一致：本地 ${local.commit} vs 线上 ${remoteCommit ?? '?'}`);
    if (behind && behind !== '0') {
      console.log(`     线上落后本地 ${behind} 个提交 —— 可能仍在部署中（Actions 约需 1-2 分钟）`);
    } else if (behind === '0') {
      console.log('     提交数一致但 hash 不同 —— 可能线上是不同分支构建的产物');
    } else {
      console.log('     线上 commit 在本地不存在 —— 检查是否来自其他分支/环境');
    }
  }
}
console.log('');
