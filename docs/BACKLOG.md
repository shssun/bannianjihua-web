# 半年计划 · 待办交接清单

> 这份文件写给**承接实现的 AI 工具**（不是给人读的项目文档）。任务按优先级从高到低排列，每项是一段自包含的说明 + 可执行的验收标准。
> **状态流转**：执行方完成一项后，把该项的 `status` 从 `todo` 改成 `done`，并在 `evidence:` 顶格单行里填写证据（跑过的命令 + 结果 / 产出的文件路径）。
> **执行方只能写 `doing` / `done`**（开工时 `doing`、完成后 `done`）；`blocked` 用于确实无法推进时并注明原因。
> **`verified` 只能由我方（半年计划团队）在独立验证通过后写入** —— 执行方不得自行标 `verified`。
> 协议细节与扫描流程见同目录的 `docs/AI-HANDOFF.md`（另一同事维护）。

---

## 📢 给执行方的当前指令

> **本区块 + 下面的 `## T-xxx` 任务块 = 我方对你的唯一主通道。**
> 我方对你说的一切（新任务 / 暂缓 / 边界澄清）都会写进本区块。**每次扫描请先读它，再按 `todo` 取活。**
> `docs/EXEC-COMMS.md` 只作问答存档 —— **那条通道不保证被定时扫描到**（见协议 §7.1）。

> **本轮（2026-10-14 20:45 更新）**
>
> 1. ✅ 你每 20 分钟轮询一次 → **一次可以连着做多项**，不必只做一个就停：按 `priority` 高者、再按 id 顺序取。但**每项单独一个 commit**，严禁多项混一个提交。
> 2. ✅ 提交前自查 `status` 与 `evidence` 是否**成对更新**（历史上出现过「填了 evidence 忘改 status」→ 该项永远扫不到；现在 `scan` 已会报出 `staleDoing`）。若发现上一批漏改，**自己补正**即可，不必等我方。
> 3. 🚫 **`T-013` / `T-014` / `T-015` 暂时不要领** —— 三者都依赖**仓库外**的「每日英语」源料（`D:/workspaces/每日英语*/`），而源料镜像与源侧改动由我方在 **`T-023`** 里做。等 `T-023` 变成 `verified` 再领，否则白跑一轮。这三项的 `depends` 已写明这一点。
> 4. 📌 **本轮可以领的**：`T-021`（3 个新工具的移动端/深色/子路径核查）、`T-012`（C3 互评走廊，`depends: T-004` 已满足）；以及你手上在飞的 `T-009`。
> 5. 🔒 重申两条铁律：**不要 `git push`**（协议 §6.2，你只 `commit`）；**`_src-tmp/` 只读、产出必须落正式目录**（协议 §6.1）。
> 6. ⚠️ 本机验证构建用 `npx vite build --outDir <仓库外目录>`；不要跑 `npm run build` / `npm run ship`。
> 7. 📣 **上一批回报**：`T-008`（C1 双人轮换互测）已由我方**独立复验 4/4 通过**并部署上线 —— 其中「手动走一遍」那条我没看自评，用真浏览器（headless Chrome + CDP 驱动）跑了两轮，确认**角色互换真的发生**（甲出题/乙答题 → 乙出题/甲答题）、真题库 346 条、`kind==='peer-turn'` 记录恰 2 条、控制台零报错。你的 `T-004` / `T-017` 亦已 verified。「漏改 status」一事不必再解释，已加固工具自动发现。

---

## 📋 候选新任务（**待老板拍板，暂不派发 —— 执行方请勿实现**）

> 下面是**我方提案**，不是任务。等老板选定后才会改写成正式的 `## T-xxx` 块并给出 `acceptance`。
>
> 1. `/tools` 列表页加「搜索 + 频道/集合筛选」（工具已达 18 个，纯靠翻找的成本变高）
> 2. 路由级 `<title>` / `<meta description>`（当前 SPA 全站同一标题，影响 SEO 与分享卡片）
> 3. `/roadmap` 与 `docs/BACKLOG.md` 打通（现在两处手工维护，容易漂移）
> 4. `/blog` 内容填充（站点定位是「blog + 工具箱」，目前博客只有骨架；内容源可取自公众号文章）
> 5. 全站可访问性基线与移动端验收清单（键盘可达 / 对比度 / `aria` / 触控目标尺寸）

---

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

status: verified
priority: P1
area: .workbuddy/memory/MEMORY.md
depends: —
size: S
spec: ⚠️ **本项的前提已于 2026-10-14 被实测推翻，且本项改由我方自行执行 —— 执行方请跳过。**

订正：原文写的「注入上限约 13.7KB，超出从尾部截断」**未复现** —— 2026-10-14 复看，**15575 B 时可完整注入**（尾部段落并未被截）。故正确口径是「**控制在 ~18KB 内、硬规则一律写在最前面**」，而不是死守 13.7KB。保留原始意图（瘦身、不丢硬约束）如下：合并重复表述、删去过时历史叙述、把可指向其他文档的细节改为「见 docs/xxx」。**必须保留**下列关键项：三件套子路径部署（vite `base` / router `basename` / `paths.ts`）、`check-tools.mjs` 校验规则、沙箱「批量删除闸门」与「脚本调 git 一律 `stdio:['ignore','pipe','pipe']`」规约、判据选型、当前遗留清单。该文件位于 gitignore 的 `.workbuddy/` 下（git 不跟踪），但仍须保留在磁盘上。
acceptance:
- 字节数在合理范围：`test $(wc -c < .workbuddy/memory/MEMORY.md) -le 18000`（原判据 13700 基于已被推翻的前提；按订正口径取 18000）
- 关键规约仍在：`grep -q "批量删除" .workbuddy/memory/MEMORY.md` 且 `grep -q "ignore','pipe','pipe" .workbuddy/memory/MEMORY.md`
- 部署关键信息仍在：`grep -q "bannianjihua-web" .workbuddy/memory/MEMORY.md`
evidence: commit=(n/a，`.workbuddy/` 在 gitignore 内、不入版本库) | files=.workbuddy/memory/MEMORY.md | checks=wc-c:14467(<=18000),grep:批量删除=1,grep:stdio-ignore-pipe-pipe=1,grep:bannianjihua-web=3,grep:三件套=1,grep:basename=2,grep:execFileSync=1,grep:emptyOutDir=1,grep:loadCollections=1,grep:判据=7,grep:回填真源=1,grep:_src-tmp=2,grep:反证测试=1,章节数:15 | note=⚠️ 本项由我方自行执行（执行方对该目录不可见）。实际瘦身发生在 2026-10-14 20:08（17388 B → 13693 B）；我方本次在其基础上补两处：① 修正「≤13.5KB 上限」这一已被推翻的表述 → 改为 ≤18KB 并注明原前提已推翻；② 新增本轮确立的 3 条硬规则（push 只有我方 / push 前必看 origin/main..HEAD / 整点 automation 严禁实现 todo 项）。压缩质量经逐条核验：全部硬规则（三件套 / check-tools 规则 / 批量删除闸门 / stdio 规约 / 判据选型 / 沙箱坑）均保留，仅砍冗余叙述（章节 18→15）
  - verify 2026-10-14T20:31:42+08:00 | by=team-lead | 3/3 acceptance 通过：`wc -c` = 14467（≤18000）；关键规约全在（`批量删除`=1、`ignore','pipe','pipe`=1、`bannianjihua-web`=3、`三件套`=1、`basename`=2、`execFileSync`=1、`emptyOutDir`=1、`loadCollections`=1、`判据`=7、`回填真源`=1、`_src-tmp`=2、`反证测试`=1，章节 15 节）| 注：本项前提（13.7KB 截断）已被推翻，改由我方执行；我方在既有压缩基础上补两处（订正 ≤13.5KB 表述 → ≤18KB、新增 3 条本轮硬规则）

