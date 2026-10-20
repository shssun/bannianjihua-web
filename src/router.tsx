import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import HomePage from '@/pages/HomePage';
import BlogListPage from '@/pages/BlogListPage';
import BlogPostPage from '@/pages/BlogPostPage';
import ToolListPage from '@/pages/ToolListPage';
import ToolViewPage from '@/pages/ToolViewPage';
import ChannelPage from '@/pages/ChannelPage';
import CollectionPage from '@/pages/CollectionPage';
import RoadmapPage from '@/pages/RoadmapPage';
import MessageBoardPage from '@/pages/MessageBoardPage';
import CorridorPage from '@/pages/CorridorPage';
import DataPage from '@/pages/DataPage';
import GaokaoPage from '@/pages/GaokaoPage';
import AboutPage from '@/pages/AboutPage';
import NotFoundPage from '@/pages/NotFoundPage';
import { BASE_PREFIX } from '@/lib/paths';

/**
 * 路由表（createBrowserRouter 数据路由 API）。
 *
 * 深层路径回退依赖：
 * - Cloudflare Pages：public/_redirects
 * - GitHub Pages：scripts/copy-404.mjs 生成的 dist/404.html
 *
 * 部署路径适配：
 * - `basename` 取自 Vite 注入的 BASE_URL（见 lib/paths.ts），必须是
 *   **带前导斜杠** 的路径（'/bannianjihua-web'）。若误写成不带斜杠的
 *   'bannianjihua-web'，React Router 会匹配失败并抛
 *   "Unexpected Application Error! 404 Not Found"。
 *   GitHub Pages 项目站点部署在 '/bannianjihua-web/' 下时 basename 为
 *   '/bannianjihua-web'，从而让 `to="/tools"` 等声明式/编程式导航自动带上
 *   子路径前缀；根路径部署时为 '/'。
 *
 * 页面通过 MainLayout 的 <Outlet> 渲染。
 */
const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'blog', element: <BlogListPage /> },
      { path: 'blog/:slug', element: <BlogPostPage /> },
      { path: 'tools', element: <ToolListPage /> },
      // 频道页：'tools/channel/:channel' 是 3 段、'tools/:id' 只匹配 2 段，互不冲突；
      // 且静态段 'channel' 优先级高于动态段 ':id'，因此 `channel` 是保留字，不能作工具 id
      // （由 scripts/check-tools.mjs 在构建期强制校验）。
      { path: 'tools/channel/:channel', element: <ChannelPage /> },
      // 集合页：**来源 / 主题**维度的虚拟归口（见 src/data/collections.ts）。
      // 与频道正交 —— 同一个工具物理上只属于一个频道，但可以出现在多个集合里。
      // 同理 'collection' 也是保留字，不能作工具 id。
      { path: 'tools/collection/:collection', element: <CollectionPage /> },
      { path: 'tools/:id', element: <ToolViewPage /> },
      { path: 'roadmap', element: <RoadmapPage /> },
      // 考点图谱：备考知识点统一入口（注册表 src/data/gaokao/entries.ts）
      { path: 'gaokao', element: <GaokaoPage /> },
      { path: 'message', element: <MessageBoardPage /> },
      // 互评走廊：贴出你的句子 → 他人挑错/追问（复用 Supabase，见 supabase/migrations/）
      { path: 'corridor', element: <CorridorPage /> },
      // 数据页：本地学习记录的导出/导入（换 origin 前置，见 docs/DATABASE.md §4.1）
      { path: 'data', element: <DataPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes, { basename: BASE_PREFIX });
