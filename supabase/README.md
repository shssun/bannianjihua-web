# Supabase 迁移（supabase/migrations）

> 本目录是数据库结构的**唯一权威来源**。三张表（`posts` / `tools` / `messages`）
> 最初在 Supabase dashboard 手工创建、仓库里没有任何 `.sql`，导致换环境或重建项目
> 时无法复现 —— 现在以可重放迁移的方式固化下来。

## 文件清单

| 文件 | 内容 |
|---|---|
| `migrations/20261014000000_init.sql` | 三张表建表（幂等 `create table if not exists`）+ RLS 启用 + anon 策略（先 `drop policy if exists` 再建，可重复执行） |

## 表与权限一览

| 表 | anon 权限 | 写入 |
|---|---|---|
| `posts` | `SELECT`（仅 `published = true`） | 仅 `service_role` |
| `tools` | `SELECT` | 仅 `service_role` |
| `messages` | `SELECT`（仅 `status = 'visible'`）、`INSERT`（CHECK：`char_length(content) between 1 and 500`、`char_length(nickname) <= 30`） | 仅 `service_role`（隐藏/清理走 `status` 字段） |

- 三张表全部 `enable row level security`（deny-all 起点，逐条放宽）。
- 站点前端用 **anon key** 匿名直连 PostgREST；`service_role` 默认绕过 RLS，无需额外策略。
- 字段与前端对齐：`src/services/messagesService.ts` 读写 `messages` 的
  `id, nickname, content, created_at, status`。

## 如何用这些迁移重建库

### 方式 A：Supabase CLI（推荐）

```bash
# 1. 在仓库根目录初始化（若已有 supabase/ 配置可跳过 init）
supabase init

# 2. 关联远程项目（project ref 在 Supabase 控制台 URL 里）
supabase link --project-ref <your-project-ref>

# 3. 按文件名顺序应用 migrations/ 下所有未执行迁移
supabase db push
```

### 方式 B：本地开发库

```bash
supabase start          # 启动本地栈（需要 Docker）
supabase db reset       # 重放全部 migrations 到本地库
```

### 方式 C：新项目 · Dashboard 手动执行

1. 新建 Supabase 项目（或进入既有项目）→ 左侧 **SQL Editor**。
2. 打开 `migrations/20261014000000_init.sql`，**全量粘贴执行**（文件本身幂等，重复执行安全）。

## 环境变量（应用侧）

| 变量 | 用途 |
|---|---|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | 前端构建期注入（`src/lib/supabase.ts`）；缺失时全站走本地 fallback，不崩溃 |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY`（GitHub Secrets） | 供 CI 定时探活 workflow 使用（见 `.github/workflows/keepalive.yml`，防免费版「1 周无流量暂停」） |

> ⚠️ anon key 是**公开 key**（安全边界在 RLS，不在保密）；`service_role` key **绝不入库、绝不上前端**。
