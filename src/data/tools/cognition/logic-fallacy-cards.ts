import type { Tool } from '@/types';

/**
 * 逻辑谬误卡片（channel: cognition）。
 *
 * 正式产物是「公众号长文 → 深色信息图卡（PNG）」，其生成依赖无头 Chrome，
 * 无法在纯静态/浏览器端实时运行，因此定位为「已生成图集静态展示」
 * （runtime: light-backend）。
 */
const tool: Tool = {
  id: 'logic-fallacy-cards',
  name: '逻辑谬误卡片',
  channel: 'cognition',
  description: '公众号长文渲染为深色信息图卡（PNG），用于收藏与速查。',
  tags: ['信息图', '卡片', '认知'],
  status: 'developing',
  runtime: 'light-backend',
  entry: 'tools/cognition/logic-fallacy-cards/index.html',
  cover: '🧩',
  version: '0.1.0',
  createdAt: '2025-02-01',
  order: 1,
  icap: ['passive'],
};

export default tool;
