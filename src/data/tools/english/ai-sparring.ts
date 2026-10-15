import type { Tool } from '@/types';

/**
 * 单人 + 外部 AI 陪练轮次工具（ICAP Interactive 层，零后端）。
 *
 * 玩法：工具只做「题面生成 + 轮次记录」，对话交给任意外部 LLM ——
 * 复制题面指令 → 外部 AI 追问 → 把追问粘回本工具 → 学习者作答 → 记录本轮。
 * 题库：精简内联自 `public/tools/english/moear/tool/phrases.json`（346 条，仅题面字段），
 * 单文件自包含，**工具本身不调用任何 AI / 网络 API**。
 * 记录：每轮写入与主站同 origin 的 IndexedDB（内联 `src/lib/storage/idb.ts`
 * 同结构逻辑，`kind: 'ai-sparring'`），可在主站「我的数据」页导出。
 */
const tool: Tool = {
  id: 'ai-sparring',
  name: 'AI 陪练轮次记录 · 外部 LLM 搭子',
  channel: 'english',
  description:
    '单人也能玩的互动陪练：工具只出题、不内置 AI 也不联网——把题面指令复制给任意外部 AI（ChatGPT/豆包等），再把它的追问粘回来、写下你的英文作答，每轮（题面/追问/作答）存入浏览器本地，可在「我的数据」导出。',
  tags: ['英语', '互动', '口语', '零后端'],
  status: 'developing',
  runtime: 'client-only',
  entry: 'tools/english/ai-sparring/index.html',
  cover: '💬',
  version: '1.0.0',
  createdAt: '2026-10-14',
  order: 19,
  icap: ['interactive'],
};

export default tool;
