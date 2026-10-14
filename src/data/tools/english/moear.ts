import type { Tool } from '@/types';

/**
 * 影视台词磨耳朵（channel: english）。
 *
 * 多文件工具（index.html + tool/phrases.json + audio_norm/ + tool_phrase/voices/），
 * 由 `scripts/sync-tools.mjs` 依据 `scripts/sync/moear.json`
 * 从本地工作目录 `D:/workspaces/每日英语台词` 增量同步进 `public/`，
 * 站内目录刻意**镜像**本地层级，工具内部的相对路径才能原样成立。
 *
 * 播放器本体源文件名为 `player.html`，不合站内「单文件工具统一 index.html」的规约，
 * 因此由同步清单的 `rename` 字段把它精确映射为 `index.html`（工具本体零改动）。
 *
 * 只同步播放器运行期真正读取的三类素材：
 *   - `tool/phrases.json`（346 条短语）
 *   - `audio_norm/**`（1900 条已响度归一化的真人原声 + 清单）
 *   - `tool_phrase/voices/**`（692 条短语级标准音 TTS）
 * `tool/voices/**`（unit 级回退候选）与原始层 `audio/` 实测不会被播放器命中，故不带走。
 *
 * **id 为什么是 `moear` 而不是 `movie-line-listening`**：老板 2026-10-13 拍板。
 * 理由是与工具内部已定的 `localStorage` 前缀 `moear:` 对齐 ——
 * 目录名、路由段、存储键前缀三处同名，排查时不用再做一次心算映射。
 * 展示名仍是「影视台词磨耳朵」，用户看到的中文不受影响。
 */
const tool: Tool = {
  id: 'moear',
  name: '影视台词磨耳朵',
  channel: 'english',
  description:
    '346 条影视高频短语：随机抽条循环灌耳、按序串读，纯英文无中文干扰，专攻听力反应速度。',
  tags: ['英语', '听力', '磨耳朵'],
  status: 'online',
  runtime: 'client-only',
  entry: 'tools/english/moear/index.html',
  cover: '👂',
  version: '0.1.0',
  createdAt: '2026-10-13',
  order: 3,
  collections: ['movie-lines'],
  icap: ['passive'],
};

export default tool;
