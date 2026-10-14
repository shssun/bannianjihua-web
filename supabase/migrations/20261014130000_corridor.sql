-- ============================================================
-- 半年计划 bannianjihua_web · 互评走廊迁移（可重放 / 幂等）
--
-- 对应 docs/BACKLOG.md T-012（ICAP 互动层第三形态：贴出你的句子 →
-- 别人挑错/追问）。复用站点唯一强后端 Supabase，不新增后端进程。
--
-- 可重放手段（与 20261014000000_init.sql 同风格）：
--   - 建表一律 `create table if not exists`；
--   - 策略一律先 `drop policy if exists` 再 `create policy`；
--   - `enable row level security` 重复执行无副作用。
--
-- 角色模型：站点仅用 `anon` key 匿名直连 PostgREST；
--   隐藏/清理（status 置 hidden）只经 `service_role`
--   （Supabase 中 service_role 默认 BYPASS RLS，无需单独建策略）。
-- ============================================================

-- ------------------------------------------------------------
-- 1. corridor_posts · 贴出的句子（anon 可读可见项、可插入；禁止改/删）
--    字段与前端 src/services/corridorService.ts 对齐：
--    id, sentence, created_at, status
-- ------------------------------------------------------------
create table if not exists public.corridor_posts (
  id          uuid primary key default gen_random_uuid(),
  sentence    text not null check (char_length(sentence) between 1 and 200),
  created_at  timestamptz not null default now(),
  status      text not null default 'visible'
);

alter table public.corridor_posts enable row level security;

drop policy if exists "anon read visible corridor_posts" on public.corridor_posts;
create policy "anon read visible corridor_posts"
  on public.corridor_posts
  for select
  to anon
  using (status = 'visible');

drop policy if exists "anon insert corridor_posts" on public.corridor_posts;
create policy "anon insert corridor_posts"
  on public.corridor_posts
  for insert
  to anon
  with check (status = 'visible');

-- anon 无 UPDATE/DELETE 策略 → 默认拒绝；隐藏/清理仅 service_role。

-- ------------------------------------------------------------
-- 2. corridor_replies · 对句子的挑错/追问（anon 可读可见项、可插入；禁止改/删）
--    字段与前端 src/services/corridorService.ts 对齐：
--    id, post_id, content, created_at, status
--    post_id 外键强制「回复必须挂在已存在的帖子上」。
-- ------------------------------------------------------------
create table if not exists public.corridor_replies (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.corridor_posts(id) on delete cascade,
  content     text not null check (char_length(content) between 1 and 500),
  created_at  timestamptz not null default now(),
  status      text not null default 'visible'
);

alter table public.corridor_replies enable row level security;

drop policy if exists "anon read visible corridor_replies" on public.corridor_replies;
create policy "anon read visible corridor_replies"
  on public.corridor_replies
  for select
  to anon
  using (status = 'visible');

-- post_id 存在性由外键约束校验（插入不存在的 post_id 直接失败）。
drop policy if exists "anon insert corridor_replies" on public.corridor_replies;
create policy "anon insert corridor_replies"
  on public.corridor_replies
  for insert
  to anon
  with check (status = 'visible');

-- anon 无 UPDATE/DELETE 策略 → 默认拒绝；隐藏/清理仅 service_role。
