# 半年计划 · 待办交接清单

> 这份文件写给**承接实现的 AI 工具**（不是给人读的项目文档）。任务按优先级从高到低排列，每项是一段自包含的说明 + 可执行的验收标准。
> **状态流转**：执行方完成一项后，把该项的 `status` 从 `todo` 改成 `done`，并在 `evidence:` 顶格单行里填写证据（跑过的命令 + 结果 / 产出的文件路径）。
> **执行方只能写 `doing` / `done`**（开工时 `doing`、完成后 `done`）；`blocked` 用于确实无法推进时并注明原因。
> **`verified` 只能由我方（半年计划团队）在独立验证通过后写入** —— 执行方不得自行标 `verified`。
> 协议细节与扫描流程见同目录的 `docs/AI-HANDOFF.md`（另一同事维护）。

## T-001 · 补 GitHub Actions 定时探活（防 Supabase 免费版被暂停）

status: blocked
priority: P1
area: .github/workflows/, docs/DATABASE.md
depends: —
size: S
spec: 本站唯一强后端是 Supabase（留言板），但 Supabase 免费版「连续 1 周无流量即自动暂停」，暂停后留言板会静默不可用。需在 `.github/workflows/` 下**新建**一个定时 workflow（如 `keepalive.yml`）：用 `on.schedule` 的 cron 每 1~3 天跑一次，对 Supabase 发起一次轻量**只读**请求保持项目活跃（例如 `GET <SUPABASE_URL>/rest/v1/` 或 Auth health 端点）。URL 与 anon key **必须**从仓库 Secrets 读取（如 `SUPABASE_URL` / `SUPABASE_ANON_KEY`），不得把密钥写进仓库。另把 `docs/DATABASE.md` §6 里「本期只写进本文件，不实现」更新为「已实现」并写明 Secrets 名称。站点是纯静态、无服务器端进程，本项只是 CI 定时任务，不改变该约束。⚠️ 验收只覆盖「配置正确」；workflow **真实生效**要等首次定时运行，我方会在 1~3 天后复查 Actions 运行记录，届时才算最终确认。
acceptance:
- 先实测当前状态：`curl -sS -o /dev/null -w "%{http_code}" "$SUPABASE_URL/rest/v1/"` —— **只要收到 HTTP 响应（401/404 也算）= 项目活着**；若连接失败或落到暂停提示页，则必须把 `status` 标为 `blocked` 并写明「需人工到 Supabase 控制台恢复」，**不得标 done**
- `test -f .github/workflows/keepalive.yml` 且 `grep -q "schedule:" .github/workflows/keepalive.yml`
- cron 周期 < 7 天：`grep -o "cron: .*" .github/workflows/keepalive.yml` 输出确认（如 `cron: '0 3 */2 * *'`）
- 仓库内无明文密钥：`grep -rInE "supabase\\.co|eyJ" .github/workflows/keepalive.yml` 无输出
- `grep -q "已实现" docs/DATABASE.md`
evidence: commit=af7672f | files=docs/BACKLOG.md | checks=manual:排查SUPABASE_URL全部来源未果 | note=blocked：执行方拿不到 SUPABASE_URL，acceptance#1 探活实测无法执行。已穷尽排查，仓库全文无该 URL、无 .env（仅空模板）、.workbuddy 记忆无、生产 bundle 未内联该 env（线上实际处于未配置降级态）、git 全历史 -S 搜索无、GitHub Secrets 无权读取。commit 值为当前 HEAD 占位，本任务未产生提交。解除条件：我方在仓库 Secrets 配好 SUPABASE_URL 与 SUPABASE_ANON_KEY 并告知项目存活，或直接提供 URL 供实测。另发现线上部署从未注入 Supabase env，留言板目前跑的是 fallback 演示数据（超出本项范围，仅登记）

## T-002 · 压缩 .workbuddy/memory/MEMORY.md 至注入上限内

status: todo
priority: P1
area: .workbuddy/memory/MEMORY.md
depends: —
size: S
spec: `.workbuddy/memory/MEMORY.md` 是每个会话注入给 AI 的项目长期记忆，注入上限约 13.7KB，**超出会从文件尾部截断**；当前实测 **15575 字节（约 15.6KB）**，也就是排在尾部的「环境坑 / 文档位置 / 工具清单 / ⚠️遗留」这些关键段落正在被静默截掉（而它们恰是本次交接的重要来源）。需在不丢失硬约束的前提下把它压到 13.7KB 以内：合并重复表述、删去过时历史叙述、把可指向其他文档的细节改为「见 docs/xxx」。**必须保留**下列关键项：三件套子路径部署（vite `base` / router `basename` / `paths.ts`）、`check-tools.mjs` 校验规则、沙箱「批量删除闸门」与「脚本调 git 一律 `stdio:['ignore','pipe','pipe']`」规约、判据选型、当前遗留清单。该文件位于 gitignore 的 `.workbuddy/` 下（git 不跟踪），但仍须保留在磁盘上。
acceptance:
- 字节数已压缩：`test $(wc -c < .workbuddy/memory/MEMORY.md) -le 13700`
- 关键规约仍在：`grep -q "批量删除" .workbuddy/memory/MEMORY.md` 且 `grep -q "ignore','pipe','pipe" .workbuddy/memory/MEMORY.md`
- 部署关键信息仍在：`grep -q "bannianjihua-web" .workbuddy/memory/MEMORY.md`
evidence: （执行方填写，初始留空）

