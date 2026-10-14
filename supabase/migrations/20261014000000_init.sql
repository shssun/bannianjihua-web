-- ============================================================
-- 半年计划 bannianjihua_web · 初始迁移（可重放 / 幂等）
--
-- 对应 docs/PRD.md §9.1（表结构）与 §9.2（RLS 策略要点）。
-- 背景：三张表最初在 Supabase dashboard 手工创建，本文件是
-- 之后的**唯一权威重建来源**（换环境 / 重建项目直接重放即可）。
--
-- 可重放手段：
--   - 建表一律 `create table if not exists`；
--   - 策略一律先 `drop policy if exists` 再 `create policy`；
--   - `enable row level security` 重复执行无副作用。
--
-- 角色模型：站点仅用 `anon` key 匿名直连 PostgREST；
--   写入（后台维护 posts/tools、留言清理）只经 `service_role`
--   （Supabase 中 service_role 默认 BYPASS RLS，无需单独建策略）。
-- ============================================================

-- ------------------------------------------------------------
-- 1. posts · 文章表（anon 仅读已发布；写入仅 service_role）
-- ------------------------------------------------------------
create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique,
  title         text,
  excerpt       text,
  content_md    text,
  tags          text[] not null default '{}',
  cover         text,
  published     boolean not null default false,
  published_at  timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.posts enable row level security;

drop policy if exists "anon read published posts" on public.posts;
create policy "anon read published posts"
  on public.posts
  for select
  to anon
  using (published = true);

-- anon 无 INSERT/UPDATE/DELETE 策略 → 默认拒绝；service_role 绕过 RLS 可写。

-- ------------------------------------------------------------
-- 2. tools · 工具表（可选，与本地注册表二选一/同步；anon 仅读）
-- ------------------------------------------------------------
create table if not exists public.tools (
  id          text primary key,
  name        text,
  description text,
  tags        text[] not null default '{}',
  status      text,
  runtime     text,
  entry       text,
  cover       text,
  "order"     integer,
  eta         text,
  created_at  timestamptz not null default now()
);

alter table public.tools enable row level security;

drop policy if exists "anon read tools" on public.tools;
create policy "anon read tools"
  on public.tools
  for select
  to anon
  using (true);

-- anon 无写入策略 → 默认拒绝；service_role 绕过 RLS 可写。

-- ------------------------------------------------------------
-- 3. messages · 留言表（anon 可读可见项、可插入；禁止改/删）
--    字段与前端 src/services/messagesService.ts 对齐：
--    id, nickname, content, created_at, status
-- ------------------------------------------------------------
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  nickname    text check (char_length(nickname) <= 30),
  content     text not null check (char_length(content) between 1 and 500),
  created_at  timestamptz not null default now(),
  ip_hash     text,
  status      text not null default 'visible',
  user_agent  text
);

alter table public.messages enable row level security;

drop policy if exists "anon read visible messages" on public.messages;
create policy "anon read visible messages"
  on public.messages
  for select
  to anon
  using (status = 'visible');

drop policy if exists "anon insert messages" on public.messages;
create policy "anon insert messages"
  on public.messages
  for insert
  to anon
  with check (status = 'visible');

-- anon 无 UPDATE/DELETE 策略 → 默认拒绝；隐藏/清理仅 service_role（status 字段人工兜底）。
