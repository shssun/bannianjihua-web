import type { Tool } from '@/types';

/**
 * Markdown 阅读器（channel: general）。
 * 单文件工具，产物为自包含 HTML，直接提交进 public/。
 */
const tool: Tool = {
  id: 'md-to-html-reader',
  name: 'Markdown 阅读器',
  channel: 'general',
  description: '把 Markdown 文件夹构建成自包含单文件 HTML 阅读器，双击即用、离线可读。',
  tags: ['阅读器', '离线', 'Markdown'],
  status: 'online',
  runtime: 'client-only',
  entry: 'tools/general/md-to-html-reader/index.html',
  cover: '📖',
  version: '0.1.0',
  createdAt: '2025-01-10',
  order: 2,
};

export default tool;
