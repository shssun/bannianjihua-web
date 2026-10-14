import type {
  APIResult,
  CorridorPost,
  CorridorPostInput,
  CorridorReply,
  CorridorReplyInput,
} from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  CORRIDOR_INVALID_REPLY,
  CORRIDOR_INVALID_SENTENCE,
  CORRIDOR_RATE_LIMITED,
  REQUEST_FAILED,
} from '@/lib/errors';
import { safeGetItem, safeSetItem, STORAGE_PREFIX } from '@/lib/utils';

/**
 * 互评走廊数据访问层（复用 Supabase，含防滥用）。
 *
 * 「贴出你的句子 → 别人挑错/追问」，ICAP 互动层第三形态（T-012）。
 * 表：corridor_posts / corridor_replies（见 supabase/migrations/）。
 *
 * 防滥用规则（与留言板 messagesService 同一套组合拳）：
 * 1. Honeypot 蜜罐字段，非空即静默丢弃。
 * 2. 前端限流：发句与回复分别 60s 窗口。
 * 3. 长度校验：sentence 1–200、reply content 1–500（与 DB CHECK 对齐）。
 * 4. 回复的 post_id 存在性由 DB 外键兜底校验。
 *
 * 约定：**绝不抛异常**，统一返回 APIResult<T>。
 */

/** 限流窗口：60 秒。 */
const RATE_LIMIT_MS = 60_000;

/** localStorage 限流 key（发句 / 回复分开计时）。 */
const LAST_POST_AT_KEY = `${STORAGE_PREFIX}lastCorridorPostAt`;
const LAST_REPLY_AT_KEY = `${STORAGE_PREFIX}lastCorridorReplyAt`;

/** DB 行结构（corridor_posts 表）。 */
interface PostRow {
  id: string;
  sentence: string;
  created_at: string | null;
  status: string | null;
}

/** DB 行结构（corridor_replies 表）。 */
interface ReplyRow {
  id: string;
  post_id: string;
  content: string;
  created_at: string | null;
  status: string | null;
}

/** 将 DB 行映射为前端 CorridorPost。 */
function mapRowToPost(row: PostRow): CorridorPost {
  return {
    id: row.id,
    sentence: row.sentence,
    createdAt: row.created_at ?? '',
    status: row.status === 'hidden' ? 'hidden' : 'visible',
  };
}

/** 将 DB 行映射为前端 CorridorReply。 */
function mapRowToReply(row: ReplyRow): CorridorReply {
  return {
    id: row.id,
    postId: row.post_id,
    content: row.content,
    createdAt: row.created_at ?? '',
    status: row.status === 'hidden' ? 'hidden' : 'visible',
  };
}

