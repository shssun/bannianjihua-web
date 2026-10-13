import type { Tool } from '@/types';

/**
 * 英语句读器（channel: english）。
 * 把【英文句子清单】做成可点词查音标/释义的自包含阅读器，悬停即查、无需联网。
 */
const tool: Tool = {
  id: 'dict-reader',
  name: '英语句读器',
  channel: 'english',
  description: '把英文句子清单做成可点词查音标/释义的自包含阅读器，悬停即查、无需联网。',
  tags: ['英语', '离线', '词典'],
  status: 'online',
  runtime: 'client-only',
  entry: 'tools/english/dict-reader/index.html',
  cover: '🔤',
  version: '0.1.0',
  createdAt: '2025-01-18',
  order: 2,
  icap: ['passive'],
};

export default tool;