## T-003 · 修复 scripts/lib/git-info.mjs 的 Windows 元字符隐患

status: todo
priority: P1
area: scripts/lib/git-info.mjs
depends: —
size: S
spec: `scripts/lib/git-info.mjs` 的 `viaGitCommand()` 用 ``execSync(`git ${args}`)``（经 shell）读 git 信息，其中 `run('log -1 --pretty=%s')` 在 Windows 会走 `cmd.exe`，而 `%s` 是 cmd 元字符，有被吞/被展开的隐患（项目记忆已记录此类坑）。改为 **`execFileSync('git', [参数数组])`**（不经 shell），并**显式**传 `stdio: ['ignore', 'pipe', 'pipe']` —— 项目记忆实测：Node 里 `execFileSync('git', ...)` 用默认 stdio 会稳定 `EBUSY`，必须显式指定 stdio。把内部 `run(args)` 改成接收**参数数组**：`run(['rev-parse','HEAD'])`、`run(['rev-parse','--abbrev-ref','HEAD'])`、`run(['log','-1','--pretty=%s'])`。该模块被 `scripts/gen-version.mjs`、`scripts/check-deploy.mjs`、`scripts/ship.mjs` 共用，改后**不得改变**对外签名 `readGitInfo(rootDir)` 与返回结构。
acceptance:
- `grep -q "execFileSync" scripts/lib/git-info.mjs` 且 `! grep -q "execSync(" scripts/lib/git-info.mjs`
- `grep -n "stdio:" scripts/lib/git-info.mjs` 输出人工确认为 `['ignore', 'pipe', 'pipe']`
- `node -e "import('./scripts/lib/git-info.mjs').then(m=>{const i=m.readGitInfo(process.cwd());console.log(i.commitFull);if(!/^([0-9a-f]{7,40}|unknown)$/.test(i.commitFull))process.exit(1)})"` 退出码 0 且打印出本仓当前 commit
evidence: （执行方填写，初始留空）

## T-004 · 补 supabase/migrations 可重放迁移（表结构 + RLS）

status: todo
priority: P1
area: supabase/migrations/
depends: —
size: M
spec: 仓库里**一个 `.sql` 都没有**，连 `supabase/` 目录都还不存在 —— Supabase 的表是当初在 dashboard 手点建的，导致换环境/重建项目时无法复现。需**新建** `supabase/migrations/` 并放入按 Supabase CLI 约定命名的迁移（如 `20261014000000_init.sql`），把 `docs/PRD.md` §9.1 的三张表 `posts` / `tools` / `messages` 的建表语句 + §9.2 的 RLS 策略写成**可重放**（幂等：`create table if not exists`、`drop policy if exists` 后再建，或保证只执行一次）的迁移。要点：三张表 `enable row level security`；`posts`/`tools` 对 `anon` 仅 `SELECT`（`posts` 限 `published = true`），写入仅 `service_role`；`messages` 允许 anon `SELECT(status='visible')` 与 `INSERT`，并用 CHECK 约束 `char_length(content) between 1 and 500`、`char_length(nickname) <= 30`，**禁止** anon `UPDATE`/`DELETE`。字段须与前端 service 对齐（`src/services/messagesService.ts` 使用 `id,nickname,content,created_at,status`）。另补 `supabase/README.md` 说明如何在本地/新项目用这些迁移重建库。
acceptance:
- `ls supabase/migrations/*.sql` 至少命中 1 个文件
- 三张表与 RLS 都在：`grep -riq "enable row level security" supabase/migrations/` 且 `grep -riq "create table" supabase/migrations/`，并分别确认 `posts`/`tools`/`messages` 均有命中
- 长度约束已写：`grep -rq "char_length(content) between 1 and 500" supabase/migrations/`
- `test -f supabase/README.md`
evidence: （执行方填写，初始留空）

## T-005 · 新增本地学习记录的导出/导入 UI（换 origin 前置）

