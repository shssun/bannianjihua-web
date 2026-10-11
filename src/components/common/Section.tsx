import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SectionProps {
  /** 区块标题 */
  title: string;
  /** 区块副标题/描述 */
  subtitle?: string;
  /** 右上角动作（如「查看全部」链接） */
  actionLabel?: string;
  /** 动作跳转目标（内部路由） */
  actionTo?: string;
  /** 区块内容 */
  children: ReactNode;
  /** 额外类名 */
  className?: string;
}

/**
 * 通用区块容器：标题 + 可选副标题 + 可选右上角动作 + 内容 slot。
 */
export default function Section({
  title,
  subtitle,
  actionLabel,
  actionTo,
  children,
  className,
}: SectionProps): JSX.Element {
  return (
    <Box component="section" className={cn('container-page py-8', className)}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-end"
        sx={{ mb: 3 }}
        spacing={2}
      >
        <Box>
          <Typography variant="h2" component="h2" sx={{ fontSize: { xs: '1.5rem', md: '1.8rem' } }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="var(--muted)" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>

        {actionLabel && actionTo ? (
          <Typography
            component={RouterLink}
            to={actionTo}
            variant="body2"
            sx={{
              color: 'var(--primary)',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {actionLabel} →
          </Typography>
        ) : null}
      </Stack>

      {children}
    </Box>
  );
}