/** 读取最近一次提交时间戳（毫秒），无记录返回 0。 */
function getLastAt(key: string): number {
  const raw = safeGetItem(key, '0');
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** 记录提交时间戳。 */
function markAt(key: string, timestamp: number): void {
  safeSetItem(key, String(timestamp));
}

/** 检查限流，命中返回 true。 */
function isRateLimited(key: string, now: number): boolean {
  return now - getLastAt(key) < RATE_LIMIT_MS;
}

export const corridorService = {
  /**
   * 拉取可见帖子（默认按时间倒序）。
   * @param limit 限制条数，默认 50
   */
  async listPosts(limit = 50): Promise<APIResult<CorridorPost[]>> {
    if (!isSupabaseConfigured || !supabase) {
      return { data: [], error: null, fallback: true };
    }

    try {
      const { data, error } = await supabase
        .from('corridor_posts')
        .select('id, sentence, created_at, status')
        .eq('status', 'visible')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { data: null, error: REQUEST_FAILED, fallback: true };
      }

      const posts: CorridorPost[] = (data ?? []).map((row) => mapRowToPost(row as PostRow));
      return { data: posts, error: null };
    } catch {
      return { data: null, error: REQUEST_FAILED, fallback: true };
    }
  },

  /**
   * 拉取可见回复（按时间正序，前端按 postId 分组挂在帖子上）。
   * @param limit 限制条数，默认 500
   */
  async listReplies(limit = 500): Promise<APIResult<CorridorReply[]>> {
    if (!isSupabaseConfigured || !supabase) {
      return { data: [], error: null, fallback: true };
    }

    try {
      const { data, error } = await supabase
        .from('corridor_replies')
        .select('id, post_id, content, created_at, status')
        .eq('status', 'visible')
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        return { data: null, error: REQUEST_FAILED, fallback: true };
      }

      const replies: CorridorReply[] = (data ?? []).map((row) => mapRowToReply(row as ReplyRow));
      return { data: replies, error: null };
    } catch {
      return { data: null, error: REQUEST_FAILED, fallback: true };
    }
  },

  /**
   * 贴出一句（含全部防滥用校验）。
   * @param input 发句入参
   */
  async createPost(input: CorridorPostInput): Promise<APIResult<CorridorPost>> {
    // 1. Honeypot：非空即视为机器人，静默丢弃（返回成功但不写库）
    if (input.honeypot && input.honeypot.trim().length > 0) {
      return { data: null, error: null };
    }

    // 2. 长度校验
    const sentence = input.sentence.trim();
    if (sentence.length < 1 || sentence.length > 200) {
      return { data: null, error: CORRIDOR_INVALID_SENTENCE };
    }

    // 3. 未配置后端 → 明确提示（不抛异常）
    if (!isSupabaseConfigured || !supabase) {
      return { data: null, error: REQUEST_FAILED };
    }

    // 4. 前端限流
    const now = Date.now();
    if (isRateLimited(LAST_POST_AT_KEY, now)) {
      return { data: null, error: CORRIDOR_RATE_LIMITED };
    }

    try {
      const { data, error } = await supabase
        .from('corridor_posts')
        .insert({ sentence, status: 'visible' })
        .select('id, sentence, created_at, status')
        .maybeSingle();

      if (error) {
        return { data: null, error: REQUEST_FAILED };
      }

      // 记录限流时间戳（写库成功后才计时）
      markAt(LAST_POST_AT_KEY, now);

      const created: CorridorPost = data
        ? mapRowToPost(data as PostRow)
        : { id: `local-${now}`, sentence, createdAt: new Date(now).toISOString(), status: 'visible' };

      return { data: created, error: null };
    } catch {
      return { data: null, error: REQUEST_FAILED };
    }
  },

  /**
   * 回复某句（含全部防滥用校验；post_id 存在性由 DB 外键兜底）。
   * @param input 回复入参
   */
  async createReply(input: CorridorReplyInput): Promise<APIResult<CorridorReply>> {
    // 1. Honeypot：非空即视为机器人，静默丢弃（返回成功但不写库）
    if (input.honeypot && input.honeypot.trim().length > 0) {
      return { data: null, error: null };
    }

    // 2. 入参校验
    const postId = input.postId.trim();
    const content = input.content.trim();
    if (postId.length === 0) {
      return { data: null, error: REQUEST_FAILED };
    }
    if (content.length < 1 || content.length > 500) {
      return { data: null, error: CORRIDOR_INVALID_REPLY };
    }

    // 3. 未配置后端 → 明确提示（不抛异常）
    if (!isSupabaseConfigured || !supabase) {
      return { data: null, error: REQUEST_FAILED };
    }

    // 4. 前端限流
    const now = Date.now();
    if (isRateLimited(LAST_REPLY_AT_KEY, now)) {
      return { data: null, error: CORRIDOR_RATE_LIMITED };
    }

    try {
      const { data, error } = await supabase
        .from('corridor_replies')
        .insert({ post_id: postId, content, status: 'visible' })
        .select('id, post_id, content, created_at, status')
        .maybeSingle();

      if (error) {
        return { data: null, error: REQUEST_FAILED };
      }

      // 记录限流时间戳（写库成功后才计时）
      markAt(LAST_REPLY_AT_KEY, now);

      const created: CorridorReply = data
        ? mapRowToReply(data as ReplyRow)
        : {
            id: `local-${now}`,
            postId,
            content,
            createdAt: new Date(now).toISOString(),
            status: 'visible',
          };

      return { data: created, error: null };
    } catch {
      return { data: null, error: REQUEST_FAILED };
    }
  },
};
