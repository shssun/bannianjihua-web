import { useMemo, useState } from 'react';
import { Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { Tool } from '@/types';
import { TOOLS } from '@/data/tools';
import Section from '@/components/common/Section';
import ToolCard from '@/components/tools/ToolCard';
import ToolFilterBar, {
  collectTags,
  type StatusFilter,
} from '@/components/tools/ToolFilterBar';
import EmptyState from '@/components/common/EmptyState';

/**
 * 工具箱页 `/tools`：全部工具（状态筛选 + 标签筛选）。
 */
export default function ToolListPage(): JSX.Element {
  const navigate = useNavigate();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [tag, setTag] = useState<string | null>(null);

  const tags = useMemo<string[]>(() => collectTags(TOOLS), []);

  const filtered = useMemo<Tool[]>(() => {
    return TOOLS.filter((tool) => {
      const statusOk =
        status === 'all' ||
        (status === 'online' && tool.status === 'online') ||
        (status === 'upcoming' && tool.status !== 'online');
      const tagOk = tag === null || tool.tags.includes(tag);
      return statusOk && tagOk;
    }).sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
  }, [status, tag]);

  const handleOpen = (tool: Tool): void => {
    navigate(`/tools/${tool.id}`);
  };

  return (
    <Section title="工具箱" subtitle="默认浏览器本地运行 · 已上线与研发中一览">
      <ToolFilterBar
        tags={tags}
        status={status}
        tag={tag}
        onStatusChange={setStatus}
        onTagChange={setTag}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="没有符合条件的工具"
          description="试试放宽筛选条件。"
          actionLabel="重置筛选"
          onAction={() => {
            setStatus('all');
            setTag(null);
          }}
        />
      ) : (
        <Grid container spacing={2}>
          {filtered.map((tool) => (
            <Grid item xs={12} sm={6} md={4} key={tool.id}>
              <ToolCard tool={tool} onOpen={handleOpen} />
            </Grid>
          ))}
        </Grid>
      )}
    </Section>
  );
}
