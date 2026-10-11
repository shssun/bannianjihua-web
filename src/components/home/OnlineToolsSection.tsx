import { Grid } from '@mui/material';
import type { Tool } from '@/types';
import { getOnlineTools } from '@/data/tools';
import Section from '@/components/common/Section';
import ToolCard from '@/components/tools/ToolCard';
import EmptyState from '@/components/common/EmptyState';

/**
 * 已上线工具区：卡片网格，右上「查看全部」跳转 /tools。
 */
export default function OnlineToolsSection(): JSX.Element {
  const tools: Tool[] = getOnlineTools();

  return (
    <Section
      title="工具箱"
      subtitle="全部在浏览器本地运行，无需登录、隐私安全"
      actionLabel="查看全部"
      actionTo="/tools"
    >
      {tools.length === 0 ? (
        <EmptyState
          icon="🧰"
          title="暂无已上线工具"
          description="工具正在打磨中，敬请期待。"
        />
      ) : (
        <Grid container spacing={2}>
          {tools.map((tool) => (
            <Grid item xs={12} sm={6} md={4} key={tool.id}>
              <ToolCard tool={tool} />
            </Grid>
          ))}
        </Grid>
      )}
    </Section>
  );
}