status: todo
priority: P1
area: src/lib/storage/index.ts, src/pages/, src/router.tsx
depends: —
size: M
spec: `recordsStore`（`src/lib/storage/index.ts`）已实现 `exportAll()` / `importAll()`，但**全站没有任何调用它的 UI** —— 学习者无法把 IndexedDB 里的产出物导出成 JSON、也无法导入。因为一旦从 `shssun.github.io` 换成自定义域名，origin 改变，旧 origin 下的 localStorage + IndexedDB 数据在新域名下**全部读不到**（表现为数据凭空消失），所以「换域名」之前必须先有导出/导入入口。需新增一个页面（如 `src/pages/DataPage.tsx`）并挂到路由（`src/router.tsx`，路径段如 `data`），提供：「导出全部记录」（调 `recordsStore.exportAll()` → 生成 JSON 文件下载，文件名带日期）与「导入记录文件」（`<input type=file>` 读 JSON → `recordsStore.importAll()` → 展示 `ImportResult` 的 `imported`/`skipped`）。须遵守项目约定：service 层返回结果对象、**绝不抛异常**；存储不可用时静默降级、不弹窗。
acceptance:
- `npx tsc -b` 退出码 0
- `grep -rq "exportAll" src/pages/` 且 `grep -rq "importAll" src/pages/`
- 路由已注册：`grep -q "path: 'data'" src/router.tsx`（若采用其它路径段，以其实际文案为准）
- `npm run check:tools` 退出码 0（不得破坏既有构建关卡）
evidence: （执行方填写，初始留空）

## T-006 · 清理历史残留（daily-english 目录 + 根目录 4 个旧 html）

status: todo
priority: P1
area: public/tools/
depends: —
size: M
spec: 两处历史残留，本项**只做删除、不改任何代码**。(1) `public/tools/daily-english/` 整目录共 **63 个文件**，经 `diff -rq public/tools/daily-english public/tools/english/movie-line-shadowing` 实测**逐字节完全相同**（无差异输出），是被新目录取代的旧副本，且会被打进 `dist` 上线，纯属冗余。(2) `public/tools/` 根目录散落 **4 个**旧版单文件 HTML：`english-dict-reader.html`、`logic-fallacy-cards.html`、`md-to-html-reader.html`、`shuangpin-practice.html` —— 它们已被 `public/tools/<频道>/<id>/index.html` 取代（工具注册表 `src/data/tools/**` 的 `entry` 全部指向新路径，无任何代码引用这 4 个）。用 `git rm -r public/tools/daily-english` 与 `git rm public/tools/english-dict-reader.html public/tools/logic-fallacy-cards.html public/tools/md-to-html-reader.html public/tools/shuangpin-practice.html` 删除。
acceptance:
- `test -z "$(git ls-files public/tools/daily-english)"`（该目录已无被跟踪文件）
- `test -z "$(git ls-files 'public/tools/*.html')"`（根目录旧 html 已清空）
- `npm run check:tools` 退出码 0
- 跟踪文件总数确已减少 67：`test $(git ls-files public/tools | wc -l) -eq 2667`
evidence: （执行方填写，初始留空）

## T-007 · 清除工具 HTML 中的 postMessage 死代码

status: todo
priority: P2
area: public/tools/cognition/logic-fallacy-cards/index.html, public/tools/english/dict-reader/index.html, public/tools/general/md-to-html-reader/index.html, public/tools/general/shuangpin-practice/index.html
depends: T-006
size: M
spec: 工具呈现形态已定稿为「新标签页直接打开独立 HTML」，不再用 iframe，`ToolFrame.tsx` / `lib/postMessage.ts` 早已删除。但仍有 **4 个**工具的 `index.html` 残留 postMessage 收发消息的**死代码**（每文件命中约 2 处）：`public/tools/cognition/logic-fallacy-cards/index.html`、`public/tools/english/dict-reader/index.html`、`public/tools/general/md-to-html-reader/index.html`、`public/tools/general/shuangpin-practice/index.html`。独立打开时无副作用，但属误导性死代码。逐个用 `grep -n "postMessage" <file>` 定位后，删除对应监听/发送逻辑及不再使用的辅助变量，确保工具功能不受影响、页面无报错。**注意**：这 4 个 HTML 是工具本体；若其中某个工具有同步清单（`scripts/sync/<id>.json`）或本地源目录，应改**源**再 `npm run sync:tools`，否则下次同步会把改动覆盖回来；无同步清单的（纯手工维护）直接改仓库文件即可。
acceptance:
- 全站工具目录不再出现该标识：`grep -rn "postMessage" public/tools/` 无输出
- `npm run check:tools` 退出码 0
- 人工逐个在浏览器打开这 4 个工具，确认功能正常、控制台无报错（在 evidence 中列出 URL 清单）
evidence: （执行方填写，初始留空）

## T-008 · 实现方案 C1：同屏轮换双人互测工具（零后端）

