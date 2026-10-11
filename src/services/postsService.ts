import type { APIResult, Post, PostSummary } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { FALLBACK_POSTS } from '@/data/fallbackPosts';
import { REQUEST_FAILED } from '@/lib/errors';

/**
 * 文章数据访问层。
 *
 * 约定：
 * - **绝不抛异常**，统一返回 APIResult<T>。
 * - DB snake_case ↔ 前端 camelCase 在本层完成。
 * - 未配置 Supabase 或请求失败 → 返回本地 fallback 数据（fallback: true）。
 */

/** DB 行结构（posts 表）。 */
interface PostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_md: string | null;
  tags: string[] | null;
  cover: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string | null;
}

/** 列表查询可选参数。 */
export interface PostListOptions {
  tag?: string;
  limit?: number;
}

/** 将 DB 行映射为前端 Post。 */
function mapRowToPost(row: PostRow): Post {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? '',
    contentMd: row.content_md ?? '',
    tags: row.tags ?? [],
    cover: row.cover ?? undefined,
    published: row.published,
    publishedAt: row.published_at ?? row.created_at ?? '',
    createdAt: row.created_at ?? '',
  };
}

/** 将 Post 映射为摘要。 */
function toSummary(post: Post): PostSummary {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    tags: post.tags,
    cover: post.cover,
    publishedAt: post.publishedAt,
  };
}

/** 对 fallback 数据按 tag/limit 做与远端一致的裁剪。 */
function buildFallbackList(opts: PostListOptions = {}): PostSummary[] {
  let list = [...FALLBACK_POSTS].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
  if (opts.tag) {
    list = list.filter((post) => post.tags.includes(opts.tag as string));
  }
  if (typeof opts.limit === 'number') {
    list = list.slice(0, opts.limit);
  }
  return list.map(toSummary);
}

export const postsService = {
  /**
   * 拉取已发布文章列表。
   * @param opts 可选：按标签过滤、限制条数
   */
  async list(opts: PostListOptions = {}): Promise<APIResult<PostSummary[]>> {
    // 未配置后端 → 直接使用本地兜底，不报错
    if (!isSupabaseConfigured || !supabase) {
      return { data: buildFallbackList(opts), error: null, fallback: true };
    }

    try {
      let query = supabase
        .from('posts')
        .select('id, slug, title, excerpt, tags, cover, published_at')
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (opts.tag) {
        query = query.contains('tags', [opts.tag]);
      }
      if (typeof opts.limit === 'number') {
        query = query.limit(opts.limit);
      }

      const { data, error } = await query;

      if (error) {
        // 远端失败 → 降级到本地演示数据，UI 不崩溃
        return { data: buildFallbackList(opts), error: REQUEST_FAILED, fallback: true };
      }

      const summaries: PostSummary[] = (data ?? []).map((row) => ({
        id: row.id as string,
        slug: row.slug as string,
        title: row.title as string,
        excerpt: (row.excerpt as string | null) ?? '',
        tags: (row.tags as string[] | null) ?? [],
        cover: (row.cover as string | null) ?? undefined,
        publishedAt: (row.published_at as string | null) ?? '',
      }));

      return { data: summaries, error: null };
    } catch {
      return { data: buildFallbackList(opts), error: REQUEST_FAILED, fallback: true };
    }
  },

  /**
   * 按 slug 拉取单篇文章（含 contentMd）。
   * @param slug 文章 slug
   */
  async getBySlug(slug: string): Promise<APIResult<Post>> {
    if (!isSupabaseConfigured || !supabase) {
      const found = FALLBACK_POSTS.find((post) => post.slug === slug);
      return found
        ? { data: found, error: null, fallback: true }
        : { data: null, error: null, fallback: true };
    }

    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();

      if (error) {
        const found = FALLBACK_POSTS.find((post) => post.slug === slug);
        return found
          ? { data: found, error: REQUEST_FAILED, fallback: true }
          : { data: null, error: REQUEST_FAILED, fallback: true };
      }

      if (!data) {
        return { data: null, error: null };
      }

      return { data: mapRowToPost(data as PostRow), error: null };
    } catch {
      const found = FALLBACK_POSTS.find((post) => post.slug === slug);
      return found
        ? { data: found, error: REQUEST_FAILED, fallback: true }
        : { data: null, error: REQUEST_FAILED, fallback: true };
    }
  },
};
