import type { Tool } from '@/types';

/**
 * 基本英文100_高考版.html 的站内镜像（自包含单文件，已确认零外部依赖）。
 *
 * 内容源：`C:/Users/ZhuanZ1/Documents/WS/英文学习/内容/**\/*.md`
 * 重建：`python 工具/build_html.py <参数>` —— 详见该目录的 `归档说明.md` §三
 *
 * 更新工具时：重建源 HTML → 覆盖本工具目录的 `index.html` → 无需改任何其他文件。
 */
const tool: Tool = {
  id: 'chinese-to-english-drill',
  name: '中译英默写 · 基本英文100',
  channel: 'english',
  description:
    '看中文提示写出英文，再对答案看讲解。100 条例句覆盖时态与逻辑两大高考英作文核心，逐条标注对接考点。',
  tags: ['英语', '写作', '默写', '英作文'],
  status: 'online',
  runtime: 'client-only',
  entry: 'tools/english/chinese-to-english-drill/index.html',
  cover: '✍️',
  version: '1.0.0',
  createdAt: '2026-10-13',
  order: 11,
  collections: ['books', 'dragon-english-basic100'],
  icap: ['passive', 'active'],
};

export default tool;