status: todo
priority: P2
area: public/tools/english/, src/data/tools/english/, src/data/collections.ts
depends: —
size: M
spec: ICAP 互动层当前**零工具**（`docs/ICAP-INTEGRATION.md` §2：Passive 10 / Active 2 / Constructive 0 / Interactive 0）。C1 是「一台设备两人轮流」的互测工具，**零后端**：A 看到中文/提示（题干可取自 `public/tools/english/moear/tool/phrases.json`，346 条短语各带 function/scene/tone/difficulty），B 写出英文变体；然后 A 判分并追问「为什么用这个时态/词」，再交换角色。需新建：单文件自包含工具 `public/tools/english/peer-turn-drill/index.html` + 注册表文件 `src/data/tools/english/peer-turn-drill.ts`（对象为**纯字面量**，`channel:'english'`、`entry:'tools/english/peer-turn-drill/index.html'`、`icap:['interactive']`、`status:'online'`、`runtime:'client-only'`）。工具须把双方每轮产出写进与主站**同 origin** 的 IndexedDB（内联 `src/lib/storage/idb.ts` 的同结构逻辑；记录形如 `{id,toolId:'peer-turn-drill',kind:'peer-turn',refId,payload,createdAt}`），使主站回顾/导出能读出（零 IPC，见 `docs/DATABASE.md` §5）。若在 `src/data/collections.ts` 的某集合 `path` 里加一步指向该工具，则该 `toolId` **必须属于该集合**，否则构建期校验会 `exit 1`。
acceptance:
- `npm run check:tools` 退出码 0（新工具已注册且通过构建期校验）
- `test -f public/tools/english/peer-turn-drill/index.html`
- 工具无对外域网络请求：`grep -nE "fetch\(['\"]https?:|XMLHttpRequest" public/tools/english/peer-turn-drill/index.html` 无输出
- 手动走一遍：双方各产出 ≥1 轮后，`kind==='peer-turn'` 的记录条数 ≥ 2
evidence: （执行方填写，初始留空）

## T-009 · 实现方案 C2：单人 + 外部 AI 陪练工具（零后端）

status: todo
priority: P2
area: public/tools/english/, src/data/tools/english/
depends: —
size: M
spec: ICAP 互动层的第二种零后端形态：工具只做「题面生成 + 轮次记录」，对话交给**外部 LLM**，以保住纯静态。流程：工具生成一道题面（同样取自 `public/tools/english/moear/tool/phrases.json`）→ 提示学习者复制去任意外部 LLM 让其追问 → 学习者把 LLM 的追问**粘回**工具 → 学习者作答 → 工具记录本轮（题干 / 追问 / 作答）。需新建：单文件自包含工具 `public/tools/english/ai-sparring/index.html` + 注册表文件 `src/data/tools/english/ai-sparring.ts`（纯字面量，`channel:'english'`、`entry:'tools/english/ai-sparring/index.html'`、`icap:['interactive']`、`status:'online'`、`runtime:'client-only'`）。轮次产出写进同 origin 的 IndexedDB（`kind:'ai-sparring'`），便于主站回顾与导出。**不得**在工具内调用任何 AI/网络 API（否则破坏纯静态与零服务器约束）。
acceptance:
- `npm run check:tools` 退出码 0
- `test -f public/tools/english/ai-sparring/index.html`
- 工具无对外域网络请求：`grep -nE "fetch\(['\"]https?:|XMLHttpRequest" public/tools/english/ai-sparring/index.html` 无输出
- 手动走一遍：完成 ≥1 轮（题面 → 追问 → 作答）后，`kind==='ai-sparring'` 的记录能被读出
evidence: （执行方填写，初始留空）

## T-010 · 清退已废弃脚本 scripts/sync-daily-english.mjs 及其失效文档引用

status: todo
priority: P2
area: scripts/, docs/
depends: —
size: M
spec: `scripts/sync-daily-english.mjs`（约 12KB）是早期的**硬编码单工具同步器**，已被「通用同步器 `scripts/sync-tools.mjs` + 一工具一清单 `scripts/sync/<id>.json`」取代 —— `package.json` 的 `prebuild` 只调用 `sync-tools.mjs`，全仓**没有任何配置引用** `sync-daily-english.mjs`，它已是死代码。请执行 `git rm scripts/sync-daily-english.mjs`，并清理文档里对它的失效引用（`docs/PRD.md` §6 第 4 条、`docs/ARCHITECTURE.md`（约第 645 行）、`docs/TOOLS-LAYOUT.md` 相关叙述），改为指向 `scripts/sync-tools.mjs` + `scripts/sync/*.json` 的现状。⚠️ `.workbuddy/memory/` 下的引用**不要改**（该目录被 gitignore、属项目记忆，记录的是历史演进，不回改）。本项不改任何运行逻辑。
acceptance:
- `test ! -f scripts/sync-daily-english.mjs`
- docs 内已无失效引用：`! grep -rn "sync-daily-english" docs/`
- `npm run sync:tools` 退出码 0（同步链不受影响）
evidence: （执行方填写，初始留空）

