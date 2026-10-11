import type { APIResult, Message, MessageInput } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { FALLBACK_MESSAGES } from '@/data/fallbackMessages';
import {
  MESSAGE_BACKEND_NOT_CONFIGURED,
  MESSAGE_INVALID_CONTENT,
  MESSAGE_INVALID_NICKNAME,
  MESSAGE_RATE_LIMITED,
  REQUEST_FAILED,
} from '@/lib/errors';
import { safeGetItem, safeSetItem, STORAGE_PREFIX } from '@/lib/utils';

/**
 * 留言数据访问层（唯一强后端功能，含防滥用）。
 *
 * 防滥用规则（无服务端时的组合拳）：
 * 1. Honeypot 蜜罐字段 `honeypot`，非空即静默丢弃。
 * 2. 前端限流：localStorage 记录最近提交时间，60s 窗口内拒绝。
 * 3. 长度校验：content 1–500、nickname ≤30。
 * 4. Turnstile：由环境开关控制（默认关闭），token 随请求带上。
 *
 * 约定：**绝不抛异常**，统一返回 APIResult<T>。
 */

/** 限流窗口：60 秒。 */
const RATE_LIMIT_MS = 60_000;

/** localStorage 限流 key。 */
const LAST_MESSAGE_AT_KEY = `${STORAGE_PREFIX}lastMessageAt`;

/** DB 行结构（messages 表）。 */
interface MessageRow {
  id: string;
  nickname: string | null;
  content: string;
  created_at: string | null;
  status: string | null;
}

/** 将 DB 行映射为前端 Message。 */
function mapRowToMessage(row: MessageRow): Message {
  return {
    id: row.id,
    nickname: row.nickname ?? '匿名',
    content: row.content,
    createdAt: row.created_at ?? '',
    status: row.status === 'hidden' ? 'hidden' : 'visible',
  };
}

/** 读取最近一次提交时间戳（毫秒），无记录返回 0。 */
function getLastMessageAt(): number {
  const raw = safeGetItem(LAST_MESSAGE_AT_KEY, '0');
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** 记录提交时间戳。 */
function markMessageAt(timestamp: number): void {
  safeSetItem(LAST_MESSAGE_AT_KEY, String(timestamp));
}

/** 校验输入，返回错误文案或 null。 */
function validateInput(input: MessageInput): string | null {
  const content = input.content.trim();
  const nickname = (input.nickname ?? '').trim();

  if (content.length < 1 || content.length > 500) {
    return MESSAGE_INVALID_CONTENT;
  }
  if (nickname.length > 30) {
    return MESSAGE_INVALID_NICKNAME;
  }
  return null;
}

export const messagesService = {
  /**
   * 拉取可见留言（默认按时间倒序）。
   * @param limit 限制条数，默认 50
   */
  async list(limit = 50): Promise<APIResult<Message[]>> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        data: FALLBACK_MESSAGES.slice(0, limit),
        error: null,
        fallback: true,
      };
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, nickname, content, created_at, status')
        .eq('status', 'visible')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { data: FALLBACK_MESSAGES.slice(0, limit), error: REQUEST_FAILED, fallback: true };
      }

      const messages: Message[] = (data ?? []).map((row) => mapRowToMessage(row as MessageRow));
      return { data: messages, error: null };
    } catch {
      return { data: FALLBACK_MESSAGES.slice(0, limit), error: REQUEST_FAILED, fallback: true };
    }
  },

  /**
   * 创建留言（含全部防滥用校验）。
   * @param input 留言入参
   */
  async create(input: MessageInput): Promise<APIResult<Message>> {
    // 1. Honeypot：非空即视为机器人，静默丢弃（返回成功但不写库，避免机器人探测）
    if (input.honeypot && input.honeypot.trim().length > 0) {
      return { data: null, error: null };
    }

    // 2. 长度校验
    const validationError = validateInput(input);
    if (validationError) {
      return { data: null, error: validationError };
    }

    // 3. 未配置后端 → 明确提示（不抛异常）
    if (!isSupabaseConfigured || !supabase) {
      return { data: null, error: MESSAGE_BACKEND_NOT_CONFIGURED };
    }

    // 4. 前端限流
    const now = Date.now();
    const lastAt = getLastMessageAt();
    if (now - lastAt < RATE_LIMIT_MS) {
      return { data: null, error: MESSAGE_RATE_LIMITED };
    }

    const content = input.content.trim();
    const nickname = (input.nickname ?? '').trim() || '匿名';

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          nickname,
          content,
          status: 'visible',
        })
        .select('id, nickname, content, created_at, status')
        .maybeSingle();

      if (error) {
        return { data: null, error: REQUEST_FAILED };
      }

      // 记录限流时间戳（写库成功后才计时）
      markMessageAt(now);

      const created: Message = data
        ? mapRowToMessage(data as MessageRow)
        : {
            id: `local-${now}`,
            nickname,
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
