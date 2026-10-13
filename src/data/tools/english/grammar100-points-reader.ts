import type { Tool } from '@/types';

/**
 * 必修英文法100_高考版.html 的站内镜像（自包含单文件，已确认零外部依赖）。
 *
 * 内容源：`C:/Users/ZhuanZ1/Documents/WS/英文学习/内容/**\/*.md`
 * 重建：`python 工具/build_html.py <参数>` —— 详见该目录的 `归档说明.md` §三
 *
 * 更新工具时：重建源 HTML → 覆盖本工具目录的 `index.html` → 无需改任何其他文件。
 */
const tool: Tool = {
  id: 'grammar100-points-reader',
  name: '高考语法讲点 · 必修英文法100',
  channel: 'english',
  description:
    '100 个高考语法讲点，逐点配讲解、例题与解析，另附按错因聚合的中国学生专属易错表。',
  tags: ['英语', '语法', '讲义', '高考'],
  status: 'online',
  runtime: 'client-only',
  entry: 'tools/english/grammar100-points-reader/index.html',
  cover: '📐',
  version: '1.0.0',
  createdAt: '2026-10-13',
  order: 13,
  collections: ['books', 'dragon-english-grammar100'],
  icap: ['passive', 'active'],
};

export default tool;
