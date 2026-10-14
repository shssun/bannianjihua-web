import type { Tool } from '@/types';

/**
 * 函数参数实验室（channel: math）。
 * 通过拖动参数实时观察常见函数图象的变化，覆盖高中数学易误解点。
 */
const tool: Tool = {
  id: 'function-param-lab',
  name: '函数参数实验室',
  channel: 'math',
  description: '拖动参数实时观察二次、一次、反比例、指数、对数、对勾函数图象变化，直观理解高中数学易误解点。',
  tags: ['数学', '函数', '图象', '参数'],
  status: 'online',
  runtime: 'client-only',
  entry: 'tools/math/function-param-lab/index.html',
  cover: '📐',
  version: '1.0.0',
  createdAt: '2026-10-14',
  order: 2,
  collections: ['high-school-math'],
  icap: ['active'],
};

export default tool;
