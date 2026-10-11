import { Typography } from '@mui/material';
import HeroSection from '@/components/home/HeroSection';
import OnlineToolsSection from '@/components/home/OnlineToolsSection';
import RoadmapSection from '@/components/home/RoadmapSection';
import LatestPostsSection from '@/components/home/LatestPostsSection';
import MessageCtaSection from '@/components/home/MessageCtaSection';
import { TOOLS, getOnlineTools } from '@/data/tools';

/**
 * 首页 `/`：Hero + 已上线工具 + 研发计划 + 最新文章 + 留言入口。
 * 区块顺序严格按 PRD §7 组织。
 */
export default function HomePage(): JSX.Element {
  const toolCount = TOOLS.length;
  const onlineToolCount = getOnlineTools().length;

  // 文章数展示用逻辑：文章区自行拉取；统计用占位（无后端时 0，由 LatestPostsSection 拉取）
  const postCount = 0;

  return (
    <>
      <HeroSection toolCount={toolCount} onlineToolCount={onlineToolCount} postCount={postCount} />
      <OnlineToolsSection />
      <RoadmapSection />
      <LatestPostsSection limit={3} />
      <MessageCtaSection />
      <Typography variant="caption" color="var(--muted)" sx={{ display: 'block', px: 3, pb: 2 }}>
        * 首页统计数据为示意；已上线工具与研发计划来自本地注册表，实时准确。
      </Typography>
    </>
  );
}
