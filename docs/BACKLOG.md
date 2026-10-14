# 半年计划 · 待办交接清单

> 这份文件写给**承接实现的 AI 工具**。任务按优先级从高到低排列，每项是一段自包含的说明 + 可执行的验收标准。
> ⚠️ **本文件归「我方」所有，执行方只读。** 从 2026-10-14 起状态被拆成两个文件（协议 **§7.3 双文件契约**）：
> **`docs/BACKLOG.md` = 我方**（任务定义 + 本文件顶部的指令区块 + 我方的 `verdict` 与轨迹）；
> **`docs/EXEC-REPORT.md` = 执行方**（`status` / `evidence` / 执行方轨迹）。
> 一个文件只有一个写者 —— 两个写者改同一个文件会**静默互相覆盖**。执行方只写 `doing` / `done` / `blocked`；
> **`verified` 只能由我方表达**（执行方任务写 `verdict: verified`，我方自办任务写 `status: verified`）。
> 协议细节与扫描流程见同目录的 `docs/AI-HANDOFF.md`。

---

## 📢 给执行方的当前指令

> **本区块 = 我方对你说的一切（新任务 / 暂缓 / 边界澄清）的唯一落点。每次扫描先读它。**
> `docs/EXEC-COMMS.md` 只作问答存档 —— 那条通道**不保证被定时扫描到**（协议 §7.1）。

> **现行规则（长期有效）**
>
> 1. 你每 20 分钟轮询一次 → **一次可连做多项**（`priority` 高者优先、再按 id 顺序），但**每项单独一个 commit**。
> 2. 你的 `status` / `evidence` / 轨迹行**只写 `docs/EXEC-REPORT.md`**；**`docs/BACKLOG.md` 一个字都不要改**（那正是锁死的根源，协议 §7.3）。有疑问就写进 `docs/EXEC-REPORT.md` 的 `## Q-xxx` 区块。
> 3. 提交前自查 `status` 与 `evidence` 是否成对更新；发现上一批漏改，自己补正即可。
> 4. 🔒 不要 `git push`（你只 `commit`）；`_src-tmp/` 只读、产出必须落正式目录；本机验证构建用 `npx vite build --outDir <仓库外目录>`，不要 `npm run build` / `npm run ship`。

> **本轮（2026-10-14 22:05）**
>
> 5. 📣 **回报**：`T-008`（双人轮换互测）与 `T-009`（AI 陪练）我方均已**独立复验 4/4 通过**并上线 —— 两项都不是看你的自评：`T-008` 用真浏览器确认**角色互换真的发生**；`T-009` 真浏览器**两次冷启动**一致、`kind==='ai-sparring'` 恰 2 条、`bankCount=346`、控制台零报错。你建的 `docs/EXEC-REPORT.md` 结构规范，很好。
> 6. 🚫 **`T-013` / `T-014` / `T-015` 暂时别领** —— 三者都依赖**仓库外**的「每日英语」源料（`D:/workspaces/每日英语*/`），镜像与源侧改动由我方在 **`T-023`** 里做（已设 `depends: T-023`）。等 `T-023` → `verified` 再领，否则白跑一轮。
> 7. 📌 **现在可领**：`T-012`（C3 互评走廊，`depends: T-004` 已满足）与 **`T-024`（新，P1，见文件末尾）**。
> 8. ⚠️ **我方越界一次，已纠正**：我方 21:03 的「状态拆分」迁移**误把你 20:54 认领的 `T-021` 从 `doing` 改成了 `todo`**，现已**原样恢复为 `doing`**。按契约我方不该写你的文件，这是**纠错性质的例外**（协议 §7.3 已记明）。**你随时可依真实进度改回任何值。**
> 9. ⛔ `T-021` 的边界提醒：本项**只出核查报告、禁止修改任何工具 HTML**（见 spec）。报告落 `docs/t021-qa/`（你已在做，7 张截图方向正确）。
> 10. 🆕 **`T-024` 是 `math` 频道的第一个工具**（该频道此前只有一个 `planned` 占位、`public/tools/math/` 目录都不存在）。它的硬约束：**手写 Canvas、零第三方绘图库、零外部请求、禁用 `eval`/`new Function`** —— 理由写在 spec 里，请照做。规划全文 `docs/PLAN-math.md` 可参考，但**以 `## T-024` 的 spec / acceptance 为准**。

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

## T-002 · 压缩 .workbuddy/memory/MEMORY.md 至注入上限内

owner: 我方
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

