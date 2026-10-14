import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Collapse,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { CorridorPost, CorridorReply } from '@/types';
import { corridorService } from '@/services/corridorService';
import { isSupabaseConfigured } from '@/lib/supabase';
import { CORRIDOR_BACKEND_NOT_CONFIGURED } from '@/lib/errors';
import { formatDate } from '@/lib/utils';
import Section from '@/components/common/Section';
import LoadingState from '@/components/common/LoadingState';
import EmptyState from '@/components/common/EmptyState';

/** 表单字段长度上限（与 service / DB CHECK 对齐）。 */
const MAX_SENTENCE = 200;
const MAX_REPLY = 500;

interface PostFormState {
  sentence: string;
  /** 蜜罐字段：保持为空，被自动化填写即判机器人 */
  honeypot: string;
}

/** 空表单初始值。 */
const EMPTY_POST_FORM: PostFormState = { sentence: '', honeypot: '' };

/**
 * 互评走廊页 `/corridor`：贴出你的句子 → 他人挑错/追问。
 *
 * ICAP 互动层第三形态（T-012），复用站点唯一强后端 Supabase。
 * 防滥用：Honeypot 蜜罐、前端 60s 限流（service 内置）、
 * 长度校验（service 内置 + 本地即时校验）。
 */
export default function CorridorPage(): JSX.Element {
  const [posts, setPosts] = useState<CorridorPost[]>([]);
  const [replies, setReplies] = useState<CorridorReply[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFallback, setIsFallback] = useState<boolean>(false);

  const [postForm, setPostForm] = useState<PostFormState>(EMPTY_POST_FORM);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  /** 当前展开回复输入框的帖子 id；null 表示全部收起。 */
  const [replyOpenId, setReplyOpenId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState<string>('');
  const [replyHoneypot, setReplyHoneypot] = useState<string>('');
  const [replySubmitting, setReplySubmitting] = useState<boolean>(false);
  const [replyFeedback, setReplyFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  /** 拉取帖子与回复列表。 */
  const loadAll = useCallback(async (): Promise<void> => {
    setLoading(true);
    const [postsResult, repliesResult] = await Promise.all([
      corridorService.listPosts(50),
      corridorService.listReplies(500),
    ]);
    setPosts(postsResult.data ?? []);
    setReplies(repliesResult.data ?? []);
    setIsFallback(Boolean(postsResult.fallback) || Boolean(repliesResult.fallback));
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleChange =
    (field: keyof PostFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      setPostForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  /** 本地即时校验（发句），返回错误文案或 null。 */
  const validatePostLocally = (): string | null => {
    const sentence = postForm.sentence.trim();
    if (sentence.length < 1 || sentence.length > MAX_SENTENCE) {
      return `句子需为 1–${MAX_SENTENCE} 字。`;
    }
    return null;
  };

  const handlePostSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setFeedback(null);

    const localError = validatePostLocally();
    if (localError) {
      setFeedback({ type: 'error', text: localError });
      return;
    }

    setSubmitting(true);
    const result = await corridorService.createPost({
      sentence: postForm.sentence.trim(),
      honeypot: postForm.honeypot,
    });
    setSubmitting(false);

    if (result.error) {
      setFeedback({ type: 'error', text: result.error });
      return;
    }

    // Honeypot 命中时 service 返回 success 但 data 为 null：静默处理
    if (!result.data) {
      setFeedback({ type: 'error', text: '提交未通过校验或被安全策略拦截。' });
      return;
    }

    setFeedback({ type: 'success', text: '已贴出，等待他人挑错与追问。' });
    setPostForm(EMPTY_POST_FORM);
    await loadAll();
  };

  /** 展开/收起某帖的回复输入框。 */
  const toggleReply = (postId: string): void => {
    setReplyFeedback(null);
    if (replyOpenId === postId) {
      setReplyOpenId(null);
      setReplyDraft('');
      setReplyHoneypot('');
    } else {
      setReplyOpenId(postId);
      setReplyDraft('');
      setReplyHoneypot('');
    }
  };

  /** 本地即时校验（回复），返回错误文案或 null。 */
  const validateReplyLocally = (): string | null => {
    const content = replyDraft.trim();
    if (content.length < 1 || content.length > MAX_REPLY) {
      return `回复内容需为 1–${MAX_REPLY} 字。`;
    }
    return null;
  };

  const handleReplySubmit = async (postId: string): Promise<void> => {
    setReplyFeedback(null);

    const localError = validateReplyLocally();
    if (localError) {
      setReplyFeedback({ type: 'error', text: localError });
      return;
    }

    setReplySubmitting(true);
    const result = await corridorService.createReply({
      postId,
      content: replyDraft.trim(),
      honeypot: replyHoneypot,
    });
    setReplySubmitting(false);

    if (result.error) {
      setReplyFeedback({ type: 'error', text: result.error });
      return;
    }

    if (!result.data) {
      setReplyFeedback({ type: 'error', text: '提交未通过校验或被安全策略拦截。' });
      return;
    }

    setReplyFeedback({ type: 'success', text: '回复成功。' });
    setReplyOpenId(null);
    setReplyDraft('');
    setReplyHoneypot('');
    await loadAll();
  };

  /** 按帖子分组回复（保持时间正序）。 */
  const repliesByPost = new Map<string, CorridorReply[]>();
  for (const reply of replies) {
    const list = repliesByPost.get(reply.postId);
    if (list) {
      list.push(reply);
    } else {
      repliesByPost.set(reply.postId, [reply]);
    }
  }

  return (
    <Section title="互评走廊" subtitle="贴出你的句子 · 他人挑错与追问（ICAP 互动层）">
      {/* 后端未配置提示 */}
      {!isSupabaseConfigured ? (
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            {CORRIDOR_BACKEND_NOT_CONFIGURED}
          </Alert>
        </Box>
      ) : null}

      {/* 发句表单 */}
      <Box
        component="form"
        onSubmit={handlePostSubmit}
        className="surface-card"
        sx={{ p: 3, mb: 4 }}
        noValidate
      >
        <Typography variant="h3" sx={{ fontSize: '1.1rem', mb: 2 }}>
          贴出你的句子
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="英文句子（200 字以内）"
            value={postForm.sentence}
            onChange={handleChange('sentence')}
            fullWidth
            required
            multiline
            minRows={3}
            inputProps={{ maxLength: MAX_SENTENCE }}
            helperText={`${postForm.sentence.length}/${MAX_SENTENCE}`}
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
            <label htmlFor="corridor-honeypot">请勿填写此字段</label>
            <input
              id="corridor-honeypot"
              name="corridor-honeypot"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={postForm.honeypot}
              onChange={handleChange('honeypot')}
            />
          </Box>

          {feedback ? <Alert severity={feedback.type}>{feedback.text}</Alert> : null}

          <Stack direction="row" justifyContent="flex-end">
            <Button
              type="submit"
              variant="contained"
              disabled={submitting || !isSupabaseConfigured}
            >
              {submitting ? '提交中…' : '贴出句子'}
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* 帖子列表 */}
      <Typography variant="h3" sx={{ fontSize: '1.1rem', mb: 2 }}>
        全部句子{isFallback ? '（离线状态）' : ''}
      </Typography>

      {loading ? (
        <LoadingState variant="skeleton" rows={3} />
      ) : posts.length === 0 ? (
        <EmptyState
          icon="🪞"
          title="走廊还是空的"
          description="贴出第一句，让大家帮你挑错、追问。"
        />
      ) : (
        <Stack spacing={2}>
          {posts.map((post) => {
            const postReplies = repliesByPost.get(post.id) ?? [];
            return (
              <Box key={post.id} className="surface-card" sx={{ p: 2.5 }}>
                <Typography variant="body1" sx={{ mb: 1.5, lineHeight: 1.8 }}>
                  {post.sentence}
                </Typography>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: postReplies.length > 0 ? 1.5 : 0 }}
                >
                  <Typography variant="caption" color="var(--muted)">
                    {formatDate(post.createdAt, true)} · {postReplies.length} 条回复
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => toggleReply(post.id)}
                    disabled={!isSupabaseConfigured}
                  >
                    {replyOpenId === post.id ? '收起' : '回复'}
                  </Button>
                </Stack>

                {postReplies.length > 0 ? (
                  <Stack spacing={1.5} sx={{ pl: 2, borderLeft: '2px solid var(--border)' }}>
                    {postReplies.map((reply) => (
                      <Box key={reply.id}>
                        <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                          {reply.content}
                        </Typography>
                        <Typography variant="caption" color="var(--muted)">
                          {formatDate(reply.createdAt, true)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                ) : null}

                <Collapse in={replyOpenId === post.id}>
                  <Divider sx={{ borderColor: 'var(--border)', my: 1.5 }} />
                  <Stack spacing={1.5}>
                    <TextField
                      label="挑错 / 追问（500 字以内）"
                      value={replyDraft}
                      onChange={(event) => setReplyDraft(event.target.value)}
                      fullWidth
                      multiline
                      minRows={2}
                      size="small"
                      inputProps={{ maxLength: MAX_REPLY }}
                      helperText={`${replyDraft.length}/${MAX_REPLY}`}
                    />
                    {/* 回复区蜜罐字段：视觉隐藏 */}
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
                      <label htmlFor={`corridor-reply-honeypot-${post.id}`}>请勿填写此字段</label>
                      <input
                        id={`corridor-reply-honeypot-${post.id}`}
                        name={`corridor-reply-honeypot-${post.id}`}
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={replyHoneypot}
                        onChange={(event) => setReplyHoneypot(event.target.value)}
                      />
                    </Box>
                    {replyOpenId === post.id && replyFeedback ? (
                      <Alert severity={replyFeedback.type}>{replyFeedback.text}</Alert>
                    ) : null}
                    <Stack direction="row" justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => void handleReplySubmit(post.id)}
                        disabled={replySubmitting || !isSupabaseConfigured}
                      >
                        {replySubmitting ? '提交中…' : '提交回复'}
                      </Button>
                    </Stack>
                  </Stack>
                </Collapse>
              </Box>
            );
          })}
        </Stack>
      )}
    </Section>
  );
}
