# PRD — bannianjihua_web（百年计划 · 个人站点）

> 结论先行版，供架构师直接消费。完整竞品分析/市场象限图本轮不做。

## 1. 项目信息

| 项 | 值 |
|---|---|
| Language | 中文 |
| 项目名 | `bannianjihua_web`（snake_case） |
| 技术栈（默认建议） | Vite + React + MUI + Tailwind CSS；静态导出（SSG/SPA 静态产物） |
| 部署目标 | 免费静态托管（Cloudflare Pages 首选 / GitHub Pages / Vercel 静态导出） |
| 数据库 | Supabase（PostgreSQL + PostgREST + RLS） |
| 关键约束 | **无任何服务器端进程**；动态能力全部由 Supabase 托管承担；工具默认 100% 浏览器端本地执行 |

### 原始需求复述
老板要「先搭一个个人 blog 架构打底」，首页挂载「已写好的工具 + 未来工具研发计划」。工具优先加载到用户浏览器本地执行，尽量少占服务器资源、尽量不与后端交互。需要一个留言板用于与用户沟通（优先级低，P2）。数据库用 Supabase 或同类在线 SQL。部署到免费静态托管站，因此不能有任何服务器端进程；动态数据能力由在线 SQL 承担，前端匿名直连 PostgREST + RLS 实现鉴权与写入。

---

## 2. 产品目标与定位

**一句话定位**：一个可长期演进的个人 blog 底座，首页即「工具箱 + 研发路线图」，所有工具默认在浏览器本地运行、几乎零服务器成本。

**产品目标（3 个，正交）**
1. **架构打底**：建立可扩展的 blog + 工具站信息架构与内容体系（文章、工具、留言三条数据线），后续加工具/加文章不改框架。
2. **工具即服务**：让每个工具成为可注册、可发现、可离线运行的独立单元，首页自动呈现「已上线 / 研发中」两类。
3. **零运维成本**：纯静态部署 + 匿名直连 Supabase，无服务器进程；留言板是唯一强后端功能且带防滥用。

---

## 3. 站点信息架构

### 3.1 导航结构（顶部导航）
```
Logo(首页) | 文章(Blog) | 工具箱(Tools) | 研发计划(Roadmap) | 留言板(Message) | 关于(About)
```
- 主导航 6 项；「工具箱」与「研发计划」可从首页区块锚点直达，也保留独立页。

### 3.2 页面清单

| 页面 | 路由 | 说明 | 优先级 |
|---|---|---|---|
| 首页 | `/` | Hero + 已上线工具 + 研发计划 + 最新文章 + 留言入口 | P0 |
| 文章列表 | `/blog` | 文章卡片流（分页/标签） | P0 |
| 文章详情 | `/blog/:slug` | Markdown 渲染 | P0 |
| 工具箱 | `/tools` | 全部工具（已上线/研发中筛选、标签筛选） | P0 |
| 工具页 | `/tools/:id` | 工具呈现容器（见 §6） | P0 |
| 研发计划 | `/roadmap` | 未来工具时间线/看板 | P1 |
| 留言板 | `/message` | 留言列表 + 提交表单（防滥用） | P2 |
| 关于 | `/about` | 站点介绍、联系方式 | P1 |
| 404 | `*` | 兜底页 | P1 |

### 3.3 路由表（约定）

| 路由 | 组件 | 数据源 |
|---|---|---|
| `/` | Home | tools + posts |
| `/blog` | BlogList | posts |
| `/blog/:slug` | BlogPost | posts(by slug) |
| `/tools` | ToolList | tools |
| `/tools/:id` | ToolView | tools(by id) + 本地工具产物 |
| `/roadmap` | Roadmap | tools(status=planned) |
| `/message` | MessageBoard | messages (PostgREST) |
| `/about` | About | 静态 |
| `*` | NotFound | — |

---

## 4. 用户故事

