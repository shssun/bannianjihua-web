import { Box } from '@mui/material';
import EmptyState from '@/components/common/EmptyState';

/**
 * 404 兜底页 `*`。
 */
export default function NotFoundPage(): JSX.Element {
  return (
    <Box className="container-page py-12">
      <EmptyState
        icon="🧭"
        title="页面不存在（404）"
        description="你访问的页面可能已被移动或删除。"
        actionLabel="返回首页"
        actionTo="/"
      />
    </Box>
  );
}