verdict: verified
priority: P1
area: scripts/lib/git-info.mjs
depends: —
size: S
spec: `scripts/lib/git-info.mjs` 的 `viaGitCommand()` 用 ``execSync(`git ${args}`)``（经 shell）读 git 信息，其中 `run('log -1 --pretty=%s')` 在 Windows 会走 `cmd.exe`，而 `%s` 是 cmd 元字符，有被吞/被展开的隐患（项目记忆已记录此类坑）。改为 **`execFileSync('git', [参数数组])`**（不经 shell），并**显式**传 `stdio: ['ignore', 'pipe', 'pipe']` —— 项目记忆实测：Node 里 `execFileSync('git', ...)` 用默认 stdio 会稳定 `EBUSY`，必须显式指定 stdio。把内部 `run(args)` 改成接收**参数数组**：`run(['rev-parse','HEAD'])`、`run(['rev-parse','--abbrev-ref','HEAD'])`、`run(['log','-1','--pretty=%s'])`。该模块被 `scripts/gen-version.mjs`、`scripts/check-deploy.mjs`、`scripts/ship.mjs` 共用，改后**不得改变**对外签名 `readGitInfo(rootDir)` 与返回结构。
acceptance:
- `grep -q "execFileSync" scripts/lib/git-info.mjs` 且 `! grep -q "execSync(" scripts/lib/git-info.mjs`
- `grep -n "stdio:" scripts/lib/git-info.mjs` 输出人工确认为 `['ignore', 'pipe', 'pipe']`
- `node -e "import('./scripts/lib/git-info.mjs').then(m=>{const i=m.readGitInfo(process.cwd());console.log(i.commitFull);if(!/^([0-9a-f]{7,40}|unknown)$/.test(i.commitFull))process.exit(1)})"` 退出码 0 且打印出本仓当前 commit
  - verify 2026-10-14T19:21:07+08:00 | by=team-lead | 3/3 acceptance 通过；另做对抗验证：readGitInfo 的 subject 逐字等于 git log -1 --pretty=%s（证明 %s 未被 cmd 吞噬）；三个调用方 gen-version/check-deploy/ship 均未改坏（gen-version 实测输出 commit=ddac409 branch=main）

## T-004 · 补 supabase/migrations 可重放迁移（表结构 + RLS）

verdict: verified
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
  - verify 2026-10-14T20:17:30+08:00 | by=team-lead | 4/4 acceptance 通过：migrations/20261014000000_init.sql 存在，posts/tools/messages 三表与 enable row level security 均命中，char_length(content) between 1 and 500 命中，README.md 存在；另查幂等风格 "if not exists / drop policy if exists" 共 9 处（可重放）| 注：执行方漏改 status（doing 未→done），由我方补正后验证

## T-005 · 新增本地学习记录的导出/导入 UI（换 origin 前置）

verdict: verified
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
  - verify 2026-10-14T19:21:08+08:00 | by=team-lead | 4/4 acceptance 通过；偏离项（Navbar 加入口）判定为必要且已声明，接受。另做对抗验证：esbuild 打包 storage 后对 importAll 打 10 例畸形输入（null/undefined/数组/字符串/数字/空对象/records非数组/全非法条目/空数组/缺字段），10/10 均未抛异常且返回结构 ok/imported/skipped 齐全，「绝不抛异常」声明实证成立；exportAll 结构含 schema/version/exportedAt/records

## T-006 · 清理历史残留（daily-english 目录 + 根目录 4 个旧 html）

verdict: verified
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
  - verify 2026-10-14T19:58:14+08:00 | by=team-lead | 4/4 acceptance 通过：在 d3ddcb1 处复算 public/tools 跟踪文件数=2667（2734−67）、daily-english 0 条、根目录一级 html 0 个、check-tools exit 0；另复核旧目录与 movie-line-shadowing 逐字节相同

## T-007 · 清除工具 HTML 中的 postMessage 死代码