## T-011 · 准备切换自定义域名（Cloudflare Pages，BASE_PATH=/）

status: todo
priority: P2
area: docs/, public/_redirects, .github/workflows/deploy.yml
depends: T-005
size: M
spec: 站点现部署在 GitHub Pages 项目子路径 `/bannianjihua-web/`。若切到自定义域名（Cloudflare Pages 等根路径托管），必须用 `BASE_PATH=/` 构建，否则路由 basename、静态资源、工具 entry 全断（三件套：`vite.config.ts` 的 `base`、`src/router.tsx` 的 `basename`、`src/lib/paths.ts`）。本项**只做仓库内可自动化的准备与验证**（域名注册 / Cloudflare 项目创建属人工，不在本项范围）：新建 `docs/DEPLOY-CLOUDFLARE.md`，写明构建命令（`BASE_PATH=/ npm run build`）、Cloudflare Pages 构建配置、`public/_redirects` 的 SPA 兜底是否仍需保留、以及**回滚到 GitHub Pages 的步骤**；复核 `public/_redirects`、`public/.nojekyll` 在新平台的取舍。**强前置**：必须等 T-005（导出/导入 UI）完成后才能真正切域名，因为换 origin 会让旧本地数据全部孤立。
acceptance:
- `test -f docs/DEPLOY-CLOUDFLARE.md`，且文档含 `BASE_PATH=/` 与回滚步骤（`grep -q "回滚" docs/DEPLOY-CLOUDFLARE.md`）
- 根路径构建可用：`BASE_PATH=/ npx vite build --outDir ../bannianjihua-rootcheck` 退出码 0（⚠️ 本地**不要**跑默认 outDir 的 `npm run build`：`vite build` 的 `emptyOutDir` 会撞沙箱批量删除闸门）
- 产物 base 正确：`grep -o "/assets/[^\"']*" ../bannianjihua-rootcheck/index.html | head -1` 结果以 `/assets/` 开头（而非 `/bannianjihua-web/assets/`）
evidence: （执行方填写，初始留空）

## T-012 · 实现方案 C3：互评走廊（复用 Supabase）

status: todo
priority: P3
area: src/services/, src/pages/, src/router.tsx, supabase/migrations/
depends: T-004
size: L
spec: ICAP 互动层的第三种形态，**复用站点唯一强后端 Supabase**（不新增后端）：把留言板模式改造成「贴出你的句子 → 别人挑错/追问」的互评走廊。需要：(1) 在 `supabase/migrations/` **新增**迁移，建 `corridor_posts`（`id` / `sentence` / `created_at` / `status`）与 `corridor_replies`（`id` / `post_id` / `content` / `created_at` / `status`）两张表，均 `enable row level security`；anon 仅可 `SELECT(status='visible')` 与 `INSERT`（带 CHECK 长度约束，`corridor_replies` 的 INSERT 通过外键校验 `post_id` 存在），**禁止** anon `UPDATE`/`DELETE`。(2) 新建 `src/services/corridorService.ts`，照 `src/services/messagesService.ts` 的写法（返回 `APIResult<T>`、honeypot 蜜罐、前端限流、**绝不抛异常**）。(3) 新建 `src/pages/CorridorPage.tsx` 并注册路由（如路径段 `corridor`）与导航入口。诚实边界：无推广时走廊前期必然冷清，且引入 UGC 审核风险（靠 `status` 字段人工隐藏）。T-004 必须先完成，本项迁移接在其后。
acceptance:
- `npx tsc -b` 退出码 0
- 迁移与 service 都到位：`grep -rq "corridor" supabase/migrations/` 且 `test -f src/services/corridorService.ts`
- 路由已注册：`grep -q "path: 'corridor'" src/router.tsx`
- `npm run check:tools` 退出码 0
evidence: （执行方填写，初始留空）

## T-013 · 复核音频/素材侧遗留（标签偏差 / 帧 OCR / 隔离片段 / whisper 幻觉 / 错别字文件名）

