import { useEffect, useState } from 'react';
import { Box, Button, Grid, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { Message } from '@/types';
import { messagesService } from '@/services/messagesService';
import Section from '@/components/common/Section';
import { formatDate } from '@/lib/utils';
import LoadingState from '@/components/common/LoadingState';

/**
 * 留言入口区：一句话邀请 + 最近 3 条留言预览 + 「去留言」按钮。
 * 无后端时展示本地演示留言（fallback）。
 */
export default function MessageCtaSection(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      const result = await messagesService.list(3);
      if (cancelled) {
        return;
      }
      setMessages(result.data ?? []);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Section title="留言板" subtitle="有任何想法或建议？欢迎留言交流">
      {loading ? (
        <LoadingState variant="skeleton" rows={1} />
      ) : messages.length === 0 ? (
        <Typography variant="body2" color="var(--muted)">
          还没有留言，来做第一个吧。
        </Typography>
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {messages.map((message) => (
            <Grid item xs={12} md={4} key={message.id}>
              <Box className="surface-card" sx={{ p: 2, height: '100%' }}>
                <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.7 }}>
                  “{message.content}”
                </Typography>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="var(--fg)">
                    {message.nickname}
                  </Typography>
                  <Typography variant="caption" color="var(--muted)">
                    {formatDate(message.createdAt)}
                  </Typography>
                </Stack>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      <Button component={RouterLink} to="/message" variant="contained">
        去留言 →
      </Button>
    </Section>
  );
}