verdict: verified
priority: P2
area: public/tools/cognition/logic-fallacy-cards/index.html, public/tools/english/dict-reader/index.html, public/tools/general/md-to-html-reader/index.html, public/tools/general/shuangpin-practice/index.html
depends: T-006
size: M
spec: 工具呈现形态已定稿为「新标签页直接打开独立 HTML」，不再用 iframe，`ToolFrame.tsx` / `lib/postMessage.ts` 早已删除。但仍有 **4 个**工具的 `index.html` 残留 postMessage 收发消息的**死代码**（每文件命中约 2 处）：`public/tools/cognition/logic-fallacy-cards/index.html`、`public/tools/english/dict-reader/index.html`、`public/tools/general/md-to-html-reader/index.html`、`public/tools/general/shuangpin-practice/index.html`。独立打开时无副作用，但属误导性死代码。逐个用 `grep -n "postMessage" <file>` 定位后，删除对应监听/发送逻辑及不再使用的辅助变量，确保工具功能不受影响、页面无报错。**注意**：这 4 个 HTML 是工具本体；若其中某个工具有同步清单（`scripts/sync/<id>.json`）或本地源目录，应改**源**再 `npm run sync:tools`，否则下次同步会把改动覆盖回来；无同步清单的（纯手工维护）直接改仓库文件即可。
acceptance:
- 全站工具目录不再出现该标识：`grep -rn "postMessage" public/tools/` 无输出
- `npm run check:tools` 退出码 0
- 人工逐个在浏览器打开这 4 个工具，确认功能正常、控制台无报错（在 evidence 中列出 URL 清单）
  - verify 2026-10-14T19:58:14+08:00 | by=team-lead | 3/3 acceptance 通过：grep postMessage/reportHeight 在 public/tools 零命中、check-tools exit 0、4 工具经 Chrome headless 真跑（正确正则 :CONSOLE:）0 条控制台消息，并以阳性对照证明捕获链路有效

## T-008 · 实现方案 C1：同屏轮换双人互测工具（零后端）

verdict: verified
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
  - verify 2026-10-14T20:34:35+08:00 | by=team-lead | 4/4 acceptance 通过。① `check-tools` exit 0（18 工具 / 4 频道 / 4 集合 / 2 路径）。② `test -f public/tools/english/peer-turn-drill/index.html` 存在（19140 B）。③ 外域请求：原判据 grep 零命中；另做**更强审计** —— `https?://|WebSocket|EventSource|sendBeacon|importScripts|<script src=|<link href=|url(http` 全零命中，全文只有 1 处网络调用（第 223 行 `fetch('../moear/tool/phrases.json')`，**同源相对路径**）。④ **真浏览器跑通两轮**：自建 CDP 探针（headless Chrome 155 + 静态服务器 webroot=仓库 `public/`，与线上同相对路径），在真实页面上下文里模拟用户点选，**连续两次冷启动**结果一致 —— 第 1 轮出题方=甲/答题方=乙、第 2 轮出题方=乙/答题方=甲（**角色真的互换了**），`state.round` 1→2→3，题库 `pool.length=346`（**真题库而非 6 条降级题**），UI 记录区显示「共 2 轮」+2 个「👍 优秀」标签，读 IndexedDB 得 `bannianjihua/records` 共 2 条、`kind==='peer-turn'` **恰为 2 条**，字段与 spec 逐项吻合（`{id,toolId:'peer-turn-drill',kind,refId,payload{round,examiner,author,promptZh,hint{func,scene,tone},answer,referenceEn,score,followup},createdAt}`），**控制台零 error / 零 warning**。附注：证据由 `b62766b`（工具+注册表）+ `45bd8ad`（清单）承载；执行方自报的 outDir 偏离（改用仓库内 `node_modules/.bc-t008`）不影响判据

## T-009 · 实现方案 C2：单人 + 外部 AI 陪练工具（零后端）

verdict: verified
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
  - verify 2026-10-14T21:10:54+08:00 | by=team-lead | 4/4 acceptance 通过。① `check-tools` exit 0（18 工具 / 4 频道 / 4 集合 / 2 路径）。② 文件存在 72,385 字节。③ 外域请求：原判据 grep 零命中；另做更强审计（`https?://|WebSocket|EventSource|sendBeacon|importScripts|<script src=|<link href=|url(http`）零命中，全文**零网络调用**；并做了**阳性对照**证明探针有效（同一 grep 在 `peer-turn-drill` 上命中 1 处 `fetch(`、在本工具 0 命中）。④ **真浏览器跑通两轮**：自建 CDP 探针（headless Chrome 155 + 静态服务器 webroot=仓库 `public/`，与线上同相对路径），在真实页面上下文模拟用户操作（抽题 → 粘回追问 → 作答 → 保存），**连续两次冷启动结果一致** —— `roundCount` 0→1→2，UI 记录区 2 条，直读 IndexedDB 得 `kind==='ai-sparring'` **恰 2 条**且记录结构与 spec 逐项吻合（`{id,toolId:'ai-sparring',kind,refId,payload{phrase{id,en,zh,difficulty,scene,func,tone},followUp,answer},createdAt}`），`bankCount=346`（内置全量题库，断网可用），**控制台零 error / 零 warning**，运行期**非本站请求 0**。附注：承载提交 `236dc7a`；执行方自报的两处偏离（构建 outDir 用仓库内 `node_modules/.bc-t009`、题库内联而非相对 fetch）**均不影响任何 acceptance 判据**；`Network.enable` 在导航之后开启，故首屏文档请求未被捕获（已由静态审计覆盖）