status: todo
priority: P3
area: docs/
depends: —
size: L
spec: 音频/素材侧（moear 工具链，工作目录 `D:/workspaces/每日英语台词/`，**不进仓库**）据前期同事反馈存在 5 类系统性遗留，但本清单作者**未能一手复核**具体数量与位置，故本项先「核实 + 登记」，**先不做修复**：① 标签表系统性偏差（`_taxonomy/tags.json`、`_taxonomy/build_tags.py`），据称约 3 处；② 高危单元需靠帧 OCR 定谳（`_audit/_frames_a_manifest.json`、`_audit/frame_audit_b_meta.json`、`_audit/asr_doubt.json`），据称约 72 条；③ 隔离片段待决定去留（`_orphan_voices/`，含 `_moved.json`），据称约 8 条；④ whisper 转写疑似幻觉（`_logs/1_transcribe.log`、`_audit/asr_doubt.*`），据称约 26 条；⑤ 错别字文件名（散在 `D:/workspaces/每日英语台词/*.mp4`），据称约 25 个。产出 `docs/AUDIO-LEGACY-AUDIT.md`：**用命令实测**每个类别的真实数量与代表文件、标注来源，凡信息不足处写「待确认」，**不得直接沿用上述未复核数字**；并给出每类的处置建议（去 / 留 / 改）。源目录在仓库外，本项只产出文档，不修改素材。
acceptance:
- `test -f docs/AUDIO-LEGACY-AUDIT.md`
- 文档含 ≥5 个类别小节且每节给出「数量 + 定位命令 + 代表文件」：`test $(grep -c "^## " docs/AUDIO-LEGACY-AUDIT.md) -ge 5`
- 引用可复现：`ls "D:/workspaces/每日英语台词/_audit/" "D:/workspaces/每日英语台词/_taxonomy/" "D:/workspaces/每日英语台词/_orphan_voices/"` 能列出文档中引用的文件
evidence: （执行方填写，初始留空）

## T-014 · 补足 movie-line-shadowing 素材（当前仅 11 条 demo）

status: todo
priority: P3
area: public/tools/english/movie-line-shadowing/, D:/workspaces/每日英语/
depends: —
size: M
spec: `movie-line-shadowing` 工具目前内容只有 **11 条 demo**：`public/tools/english/movie-line-shadowing/tool/data.json` 的 `items` 数组实测长度 = 11（而源目录 `D:/workspaces/每日英语/` 的成品素材多于 11 条）。需在**源工作目录**按既有管线补足条目（转写 + 中文 + TTS 配音等），再经 `npm run sync:tools` 增量同步进站（同步判据是「大小 + 内容 sha1」双判据，不会误判）。本项属素材生产，不写新代码；若某条素材缺中文/配音，需先在源侧补齐再同步。目标条数由老板给定（若未给定，以「源目录已就绪的成品条数」为准，并在 evidence 报告实际数字）。
acceptance:
- 条数确已超过 demo：`node -e "const d=require('./public/tools/english/movie-line-shadowing/tool/data.json'); if(d.items.length<=11){console.error('仍为 demo 条数'); process.exit(1)}"`
- `npm run sync:tools` 退出码 0（源目标 sha1 一致）
- `npm run check:tools` 退出码 0
evidence: （执行方填写，初始留空）

## T-015 · 统一 movie-line-shadowing 的站内 URL 层级（sync 增加 stripPrefix）

status: todo
priority: P3
area: scripts/sync-tools.mjs, scripts/sync/movie-line-shadowing.json, src/data/tools/english/movie-line-shadowing.ts, public/tools/english/movie-line-shadowing/
depends: —
size: M
spec: 其它工具入口都是 `public/tools/<频道>/<id>/index.html`，唯独 `movie-line-shadowing` 因源目录多一层 `tool/` 而变成 `public/tools/english/movie-line-shadowing/tool/index.html`（入口 `entry: 'tools/english/movie-line-shadowing/tool/index.html'`），URL 比别的工具深一层。给通用同步器 `scripts/sync-tools.mjs` 增加清单字段 `stripPrefix`（如 `"stripPrefix": "tool/"`），把匹配到的源相对路径去掉该前缀后再映射到目标；在 `scripts/sync/movie-line-shadowing.json` 里启用它，使产物落到 `.../movie-line-shadowing/index.html`。⚠️ **关键坑**：该工具 HTML 内部用 `mediaUrl(file){ return '../' + encodeURIComponent(file) }`（`tool/index.html` 约第 288 行）引用**上一层**的 `.mp4`；产物上移一层后会指向错误位置，必须**同时**把**源**目录里该工具 HTML 的 `'../'` 改成 `'./'`（改源再同步），否则视频全 404。改完更新 `Tool.entry`。`stripPrefix` 需与既有 `rename`（精确映射）/ `required`（按**源**路径判定）共存，且不影响其它清单。
acceptance:
- 新字段已实现并在清单启用：`grep -q "stripPrefix" scripts/sync-tools.mjs` 且 `grep -q "stripPrefix" scripts/sync/movie-line-shadowing.json`
- 产物已上移：`test -f public/tools/english/movie-line-shadowing/index.html` 且 `test ! -d public/tools/english/movie-line-shadowing/tool`
- 入口已更新：`grep -q "tools/english/movie-line-shadowing/index.html" src/data/tools/english/movie-line-shadowing.ts`
- 同步与校验均通过：`npm run sync:tools` 与 `npm run check:tools` 退出码均 0
evidence: （执行方填写，初始留空）

