import type { Post } from '@/types';

/**
 * 本地兜底文章（无 Supabase 时用于演示渲染）。
 * 内容为 Markdown，覆盖标题、列表、代码块、表格等常见语法。
 */
export const FALLBACK_POSTS: Post[] = [
  {
    id: 'fallback-post-1',
    slug: 'why-browser-first-tools',
    title: '为什么我把工具都放在浏览器里跑',
    excerpt:
      '纯静态部署 + 浏览器本地执行，是这个站点所有工具的第一原则。本文说明背后的取舍与收益。',
    tags: ['架构', '纯静态', '工具'],
    published: true,
    publishedAt: '2025-02-12T08:00:00.000Z',
    createdAt: '2025-02-12T08:00:00.000Z',
    contentMd: `# 为什么我把工具都放在浏览器里跑

这个站点的定位很简单：**一个可长期演进的个人 blog 底座**，首页即「工具箱 + 研发路线图」。

## 第一原则

1. **零服务器进程**：所有产物都是静态文件，托管在免费的静态平台上。
2. **工具本地执行**：每个工具都是自包含单文件 HTML，不联网也能跑。
3. **后端只做最少的事**：唯一强后端功能是留言板，其余全部交给浏览器。

> 少即是多：能用浏览器解决的，绝不上服务器。

## 一个最小的示例

\`\`\`ts
export function add(a: number, b: number): number {
  return a + b;
}
\`\`\`

## 对比

| 方案 | 服务器成本 | 隐私 | 可离线 |
|---|---|---|---|
| 浏览器本地 | 0 | 高 | 是 |
| 传统后端 | 中/高 | 取决于政策 | 否 |

就这样，简单、可控、便宜。`,
  },
  {
    id: 'fallback-post-2',
    slug: 'iframe-sandbox-notes',
    title: '用 iframe 沙箱零改造复用单文件工具',
    excerpt:
      '工具是独立的单文件 HTML，如何在不破坏其「可离线」属性的前提下嵌入主站？答案是一个带 sandbox 的 iframe 与一套极简 postMessage 协议。',
    tags: ['前端', 'iframe', '架构'],
    published: true,
    publishedAt: '2025-03-05T09:30:00.000Z',
    createdAt: '2025-03-05T09:30:00.000Z',
    contentMd: `# 用 iframe 沙箱零改造复用单文件工具

## 问题

工具产物是自包含单文件 HTML（HTML + CSS/JS 渲染），
若改造成 React 组件，会破坏它的「离线可跑」属性。

## 方案：iframe + sandbox

\`\`\`html
<iframe
  sandbox="allow-scripts allow-same-origin allow-downloads allow-popups"
  src="/tools/xxx.html"
></iframe>
\`\`\`

## postMessage 协议

- 主站 → 工具：\`{ type: 'theme', value: 'light' | 'dark' }\`
- 工具 → 主站：\`{ type: 'resize', height: number }\`

接收端必须校验 \`type\` 与数值合法性，并通过高度上下限做兜底。

这样，加一个工具 = 丢一个 HTML 进 \`public/tools/\` + 注册表加一行。`,
  },
];