## T-010 · 清退已废弃脚本 scripts/sync-daily-english.mjs 及其失效文档引用

verdict: verified
priority: P2
area: scripts/, docs/
depends: —
size: M
spec: `scripts/sync-daily-english.mjs`（约 12KB）是早期的**硬编码单工具同步器**，已被「通用同步器 `scripts/sync-tools.mjs` + 一工具一清单 `scripts/sync/<id>.json`」取代 —— `package.json` 的 `prebuild` 只调用 `sync-tools.mjs`，全仓**没有任何配置引用** `sync-daily-english.mjs`，它已是死代码。请执行 `git rm scripts/sync-daily-english.mjs`，并清理文档里对它的失效引用（`docs/PRD.md` §6 第 4 条、`docs/ARCHITECTURE.md`（约第 645 行）、`docs/TOOLS-LAYOUT.md` 相关叙述），改为指向 `scripts/sync-tools.mjs` + `scripts/sync/*.json` 的现状。⚠️ `.workbuddy/memory/` 下的引用**不要改**（该目录被 gitignore、属项目记忆，记录的是历史演进，不回改）。本项不改任何运行逻辑。
acceptance:
- `test ! -f scripts/sync-daily-english.mjs`
- docs 内已无失效引用：`! grep -rn "sync-daily-english" docs/`
- `npm run sync:tools` 退出码 0（同步链不受影响）
  - verify 2026-10-14T19:58:14+08:00 | by=team-lead | 3/3 acceptance 通过：脚本已删除、docs 内（除本清单任务记录自身外）零引用、npm run sync:tools exit 0（拷贝 0 / 跳过 2659 / 失败 0）

## T-011 · 准备切换自定义域名（Cloudflare Pages，BASE_PATH=/）

verdict: verified
priority: P2
area: docs/, public/_redirects, .github/workflows/deploy.yml
depends: T-005
size: M
spec: 站点现部署在 GitHub Pages 项目子路径 `/bannianjihua-web/`。若切到自定义域名（Cloudflare Pages 等根路径托管），必须用 `BASE_PATH=/` 构建，否则路由 basename、静态资源、工具 entry 全断（三件套：`vite.config.ts` 的 `base`、`src/router.tsx` 的 `basename`、`src/lib/paths.ts`）。本项**只做仓库内可自动化的准备与验证**（域名注册 / Cloudflare 项目创建属人工，不在本项范围）：新建 `docs/DEPLOY-CLOUDFLARE.md`，写明构建命令（`BASE_PATH=/ npm run build`）、Cloudflare Pages 构建配置、`public/_redirects` 的 SPA 兜底是否仍需保留、以及**回滚到 GitHub Pages 的步骤**；复核 `public/_redirects`、`public/.nojekyll` 在新平台的取舍。**强前置**：必须等 T-005（导出/导入 UI）完成后才能真正切域名，因为换 origin 会让旧本地数据全部孤立。
acceptance:
- `test -f docs/DEPLOY-CLOUDFLARE.md`，且文档含 `BASE_PATH=/` 与回滚步骤（`grep -q "回滚" docs/DEPLOY-CLOUDFLARE.md`）
- 根路径构建可用：`BASE_PATH=/ npx vite build --outDir ../bannianjihua-rootcheck` 退出码 0（⚠️ 本地**不要**跑默认 outDir 的 `npm run build`：`vite build` 的 `emptyOutDir` 会撞沙箱批量删除闸门）
- 产物 base 正确：`grep -o "/assets/[^\"']*" ../bannianjihua-rootcheck/index.html | head -1` 结果以 `/assets/` 开头（而非 `/bannianjihua-web/assets/`）
  - verify 2026-10-14T19:58:14+08:00 | by=team-lead | 3/3 acceptance 通过：DEPLOY-CLOUDFLARE.md 含 BASE_PATH=/ 与 §7 回滚步骤；BASE_PATH=/ npx vite build --outDir ../bannianjihua-rootcheck exit 0，产物引用以 /assets/ 开头且无 /bannianjihua-web/ 前缀；强前置 T-005 已 verified

## T-012 · 实现方案 C3：互评走廊（复用 Supabase）