## T-016 · 决策 3 个已产出未上线成品的去留（待决策，非实现）

status: verified
priority: P3
area: docs/
depends: —
size: S
spec: 有 **3 个已产出但从未上线**的成品，需老板拍板处置（上线 / 归档 / 删除）；本项**只登记、不实现**：① `英文学习精编.html`（约 2.3MB）、② `台词语音卡_v0.2.html`、③ `工具/锁屏背句_demo.html`。三者均在**仓库外**的素材目录 `C:/Users/ZhuanZ1/Documents/WS/英文学习/`（仓库 `D:/workspaces/bannianjihua_web` 内没有这些文件）。请在 evidence 里填「三选一」结论：若选「上线」，另开一个实现项（把成品放进 `public/tools/<频道>/<id>/` + 建注册表文件 `src/data/tools/<频道>/<id>.ts`），并在本项注明该新项 id；若选「归档/删除」，记录归档路径或删除确认。判定依据可参考同目录的 `归档说明.md`、`07_锁屏背句可行性.md`、`08_载体可行性评估.md`。
acceptance:
- 确认三件成品存在：`ls -la "C:/Users/ZhuanZ1/Documents/WS/英文学习/英文学习精编.html" "C:/Users/ZhuanZ1/Documents/WS/英文学习/台词语音卡_v0.2.html" "C:/Users/ZhuanZ1/Documents/WS/英文学习/工具/锁屏背句_demo.html"`
- evidence 中记录每件的处置结论（上线 / 归档 / 删除）及理由
- 若结论为「上线」，已另建实现项并在本项 evidence 注明其 id
evidence: 结论=三件**全部上线**（老板 2026-10-14 决策原话「上线，使用过程中我们再打磨」）| files=— | checks=三件均实测存在且**真自包含**（`grep -c 'src="https?://'` = 0、`fetch(` = 0、根绝对路径 = 0）| note=已另开实现项 **T-017 / T-018 / T-019**，分别对应精编 / 台词语音卡 / 锁屏背句；本项仅作决策登记，实现走那三项
  - verify 2026-10-14T19:05:00+08:00 | by=team-lead | 3/3 acceptance 通过（三件存在性已 ls 确认；结论已记录；三个新项 id 已注明）

## T-017 · 上线「英文学习精编」阅读器（源 2.3MB 自包含单文件）

status: todo
priority: P2
area: public/tools/english/dragon-english-reader/, src/data/tools/english/dragon-english-reader.ts
depends: —
size: S
spec: 把仓库外的 `C:/Users/ZhuanZ1/Documents/WS/英文学习/英文学习精编.html`（2,386,840 字节 / 12058 行，`<title>` = 「ドラゴン・イングリッシュ　中文精编」）**原样**落进站点成为工具。该文件**已实测真自包含**（零 `http(s)://` 外部引用、零 `fetch(`、零根绝对路径引用），属本项目「自包含单文件 → 原样拷、无同步清单」那一类，因此：(1) `mkdir -p public/tools/english/dragon-english-reader && cp` 该文件为 `public/tools/english/dragon-english-reader/index.html`（**内容不得做任何修改、压缩或美化**）；(2) 新建注册表 `src/data/tools/english/dragon-english-reader.ts`，**严格照抄** `src/data/tools/english/basic100-sentence-reader.ts` 的结构（import 类型 + 顶部注释说明内容源与重建方式 + `const tool: Tool` + `export default tool`），字段取值：`id: 'dragon-english-reader'`、`channel: 'english'`、`status: 'online'`、`runtime: 'client-only'`、`entry: 'tools/english/dragon-english-reader/index.html'`、`createdAt: '2026-10-14'`；`name` 写「英文学习精编 · Dragon English」；`description` 说明它是竹冈广信《Dragon English》的中文精编阅读器（左侧目录树 + 全文检索 + 深浅色切换 + 阅读进度）；`tags` 含 '英语'、'阅读'、'离线'；`collections: ['books', 'dragon-english']`（**若 `dragon-english` 集合不存在则只写 `['books']`，不要新建集合**）；`icap: ['passive']`；`order` 取当前 english 频道未被占用的下一个值（先 `grep -h "order:" src/data/tools/english/*.ts` 查重）。**只新建这 2 个文件，不改任何既有文件**（注册表靠 `import.meta.glob` 自动收集，这是本项目已过 QA 的约定）。
acceptance:
- `test -f public/tools/english/dragon-english-reader/index.html` 且其 sha1 与源文件**逐字节相同**：源 `sha1sum "C:/Users/ZhuanZ1/Documents/WS/英文学习/英文学习精编.html"` 与站内 `sha1sum public/tools/english/dragon-english-reader/index.html` 输出一致（若因 `core.autocrlf` 导致差异，比对前两边都先 `tr -d '\r'` 再算 sha1）
- `test -f src/data/tools/english/dragon-english-reader.ts` 且 `grep -n "id: 'dragon-english-reader'"` 命中
- `node scripts/check-tools.mjs` 退出码 0（会校验 id 唯一 / 目录名==channel / 文件名==id / `public/<entry>` 存在 / collections id 存在 / icap 合法 / order 无重复）
- `npx tsc -b` 退出码 0
- **不跑 `npm run build`**；构建验证用 `npx vite build --outDir ../_buildcheck`，退出码 0
evidence: （执行方填写，初始留空）

