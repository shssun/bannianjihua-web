import type { Message } from '@/types';

/**
 * 本地兜底留言（演示用）。
 * 仅在无 Supabase 时用于渲染留言板示例，页面上会明确标注「演示数据」。
 */
export const FALLBACK_MESSAGES: Message[] = [
  {
    id: 'fallback-msg-1',
    nickname: '路过的人',
    content: '站点很干净，Markdown 阅读器挺好用的，希望能加个暗色导出。',
    createdAt: '2025-03-01T10:12:00.000Z',
    status: 'visible',
  },
  {
    id: 'fallback-msg-2',
    nickname: '阿仓',
    content: '研发计划里的「直觉之卡」很期待，请问大概什么时候能上线？',
    createdAt: '2025-03-04T14:40:00.000Z',
    status: 'visible',
  },
  {
    id: 'fallback-msg-3',
    nickname: '匿名访客',
    content: '建议加个 RSS 订阅，方便追更。',
    createdAt: '2025-03-06T09:05:00.000Z',
    status: 'visible',
  },
];
