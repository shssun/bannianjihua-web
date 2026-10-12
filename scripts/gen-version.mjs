/**
 * 构建后注入版本标识（`npm run build` 的收尾步骤，在 postbuild 之前执行）。
 *
 * 解决什么问题：
 *   push 之后想知道"线上到底更新到哪一版了"，此前只能翻 GitHub Actions 页面。
 *   现在每次构建会把版本信息写进产物，部署完成后一条 curl 即可确认：
 *     curl https://<站点>/version.json
 *
 * 产出两份（互为补充）：
 *   1. dist/version.json —— 结构化版本信息，curl 直接可读，不受 HTML 缓存影响
 *   2. dist/index.html 的 <html> 标签注入隐藏属性 data-version / data-commit /
 *      data-build-time（随后 copy-404.mjs 会把它复制成 404.html，两个入口都带版本）
 *
 * 提交号来源优先级：GitHub Actions 注入的环境变量 > 本地 git 命令 > 'unknown'。
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readGitInfo } from './lib/git-info.mjs';

const currentDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(currentDir, '..');
const distDir = join(rootDir, 'dist');

const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));

// 提交号来源优先级：CI 注入的环境变量（最准） > 本地 git 读取
const gitInfo = readGitInfo(rootDir);
const commitFull = process.env.GITHUB_SHA || gitInfo.commitFull;
const commit = commitFull === 'unknown' ? 'unknown' : commitFull.slice(0, 7);
const branch = process.env.GITHUB_REF_NAME || gitInfo.branch;
const buildTime = new Date().toISOString();
const base = process.env.BASE_PATH ?? '/bannianjihua-web/';

const versionInfo = {
  name: pkg.name,
  version: pkg.version,
  commit,
  commitFull,
  branch,
  buildTime,
  base,
  node: process.version,
};

// ---- 1. 写 dist/version.json ----
if (!existsSync(distDir)) {
  console.error('[gen-version] dist/ 不存在，请先执行 vite build。跳过。');
  process.exit(0);
}

const versionFile = join(distDir, 'version.json');
writeFileSync(versionFile, `${JSON.stringify(versionInfo, null, 2)}\n`, 'utf8');

// ---- 2. 给 dist/index.html 的 <html> 注入隐藏属性 ----
const indexPath = join(distDir, 'index.html');
if (existsSync(indexPath)) {
  const html = readFileSync(indexPath, 'utf8');
  const attrs =
    ` data-version="${pkg.version}"` +
    ` data-commit="${commit}"` +
    ` data-build-time="${buildTime}"`;

  // 幂等：先移除已有的同名属性，避免重复构建时叠加
  const patched = html.replace(/<html([^>]*)>/i, (_match, existing) => {
    const cleaned = existing.replace(
      /\s*data-(version|commit|build-time)="[^"]*"/gi,
      '',
    );
    return `<html${cleaned}${attrs}>`;
  });

  writeFileSync(indexPath, patched, 'utf8');
} else {
  console.warn('[gen-version] dist/index.html 不存在，跳过 HTML 属性注入。');
}

console.log(
  `[gen-version] ${pkg.name}@${pkg.version} commit=${commit} branch=${branch} base=${base}`,
);
console.log(`[gen-version] 已写入 dist/version.json 并注入 dist/index.html 隐藏属性`);