verdict: verified
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
  - verify 2026-10-14T22:09:23+08:00 | by=team-lead | 4/4 acceptance 通过：`npx tsc -b` exit 0；`supabase/migrations/20261014130000_corridor.sql` 含 corridor 且 `src/services/corridorService.ts` 存在；`src/router.tsx:57` 注册 `path: 'corridor'`；`node scripts/check-tools.mjs` exit 0（4 频道/4 集合/18 工具/2 路径）。另做（超出 acceptance）：通读 corridorService.ts —— APIResult 约定、绝不抛异常、复用 isSupabaseConfigured 降级、防滥用三件套（蜜罐 + 60s 限流 + 与 DB CHECK 对齐的长度校验）齐备；`npx vite build --outDir ../_buildcheck` exit 0（8.16s）。📌 附注（不构成打回）：实际改动比 area 多 3 个文件（`Navbar.tsx` 加入口 / `lib/errors.ts` / `types/index.ts`），属必要偏离且执行方已在 deviation 中申报；未配置 Supabase 时**返回空数组并标 fallback、不造演示数据**（与留言板"跑演示数据"不同，更诚实）
## T-013 · 复核音频/素材侧遗留（标签偏差 / 帧 OCR / 隔离片段 / whisper 幻觉 / 错别字文件名）

priority: P3
area: docs/
depends: T-023
size: L
spec: ⚠️ **暂缓领取：本项依赖仓库外源料，我方正在 `T-023` 里做镜像；`T-023` 变 `verified` 后本条即可正常领。** 音频/素材侧（moear 工具链，工作目录 `D:/workspaces/每日英语台词/`，**不进仓库**）据前期同事反馈存在 5 类系统性遗留，但本清单作者**未能一手复核**具体数量与位置，故本项先「核实 + 登记」，**先不做修复**：① 标签表系统性偏差（`_taxonomy/tags.json`、`_taxonomy/build_tags.py`），据称约 3 处；② 高危单元需靠帧 OCR 定谳（`_audit/_frames_a_manifest.json`、`_audit/frame_audit_b_meta.json`、`_audit/asr_doubt.json`），据称约 72 条；③ 隔离片段待决定去留（`_orphan_voices/`，含 `_moved.json`），据称约 8 条；④ whisper 转写疑似幻觉（`_logs/1_transcribe.log`、`_audit/asr_doubt.*`），据称约 26 条；⑤ 错别字文件名（散在 `D:/workspaces/每日英语台词/*.mp4`），据称约 25 个。产出 `docs/AUDIO-LEGACY-AUDIT.md`：**用命令实测**每个类别的真实数量与代表文件、标注来源，凡信息不足处写「待确认」，**不得直接沿用上述未复核数字**；并给出每类的处置建议（去 / 留 / 改）。源目录在仓库外，本项只产出文档，不修改素材。
acceptance:
- `test -f docs/AUDIO-LEGACY-AUDIT.md`
- 文档含 ≥5 个类别小节且每节给出「数量 + 定位命令 + 代表文件」：`test $(grep -c "^## " docs/AUDIO-LEGACY-AUDIT.md) -ge 5`
- 引用可复现：`ls "D:/workspaces/每日英语台词/_audit/" "D:/workspaces/每日英语台词/_taxonomy/" "D:/workspaces/每日英语台词/_orphan_voices/"` 能列出文档中引用的文件
## T-014 · 补足 movie-line-shadowing 素材（当前仅 11 条 demo）

priority: P3
area: public/tools/english/movie-line-shadowing/, D:/workspaces/每日英语/
depends: T-023
size: M
spec: ⚠️ **暂缓领取：本项要在仓库外源目录里生产素材，我方正在 `T-023` 里做镜像与源侧准备；`T-023` 变 `verified` 后本条即可正常领。** `movie-line-shadowing` 工具目前内容只有 **11 条 demo**：`public/tools/english/movie-line-shadowing/tool/data.json` 的 `items` 数组实测长度 = 11（而源目录 `D:/workspaces/每日英语/` 的成品素材多于 11 条）。需在**源工作目录**按既有管线补足条目（转写 + 中文 + TTS 配音等），再经 `npm run sync:tools` 增量同步进站（同步判据是「大小 + 内容 sha1」双判据，不会误判）。本项属素材生产，不写新代码；若某条素材缺中文/配音，需先在源侧补齐再同步。目标条数由老板给定（若未给定，以「源目录已就绪的成品条数」为准，并在 evidence 报告实际数字）。
acceptance:
- 条数确已超过 demo：`node -e "const d=require('./public/tools/english/movie-line-shadowing/tool/data.json'); if(d.items.length<=11){console.error('仍为 demo 条数'); process.exit(1)}"`
- `npm run sync:tools` 退出码 0（源目标 sha1 一致）
- `npm run check:tools` 退出码 0
## T-015 · 统一 movie-line-shadowing 的站内 URL 层级（sync 增加 stripPrefix）

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
## T-016 · 决策 3 个已产出未上线成品的去留（待决策，非实现）

