import type { Tool } from '@/types';

/**
 * 双拼键位练习（channel: general）。
 * 单文件工具，产物为自包含 HTML，直接提交进 public/。
 */
const tool: Tool = {
  id: 'shuangpin-practice',
  name: '双拼练习',
  channel: 'general',
  description: '搜狗双拼键位练习：实时提示按键与拼音，统计速度与正确率，纯浏览器本地运行。',
  tags: ['输入法', '双拼', '练习'],
  status: 'online',
  runtime: 'client-only',
  entry: 'tools/general/shuangpin-practice/index.html',
  cover: '⌨️',
  version: '0.1.0',
  createdAt: '2026-10-11',
  order: 1,
};

export default tool;
