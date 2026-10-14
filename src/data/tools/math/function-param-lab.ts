import type { Tool } from '@/types';

/**
 * 数学参数实验室（channel: math）。
 * 三章 12 个场景（函数与基本初等 / 数列与三角 / 解析几何），
 * 拖动参数实时观察图象变化与临界退化，覆盖高中数学易误解点。
 */
const tool: Tool = {
  id: 'function-param-lab',
  name: '数学参数实验室',
  channel: 'math',
  description: '拖动参数实时观察二次、幂函数、等比 Sₙ、三角平移、直线斜率、椭圆等 12 个高中数学易误解场景的图象变化与临界退化。',
  tags: ['数学', '函数', '图象', '参数'],
  status: 'online',
  runtime: 'client-only',
  entry: 'tools/math/function-param-lab/index.html',
  cover: '📐',
  version: '2.0.0',
  createdAt: '2026-10-14',
  order: 2,
  collections: ['high-school-math'],
  icap: ['active'],
};

export default tool;