owner: 我方
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

verdict: verified
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
  - verify 2026-10-14T20:17:30+08:00 | by=team-lead | 5/5 acceptance 通过：站内 index.html 与源 英文学习精编.html sha1 逐字节一致 419f083371146a81b855361c9f9e31de53f1778c（2386840 字节）；注册表 id 命中；check-tools exit 0；tsc -b exit 0 | 注：执行方漏改 status（doing 未→done），由我方补正后验证；制品已提交 b658185


## T-018 · 上线「台词语音卡 v0.2」背句工具

verdict: verified
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
  - verify 2026-10-14T19:58:14+08:00 | by=team-lead | 5/5 acceptance 通过：源与站内 sha1 逐字节一致 d1227f57f46953024488757aee6784ce1dee5c3a；注册表 id/name（避开「语音卡」）/collections(books,movie-lines 均实际存在)/icap active/order 16 正确；check-tools 与 tsc exit 0；npx vite build --outDir ../_buildcheck exit 0


## T-019 · 上线「锁屏背句」原型（demo，需标注原型性质）

verdict: verified
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
  - verify 2026-10-14T19:58:14+08:00 | by=team-lead | 5/5 acceptance 通过：源与站内 sha1 逐字节一致 0a94b63ba4d6f3129975e7ced6fa307c3eb96e94；version 0.1.0、tags 含「原型」、description 明示不修改系统锁屏不记忆进度；check-tools/tsc/build 均 exit 0


## T-020 · 上线前修正 3 个新工具的「名称/描述诚实性」（我方调研发现）

verdict: verified
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
  - verify 2026-10-14T19:58:15+08:00 | by=team-lead | 5/5 acceptance 通过：三个注册文件均存在；quotecards 3 处 audio 命中全属「不含音频播放」否定语境；lockscreen 命中「模拟/原型/不修改系统锁屏」；dragon 命中「30 篇文档/464 个章节/全书」；check-tools 与 tsc exit 0。附注：T-017 status 仍停在 doing（执行方漏改成 done），其实质内容已随本项一并核验通过，建议执行方补正状态

## T-021 · 3 个新工具的移动端与深色主题适配核查（我方调研发现）

verdict: verified
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
  - verify 2026-10-14T22:09:23+08:00 | by=team-lead | 4/4 acceptance 通过：① 三工具线上 URL 真实浏览器逐一打开并记录（非白屏，给出 body.innerText 字符数；console 唯一 error 是**域根** `/favicon.ico` 404，工具自身资源零 404、子路径安全）② 锁屏麦克风流程用 CDP `Browser.setPermission(denied)` 对同 origin 显式拒绝后真点按钮、以 MutationObserver 实录状态序列（98ms 内 3 条），并实测**手动降级链路完整可用**（输入复述 → LCS 命中 6/7 → 「通过·解锁」）③ 7 张截图均落盘 `docs/t021-qa/`（我方 Glob 确认存在，尺寸合理）④ 报告明确区分「阻塞 0 项 / 可上线但需打磨 5 项」。独立抽查证实其两项关键断言（非只信报告）：精编与语音卡均为 `data-theme="light"` 默认浅色、两者 `prefers-color-scheme` 均出现 **0 次**（不跟随系统偏好）、且**各含 `reader-theme` 2 次**（同 origin 共用同一 localStorage 键 → 跨工具主题串扰属实）；锁屏工具无独立主题键、自带深色。⚠️ 附注（不影响 acceptance）：报告 §1 观察到的 `h1=15 / h2=232` 与磁盘实测**不符** —— 站内产物与源 HTML 均为 `h1=30 / h2=464 / h3=1762 / h4=38`，它用的是**浏览器 DOM 计数**这一代理指标；本轮据此再次践行「判据必须指向内容本身」。
## T-022 · 3 个新工具上线后补齐「源料库可重建性」文档

verdict: verified
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
  - verify 2026-10-14T19:58:15+08:00 | by=team-lead | 4/4 acceptance 通过：BOOKS-SOURCE.md 存在；3 个新工具 id 三列齐全；§2 风险提示含「非 git 仓库（git rev-parse 实测 fatal: not a git repository）」「无版本保护」「唯一重建链路」；抽查 9 条路径全部存在。附注：§2 写「15 个生成脚本 / build_pure_dict.py 29KB」与实测（13 个 / 35620B）不符，属非验收范围的事实性小错，建议后续订正

