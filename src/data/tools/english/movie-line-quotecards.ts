import type { Tool } from '@/types';

/**
 * 台词语音卡_v0.2.html 的站内镜像（自包含单文件，已确认零外部依赖）。
 *
 * 内容源：`C:/Users/ZhuanZ1/Documents/WS/英文学习/台词语音卡_v0.2.html`（由 `台词语音卡_v0.2.md` 生成）
 * 重建：修改 `内容/**\/*.md` 后重跑 `python 工具/build_html.py` —— 详见该目录的 `归档说明.md`
 *
 * ⚠️ 命名注意：该页面**不含任何音频播放能力**（零 `<audio>`、零 .mp3），
 * 「语音」指的是台词的连读/弱读/吞音**标注笔记**，不是可听的音频 —— 名称与描述据实。
 *
 * 更新工具时：重建源 HTML → 覆盖本工具目录的 `index.html` → 无需改任何其他文件。
 */
const tool: Tool = {
  id: 'movie-line-quotecards',
  name: '台词金句语音标注 · 阅读版',
  channel: 'english',
  description:
    '10 句电影台词的语音标注笔记：连读 / 弱读 / 吞音的静态阅读页（由 Markdown 生成）。注意：不含音频播放，只有文字标注，适合朗读跟读练习。',
  tags: ['英语', '台词', '阅读', '笔记'],
  status: 'online',
  runtime: 'client-only',
  entry: 'tools/english/movie-line-quotecards/index.html',
  cover: '🎬',
  version: '1.0.0',
  createdAt: '2026-10-14',
  order: 16,
  collections: ['books', 'movie-lines'],
  icap: ['active'],
};

export default tool;
