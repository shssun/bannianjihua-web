/**
 * 读取 Git 仓库信息（供构建脚本与部署检查脚本共用）。
 *
 * 为什么需要兜底：
 *   直接调用 `git` 命令依赖子进程与 shell，在某些受限环境（沙箱、权限受限的
 *   CI、PATH 缺 git）会失败。因此这里先试 `git` 命令，失败则退化为**直接读
 *   `.git` 目录下的文件**（纯 fs 操作，不依赖任何外部进程）。
 *
 * 返回：{ commit, commitFull, branch, subject }；完全无法判断时字段为 'unknown'。
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';

const UNKNOWN = 'unknown';

/** 用 git 命令读取（最可靠，能正确处理 worktree / packed-refs）。失败返回 null。 */
function viaGitCommand(rootDir) {
  try {
    const run = (args) =>
      execSync(`git ${args}`, {
        cwd: rootDir,
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .toString()
        .trim();

    const commitFull = run('rev-parse HEAD');
    return {
      commitFull,
      commit: commitFull.slice(0, 7),
      branch: run('rev-parse --abbrev-ref HEAD'),
      subject: run('log -1 --pretty=%s'),
    };
  } catch {
    return null;
  }
}

/** 解析 `.git` 位置：普通仓库是目录，worktree / submodule 是含 "gitdir: ..." 的文件。 */
function resolveGitDir(rootDir) {
  const dotGit = join(rootDir, '.git');
  if (!existsSync(dotGit)) return null;

  if (statSync(dotGit).isDirectory()) return dotGit;

  // .git 是文件：内容形如 "gitdir: /path/to/actual/gitdir"
  try {
    const content = readFileSync(dotGit, 'utf8').trim();
    const match = /^gitdir:\s*(.+)$/i.exec(content);
    if (!match) return null;
    const target = match[1].trim();
    return isAbsolute(target) ? target : join(rootDir, target);
  } catch {
    return null;
  }
}

/** 从 refs 文件里解析出 commit hash；支持 loose refs 与 packed-refs。 */
function resolveRef(gitDir, ref) {
  // 1) loose ref：.git/refs/heads/main
  const loosePath = join(gitDir, ref);
  if (existsSync(loosePath)) {
    try {
      return readFileSync(loosePath, 'utf8').trim();
    } catch {
      /* 继续尝试 packed-refs */
    }
  }

  // 2) packed-refs：每行形如 "<hash> refs/heads/main"
  const packedPath = join(gitDir, 'packed-refs');
  if (existsSync(packedPath)) {
    try {
      const lines = readFileSync(packedPath, 'utf8').split('\n');
      for (const line of lines) {
        if (line.startsWith('#') || !line.trim()) continue;
        const [hash, name] = line.trim().split(/\s+/);
        if (name === ref) return hash;
      }
    } catch {
      /* 忽略 */
    }
  }

  return null;
}

/** 直接读 .git 文件（不依赖 git 命令）。失败返回 null。 */
function viaGitFiles(rootDir) {
  const gitDir = resolveGitDir(rootDir);
  if (!gitDir) return null;

  let head;
  try {
    head = readFileSync(join(gitDir, 'HEAD'), 'utf8').trim();
  } catch {
    return null;
  }

  // HEAD 形如 "ref: refs/heads/main"（正常）或直接的 hash（detached）
  let commitFull = null;
  let branch = UNKNOWN;

  const refMatch = /^ref:\s*(.+)$/i.exec(head);
  if (refMatch) {
    const ref = refMatch[1].trim();
    branch = ref.replace(/^refs\/heads\//, '');
    commitFull = resolveRef(gitDir, ref);
  } else if (/^[0-9a-f]{40}$/i.test(head)) {
    commitFull = head;
    branch = '(detached)';
  }

  if (!commitFull) return null;

  return {
    commitFull,
    commit: commitFull.slice(0, 7),
    branch,
    subject: UNKNOWN, // 读文件方式拿不到提交信息，需遍历对象，这里不实现
  };
}

/**
 * 读取仓库信息。
 * @param {string} rootDir 仓库根目录
 * @returns {{commit:string, commitFull:string, branch:string, subject:string}}
 */
export function readGitInfo(rootDir) {
  return (
    viaGitCommand(rootDir) ||
    viaGitFiles(rootDir) || {
      commit: UNKNOWN,
      commitFull: UNKNOWN,
      branch: UNKNOWN,
      subject: UNKNOWN,
    }
  );
}