## T-023 · 把「每日英语」源料按需镜像进 `_src-tmp/` 并备好源侧改动（**我方自行执行，执行方请跳过**）

owner: 我方
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

## T-024 · 新建「函数参数实验室」工具（math 频道第一个落地工具）

priority: P1
area: public/tools/math/function-param-lab/, src/data/tools/math/, src/data/collections.ts
depends: —
size: L
spec: 站点 `math` 频道（见 `src/data/channels.ts`）**至今没有任何已落地工具** —— 只有一个 `planned` 占位 `set-theory-cards`，且 `public/tools/math/` 目录**尚不存在**。本项是该频道第一个工具，请一次做到位。

**老板需求原话**：「高中数学…很多容易误解的点，希望能有个全面的」「画个图也可…如果能调参数是最好不过了。比如 AX 方加上 BX 加上 C，然后 ABC 的值取正负 0，分别看到它这个图像发生什么变化，位置什么的」「先快速的」。

**交付（只新建 2 个文件 + 追加 1 处，不改任何既有文件）**：

1. **产物** `public/tools/math/function-param-lab/index.html` —— **自包含单文件**：内联 `<style>`/`<script>`，**零外部引用**（无 `<script src>` / `<link rel=stylesheet>` / 远程字体 / 图片）。风格参考站内既有单文件工具 `public/tools/english/dict-reader/index.html`（`<html lang="zh-CN" data-theme="dark">` + CSS 变量 + 系统字体栈）。
2. **注册表** `src/data/tools/math/function-param-lab.ts` —— 纯字面量（构建设用 `Function()` 求值解析，**不得**出现函数/模板字符串/变量引用）。必填 `id: 'function-param-lab'`（**必须单引号字面量**，且 == 文件名 == 产物目录名）、`channel: 'math'`、`name: '函数参数实验室'`、`description`、`tags: ['数学','函数','图象','参数']`、`status: 'online'`、`runtime: 'client-only'`、`entry: 'tools/math/function-param-lab/index.html'`（**显式完整路径，不得拼**）、`cover`、`version: '1.0.0'`、`createdAt: '2026-10-14'`、`order`（**同频道 `set-theory-cards` 已占一个 order，请查重**）、`collections: ['high-school-math']`、`icap: ['active']`。
3. **集合** 在 `src/data/collections.ts` 的 `COLLECTIONS` 数组里**追加一个对象**（⚠️ 该文件用正则 `\bid\s*:\s*'([^']+)'` 解析 id，**所有 id 必须写单引号字面量**；追加在数组末尾即可）：

```ts
{
  id: 'high-school-math',
  name: '高中数学',
  cover: '📐',
  description: '易错易误解点 · 数形结合：拖动参数，看图象怎么变',
  order: 3,          // 现有占用：books 1 / movie-lines 2 / dragon-english-basic100 10 / dragon-english-grammar100 11
  path: [
    { label:'看图辨形', note:'拖动参数，看常见函数图象怎么变、位置怎么移',
      toolId:'function-param-lab' },
    { label:'（待建）', note:'更多章节的易误解点',
      todo:'等「高中数学易误解点全清单」调研后按可视化性排序补入' },
  ],
}
```

**工具功能要求**（第一版要快、要能用，**不要过度设计**）：

- **画布**：手写 **Canvas 2D**（**禁止任何第三方绘图库**）。坐标轴 + 网格 + 刻度（步长取 1/2/5×10ⁿ 自适应）。坐标系固定视窗（**不做**拖拽平移 / 滚轮缩放）；参数变化导致曲线超界时，自动取一个能看全的视窗即可。
- **场景切换**：6 个标签页，切换时重建滑块：

| # | 场景 | 参数（滑块） | 必须体现的「易误解点」 |
|---|---|---|---|
| 1 | `y = ax² + bx + c` | **a** ∈ [−3,3] 步 .1；**b** ∈ [−5,5] 步 .5；**c** ∈ [−5,5] 步 .5 | **a=0 时二次项消失、图象退化为直线**（最经典的"忘记讨论 a=0"）；a 变号 → 开口翻转且**值域随之翻转**；b 变 → 对称轴 `x=−b/(2a)` 移动；c 变 → 上下平移（过 `(0,c)`） |
| 2 | `y = kx + b` | **k** ∈ [−5,5] 步 .5；**b** ∈ [−5,5] 步 .5 | `k=0` → 退化为**常函数**（不是"斜率为 0 的一次函数"） |
| 3 | `y = k/x` | **k** ∈ [−5,5] 步 .5 | k 正负 → 一三 / 二四象限；**x=0 处必须断开**，见下方"断点硬要求" |
| 4 | `y = aˣ` | **a** ∈ (0,4] 步 .1 | 0<a<1 减 / a>1 增；**值域恒 (0,+∞)，不随 a 变**（反直觉点） |
| 5 | `y = log_a x` | **a** ∈ (0,4] 步 .1，**a=1 必须给提示** | 定义域恒 (0,+∞)；**底数不能为 1** |
| 6 | `y = x + a/x` | **a** ∈ [−10,10] 步 .1 | 拐点 (√a, 2√a)；`a<0` 变「飘带函数」单调无最值；`a=0` 退化成直线 `y=x` |

