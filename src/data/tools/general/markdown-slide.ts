import type { Tool } from '@/types';

/**
 * Markdown 幻灯（channel: general）。
 * 规划中，暂无产物目录。
 */
const tool: Tool = {
  id: 'markdown-slide',
  name: 'Markdown 幻灯',
  channel: 'general',
  description: '一份 Markdown 直接生成可演示的单文件幻灯片，离线分享。',
  tags: ['演示', '离线', 'Markdown'],
  status: 'planned',
  runtime: 'client-only',
  cover: '📊',
  eta: '2026-Q2',
  order: 3,
  icap: ['passive'],
};

export default tool;