| # | 角色 | 用户故事 | 优先级 |
|---|---|---|---|
| 1 | 访客 | As a 访客, I want 在首页一眼看到已上线工具和研发计划, so that 我能快速判断这个站有什么价值 | P0 |
| 2 | 访客 | As a 访客, I want 打开工具后直接在浏览器本地运行、无需登录/不联网也能用, so that 隐私安全且加载快 | P0 |
| 3 | 站点主 | As a 站点主, I want 用一份注册表配置新增工具, so that 加工具不用改页面代码 | P0 |
| 4 | 访客 | As a 访客, I want 按标签/状态筛选工具, so that 我能找到想要的工具 | P1 |
| 5 | 访客 | As a 访客, I want 阅读和按标签浏览文章, so that 我能持续获取内容 | P0 |
| 6 | 访客 | As a 访客, I want 在研发计划页看到未来工具规划与进度, so that 我知道站点的演进方向 | P1 |
| 7 | 访客 | As a 访客, I want 匿名留言并看到其他留言, so that 我能与站点主沟通 | P2 |
| 8 | 站点主 | As a 站点主, I want 留言防刷/防灌水, so that 无需人工值守也能维持质量 | P2 |

---

## 5. 需求池

| 模块 | 描述 | 优先级 | 备注 |
|---|---|---|---|
| 站点骨架 | Vite+React+MUI+Tailwind 工程、路由、布局、主题（含深浅色） | P0 | 静态导出 |
| 首页 | Hero + 已上线工具 + 研发计划 + 最新文章 + 留言入口 | P0 | 见 §7 |
| 工具注册表 | 单文件 `tools.json`/TS 常量，声明工具元数据 | P0 | 见 §8 |
| 工具呈现容器 | 工具页统一容器（见 §6 推荐方案） | P0 | 样式隔离关键 |
| 工具：md-to-html-reader | 首页挂载（已上线） | P0 | 独立单文件 HTML |
| 工具：english-dict-reader | 首页挂载（已上线） | P0 | 独立单文件 HTML |
| 工具：logic-fallacy-cards | 首页挂载（已上线） | P1 | 产出为 PNG，可能需要服务/头，需确认形态 |
| Blog 列表/详情 | Markdown 文章渲染、标签、分页 | P0 | 数据源 Supabase posts 表 |
| 研发计划页/区块 | 未来工具（集合论卡片、直觉 zhika 等）时间线 | P1 | 数据源 tools(status=planned) |
| 标签/状态筛选 | 工具与文章筛选 | P1 | |
| 关于页 | 站点介绍、联系方式 | P1 | 静态 |
| 留言板 | 列表 + 表单提交（匿名） | P2 | Supabase messages |
| 留言防滥用 | 限流 + honeypot 或 Cloudflare Turnstile | P2 | 无服务端，靠前端+RLC+RLS+边缘函数可选 |
| SEO/分享 | meta、OG、sitemap、RSS | P1 | 静态生成 |
| 404 兜底页 | — | P1 | |

---

## 6. 工具呈现形态（已定稿）

**定稿：新标签页直接打开工具产物** —— 主站用真实 `<a target="_blank" rel="noopener noreferrer">` 打开。

> 本节原先是对三方案（A 内嵌组件 / B iframe 嵌入 / C 新标签打开）的对比论证，当时结论为推荐 B。
> **该结论已于 2026-10-11 推翻并移除**（如需追溯可查 git history）。改为 C 的原因：
> 单文件工具产出即成品，新标签页打开是**零改造**方案，天然无样式冲突（不同文档，不需要沙箱约束），
> 也不受 iframe 对下载/剪贴板/全屏的限制；工具自持主题，省掉一整套跨文档通信协议。

约定：

1. 打开动作一律用真实 `<a>`，**不要用 `window.open`**（会被弹窗拦截，且中键/右键「新标签打开」失效）。
2. `/tools/:id` 路由保留为**详情页**（工具信息 + 「打开工具」按钮 + 完整 URL 展示），仅作落地页与分享入口。
3. 加工具的成本 = 丢一个 HTML 进 `public/tools/` + `src/data/tools.ts` 加一行。
4. 多文件工具（带素材/数据/音轨）走镜像同步脚本，见 `scripts/sync-daily-english.mjs`。

> 待确认：`logic-fallacy-cards` 产出是 PNG（可能需要无头 Chrome 生成）。若其运行依赖 Node/无头浏览器，则**无法在纯静态/浏览器端运行**，应改为「已生成图集 + 静态展示」或标注为「轻后端交互」，见 §9 Q3。

---

## 7. 首页布局草案（从上到下区块顺序）

