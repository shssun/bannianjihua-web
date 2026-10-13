import type { Tool } from '@/types';

/**
 * 基本英文100_纯句词典版.html 的站内镜像（自包含单文件，已确认零外部依赖）。
 *
 * 内容源：`C:/Users/ZhuanZ1/Documents/WS/英文学习/内容/**\/*.md`
 * 重建：`python 工具/build_html.py <参数>` —— 详见该目录的 `归档说明.md` §三
 *
 * 更新工具时：重建源 HTML → 覆盖本工具目录的 `index.html` → 无需改任何其他文件。
 */
const tool: Tool = {
  id: 'basic100-sentence-reader',
  name: '纯句点词阅读 · 基本英文100',
  channel: 'english',
  description:
    '100 句英文连着读，句中每个单词可悬停（桌面）或点击（手机）查音标和中文释义，词典离线内嵌，断网可用。',
  tags: ['英语', '阅读', '词典', '离线'],
  status: 'online',
  runtime: 'client-only',
  entry: 'tools/english/basic100-sentence-reader/index.html',
  cover: '📖',
  version: '1.0.0',
  createdAt: '2026-10-13',
  order: 12,
  collections: ['books', 'dragon-english-basic100'],
  icap: ['passive'],
};

export default tool;
