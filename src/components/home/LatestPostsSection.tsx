import { useEffect, useState } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import type { PostSummary } from '@/types';
import { postsService } from '@/services/postsService';
import Section from '@/components/common/Section';
import PostCard from '@/components/blog/PostCard';
import EmptyState from '@/components/common/EmptyState';
import LoadingState from '@/components/common/LoadingState';

interface LatestPostsSectionProps {
  /** 展示条数，默认 3 */
  limit?: number;
}

/**
 * 最新文章区：拉取最新文章卡片，右上「查看全部」跳转 /blog。
 * 无后端时自动使用 fallback 并标注「演示数据」。
 */
export default function LatestPostsSection({ limit = 3 }: LatestPostsSectionProps): JSX.Element {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFallback, setIsFallback] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setLoading(true);
      const result = await postsService.list({ limit });
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
  }, [limit]);

  return (
    <Section
      title="最新文章"
      subtitle={isFallback ? '演示数据（未配置后端）' : '持续记录与思考'}
      actionLabel="查看全部"
      actionTo="/blog"
    >
      {loading ? (
        <LoadingState variant="skeleton" rows={2} />
      ) : posts.length === 0 ? (
        <EmptyState icon="📝" title="暂无文章" description="第一篇正在路上。" />
      ) : (
        <Grid container spacing={2}>
          {posts.map((post) => (
            <Grid item xs={12} sm={6} md={4} key={post.id}>
              <PostCard post={post} />
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && isFallback && posts.length > 0 ? (
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="var(--muted)">
            * 当前展示的是本地演示数据，配置 Supabase 后会自动切换到线上文章。
          </Typography>
        </Box>
      ) : null}
    </Section>
  );
}