## T-018 · 上线「台词语音卡 v0.2」背句工具

status: todo
priority: P2
area: public/tools/english/movie-line-quotecards/, src/data/tools/english/movie-line-quotecards.ts
depends: —
size: S
spec: 把仓库外的 `C:/Users/ZhuanZ1/Documents/WS/英文学习/台词语音卡_v0.2.html`（139,227 字节，`<title>` = 「台词语音卡 v0.2 ｜ 背句优先版」）**原样**落进站点。该文件**已实测真自包含**（零外部引用 / 零 `fetch(` / 零根绝对路径），处理方式与 T-017 完全相同：(1) `mkdir -p public/tools/english/movie-line-quotecards && cp` 为 `index.html`（**内容零修改**）；(2) 新建 `src/data/tools/english/movie-line-quotecards.ts`，照抄 `basic100-sentence-reader.ts` 结构：`id: 'movie-line-quotecards'`、`channel: 'english'`、`status: 'online'`、`runtime: 'client-only'`、`entry: 'tools/english/movie-line-quotecards/index.html'`、`createdAt: '2026-10-14'`；`name` 写「台词语音卡 · 背句优先」；`description` 说明它按「背句优先」组织影视台词，先记整句再定位片段；`collections` 填 `['books', 'movie-lines', 'dragon-english']` 中**实际存在**的项（先 `grep -n "id:" src/data/collections.ts` 确认，不存在的**不要写**）；`icap: ['active']`（读句跟读属 active 层）；`order` 查重后取值。**只新建 2 个文件，不改既有文件。**
acceptance:
- `test -f public/tools/english/movie-line-quotecards/index.html` 且与源文件 sha1 一致（比对方法同 T-017，注意 CRLF）
- `test -f src/data/tools/english/movie-line-quotecards.ts` 且 `grep -n "id: 'movie-line-quotecards'"` 命中
- `node scripts/check-tools.mjs` 退出码 0
- `npx tsc -b` 退出码 0
- **不跑 `npm run build`**；构建验证用 `npx vite build --outDir ../_buildcheck`，退出码 0
evidence: （执行方填写，初始留空）

## T-019 · 上线「锁屏背句」原型（demo，需标注原型性质）

status: todo
priority: P3
area: public/tools/english/lockscreen-sentence-drill/, src/data/tools/english/lockscreen-sentence-drill.ts
depends: —
size: S
spec: 把仓库外的 `C:/Users/ZhuanZ1/Documents/WS/英文学习/工具/锁屏背句_demo.html`（18,633 字节，`<title>` = 「锁屏背句 · 可行性原型 v0.1」）**原样**落进站点。该文件**已实测真自包含**，处理方式同 T-017：(1) `mkdir -p public/tools/english/lockscreen-sentence-drill && cp` 为 `index.html`（**内容零修改**）；(2) 新建注册表 `lockscreen-sentence-drill.ts`：`id: 'lockscreen-sentence-drill'`、`channel: 'english'`、`status: 'online'`、`runtime: 'client-only'`、`entry: 'tools/english/lockscreen-sentence-drill/index.html'`、`createdAt: '2026-10-14'`；`name` 写「锁屏背句 · 可行性原型」；`description` **必须诚实标注这是可行性原型（demo）而非完成品**，说明它验证「锁屏状态下背句」这一交互形态；`icap: ['active']`；`order` 查重后取值。⚠️ 本项被老板明确为「上线后在使用过程中再打磨」，属**未打磨的原型**，因此 `version` 建议写 `'0.1.0'`（区别于正式工具的 `1.0.0`）。**只新建 2 个文件，不改既有文件。**
acceptance:
- `test -f public/tools/english/lockscreen-sentence-drill/index.html` 且与源文件 sha1 一致（比对方法同 T-017，注意 CRLF）
- `test -f src/data/tools/english/lockscreen-sentence-drill.ts` 且 `grep -n "id: 'lockscreen-sentence-drill'"` 命中，且 `grep -n "version: '0.1.0'"` 命中
- `node scripts/check-tools.mjs` 退出码 0
- `npx tsc -b` 退出码 0
- **不跑 `npm run build`**；构建验证用 `npx vite build --outDir ../_buildcheck`，退出码 0
evidence: （执行方填写，初始留空）