1. **顶部导航栏**（固定）：Logo + 6 项导航 + 深浅色切换。
2. **Hero 区**：一句话定位 + 副标题 + 两个 CTA（「进入工具箱」「查看研发计划」）+ 站点统计（工具数 / 文章数）。
3. **已上线工具区**（核心）：标题「工具箱」+ 卡片网格；每卡含图标/封面、名称、一句话描述、标签、状态徽章（已上线）、「打开」按钮；右上「查看全部」→ `/tools`。
4. **研发计划区**：标题「研发计划」+ 时间线/看板；每条含工具名、简介、状态（规划中/开发中）、预计；CTA「查看完整路线图」→ `/roadmap`。
5. **最新文章区**：3–6 篇最新文章卡片 → `/blog`。
6. **留言入口区**：一句话邀请 + 最近 3 条留言预览 + 「去留言」→ `/message`（P2，可后置为占位）。
7. **页脚**：关于、RSS、GitHub、版权、备案/联系方式。

---

## 8. 工具注册表数据结构设计

单文件声明，首页据此渲染「已上线 / 研发中」两类。

```ts
// src/data/tools.ts
export type ToolStatus = 'online' | 'planned' | 'developing' | 'paused';
export type ToolRuntime = 'client-only' | 'light-backend'; // 默认 client-only

export interface Tool {
  id: string;              // 唯一标识，用作路由 /tools/:id
  name: string;            // 工具名
  description: string;     // 一句话描述（卡片展示）
  tags: string[];          // 如 ['阅读器','离线','Markdown']
  status: ToolStatus;      // 状态：用于首页「已上线/研发中」分类
  runtime: ToolRuntime;    // 运行形态：默认 client-only
  entry?: string;          // 工具产物的静态路径（相对 public/，不带前导斜杠），如 'tools/md-to-html-reader.html'
  externalUrl?: string;    // 可选：外部兜底跳转（新标签打开）
  cover?: string;          // 卡片封面/图标
  version?: string;
  createdAt?: string;      // ISO 日期
  eta?: string;            // 研发中工具的预计时间
  order?: number;          // 手动排序
}
```

**首页分类规则**：
- 「已上线」= `status === 'online'`
- 「研发中」= `status in ('planned' | 'developing' | 'paused')`

**示例条目**：
```ts
{ id: 'md-to-html-reader', name: 'Markdown 阅读器', description: '把 Markdown 文件夹构建成自包含单文件 HTML 阅读器', tags: ['阅读器','离线','Markdown'], status: 'online', runtime: 'client-only', entry: '/tools/md-to-html-reader.html', order: 1 },
{ id: 'english-dict-reader', name: '英语句读器', description: '英文句子清单生成可点词查音标的单文件阅读器', tags: ['英语','离线','词典'], status: 'online', runtime: 'client-only', entry: '/tools/english-dict-reader.html', order: 2 },
{ id: 'logic-fallacy-cards', name: '逻辑谬误卡片', description: '公众号长文渲染为深色信息图卡（PNG）', tags: ['信息图','卡片'], status: 'online', runtime: 'light-backend', cover: '...', order: 3 },
{ id: 'set-theory-cards', name: '集合论学习卡片', description: '数理基础学习卡片', tags: ['数学','学习'], status: 'planned', runtime: 'client-only', eta: '2025-Q4' },
```

> 工具注册表也可选择存 Supabase `tools` 表（便于站点主在线维护），但 P0 建议**先用本地静态 JSON/TS**，减少后端交互；后续如需在线编辑再迁移到 Supabase。

---

## 9. Supabase 建议（表结构 + RLS 要点）

> 纯静态前端**匿名直连 PostgREST**，鉴权与写入边界全部由 RLS 承担。使用 `anon` key（公开 key，安全依赖 RLS）。

### 9.1 表结构

| 表 | 关键字段 | 说明 |
|---|---|---|
| `posts` | `id uuid pk`, `slug text unique`, `title`, `excerpt`, `content_md text`, `tags text[]`, `cover`, `published bool`, `published_at timestamptz`, `created_at` | 文章表 |
| `tools` | `id text pk`, `name`, `description`, `tags text[]`, `status text`, `runtime text`, `entry`, `cover`, `order int`, `eta`, `created_at` | 工具表（可选，与本地注册表二选一/同步） |
| `messages` | `id uuid pk default gen_random_uuid()`, `nickname text`, `content text`, `created_at timestamptz default now()`, `ip_hash text`, `status text default 'visible'`, `user_agent text` | 留言表 |