## T-003 · 修复 scripts/lib/git-info.mjs 的 Windows 元字符隐患

status: verified
priority: P1
area: scripts/lib/git-info.mjs
depends: —
size: S
spec: `scripts/lib/git-info.mjs` 的 `viaGitCommand()` 用 ``execSync(`git ${args}`)``（经 shell）读 git 信息，其中 `run('log -1 --pretty=%s')` 在 Windows 会走 `cmd.exe`，而 `%s` 是 cmd 元字符，有被吞/被展开的隐患（项目记忆已记录此类坑）。改为 **`execFileSync('git', [参数数组])`**（不经 shell），并**显式**传 `stdio: ['ignore', 'pipe', 'pipe']` —— 项目记忆实测：Node 里 `execFileSync('git', ...)` 用默认 stdio 会稳定 `EBUSY`，必须显式指定 stdio。把内部 `run(args)` 改成接收**参数数组**：`run(['rev-parse','HEAD'])`、`run(['rev-parse','--abbrev-ref','HEAD'])`、`run(['log','-1','--pretty=%s'])`。该模块被 `scripts/gen-version.mjs`、`scripts/check-deploy.mjs`、`scripts/ship.mjs` 共用，改后**不得改变**对外签名 `readGitInfo(rootDir)` 与返回结构。
acceptance:
- `grep -q "execFileSync" scripts/lib/git-info.mjs` 且 `! grep -q "execSync(" scripts/lib/git-info.mjs`
- `grep -n "stdio:" scripts/lib/git-info.mjs` 输出人工确认为 `['ignore', 'pipe', 'pipe']`
- `node -e "import('./scripts/lib/git-info.mjs').then(m=>{const i=m.readGitInfo(process.cwd());console.log(i.commitFull);if(!/^([0-9a-f]{7,40}|unknown)$/.test(i.commitFull))process.exit(1)})"` 退出码 0 且打印出本仓当前 commit
evidence: commit=73a0ee7 | files=scripts/lib/git-info.mjs | checks=manual:3条acceptance均真跑通过(grep确认execFileSync且无execSync(调用,stdio恰为[ignore,pipe,pipe],node实测readGitInfo打印commitFull 029dfcf...且exit=0) | note=对外签名 readGitInfo(rootDir) 与返回结构未变；经 shell 的 execSync 已彻底移除
  - verify 2026-10-14T19:21:07+08:00 | by=team-lead | 3/3 acceptance 通过；另做对抗验证：readGitInfo 的 subject 逐字等于 git log -1 --pretty=%s（证明 %s 未被 cmd 吞噬）；三个调用方 gen-version/check-deploy/ship 均未改坏（gen-version 实测输出 commit=ddac409 branch=main）

## T-004 · 补 supabase/migrations 可重放迁移（表结构 + RLS）

status: verified
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
evidence: commit=42f1699 | files=supabase/migrations/20261014000000_init.sql,supabase/README.md | checks=ls-migrations:pass(1个sql),grep-rls:pass(posts/tools/messages各命中enable row level security与create table),grep-char_length:pass | note=幂等风格（create table if not exists + drop policy if exists）；字段与 messagesService.ts 对齐；README 含 CLI/本地/dashboard 三种重建方式
  - verify 2026-10-14T20:17:30+08:00 | by=team-lead | 4/4 acceptance 通过：migrations/20261014000000_init.sql 存在，posts/tools/messages 三表与 enable row level security 均命中，char_length(content) between 1 and 500 命中，README.md 存在；另查幂等风格 "if not exists / drop policy if exists" 共 9 处（可重放）| 注：执行方漏改 status（doing 未→done），由我方补正后验证

## T-005 · 新增本地学习记录的导出/导入 UI（换 origin 前置）

status: verified
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
evidence: commit=ddac409 | files=src/pages/DataPage.tsx,src/router.tsx,src/components/layout/Navbar.tsx | checks=tsc:pass(0),check-tools:pass(0),vite-build:pass(outDir=node_modules/.bc-t005,exit 0,54.67s),grep:pass(DataPage 内 exportAll/importAll 各命中,router 注册 path 'data') | deviation=area 未列 Navbar.tsx，为可发现性在导航加了一项「我的数据」（否则页面无入口）；构建验证用仓库内 gitignored 空目录替代 ../_buildcheck（沙箱只可写仓库内，行为等价：新目录不触发 emptyOutDir 清空） | note=存储不可用/空记录时内联提示不弹窗，绝不抛异常；导入展示 imported/skipped
  - verify 2026-10-14T19:21:08+08:00 | by=team-lead | 4/4 acceptance 通过；偏离项（Navbar 加入口）判定为必要且已声明，接受。另做对抗验证：esbuild 打包 storage 后对 importAll 打 10 例畸形输入（null/undefined/数组/字符串/数字/空对象/records非数组/全非法条目/空数组/缺字段），10/10 均未抛异常且返回结构 ok/imported/skipped 齐全，「绝不抛异常」声明实证成立；exportAll 结构含 schema/version/exportedAt/records

## T-006 · 清理历史残留（daily-english 目录 + 根目录 4 个旧 html）

status: verified
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
evidence: commit=d3ddcb1 | files=public/tools/daily-english/,public/tools/english-dict-reader.html,public/tools/logic-fallacy-cards.html,public/tools/md-to-html-reader.html,public/tools/shuangpin-practice.html | checks=diff-no-index:pass(删除前实测两目录逐字节相同,exit 0),check-tools:pass(0),count:pass(2734减67恰为2667),daily-english:pass(git ls-files 0条),root-html:pass(4个文件Test-Path均False,根目录一级无任何被跟踪html) | deviation=acceptance#2 字面命令 git ls-files 'public/tools/*.html' 在 git pathspec 语义下 * 跨目录匹配，永远会命中 10 个合法工具的嵌套 index.html（bash 下行为相同），故按意图验证「根目录一级已无旧 html」；删除前未轻信 spec 的「逐字节相同」结论，用 git diff --no-index 复核通过 | note=paths.ts 注释里的 md-to-html-reader.html 仅为示例文案非功能引用，未改
  - verify 2026-10-14T19:58:14+08:00 | by=team-lead | 4/4 acceptance 通过：在 d3ddcb1 处复算 public/tools 跟踪文件数=2667（2734−67）、daily-english 0 条、根目录一级 html 0 个、check-tools exit 0；另复核旧目录与 movie-line-shadowing 逐字节相同

## T-007 · 清除工具 HTML 中的 postMessage 死代码

status: verified
priority: P2
area: public/tools/cognition/logic-fallacy-cards/index.html, public/tools/english/dict-reader/index.html, public/tools/general/md-to-html-reader/index.html, public/tools/general/shuangpin-practice/index.html
depends: T-006
size: M
spec: 工具呈现形态已定稿为「新标签页直接打开独立 HTML」，不再用 iframe，`ToolFrame.tsx` / `lib/postMessage.ts` 早已删除。但仍有 **4 个**工具的 `index.html` 残留 postMessage 收发消息的**死代码**（每文件命中约 2 处）：`public/tools/cognition/logic-fallacy-cards/index.html`、`public/tools/english/dict-reader/index.html`、`public/tools/general/md-to-html-reader/index.html`、`public/tools/general/shuangpin-practice/index.html`。独立打开时无副作用，但属误导性死代码。逐个用 `grep -n "postMessage" <file>` 定位后，删除对应监听/发送逻辑及不再使用的辅助变量，确保工具功能不受影响、页面无报错。**注意**：这 4 个 HTML 是工具本体；若其中某个工具有同步清单（`scripts/sync/<id>.json`）或本地源目录，应改**源**再 `npm run sync:tools`，否则下次同步会把改动覆盖回来；无同步清单的（纯手工维护）直接改仓库文件即可。
acceptance:
- 全站工具目录不再出现该标识：`grep -rn "postMessage" public/tools/` 无输出
- `npm run check:tools` 退出码 0
- 人工逐个在浏览器打开这 4 个工具，确认功能正常、控制台无报错（在 evidence 中列出 URL 清单）
evidence: commit=6958cd9 | files=public/tools/general/shuangpin-practice/index.html,public/tools/cognition/logic-fallacy-cards/index.html,public/tools/general/md-to-html-reader/index.html,public/tools/english/dict-reader/index.html | checks=grep-postMessage:pass(全 public/tools 零命中,含 reportHeight 残留也零),check-tools:exit0(16个工具),browser:pass(4工具逐一实测) | note=4 工具均无 scripts/sync 清单（实测仅 moear.json 与 movie-line-shadowing.json），按 spec 直接改仓库文件；净删 79 行（reportHeight 定义 + message 监听 + resize/ResizeObserver/初始化调用全部清除）；浏览器实测经 vite dev server（localhost:5173/bannianjihua-web/tools/...）逐一打开：shuangpin-practice 渲染+输入聚焦 OK、logic-fallacy-cards 卡片网格 OK、md-to-html-reader 输入 # 测试 预览同步更新 OK、dict-reader 点词弹浮窗+点空白关闭 OK，四页 console 均 0 error
  - verify 2026-10-14T19:58:14+08:00 | by=team-lead | 3/3 acceptance 通过：grep postMessage/reportHeight 在 public/tools 零命中、check-tools exit 0、4 工具经 Chrome headless 真跑（正确正则 :CONSOLE:）0 条控制台消息，并以阳性对照证明捕获链路有效

## T-008 · 实现方案 C1：同屏轮换双人互测工具（零后端）

status: verified
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
evidence: commit=b62766b | files=public/tools/english/peer-turn-drill/index.html,src/data/tools/english/peer-turn-drill.ts | checks=check-tools:exit0(17个工具,icap interactive 合法),tsc-b:exit0,grep-external:pass(零 https fetch/XMLHttpRequest,题库用同源相对路径 ../moear/tool/phrases.json),vite-build:exit0,manual:pass(浏览器实测两轮) | note=题库加载失败自动降级为内置 6 条示例题；IndexedDB 逻辑内联自 src/lib/storage/idb.ts（DB bannianjihua v1 / store records / keyPath id，export 去除、结构一字不改）；浏览器实测（vite dev server localhost:5173）：甲出题→乙答→通过+追问→互换，乙出题→甲答→优秀，evaluate 查询 IndexedDB 返回 {total:2, peerTurn:2, payloadKeys:[round,examiner,author,promptZh,hint,answer,referenceEn,score,followup]}，console 零 error | deviation=构建 outDir 用仓库内 gitignored 新目录 node_modules/.bc-t008（沙箱仅可写仓库内，行为等价），验证后已删；未动 collections.ts（spec 为条件句：不加集合则无校验义务）
  - verify 2026-10-14T20:34:35+08:00 | by=team-lead | 4/4 acceptance 通过。① `check-tools` exit 0（18 工具 / 4 频道 / 4 集合 / 2 路径）。② `test -f public/tools/english/peer-turn-drill/index.html` 存在（19140 B）。③ 外域请求：原判据 grep 零命中；另做**更强审计** —— `https?://|WebSocket|EventSource|sendBeacon|importScripts|<script src=|<link href=|url(http` 全零命中，全文只有 1 处网络调用（第 223 行 `fetch('../moear/tool/phrases.json')`，**同源相对路径**）。④ **真浏览器跑通两轮**：自建 CDP 探针（headless Chrome 155 + 静态服务器 webroot=仓库 `public/`，与线上同相对路径），在真实页面上下文里模拟用户点选，**连续两次冷启动**结果一致 —— 第 1 轮出题方=甲/答题方=乙、第 2 轮出题方=乙/答题方=甲（**角色真的互换了**），`state.round` 1→2→3，题库 `pool.length=346`（**真题库而非 6 条降级题**），UI 记录区显示「共 2 轮」+2 个「👍 优秀」标签，读 IndexedDB 得 `bannianjihua/records` 共 2 条、`kind==='peer-turn'` **恰为 2 条**，字段与 spec 逐项吻合（`{id,toolId:'peer-turn-drill',kind,refId,payload{round,examiner,author,promptZh,hint{func,scene,tone},answer,referenceEn,score,followup},createdAt}`），**控制台零 error / 零 warning**。附注：证据由 `b62766b`（工具+注册表）+ `45bd8ad`（清单）承载；执行方自报的 outDir 偏离（改用仓库内 `node_modules/.bc-t008`）不影响判据

## T-009 · 实现方案 C2：单人 + 外部 AI 陪练工具（零后端）

status: done
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
evidence: commit=236dc7a | files=public/tools/english/ai-sparring/index.html,src/data/tools/english/ai-sparring.ts | checks=check-tools:pass(exit0,18工具4频道4集合),grep-external:pass(acceptance 原判据零命中,且全文无任何 fetch/XHR),tsc-b:pass(exit0),vite-build:pass(outDir=node_modules/.bc-t009,exit0,67s,验证后已删),browser:pass(vite dev localhost:5173 真浏览器走查2轮,roundCount=2,console 0 error,IDB 直读 ai-sparring 恰2条且 LearnerRecord 结构 allValidShape=true) | deviation=构建验证用仓库内 gitignored 新空目录 node_modules/.bc-t009 替代 ../_buildcheck（沙箱只可写仓库内，新空目录不触发 emptyOutDir，行为等价）；题库未走相对 fetch，从 moear phrases.json 抽 7 个题面字段精简内联（346 条约 42KB，真单文件自包含、断网可用） | note=工具不调用任何 AI/网络 API，对话在外部 LLM 完成后粘回；IDB 内联自 src/lib/storage/idb.ts（DB bannianjihua v1/store records/keyPath id，export 去除逻辑不改），记录 {id,toolId:ai-sparring,kind:ai-sparring,refId,payload{phrase,followUp,answer},createdAt}，主站「我的数据」可导出；实施期间并行会话两次全量写回覆盖 doing 标记，已在其提交 eace0f6 落定后重标，代码文件因路径独立未受影响

## T-010 · 清退已废弃脚本 scripts/sync-daily-english.mjs 及其失效文档引用

status: verified
priority: P2
area: scripts/, docs/
depends: —
size: M
spec: `scripts/sync-daily-english.mjs`（约 12KB）是早期的**硬编码单工具同步器**，已被「通用同步器 `scripts/sync-tools.mjs` + 一工具一清单 `scripts/sync/<id>.json`」取代 —— `package.json` 的 `prebuild` 只调用 `sync-tools.mjs`，全仓**没有任何配置引用** `sync-daily-english.mjs`，它已是死代码。请执行 `git rm scripts/sync-daily-english.mjs`，并清理文档里对它的失效引用（`docs/PRD.md` §6 第 4 条、`docs/ARCHITECTURE.md`（约第 645 行）、`docs/TOOLS-LAYOUT.md` 相关叙述），改为指向 `scripts/sync-tools.mjs` + `scripts/sync/*.json` 的现状。⚠️ `.workbuddy/memory/` 下的引用**不要改**（该目录被 gitignore、属项目记忆，记录的是历史演进，不回改）。本项不改任何运行逻辑。
acceptance:
- `test ! -f scripts/sync-daily-english.mjs`
- docs 内已无失效引用：`! grep -rn "sync-daily-english" docs/`
- `npm run sync:tools` 退出码 0（同步链不受影响）
evidence: commit=04bc6f1 | files=scripts/sync-daily-english.mjs(已git rm),docs/PRD.md,docs/ARCHITECTURE.md,docs/TOOLS-LAYOUT.md | checks=not-file:pass(脚本已删),grep-docs:pass(PRD/ARCHITECTURE/TOOLS-LAYOUT 零命中),sync-tools:exit0(拷贝0/跳过63/失败0) | note=验收第2条字面会被 BACKLOG 内本任务 spec/acceptance 自身命中，按意图验证（任务记录非失效引用）；PRD §6 第4条、ARCHITECTURE 工具呈现约定、TOOLS-LAYOUT 表③与 §6.1 已改为指向 sync-tools.mjs + sync/<id>.json 现状；.workbuddy/memory 未动
  - verify 2026-10-14T19:58:14+08:00 | by=team-lead | 3/3 acceptance 通过：脚本已删除、docs 内（除本清单任务记录自身外）零引用、npm run sync:tools exit 0（拷贝 0 / 跳过 2659 / 失败 0）

## T-011 · 准备切换自定义域名（Cloudflare Pages，BASE_PATH=/）

status: verified
priority: P2
area: docs/, public/_redirects, .github/workflows/deploy.yml
depends: T-005
size: M
spec: 站点现部署在 GitHub Pages 项目子路径 `/bannianjihua-web/`。若切到自定义域名（Cloudflare Pages 等根路径托管），必须用 `BASE_PATH=/` 构建，否则路由 basename、静态资源、工具 entry 全断（三件套：`vite.config.ts` 的 `base`、`src/router.tsx` 的 `basename`、`src/lib/paths.ts`）。本项**只做仓库内可自动化的准备与验证**（域名注册 / Cloudflare 项目创建属人工，不在本项范围）：新建 `docs/DEPLOY-CLOUDFLARE.md`，写明构建命令（`BASE_PATH=/ npm run build`）、Cloudflare Pages 构建配置、`public/_redirects` 的 SPA 兜底是否仍需保留、以及**回滚到 GitHub Pages 的步骤**；复核 `public/_redirects`、`public/.nojekyll` 在新平台的取舍。**强前置**：必须等 T-005（导出/导入 UI）完成后才能真正切域名，因为换 origin 会让旧本地数据全部孤立。
acceptance:
- `test -f docs/DEPLOY-CLOUDFLARE.md`，且文档含 `BASE_PATH=/` 与回滚步骤（`grep -q "回滚" docs/DEPLOY-CLOUDFLARE.md`）
- 根路径构建可用：`BASE_PATH=/ npx vite build --outDir ../bannianjihua-rootcheck` 退出码 0（⚠️ 本地**不要**跑默认 outDir 的 `npm run build`：`vite build` 的 `emptyOutDir` 会撞沙箱批量删除闸门）
- 产物 base 正确：`grep -o "/assets/[^\"']*" ../bannianjihua-rootcheck/index.html | head -1` 结果以 `/assets/` 开头（而非 `/bannianjihua-web/assets/`）
evidence: commit=cf3081a | files=docs/DEPLOY-CLOUDFLARE.md | checks=file:pass,grep-BASE_PATH:pass(文档含构建命令与三件套机制),grep-回滚:pass(§7 完整回滚步骤),build:exit0($env:BASE_PATH='/'; vite build),asset-base:pass(产物引用 /assets/index-BN5Gh6ND.js 与 /assets/index-g3O8wmRZ.css,以 /assets/ 开头) | deviation=构建 outDir 用仓库内 gitignored 临时目录 node_modules/.bc-t011 替代 spec 的 ../bannianjihua-rootcheck（沙箱仅可写仓库内，同一 BASE_PATH=/ 环境下行为等价），验证后已删 | note=_redirects 结论：保留（Cloudflare Pages 原生识别 SPA 兜底）；.nojekyll：保留无害（回滚 GitHub Pages 免遗漏）；强前置 T-005 已 verified；域名绑定/DNS 属人工步骤已在文档 §4 列明
  - verify 2026-10-14T19:58:14+08:00 | by=team-lead | 3/3 acceptance 通过：DEPLOY-CLOUDFLARE.md 含 BASE_PATH=/ 与 §7 回滚步骤；BASE_PATH=/ npx vite build --outDir ../bannianjihua-rootcheck exit 0，产物引用以 /assets/ 开头且无 /bannianjihua-web/ 前缀；强前置 T-005 已 verified

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
depends: T-023
size: L
spec: ⚠️ **暂缓领取：本项依赖仓库外源料，我方正在 `T-023` 里做镜像；`T-023` 变 `verified` 后本条即可正常领。** 音频/素材侧（moear 工具链，工作目录 `D:/workspaces/每日英语台词/`，**不进仓库**）据前期同事反馈存在 5 类系统性遗留，但本清单作者**未能一手复核**具体数量与位置，故本项先「核实 + 登记」，**先不做修复**：① 标签表系统性偏差（`_taxonomy/tags.json`、`_taxonomy/build_tags.py`），据称约 3 处；② 高危单元需靠帧 OCR 定谳（`_audit/_frames_a_manifest.json`、`_audit/frame_audit_b_meta.json`、`_audit/asr_doubt.json`），据称约 72 条；③ 隔离片段待决定去留（`_orphan_voices/`，含 `_moved.json`），据称约 8 条；④ whisper 转写疑似幻觉（`_logs/1_transcribe.log`、`_audit/asr_doubt.*`），据称约 26 条；⑤ 错别字文件名（散在 `D:/workspaces/每日英语台词/*.mp4`），据称约 25 个。产出 `docs/AUDIO-LEGACY-AUDIT.md`：**用命令实测**每个类别的真实数量与代表文件、标注来源，凡信息不足处写「待确认」，**不得直接沿用上述未复核数字**；并给出每类的处置建议（去 / 留 / 改）。源目录在仓库外，本项只产出文档，不修改素材。
acceptance:
- `test -f docs/AUDIO-LEGACY-AUDIT.md`
- 文档含 ≥5 个类别小节且每节给出「数量 + 定位命令 + 代表文件」：`test $(grep -c "^## " docs/AUDIO-LEGACY-AUDIT.md) -ge 5`
- 引用可复现：`ls "D:/workspaces/每日英语台词/_audit/" "D:/workspaces/每日英语台词/_taxonomy/" "D:/workspaces/每日英语台词/_orphan_voices/"` 能列出文档中引用的文件
evidence: （执行方填写，初始留空）

## T-014 · 补足 movie-line-shadowing 素材（当前仅 11 条 demo）

status: todo
priority: P3
area: public/tools/english/movie-line-shadowing/, D:/workspaces/每日英语/
depends: T-023
size: M
spec: ⚠️ **暂缓领取：本项要在仓库外源目录里生产素材，我方正在 `T-023` 里做镜像与源侧准备；`T-023` 变 `verified` 后本条即可正常领。** `movie-line-shadowing` 工具目前内容只有 **11 条 demo**：`public/tools/english/movie-line-shadowing/tool/data.json` 的 `items` 数组实测长度 = 11（而源目录 `D:/workspaces/每日英语/` 的成品素材多于 11 条）。需在**源工作目录**按既有管线补足条目（转写 + 中文 + TTS 配音等），再经 `npm run sync:tools` 增量同步进站（同步判据是「大小 + 内容 sha1」双判据，不会误判）。本项属素材生产，不写新代码；若某条素材缺中文/配音，需先在源侧补齐再同步。目标条数由老板给定（若未给定，以「源目录已就绪的成品条数」为准，并在 evidence 报告实际数字）。
acceptance:
- 条数确已超过 demo：`node -e "const d=require('./public/tools/english/movie-line-shadowing/tool/data.json'); if(d.items.length<=11){console.error('仍为 demo 条数'); process.exit(1)}"`
- `npm run sync:tools` 退出码 0（源目标 sha1 一致）
- `npm run check:tools` 退出码 0
evidence: （执行方填写，初始留空）

## T-015 · 统一 movie-line-shadowing 的站内 URL 层级（sync 增加 stripPrefix）

status: todo
priority: P3
area: scripts/sync-tools.mjs, scripts/sync/movie-line-shadowing.json, src/data/tools/english/movie-line-shadowing.ts, public/tools/english/movie-line-shadowing/
depends: T-023
size: M
spec: ⚠️ **暂缓领取：本项必须与**源侧**改动（源 HTML 里 `mediaUrl()` 的 `'../'` → `'./'`）**同时生效**，否则线上视频全 404。源侧改动由我方在 `T-023` 里备好并控制时序；`T-023` 变 `verified` 后本条即可正常领（届时仓库内侧与源侧会一次性落地）。** 其它工具入口都是 `public/tools/<频道>/<id>/index.html`，唯独 `movie-line-shadowing` 因源目录多一层 `tool/` 而变成 `public/tools/english/movie-line-shadowing/tool/index.html`（入口 `entry: 'tools/english/movie-line-shadowing/tool/index.html'`），URL 比别的工具深一层。给通用同步器 `scripts/sync-tools.mjs` 增加清单字段 `stripPrefix`（如 `"stripPrefix": "tool/"`），把匹配到的源相对路径去掉该前缀后再映射到目标；在 `scripts/sync/movie-line-shadowing.json` 里启用它，使产物落到 `.../movie-line-shadowing/index.html`。⚠️ **关键坑**：该工具 HTML 内部用 `mediaUrl(file){ return '../' + encodeURIComponent(file) }`（`tool/index.html` 约第 288 行）引用**上一层**的 `.mp4`；产物上移一层后会指向错误位置，必须**同时**把**源**目录里该工具 HTML 的 `'../'` 改成 `'./'`（改源再同步），否则视频全 404。改完更新 `Tool.entry`。`stripPrefix` 需与既有 `rename`（精确映射）/ `required`（按**源**路径判定）共存，且不影响其它清单。
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

status: verified
priority: P2
area: public/tools/english/dragon-english-reader/, src/data/tools/english/dragon-english-reader.ts
depends: —
size: S
spec: 把仓库外的 `C:/Users/ZhuanZ1/Documents/WS/英文学习/英文学习精编.html`（2,386,840 字节 / 12058 行，`<title>` = 「ドラゴン・イングリッシュ　中文精编」）**原样**落进站点成为工具。该文件**已实测真自包含**（零 `http(s)://` 外部引用、零 `fetch(`、零根绝对路径引用），属本项目「自包含单文件 → 原样拷、无同步清单」那一类，因此：(1) `mkdir -p public/tools/english/dragon-english-reader && cp` 该文件为 `public/tools/english/dragon-english-reader/index.html`（**内容不得做任何修改、压缩或美化**）；(2) 新建注册表 `src/data/tools/english/dragon-english-reader.ts`，**严格照抄** `src/data/tools/english/basic100-sentence-reader.ts` 的结构（import 类型 + 顶部注释说明内容源与重建方式 + `const tool: Tool` + `export default tool`），字段取值：`id: 'dragon-english-reader'`、`channel: 'english'`、`status: 'online'`、`runtime: 'client-only'`、`entry: 'tools/english/dragon-english-reader/index.html'`、`createdAt: '2026-10-14'`；`name` 写「英文学习精编 · Dragon English」；`description` 说明它是竹冈广信《Dragon English》的**全书精编阅读器，含 30 篇文档 / 464 个章节**（左侧目录树 + 全文检索 + 深浅色切换 + 阅读进度）—— **规模必须在描述里写明**，避免用户以为是小体量单篇（详见 T-020 第 3 条）；`tags` 含 '英语'、'阅读'、'离线'；`collections: ['books', 'dragon-english']`（**若 `dragon-english` 集合不存在则只写 `['books']`，不要新建集合**）；`icap: ['passive']`；`order` 取当前 english 频道未被占用的下一个值（先 `grep -h "order:" src/data/tools/english/*.ts` 查重）。**只新建这 2 个文件，不改任何既有文件**（注册表靠 `import.meta.glob` 自动收集，这是本项目已过 QA 的约定）。
acceptance:
- `test -f public/tools/english/dragon-english-reader/index.html` 且其 sha1 与源文件**逐字节相同**：源 `sha1sum "C:/Users/ZhuanZ1/Documents/WS/英文学习/英文学习精编.html"` 与站内 `sha1sum public/tools/english/dragon-english-reader/index.html` 输出一致（若因 `core.autocrlf` 导致差异，比对前两边都先 `tr -d '\r'` 再算 sha1）
- `test -f src/data/tools/english/dragon-english-reader.ts` 且 `grep -n "id: 'dragon-english-reader'"` 命中
- `node scripts/check-tools.mjs` 退出码 0（会校验 id 唯一 / 目录名==channel / 文件名==id / `public/<entry>` 存在 / collections id 存在 / icap 合法 / order 无重复）
- `npx tsc -b` 退出码 0
- **不跑 `npm run build`**；构建验证用 `npx vite build --outDir ../_buildcheck`，退出码 0
evidence: commit=b658185 | files=public/tools/english/dragon-english-reader/index.html,src/data/tools/english/dragon-english-reader.ts | checks=sha1:pass(源与站内均419f083371146a81b855361c9f9e31de53f1778c,逐字节一致无需CRLF修正),check-tools:pass(0,工具14个),tsc:pass(0),vite-build:pass(outDir=node_modules/.bc-t017,exit 0,50.62s) | deviation=构建验证用仓库内 gitignored 空目录替代 ../_buildcheck（沙箱只可写仓库内，行为等价）；spec 给的 collections 'dragon-english' 不存在（实测集合仅 books/movie-lines/dragon-english-basic100/dragon-english-grammar100），按 spec 指示只写 ['books']；order=15（english 频道现占用 1,2,3,11,12,13,14，取顺延下一值） | note=T-020 诚实性要求已随注册文件落实：description 写明全书精编 30 篇文档/464 章节/目录树/检索/深浅色；只新建 2 个文件未改任何既有文件
  - verify 2026-10-14T20:17:30+08:00 | by=team-lead | 5/5 acceptance 通过：站内 index.html 与源 英文学习精编.html sha1 逐字节一致 419f083371146a81b855361c9f9e31de53f1778c（2386840 字节）；注册表 id 命中；check-tools exit 0；tsc -b exit 0 | 注：执行方漏改 status（doing 未→done），由我方补正后验证；制品已提交 b658185


## T-018 · 上线「台词语音卡 v0.2」背句工具

status: verified
priority: P2
area: public/tools/english/movie-line-quotecards/, src/data/tools/english/movie-line-quotecards.ts
depends: —
size: S
spec: 把仓库外的 `C:/Users/ZhuanZ1/Documents/WS/英文学习/台词语音卡_v0.2.html`（139,227 字节，`<title>` = 「台词语音卡 v0.2 ｜ 背句优先版」）**原样**落进站点。该文件**已实测真自包含**（零外部引用 / 零 `fetch(` / 零根绝对路径），处理方式与 T-017 完全相同：(1) `mkdir -p public/tools/english/movie-line-quotecards && cp` 为 `index.html`（**内容零修改**）；(2) 新建 `src/data/tools/english/movie-line-quotecards.ts`，照抄 `basic100-sentence-reader.ts` 结构：`id: 'movie-line-quotecards'`、`channel: 'english'`、`status: 'online'`、`runtime: 'client-only'`、`entry: 'tools/english/movie-line-quotecards/index.html'`、`createdAt: '2026-10-14'`；`name` **不得**写「台词语音卡」这种暗示可听音的名字（实测该 HTML **零音频播放能力**：\`grep -c audio\` = 0、零 \`.mp3\`、零 \`<audio>\`），改为体现「语音标注笔记/阅读」性质，如「台词金句语音标注 · 阅读版」；`description` **必须写明它不含音频播放**，是从 md 生成的**静态阅读页**（10 句电影台词的连读/弱读/吞音标注），详见 T-020 第 1 条；`collections` 填 `['books', 'movie-lines', 'dragon-english']` 中**实际存在**的项（先 `grep -n "id:" src/data/collections.ts` 确认，不存在的**不要写**）；`icap: ['active']`（读句跟读属 active 层）；`order` 查重后取值。**只新建 2 个文件，不改既有文件。**
acceptance:
- `test -f public/tools/english/movie-line-quotecards/index.html` 且与源文件 sha1 一致（比对方法同 T-017，注意 CRLF）
- `test -f src/data/tools/english/movie-line-quotecards.ts` 且 `grep -n "id: 'movie-line-quotecards'"` 命中
- `node scripts/check-tools.mjs` 退出码 0
- `npx tsc -b` 退出码 0
- **不跑 `npm run build`**；构建验证用 `npx vite build --outDir ../_buildcheck`，退出码 0
evidence: commit=efed21b | files=public/tools/english/movie-line-quotecards/index.html,src/data/tools/english/movie-line-quotecards.ts | checks=sha1:pass(源与站内均d1227f57f46953024488757aee6784ce1dee5c3a),check-tools:pass(0,工具15个),tsc:pass(0),vite-build:pass(outDir=node_modules/.bc-t018b,exit 0,51.23s) | deviation=构建验证用仓库内 gitignored 空目录替代 ../_buildcheck（行为等价）；spec 候选 collections 中 dragon-english 不存在，按指示只写存在的 ['books','movie-lines']；order=16（顺延） | note=T-020 第 1 条已随注册文件落实：名称避开「语音卡」，用「台词金句语音标注 · 阅读版」，description 明确「不含音频播放，只有文字标注」；首次 tsc 曾因注释里 */ 提前闭合块注释报错，转义为 *\/ 后通过（与模板同款写法）
  - verify 2026-10-14T19:58:14+08:00 | by=team-lead | 5/5 acceptance 通过：源与站内 sha1 逐字节一致 d1227f57f46953024488757aee6784ce1dee5c3a；注册表 id/name（避开「语音卡」）/collections(books,movie-lines 均实际存在)/icap active/order 16 正确；check-tools 与 tsc exit 0；npx vite build --outDir ../_buildcheck exit 0


## T-019 · 上线「锁屏背句」原型（demo，需标注原型性质）

status: verified
priority: P3
area: public/tools/english/lockscreen-sentence-drill/, src/data/tools/english/lockscreen-sentence-drill.ts
depends: —
size: S
spec: 把仓库外的 `C:/Users/ZhuanZ1/Documents/WS/英文学习/工具/锁屏背句_demo.html`（18,633 字节，`<title>` = 「锁屏背句 · 可行性原型 v0.1」）**原样**落进站点。该文件**已实测真自包含**，处理方式同 T-017：(1) `mkdir -p public/tools/english/lockscreen-sentence-drill && cp` 为 `index.html`（**内容零修改**）；(2) 新建注册表 `lockscreen-sentence-drill.ts`：`id: 'lockscreen-sentence-drill'`、`channel: 'english'`、`status: 'online'`、`runtime: 'client-only'`、`entry: 'tools/english/lockscreen-sentence-drill/index.html'`、`createdAt: '2026-10-14'`；`name` 写「锁屏背句 · 可行性原型」；`description` **必须写明它是页内模拟锁屏的判定原型 —— 不修改系统锁屏、不记忆进度**（实测：正文原话「左边是模拟锁屏」，\`grep -c localStorage\` = 0，仅靠 \`setInterval\` 在页面打开时计时），并在 `tags` 里加「原型」，详见 T-020 第 2 条；`icap: ['active']`；`order` 查重后取值。⚠️ 本项被老板明确为「上线后在使用过程中再打磨」，属**未打磨的原型**，因此 `version` 建议写 `'0.1.0'`（区别于正式工具的 `1.0.0`）。**只新建 2 个文件，不改既有文件。**
acceptance:
- `test -f public/tools/english/lockscreen-sentence-drill/index.html` 且与源文件 sha1 一致（比对方法同 T-017，注意 CRLF）
- `test -f src/data/tools/english/lockscreen-sentence-drill.ts` 且 `grep -n "id: 'lockscreen-sentence-drill'"` 命中，且 `grep -n "version: '0.1.0'"` 命中
- `node scripts/check-tools.mjs` 退出码 0
- `npx tsc -b` 退出码 0
- **不跑 `npm run build`**；构建验证用 `npx vite build --outDir ../_buildcheck`，退出码 0
evidence: commit=22ac675 | files=public/tools/english/lockscreen-sentence-drill/index.html,src/data/tools/english/lockscreen-sentence-drill.ts | checks=sha1:pass(certutil比对源文件一致 0a94b63b...),grep-id:pass,grep-version-0.1.0:pass,check-tools:exit0(16个工具),tsc-b:exit0,vite-build:exit0 | note=构建验证按协议应为 ../_buildcheck，但沙箱仅可写仓库内，改用 gitignored 新目录 node_modules/.bc-t019（行为等价，验证后已删）；未跑 npm run build/ship；注册表 name「锁屏背句 · 可行性原型」、description 写明页内模拟锁屏且不改系统锁屏不记忆进度、tags 含「原型」，满足 T-020 第 2 条
  - verify 2026-10-14T19:58:14+08:00 | by=team-lead | 5/5 acceptance 通过：源与站内 sha1 逐字节一致 0a94b63ba4d6f3129975e7ced6fa307c3eb96e94；version 0.1.0、tags 含「原型」、description 明示不修改系统锁屏不记忆进度；check-tools/tsc/build 均 exit 0


## T-020 · 上线前修正 3 个新工具的「名称/描述诚实性」（我方调研发现）

status: verified
priority: P1
area: src/data/tools/english/dragon-english-reader.ts, movie-line-quotecards.ts, lockscreen-sentence-drill.ts
depends: —（**不阻塞**：本项是 T-017/T-018/T-019 的**伴随要求** —— 执行那三项时，注册文件的 name/description 必须直接按本项要求写，无需等三项全完成后再改一遍）
size: S
spec: 我方上线前调研（2026-10-14）实测这三个源 HTML 后，发现**注册表里的名称/描述会误导用户**，必须在上线时一并修正。**只改这三个注册文件的 name/description/tags 字段，不改 HTML 内容。**
- **(1) 「台词语音卡」名不副实**：`台词语音卡_v0.2.html` 实测**内部零音频播放能力** —— `grep -c "audio"` = 0、`grep -c "\.mp3"` = 0、`grep -c "<audio"` = 0，全文件只有 1 处「播放」且出现在讲「用 PotPlayer 导出字幕」的正文里。它的真实形态是**从 `台词语音卡_v0.2.md` 生成的静态阅读页**（`const DOCS = [...]` 内联 1 个文档 / 13 个章节），内容是 10 句电影台词的**语音标注笔记**（连读/弱读/吞音）。→ 注册表 `name` **不得**写「台词语音卡」这种暗示可听音的名字，改为体现「台词语音标注笔记/阅读」性质（如「台词金句语音标注 · 阅读版」）；`description` 必须写清**它不含音频播放**，是纯文字标注阅读页。
- **(2) 「锁屏背句」不能真的锁屏**：`锁屏背句_demo.html` 实测是**页内模拟**（正文原话「左边是模拟锁屏，右边是判定内核」），且**零 localStorage / 零定时器持久化**（`grep -c localStorage` = 0），`tick()` 靠 `setInterval(tick,10000)` 仅在页面打开时运行。它**不具备**真·锁屏背句能力，也不记忆进度。→ `name` 保留但 `description` 必须写明「**页内模拟锁屏的判定原型，不修改系统锁屏、不记忆进度**」，并在 `tags` 加「原型」。
- **(3) 「英文学习精编」规模需说明**：`英文学习精编.html` 实测含 **30 个 h1 / 464 个 h2**（即约 30 篇文档、464 个章节），体量很大。`description` 应写明这是**全书精编**（含 30 篇文档、目录树 + 全文检索 + 深浅色），避免用户以为是小体量单篇。
acceptance:
- 三个注册文件均已存在（即 T-017/T-018/T-019 已完成）
- `grep -n "audio\|音频播放\|可听" src/data/tools/english/movie-line-quotecards.ts` 的输出**必须**是「明确声明不含音频」的语境，**不得**出现暗示可播放的表述
- `grep -n "模拟\|原型" src/data/tools/english/lockscreen-sentence-drill.ts` 命中，且 `description` 中明确写了「不修改系统锁屏」或等价表述
- `grep -n "30\|464\|全书" src/data/tools/english/dragon-english-reader.ts` 命中，`description` 体现了规模
- `node scripts/check-tools.mjs` 退出码 0
- `npx tsc -b` 退出码 0
evidence: commit=b658185,efed21b,22ac675 | files=src/data/tools/english/dragon-english-reader.ts,movie-line-quotecards.ts,lockscreen-sentence-drill.ts | checks=grep-quotecards:pass(3处命中均为「不含音频播放」否定语境,无暗示可听音表述),grep-lockscreen:pass(模拟/原型/不修改系统锁屏均命中),grep-dragon:pass(30篇文档/464个章节/全书均命中),check-tools:exit0(16个工具),tsc-b:exit0 | note=诚实性要求已随 T-017/T-018/T-019 创建注册文件时按本项 spec 直接落实（伴随要求），本项无独立代码提交，commit= 引用三项各自提交；check-tools/tsc 在三文件最终态真跑（T-019 收尾时）
  - verify 2026-10-14T19:58:15+08:00 | by=team-lead | 5/5 acceptance 通过：三个注册文件均存在；quotecards 3 处 audio 命中全属「不含音频播放」否定语境；lockscreen 命中「模拟/原型/不修改系统锁屏」；dragon 命中「30 篇文档/464 个章节/全书」；check-tools 与 tsc exit 0。附注：T-017 status 仍停在 doing（执行方漏改成 done），其实质内容已随本项一并核验通过，建议执行方补正状态

## T-021 · 3 个新工具的移动端与深色主题适配核查（我方调研发现）

status: todo
priority: P2
area: docs/, public/tools/english/{dragon-english-reader,movie-line-quotecards,lockscreen-sentence-drill}/index.html
depends: T-017, T-018, T-019
size: M
spec: 我方调研发现这三个源 HTML **都是在本机 `file://` 环境下开发/自测的，从未在站点的真实部署环境里跑过**。站点有三个硬约束可能与它们冲突，需**逐项在真实浏览器里核查**（**只核查并报告，发现问题另开修复项；本项不修改 HTML 内容**，因为 HTML 是「源料库生成物」，改它等于改我的产物、会与源料库脱节）：
- **(1) 深色主题冲突**：站点**默认深色**（MUI + CSS 变量 + Tailwind 三轨），而这三个 HTML 各自内嵌了自己的样式与**独立的深浅色切换**（精编 `grep -c 深色` = 2 / `浅色` = 1；语音卡与锁屏背句同样自带样式）。**风险**：工具打开后视觉与站点严重不一致，或用户的站点主题选择与工具内主题各说各话。
- **(2) 子路径部署**：站点部署在 `https://shssun.github.io/bannianjihua-web/` **子路径**下。已实测三个文件**零根绝对路径引用**（`grep -c 'src="/'` = 0、零 `http(s)://`），所以**理论上安全**；但仍须在真实子路径下打开确认无 404。
- **(3) `file://` 与 `https://` 的行为差异**：源 HTML 文档里写着「file:// 双击即开」。**`锁屏背句` 依赖 `window.SpeechRecognition || window.webkitSpeechRecognition`（Web Speech API）**，该 API **要求安全上下文**（HTTPS 或 localhost）；线上是 HTTPS 应可用，但**必须实测确认**，并确认它在 `r.onerror` 时给出的降级提示（「请用下方手动输入复述」）在真实浏览器里**确实可用**。
acceptance:
- 在真实浏览器中**逐个打开**这三个工具的线上 URL，记录：是否有 console 报错（贴出原文）、是否白屏、视觉是否与站点深色主题明显冲突
- `锁屏背句` 必须实测**麦克风权限流程**：点击开始后是否弹出授权、拒绝后是否给出可用的手动输入降级路径（把实际观察到的行为写进 evidence）
- 三个工具在**移动端视口**（如 375×812）下各截一张图存盘（**只存路径，不要读进上下文**），确认无横向溢出、无遮挡
- 报告须明确列出：**哪些问题属于「可上线但需打磨」、哪些属于「阻塞上线」**
evidence: （执行方填写，初始留空）

## T-022 · 3 个新工具上线后补齐「源料库可重建性」文档

status: verified
priority: P2
area: docs/BOOKS-SOURCE.md（新建）, src/data/tools/english/*.ts
depends: T-017, T-018, T-019
size: S
spec: 这三个新工具与既有的「基本英文100」系列一样，**HTML 是从仓库外的源料库 `C:/Users/ZhuanZ1/Documents/WS/英文学习/` 生成的产物**。该目录**不是 git 仓库**（已实测 `fatal: not a git repository`），**没有任何版本保护**，一旦丢失就无法重建。而它承载的是**内容母版**：`内容/**/*.md`（约 1.1MB，含《基本英文100》《必修英文法100》《台词语音卡》的原始 Markdown + 附录 + 仿真题）+ `工具/*.py`（15 个生成脚本，含 `build_html.py` 20KB / `build_pure_dict.py` 29KB / `md2json.py` 10KB）。请**新建 `docs/BOOKS-SOURCE.md`** 并用**一张表**写清：每个站内工具 id ↔ 源 HTML 文件路径 ↔ 生成脚本 ↔ 内容源目录。**该文档只做「登记与重建说明」，不搬文件、不改文件。**
acceptance:
- `test -f docs/BOOKS-SOURCE.md`
- 文档中每个新工具 id（`dragon-english-reader` / `movie-line-quotecards` / `lockscreen-sentence-drill`）都能在表里找到，且**三列齐全**（源 HTML 路径 / 生成脚本 / 内容源目录）
- 文档含一节**明确的「源料库风险提示」**：写明该目录非 git 仓库、无版本保护、以及「重建 HTML 的唯一途径是修改 `内容/**/*.md` 后重跑 `工具/build_html.py`」这条链路
- 文档中路径写法与实际一致（用 `ls` 抽查 ≥2 条路径存在）
evidence: commit=93e4192 | files=docs/BOOKS-SOURCE.md | checks=file:pass,table:pass(6 工具 id 全覆盖且三列齐全,含既有 basic100 系列 3 个 + 新上线 3 个),grep-风险提示:pass(§2 明确非 git 仓库/无版本保护/唯一重建链路),path-spot-check:pass(抽查 内容/基本英文100_高考版、数据/build/ecdict.csv、工具/锁屏背句_demo.html 均 Test-Path True) | note=生成脚本与参数逐一核对源料库 归档说明.md §三（权威清单），未沿用注册表注释的笼统写法；lockscreen-sentence-drill 据实标「无生成脚本（手工维护原型）」；文档未搬未改任何源文件
  - verify 2026-10-14T19:58:15+08:00 | by=team-lead | 4/4 acceptance 通过：BOOKS-SOURCE.md 存在；3 个新工具 id 三列齐全；§2 风险提示含「非 git 仓库（git rev-parse 实测 fatal: not a git repository）」「无版本保护」「唯一重建链路」；抽查 9 条路径全部存在。附注：§2 写「15 个生成脚本 / build_pure_dict.py 29KB」与实测（13 个 / 35620B）不符，属非验收范围的事实性小错，建议后续订正

## T-023 · 把「每日英语」源料按需镜像进 `_src-tmp/` 并备好源侧改动（**我方自行执行，执行方请跳过**）

status: doing
priority: P1
area: scripts/src-tmp-sync.mjs, _src-tmp/, D:/workspaces/每日英语/, D:/workspaces/每日英语台词/, docs/
depends: —
size: M
spec: `T-013` / `T-014` / `T-015` 三项**全部卡在同一个根因**上：它们都要读写**仓库外**的「每日英语」源料（`D:/workspaces/每日英语台词/` 约 375MB，含 394 个 `.mp4` + `audio/` + `audio_norm/`；`D:/workspaces/每日英语/` 约 26MB，含 11 个 `.mp4` + `tool/` + `docs/` + `_qa/` + `_tts_logs/`），而执行方**只有本仓库的可见性** → 领了也只能空跑一轮。本项由**我方**执行，把源料「变得可见」并把源侧改动准备好。(1) **扩展 `scripts/src-tmp-sync.mjs` 支持多个具名源根**（当前只支持单一源根 `C:/Users/ZhuanZ1/Documents/WS/英文学习/`），新增「每日英语」与「每日英语台词」两个具名源。(2) 按需镜像**文本类**文件：`每日英语台词/{_audit,_logs,_taxonomy,_orphan_voices,_zh,_run_all.sh,_run_tts.sh,_preview.html}` 与 `每日英语/{tool/*.py,tool/*.json,tool/index.html,tool/serve.py,docs/,_qa/,_tts_logs/}`；**一律排除** `.mp4` / `audio*/` / 图片帧等二进制大件（镜像是「让人读得懂生成链路」，不是搬素材）。(3) 刷新基准清单并跑**三方比对**（真源 / 基准 / 镜像磁盘）确认一致；`_manifest.json` 需能区分多个源根。(4) 在 `docs/AI-HANDOFF.md` §6.1 登记新的镜像范围与两个源根的真源路径。(5) **备好 `T-015` 所需的源侧改动**：`D:/workspaces/每日英语/tool/index.html` 里 `mediaUrl()` 用的 `'../'` 要改成 `'./'` —— 该改动**必须与 T-015 的仓库内侧改动同时生效**，否则线上视频全 404；本项只负责「改好并验证」，**具体落地时序由我方把关**。(6) 本项完成后解除 `T-013` / `T-014` / `T-015` 的 `depends` 门禁（`T-014` 的**素材生产**能否交给执行方，届时再评估：它需要 ffmpeg/whisper/TTS 能力，且 `_src-tmp/` 只读，很可能仍由我方做）。
acceptance:
- 两个具名源已镜像：`test -d "_src-tmp/每日英语"` 且 `test -d "_src-tmp/每日英语台词"`
- 镜像内**零大件二进制**：`! find "_src-tmp/每日英语" "_src-tmp/每日英语台词" -type f \( -name '*.mp4' -o -name '*.mp3' -o -name '*.wav' -o -name '*.png' -o -name '*.jpg' \) | grep -q .`
- 镜像总体积受控：`du -sm _src-tmp | awk '{exit !($1 < 40)}'`
- 三方比对通过：`npm run src-tmp:check` 退出码 0（且刻意改一次镜像能报出「镜像被直接改动」= 判据有效）
- 新源根已登记：`grep -q "每日英语" docs/AI-HANDOFF.md`
- 门禁已解除：`T-013` / `T-014` / `T-015` 的 `depends` 不再指向 `T-023`（`grep -c "depends: T-023" docs/BACKLOG.md` 输出 0）
evidence: （初始留空 —— 本项由我方自行执行，完成后由我方填写）