- **滑块交互**：拖动 → **实时重绘**（用 `requestAnimationFrame` 合并高频 input，不要每个 input 事件都重画）。每个滑块旁配一个**「归零」小按钮**（一键把该参数设为 0）—— 老板特别提到要"取 0"做对比。
- **参数必须能取到 0 与负值**：不得把 0 从滑块范围里排除；取到 0 时**图象照常画**，用提示文案说明退化。
- **定义域 / 值域读数**：每个场景**用解析式精确给出**（例如二次函数 `a>0 → [k,+∞)`，`k = c − b²/(4a)` 为顶点纵坐标；`a=0 → ℝ`），**不要靠采样猜**。用两行文本显示。
- **一句结论**：随参数状态**动态切换**的文案（例如 `a=0` 时显示「a=0 使二次项消失，图象退化为直线 y = bx + c」；`a>0` 时显示「开口向上，值域 [k, +∞)」）。
- **暗色主题**，与站内其他工具观感一致。

**技术硬约束**：

- **零第三方库**：不用 Desmos / GeoGebra / plotly / echarts / chart.js / d3 / function-plot 等任何绘图库，也不引任何 CDN 资源（理由：站点是纯静态、要求零外部请求；且 Desmos 需 API key + 必请求境外域、GeoGebra 整套仅非商业免费）。
- **禁止 `eval` / `new Function`**（理由：① 将来加 CSP `script-src 'self'` 会被直接拦；② 同源上下文里能读本机 `localStorage` 与同源资源）。6 个场景的求值**直接写死成各自的 JS 函数**即可，**不需要**通用表达式解析器。
- ⚠️ **断点硬要求**：`y = k/x` 在 `x=0` 处**绝对不得画出一条穿屏的竖线**（这是本项目最典型的一类视觉错误）。做法：遇 `NaN`/`±Infinity`/非有限值就记断点，折线里 `moveTo` 断开路径；相邻两点 y 均有限但**符号相反且 |Δy| > 1.5 × 画布高度** → 同样判为跨渐近线，断开。
- **采样**：按画布像素列采样（每列一个 x），不要固定点数；对 `k/x` 这类陡峭段可用"相邻点中点递归细分"改善。
- **高 DPI**：canvas 的 `width/height` 乘 `devicePixelRatio`，用 `ctx.setTransform(dpr,0,0,dpr,0,0)`，线宽取 `1/dpr` 的整数倍，否则线条发虚。

**规划全文**：`docs/PLAN-math.md`（可读；但**以本卡的 spec / acceptance 为准**）。

acceptance:
- `test -f public/tools/math/function-param-lab/index.html`
- `test -f src/data/tools/math/function-param-lab.ts` 且 `grep -n "id: 'function-param-lab'" src/data/tools/math/function-param-lab.ts` 命中
- 集合已登记：`grep -q "id: 'high-school-math'" src/data/collections.ts`
- **零外部引用**：`grep -nE "<(script|link)[^>]*(src|href)=" public/tools/math/function-param-lab/index.html` **无输出**
- **零外部域名**：`grep -nE "https?://" public/tools/math/function-param-lab/index.html` 的输出**只允许**出现在注释或说明文案里（须人工确认无任何资源引用）
- **不用动态求值**：`! grep -qE "\b(eval|new Function)\s*\(" public/tools/math/function-param-lab/index.html`
- `node scripts/check-tools.mjs` 退出码 0（工具总数 19、`math` 频道 2 个）
- `npx tsc -b` 退出码 0
- **不跑 `npm run build`**；构建验证用 `npx vite build --outDir ../_buildcheck`，退出码 0
- 真跑（人工项，**我方会用无头浏览器独立复验**）：打开工具后，① 把场景 1 的 `a` 拖到 **0**，图象**确实变成直线**且有退化提示文案；② 拖到负值，开口翻转、值域随之翻转；③ 切到 `y=k/x`，图象在 x=0 处**断开、无穿屏竖线**；④ 控制台零报错。

