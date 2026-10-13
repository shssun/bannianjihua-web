import type { Tool } from '@/types';

/**
 * 直觉之卡（channel: cognition）。
 * 开发中，暂无产物目录。（原 id：intuition-zhika，本次改为 intuition-cards）
 */
const tool: Tool = {
  id: 'intuition-cards',
  name: '直觉之卡',
  channel: 'cognition',
  description: '把抽象直觉训练拆成可翻阅的小卡片，建立长期记忆回路。',
  tags: ['认知', '学习', '卡片'],
  status: 'developing',
  runtime: 'client-only',
  cover: '💡',
  eta: '2026-Q1',
  order: 2,
  icap: ['passive'],
};

export default tool;
