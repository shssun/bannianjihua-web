import type { Tool } from '@/types';

/**
 * 影视台词跟读（channel: english）。
 *
 * 多文件工具（HTML + data.json + zh.json + voices/ + mp4 素材），
 * 由 `scripts/sync-tools.mjs` 依据 `scripts/sync/movie-line-shadowing.json`
 * 从本地工作目录 `D:/workspaces/每日英语` 增量同步进 `public/`，
 * 站内目录刻意**镜像**本地层级，工具内部的相对路径才能原样成立。
 */
const tool: Tool = {
  id: 'movie-line-shadowing',
  name: '影视台词跟读',
  channel: 'english',
  description:
    '精听影视与口语短视频台词：逐词高亮、变速循环跟读、录音与原声比对，专攻连读弱读。',
  tags: ['英语', '听力', '口语'],
  status: 'online',
  runtime: 'client-only',
  entry: 'tools/english/movie-line-shadowing/tool/index.html',
  cover: '🎧',
  version: '0.1.0',
  createdAt: '2026-10-12',
  order: 1,
};

export default tool;
