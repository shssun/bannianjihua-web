import type { Tool } from '@/types';

/**
 * 双人轮换互测工具（ICAP Interactive 层首个工具，零后端）。
 *
 * 玩法：一台设备两人轮流 —— 出题方看中文短语与场景提示，答题方写英文表达；
 * 出题方对照参考原句判分并追问「为什么这么说」，随后互换角色。
 * 题库：`public/tools/english/moear/tool/phrases.json`（346 条短语，同源相对路径
 * 加载，失败时降级为工具内置的 6 条示例题）。
 * 记录：每轮判分写入与主站同 origin 的 IndexedDB（内联 `src/lib/storage/idb.ts`
 * 同结构逻辑，`kind: 'peer-turn'`），可在主站「我的数据」页导出。
 */
const tool: Tool = {
  id: 'peer-turn-drill',
  name: '双人轮换互测 · 短语活用',
  channel: 'english',
  description:
    '一台设备两人轮流玩：一方看中文短语与场景提示出题，另一方写出英文表达，出题方判分并追问「为什么这么说」，然后互换角色。零后端，每轮结果写入浏览器本地记录（可在「我的数据」导出）。',
  tags: ['英语', '双人', '互动', '口语'],
  status: 'online',
  runtime: 'client-only',
  entry: 'tools/english/peer-turn-drill/index.html',
  cover: '🎭',
  version: '1.0.0',
  createdAt: '2026-10-14',
  order: 18,
  icap: ['interactive'],
};

export default tool;
