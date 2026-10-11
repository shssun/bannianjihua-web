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

/**
 * 路由表（createBrowserRouter 数据路由 API）。
 *
 * 深层路径回退依赖：
 * - Cloudflare Pages：public/_redirects
 * - GitHub Pages：scripts/copy-404.mjs 生成的 dist/404.html
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

export const router = createBrowserRouter(routes);
