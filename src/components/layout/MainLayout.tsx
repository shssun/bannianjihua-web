import { Outlet } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

/**
 * 布局壳：固定顶部导航 + 主内容 Outlet + 页脚。
 * 作为所有路由页面的外层容器。
 */
export default function MainLayout(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      <Navbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
