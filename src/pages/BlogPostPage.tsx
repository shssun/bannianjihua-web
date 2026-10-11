import { useEffect, useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import type { Post } from '@/types';
import { postsService } from '@/services/postsService';
import MarkdownView from '@/components/blog/MarkdownView';
import LoadingState from '@/components/common/LoadingState';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import TagChip from '@/components/common/TagChip';
import { formatDate } from '@/lib/utils';

/**
 * 文章详情页 `/blog/:slug`：Markdown 渲染。
 * slug 不存在 → 友好 NotFound 内容（不白屏）。
 */
export default function BlogPostPage(): JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      if (!slug) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const result = await postsService.getBySlug(slug);
      if (cancelled) {
        return;
      }
      setPost(result.data);
      setIsFallback(Boolean(result.fallback));
      setError(result.data ? null : result.error);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <Box className="container-page py-10">
        <LoadingState variant="skeleton" rows={5} />
      </Box>
    );
  }

  if (!post) {
    return (
      <Box className="container-page py-10">
        <EmptyState
          icon="📭"
          title="未找到该文章"
          description={error ?? '文章可能已被移除，或链接有误。'}
          actionLabel="返回文章列表"
          actionTo="/blog"
        />
      </Box>
    );
  }

  return (
    <Box component="article" className="container-page" sx={{ py: 8, maxWidth: 800 }}>
      {isFallback ? (
        <Box sx={{ mb: 3 }}>
          <ErrorState
            title="演示数据"
            message="当前展示本地演示文章，配置 Supabase 后自动切换到线上内容。"
            hintBackend
          />
        </Box>
      ) : null}

      <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '1.8rem', md: '2.2rem' } }}>
        {post.title}
      </Typography>

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5, mb: 1 }} flexWrap="wrap" useFlexGap>
        <Typography variant="body2" color="var(--muted)">
          {formatDate(post.publishedAt)}
        </Typography>
      </Stack>

      {post.tags.length > 0 ? (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
          {post.tags.map((tag) => (
            <TagChip key={tag} label={tag} />
          ))}
        </Stack>
      ) : null}

      <MarkdownView content={post.contentMd} />

      <Box sx={{ mt: 5 }}>
        <Button component={RouterLink} to="/blog" variant="outlined">
          ← 返回文章列表
        </Button>
      </Box>
    </Box>
  );
}
