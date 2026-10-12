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
    slug: 'open-tools-in-new-tab',
    title: '为什么工具是「新标签页直接打开」而不是内嵌',
    excerpt:
      '工具是独立的自包含单文件 HTML。嵌入主站看起来更一体化，却会引入沙箱、跨文档通信和一整套额外协议。本文说明最后为什么选了最朴素的做法。',
    tags: ['前端', '架构', '工具'],
    published: true,
    publishedAt: '2025-03-05T09:30:00.000Z',
    createdAt: '2025-03-05T09:30:00.000Z',
    contentMd: `# 为什么工具是「新标签页直接打开」而不是内嵌

## 问题

工具产物是自包含单文件 HTML（HTML + CSS/JS 渲染）。
若改造成 React 组件，会破坏它「离线可跑」的属性。

## 曾经考虑过：iframe + sandbox

\`\`\`html
<iframe
  sandbox="allow-scripts allow-same-origin"
  src="/tools/xxx.html"
></iframe>
\`\`\`

它确实能隔离样式，但代价是一整套跨文档通信协议（主题同步、高度上报、加载超时兜底），
而且下载、剪贴板、全屏等能力在沙箱里处处受限。

## 最终采用：真实链接 + 新标签页

\`\`\`tsx
<a href={toolUrl} target="_blank" rel="noopener noreferrer">
  打开工具
</a>
\`\`\`

- **零改造**：工具产出即成品，不需要为「被嵌入」做任何适配
- **无样式冲突**：本来就是两个独立文档，不需要沙箱来隔离
- **能力不受限**：下载、剪贴板、全屏原样可用
- **工具自持主题**：省掉主题同步协议

代价是「跳出站」的观感。但对工具类页面来说，独立标签页反而更贴合使用习惯
—— 用户常常希望工具和文章并排对照。

这样，加一个工具 = 丢一个 HTML 进 \`public/tools/\` + 注册表加一行。`,
  },
];
