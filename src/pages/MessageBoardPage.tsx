import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { Message, MessageInput } from '@/types';
import { messagesService } from '@/services/messagesService';
import { isSupabaseConfigured } from '@/lib/supabase';
import { BACKEND_NOT_CONFIGURED } from '@/lib/errors';
import { formatDate } from '@/lib/utils';
import Section from '@/components/common/Section';
import LoadingState from '@/components/common/LoadingState';
import EmptyState from '@/components/common/EmptyState';

/** Turnstile 是否启用（默认关闭）。 */
const TURNSTILE_ENABLED =
  import.meta.env.VITE_TURNSTILE_ENABLED === 'true' &&
  Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);

/** 表单字段长度上限。 */
const MAX_CONTENT = 500;
const MAX_NICKNAME = 30;

interface FormState {
  nickname: string;
  content: string;
  /** 蜜罐字段：保持为空，被自动化填写即判机器人 */
  honeypot: string;
}

/** 空表单初始值。 */
const EMPTY_FORM: FormState = { nickname: '', content: '', honeypot: '' };

/**
 * 留言板页 `/message`：留言列表 + 提交表单（防滥用）。
 *
 * 防滥用：
 * - Honeypot 蜜罐字段（视觉隐藏）；
 * - 前端 60s 限流（service 内置）；
 * - 长度校验（service 内置 + 本地即时校验）；
 * - Turnstile 由环境开关控制（默认关闭）。
 */
export default function MessageBoardPage(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  /** 拉取留言列表。 */
  const loadMessages = useCallback(async (): Promise<void> => {
    setLoading(true);
    const result = await messagesService.list(50);
    setMessages(result.data ?? []);
    setIsFallback(Boolean(result.fallback));
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const handleChange =
    (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  /** 本地即时校验，返回错误文案或 null。 */
  const validateLocally = (): string | null => {
    const content = form.content.trim();
    if (content.length < 1 || content.length > MAX_CONTENT) {
      return `留言内容需为 1–${MAX_CONTENT} 字。`;
    }
    if (form.nickname.trim().length > MAX_NICKNAME) {
      return `昵称长度不能超过 ${MAX_NICKNAME} 字。`;
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setFeedback(null);

    const localError = validateLocally();
    if (localError) {
      setFeedback({ type: 'error', text: localError });
      return;
    }

    setSubmitting(true);
    const input: MessageInput = {
      nickname: form.nickname.trim(),
      content: form.content.trim(),
      honeypot: form.honeypot,
    };

    const result = await messagesService.create(input);
    setSubmitting(false);

    if (result.error) {
      setFeedback({ type: 'error', text: result.error });
      return;
    }

    // Honeypot 命中时 service 返回 success 但 data 为 null：静默处理
    if (!result.data) {
      setFeedback({
        type: 'error',
        text: '提交未通过校验或被安全策略拦截。',
      });
      return;
    }

    setFeedback({ type: 'success', text: '留言成功，感谢反馈！' });
    setForm(EMPTY_FORM);
    await loadMessages();
  };

  return (
    <Section title="留言板" subtitle="匿名留言 · 与他人和站点主交流">
      {/* 后端未配置提示 */}
      {!isSupabaseConfigured ? (
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            {BACKEND_NOT_CONFIGURED}
          </Alert>
        </Box>
      ) : null}

      {/* 提交表单 */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        className="surface-card"
        sx={{ p: 3, mb: 4 }}
        noValidate
      >
        <Typography variant="h3" sx={{ fontSize: '1.1rem', mb: 2 }}>
          写下你的留言
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="昵称（可选）"
            value={form.nickname}
            onChange={handleChange('nickname')}
            fullWidth
            size="small"
            inputProps={{ maxLength: MAX_NICKNAME }}
            helperText={`${form.nickname.length}/${MAX_NICKNAME}`}
          />

          <TextField
            label="留言内容"
            value={form.content}
            onChange={handleChange('content')}
            fullWidth
            required
            multiline
            minRows={4}
            inputProps={{ maxLength: MAX_CONTENT }}
            helperText={`${form.content.length}/${MAX_CONTENT}`}
          />

          {/* Honeypot 蜜罐字段：视觉隐藏，辅助技术亦不可见 */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              left: '-9999px',
              width: 1,
              height: 1,
              overflow: 'hidden',
            }}
          >
            <label htmlFor="honeypot">请勿填写此字段</label>
            <input
              id="honeypot"
              name="honeypot"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.honeypot}
              onChange={handleChange('honeypot')}
            />
          </Box>

          {TURNSTILE_ENABLED ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              已启用安全验证（Turnstile）。提交时将由验证组件校验。
            </Alert>
          ) : null}

          {feedback ? <Alert severity={feedback.type}>{feedback.text}</Alert> : null}

          <Stack direction="row" justifyContent="flex-end">
            <Button
              type="submit"
              variant="contained"
              disabled={submitting || !isSupabaseConfigured}
            >
              {submitting ? '提交中…' : '提交留言'}
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* 留言列表 */}
      <Typography variant="h3" sx={{ fontSize: '1.1rem', mb: 2 }}>
        全部留言{isFallback ? '（演示数据）' : ''}
      </Typography>

      {loading ? (
        <LoadingState variant="skeleton" rows={3} />
      ) : messages.length === 0 ? (
        <EmptyState icon="💬" title="还没有留言" description="来做第一个留言的人吧。" />
      ) : (
        <Stack spacing={2}>
          {messages.map((message) => (
            <Box key={message.id} className="surface-card" sx={{ p: 2.5 }}>
              <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.8 }}>
                {message.content}
              </Typography>
              <Divider sx={{ borderColor: 'var(--border)', mb: 1 }} />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="var(--fg)">
                  {message.nickname}
                </Typography>
                <Typography variant="caption" color="var(--muted)">
                  {formatDate(message.createdAt, true)}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Section>
  );
}
