import { Box, Chip, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { PostSummary } from '@/types';
import { formatDate } from '@/lib/utils';
import TagChip from '@/components/common/TagChip';

interface PostCardProps {
  post: PostSummary;
}

/**
 * 文章卡片：标题 + 摘要 + 标签 + 日期，点击进入详情。
 */
export default function PostCard({ post }: PostCardProps): JSX.Element {
  return (
    <Box
      component={RouterLink}
      to={`/blog/${post.slug}`}
      className="surface-card"
      sx={{
        p: 2.5,
        display: 'block',
        height: '100%',
        '&:hover': { borderColor: 'var(--primary)' },
      }}
    >
      <Typography
        variant="h3"
        sx={{ fontSize: '1.15rem', mb: 1, '&:hover': { color: 'var(--primary)' } }}
      >
        {post.title}
      </Typography>

      <Typography
        variant="body2"
        color="var(--muted)"
        sx={{
          mb: 1.5,
          lineHeight: 1.7,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {post.excerpt}
      </Typography>

      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
        {post.tags.slice(0, 4).map((tag) => (
          <TagChip key={tag} label={tag} />
        ))}
      </Stack>

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" color="var(--muted)">
          {formatDate(post.publishedAt)}
        </Typography>
        <Chip
          label="阅读全文 →"
          size="small"
          variant="outlined"
          sx={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
        />
      </Stack>
    </Box>
  );
}
