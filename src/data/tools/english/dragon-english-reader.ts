import type { Tool } from '@/types';

/**
 * 英文学习精编.html 的站内镜像（自包含单文件，已确认零外部依赖）。
 *
 * 内容源：`C:/Users/ZhuanZ1/Documents/WS/英文学习/英文学习精编.html`
 * 重建：修改 `内容/**\/*.md` 后重跑 `python 工具/build_html.py` —— 详见该目录的 `归档说明.md`
 *
 * 更新工具时：重建源 HTML → 覆盖本工具目录的 `index.html` → 无需改任何其他文件。
 */
const tool: Tool = {
  id: 'dragon-english-reader',
  name: '英文学习精编 · Dragon English',
  channel: 'english',
  description:
    '竹冈广信《Dragon English》全书精编阅读器：含 30 篇文档 / 464 个章节，左侧目录树 + 全文检索 + 深浅色切换 + 阅读进度，大部头离线可读。',
  tags: ['英语', '阅读', '离线'],
  status: 'online',
  runtime: 'client-only',
  entry: 'tools/english/dragon-english-reader/index.html',
  cover: '📚',
  version: '1.0.0',
  createdAt: '2026-10-14',
  order: 15,
  collections: ['books'],
  icap: ['passive'],
};

export default tool;
