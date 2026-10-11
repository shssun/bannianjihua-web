import { useEffect, useMemo, useState } from 'react';
import { Box, Grid, Stack } from '@mui/material';
import type { PostSummary } from '@/types';
import { postsService } from '@/services/postsService';
import Section from '@/components/common/Section';
import PostCard from '@/components/blog/PostCard';
import EmptyState from '@/components/common/EmptyState';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import TagChip from '@/components/common/TagChip';

/**
 * 文章列表页 `/blog`：文章卡片流 + 标签筛选。
 */
export default function BlogListPage(): JSX.Element {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setLoading(true);
      const result = await postsService.list({ tag: activeTag ?? undefined });
      if (cancelled) {
        return;
      }
      setPosts(result.data ?? []);
      setIsFallback(Boolean(result.fallback));
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [activeTag]);

  /** 所有可选标签（基于当前已加载文章）。 */
  const allTags = useMemo<string[]>(() => {
    const set = new Set<string>();
    posts.forEach((post) => post.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
  }, [posts]);

  return (
    <Section
      title="文章"
      subtitle={isFallback ? '演示数据（未配置后端）' : '记录与思考'}
    >
      {allTags.length > 0 ? (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
          <TagChip
            label="全部"
            size="medium"
            clickable
            selected={activeTag === null}
            onClick={() => setActiveTag(null)}
          />
          {allTags.map((tag) => (
            <TagChip
              key={tag}
              label={tag}
              size="medium"
              clickable
              selected={activeTag === tag}
              onClick={() => setActiveTag(tag)}
            />
          ))}
        </Stack>
      ) : null}

      {loading ? (
        <LoadingState variant="skeleton" rows={3} />
      ) : posts.length === 0 ? (
        activeTag ? (
          <EmptyState
            icon="🔍"
            title="该标签下暂无文章"
            description="换个标签看看吧。"
            actionLabel="查看全部文章"
            onAction={() => setActiveTag(null)}
          />
        ) : (
          <EmptyState icon="📝" title="暂无文章" description="第一篇正在路上。" />
        )
      ) : (
        <Grid container spacing={2}>
          {posts.map((post) => (
            <Grid item xs={12} sm={6} md={4} key={post.id}>
              <PostCard post={post} />
            </Grid>
          ))}
        </Grid>
      )}

      {isFallback && posts.length > 0 ? (
        <Box sx={{ mt: 2 }}>
          <ErrorState
            title="演示数据"
            message="当前展示本地演示文章，配置 Supabase 后自动切换到线上内容。"
            hintBackend
          />
        </Box>
      ) : null}
    </Section>
  );
}