### 9.2 RLS 策略要点

- **posts**：`SELECT` 允许 `anon` 仅读 `published = true`；写入仅 `service_role`（站点主在后台/SQL 操作）。→ `CREATE POLICY "public read published" ON posts FOR SELECT USING (published = true);`
- **tools**：同 posts，`SELECT` 全公开（或只读 status 非草稿）；写入仅 `service_role`。
- **messages**：
  - `SELECT`：允许 `anon` 读取 `status = 'visible'`（用于留言列表）。
  - `INSERT`：允许 `anon` 插入，但用 **CHECK 约束**限制长度与格式：`char_length(content) between 1 and 500`、`char_length(nickname) <= 30`。
  - `UPDATE/DELETE`：禁止 `anon`（仅 `service_role`，用于删除/隐藏）。→ 页面不提供编辑删除。
- **通用**：关闭不需要的 RPC；表默认启用 RLS（deny-all 起点），逐条放宽。
- **Rate limit / 防灌水**：PostgREST 无内置业务限流 → 用「Edge Function（Cloudflare/Supabase Functions）作提交中转 + 按 ip_hash 限流」或前端限流 + 数据库侧限制（如按 ip_hash 时间窗触发函数/唯一约束）。**注意：Supabase Edge Function 属于「无服务器函数」但非「常驻服务端进程」，符合免费静态托管约束；纯静态托管 + 直连 PostgREST 时，限流只能靠前端 + 数据库约束 + Turnstile。**

### 9.3 防滥用方案（留言板唯一强后端功能）

| 层 | 手段 | 说明 |
|---|---|---|
| 1 | **Honeypot 蜜罐字段** | 表单隐藏字段，填了即判为机器人，静默丢弃 |
| 2 | **Cloudflare Turnstile（推荐）或 hCaptcha** | 无感验证码，前端拿到 token；纯静态可用 Turnstile（无需服务端，token 验证放 Supabase Edge Function 或省略前端软校验） |
| 3 | **前端限流** | localStorage 记录最近提交时间，如 60s 内禁止再次提交 |
| 4 | **数据库约束** | content 长度 1–500、nickname ≤30 |
| 5 | **ip_hash 时间窗** | 通过 Edge Function 中转时记录 ip_hash 做简单频控 |
| 6 | **人工兜底** | `status` 字段，站点主可隐藏；默认可见、可疑转 hidden |

> 推荐组合：**Honeypot + Turnstile + 前端限流 + DB 长度约束**（纯静态可行、零服务器进程）。

---

## 10. 待确认问题（最多 5 条，已给假设）

| # | 问题 | 我的假设（默认按此执行） |
|---|---|---|
| Q1 | 留言板是否已确定用 Turnstile？还是先只做 honeypot+前端限流？ | **假设：P2 先用 honeypot + 前端限流 + DB 约束；Turnstile 作为增强项后置。** |
| Q2 | 工具注册表用本地静态文件还是 Supabase `tools` 表？ | **假设：P0 用本地静态 `tools.ts`；后续需要在线编辑再迁移 Supabase。** |
| Q3 | `logic-fallacy-cards` 是「运行态工具」还是「已生成的图集展示」？其 PNG 生成是否依赖无头 Chrome（Node）？ | **假设：因 PNG 生成依赖无头 Chrome，站点上定位为「已生成图集的静态展示」（runtime=light-backend 或纯静态图集），不做浏览器端实时生成。** |
| Q4 | 文章内容是 Markdown 文件（构建期）还是存 Supabase（运行时）？ | **假设：文章存 Supabase `posts` 表（运行时拉取），兼顾在线维护与静态部署。** |
| Q5 | 静态托管首选平台（影响 CI/构建设置与 Turnstile 集成）？ | **假设：Cloudflare Pages 首选**（自带 Turnstile、免费、部署简单）。 |

---

## 11. 硬性约束 Checklist（交付给架构师对齐）

- [x] 纯静态部署，无服务器端进程（Edge Function 视作无服务器函数，可选）
- [x] 工具默认 100% 浏览器端执行；个别声明 `runtime: 'light-backend'`
- [x] 留言板为唯一强后端交互，含防滥用（honeypot/限流/Turnstile）
- [x] Supabase 表结构：posts / tools / messages + RLS 要点
- [x] 结论先行、简洁
