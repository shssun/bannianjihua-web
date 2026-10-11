import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import HomePage from '@/pages/HomePage';
import BlogListPage from '@/pages/BlogListPage';
import BlogPostPage from '@/pages/BlogPostPage';
import ToolListPage from '@/pages/ToolListPage';
import ToolViewPage from '@/pages/ToolViewPage';
import RoadmapPage from '@/pages/RoadmapPage';
import MessageBoardPage from '@/pages/MessageBoardPage';
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
      { path: 'tools/:id', element: <ToolViewPage /> },
      { path: 'roadmap', element: <RoadmapPage /> },
      { path: 'message', element: <MessageBoardPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes, { basename: BASE_PREFIX });
