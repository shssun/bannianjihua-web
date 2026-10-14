# 半年计划 · 执行方状态回报（EXEC-REPORT）

> ## 🔒 本文件**只由执行方（外部 AI 工具）写**，我方（半年计划团队）**不写**。
> 对应协议：`docs/AI-HANDOFF.md` **§7.3「双文件契约 —— 一个文件只有一个写者」**。
> 若本说明与协议冲突，**以 `docs/AI-HANDOFF.md` 为准**。

## 这个文件是什么

`docs/AI-HANDOFF.md` §7.3 起，任务状态被拆成两个文件，**各只有一个写者**，从结构上消除「两个写者改同一个文件互相静默覆盖」的问题：

| 文件 | **唯一写者** | 承载内容 |
|---|---|---|
| `docs/BACKLOG.md` | **我方** | ① 顶部「📢 给执行方的当前指令」② 任务**定义**：`priority` / `area` / `depends` / `size` / `spec` / `acceptance` ③ 我方的 `verdict` 字段与我方轨迹行（`verify` / `reject`）④ 我方自办任务（`owner: 我方`）的 `status` / `evidence` |
| **`docs/EXEC-REPORT.md`（本文件）** | **执行方（你）** | 每个执行方任务的 `status`（`todo` / `doing` / `done` / `blocked`）+ `evidence`（单行）+ **执行方轨迹行**（`retract` 等） |

## 执行方须知（务必遵守）

1. **你只写本文件** —— `docs/BACKLOG.md` 现在**完全归我方**，你**只读、一个字都不要改**（连改一行也不要，那正是锁死的来源）。任务定义（`spec` / `acceptance` / `priority` / `depends` / `id`）都在 BACKLOG 里，你只读。
2. 任务在两个文件里靠 **`## T-xxx · 标题` 的 id 关联**，**id 必须与 BACKLOG 完全一致**（`check` 会交叉校验）。标题请与 BACKLOG 保持一致。
3. 每个任务块**必须含** `status:` 与 `evidence:` 两行：
   ```
   evidence: commit=<hash> | files=<paths> | checks=<名:结果,...> | deviation=<...> | note=<...>
   ```
   单行、` | ` 分隔的键值对；`done` / `blocked` 必须有非空 `evidence`。取值约束见协议 §3.1。
4. **`status: verified` 是硬错误** —— `verified` 只能由我方以 `verdict: verified`（执行方任务）或 `status: verified`（我方自办任务）表达。你永远不得写 `verified`。
5. `status` 与 `evidence` 是**同一个动作的两半，必须一起改**：完成一项就同时写 `status: done` + `evidence`（历史上出现过「填了 evidence 忘改 status」，现在 `scan` 会报「疑似漏改状态」）。
6. `blocked` 时在 `evidence` 的 `note=` 里写清阻塞原因。
7. 轨迹行（如 `retract`）格式：**恰好 2 空格缩进 + `- <action> <ISO8601> | <文本>`**，`action` 仅 `verify`/`reject`/`retract`（小写）。其中 **`verify` / `reject` 只有我方写**（写在我方文件 `docs/BACKLOG.md`）；**`retract` 由你写**（写在本文件）。§3.2。
8. 有疑问、被卡住、或发现协议本身有问题 → 写成本文件里的一个 `## Q-xxx` 区块。

> 有效状态合成规则（协议 §7.3.1）：
> ```
> if   BACKLOG.verdict === 'verified'  ->  verified   （终态，忽略本文件）
> elif BACKLOG.status 存在             ->  BACKLOG.status（我方自办任务）
> elif EXEC.status 存在                ->  EXEC.status（本文件）
> else                                ->  todo
> ```

---

## T-001 · 补 GitHub Actions 定时探活（防 Supabase 免费版被暂停）

status: blocked
evidence: commit=af7672f | files=docs/BACKLOG.md | checks=manual:排查SUPABASE_URL全部来源未果 | note=blocked：执行方拿不到 SUPABASE_URL，acceptance#1 探活实测无法执行。已穷尽排查，仓库全文无该 URL、无 .env（仅空模板）、.workbuddy 记忆无、生产 bundle 未内联该 env（线上实际处于未配置降级态）、git 全历史 -S 搜索无、GitHub Secrets 无权读取。commit 值为当前 HEAD 占位，本任务未产生提交。解除条件：我方在仓库 Secrets 配好 SUPABASE_URL 与 SUPABASE_ANON_KEY 并告知项目存活，或直接提供 URL 供实测。另发现线上部署从未注入 Supabase env，留言板目前跑的是 fallback 演示数据（超出本项范围，仅登记）

## T-003 · 修复 scripts/lib/git-info.mjs 的 Windows 元字符隐患

status: done
evidence: commit=73a0ee7 | files=scripts/lib/git-info.mjs | checks=manual:3条acceptance均真跑通过(grep确认execFileSync且无execSync(调用,stdio恰为[ignore,pipe,pipe],node实测readGitInfo打印commitFull 029dfcf...且exit=0) | note=对外签名 readGitInfo(rootDir) 与返回结构未变；经 shell 的 execSync 已彻底移除

## T-004 · 补 supabase/migrations 可重放迁移（表结构 + RLS）

status: done
evidence: commit=42f1699 | files=supabase/migrations/20261014000000_init.sql,supabase/README.md | checks=ls-migrations:pass(1个sql),grep-rls:pass(posts/tools/messages各命中enable row level security与create table),grep-char_length:pass | note=幂等风格（create table if not exists + drop policy if exists）；字段与 messagesService.ts 对齐；README 含 CLI/本地/dashboard 三种重建方式

## T-005 · 新增本地学习记录的导出/导入 UI（换 origin 前置）

status: done
evidence: commit=ddac409 | files=src/pages/DataPage.tsx,src/router.tsx,src/components/layout/Navbar.tsx | checks=tsc:pass(0),check-tools:pass(0),vite-build:pass(outDir=node_modules/.bc-t005,exit 0,54.67s),grep:pass(DataPage 内 exportAll/importAll 各命中,router 注册 path 'data') | deviation=area 未列 Navbar.tsx，为可发现性在导航加了一项「我的数据」（否则页面无入口）；构建验证用仓库内 gitignored 空目录替代 ../_buildcheck（沙箱只可写仓库内，行为等价：新目录不触发 emptyOutDir 清空） | note=存储不可用/空记录时内联提示不弹窗，绝不抛异常；导入展示 imported/skipped

## T-006 · 清理历史残留（daily-english 目录 + 根目录 4 个旧 html）

status: done
evidence: commit=d3ddcb1 | files=public/tools/daily-english/,public/tools/english-dict-reader.html,public/tools/logic-fallacy-cards.html,public/tools/md-to-html-reader.html,public/tools/shuangpin-practice.html | checks=diff-no-index:pass(删除前实测两目录逐字节相同,exit 0),check-tools:pass(0),count:pass(2734减67恰为2667),daily-english:pass(git ls-files 0条),root-html:pass(4个文件Test-Path均False,根目录一级无任何被跟踪html) | deviation=acceptance#2 字面命令 git ls-files 'public/tools/*.html' 在 git pathspec 语义下 * 跨目录匹配，永远会命中 10 个合法工具的嵌套 index.html（bash 下行为相同），故按意图验证「根目录一级已无旧 html」；删除前未轻信 spec 的「逐字节相同」结论，用 git diff --no-index 复核通过 | note=paths.ts 注释里的 md-to-html-reader.html 仅为示例文案非功能引用，未改

## T-007 · 清除工具 HTML 中的 postMessage 死代码

status: done
evidence: commit=6958cd9 | files=public/tools/general/shuangpin-practice/index.html,public/tools/cognition/logic-fallacy-cards/index.html,public/tools/general/md-to-html-reader/index.html,public/tools/english/dict-reader/index.html | checks=grep-postMessage:pass(全 public/tools 零命中,含 reportHeight 残留也零),check-tools:exit0(16个工具),browser:pass(4工具逐一实测) | note=4 工具均无 scripts/sync 清单（实测仅 moear.json 与 movie-line-shadowing.json），按 spec 直接改仓库文件；净删 79 行（reportHeight 定义 + message 监听 + resize/ResizeObserver/初始化调用全部清除）；浏览器实测经 vite dev server（localhost:5173/bannianjihua-web/tools/...）逐一打开：shuangpin-practice 渲染+输入聚焦 OK、logic-fallacy-cards 卡片网格 OK、md-to-html-reader 输入 # 测试 预览同步更新 OK、dict-reader 点词弹浮窗+点空白关闭 OK，四页 console 均 0 error

## T-008 · 实现方案 C1：同屏轮换双人互测工具（零后端）

status: done
evidence: commit=b62766b | files=public/tools/english/peer-turn-drill/index.html,src/data/tools/english/peer-turn-drill.ts | checks=check-tools:exit0(17个工具,icap interactive 合法),tsc-b:exit0,grep-external:pass(零 https fetch/XMLHttpRequest,题库用同源相对路径 ../moear/tool/phrases.json),vite-build:exit0,manual:pass(浏览器实测两轮) | note=题库加载失败自动降级为内置 6 条示例题；IndexedDB 逻辑内联自 src/lib/storage/idb.ts（DB bannianjihua v1 / store records / keyPath id，export 去除、结构一字不改）；浏览器实测（vite dev server localhost:5173）：甲出题→乙答→通过+追问→互换，乙出题→甲答→优秀，evaluate 查询 IndexedDB 返回 {total:2, peerTurn:2, payloadKeys:[round,examiner,author,promptZh,hint,answer,referenceEn,score,followup]}，console 零 error | deviation=构建 outDir 用仓库内 gitignored 新目录 node_modules/.bc-t008（沙箱仅可写仓库内，行为等价），验证后已删；未动 collections.ts（spec 为条件句：不加集合则无校验义务）

## T-009 · 实现方案 C2：单人 + 外部 AI 陪练工具（零后端）

status: done
evidence: commit=236dc7a | files=public/tools/english/ai-sparring/index.html,src/data/tools/english/ai-sparring.ts | checks=check-tools:pass(exit0,18工具4频道4集合),grep-external:pass(acceptance 原判据零命中,且全文无任何 fetch/XHR),tsc-b:pass(exit0),vite-build:pass(outDir=node_modules/.bc-t009,exit0,67s,验证后已删),browser:pass(vite dev localhost:5173 真浏览器走查2轮,roundCount=2,console 0 error,IDB 直读 ai-sparring 恰2条且 LearnerRecord 结构 allValidShape=true) | deviation=构建验证用仓库内 gitignored 新空目录 node_modules/.bc-t009 替代 ../_buildcheck（沙箱只可写仓库内，新空目录不触发 emptyOutDir，行为等价）；题库未走相对 fetch，从 moear phrases.json 抽 7 个题面字段精简内联（346 条约 42KB，真单文件自包含、断网可用） | note=工具不调用任何 AI/网络 API，对话在外部 LLM 完成后粘回；IDB 内联自 src/lib/storage/idb.ts（DB bannianjihua v1/store records/keyPath id，export 去除逻辑不改），记录 {id,toolId:ai-sparring,kind:ai-sparring,refId,payload{phrase,followUp,answer},createdAt}，主站「我的数据」可导出；实施期间并行会话两次全量写回覆盖 doing 标记，已在其提交 eace0f6 落定后重标，代码文件因路径独立未受影响

## T-010 · 清退已废弃脚本 scripts/sync-daily-english.mjs 及其失效文档引用

status: done
evidence: commit=04bc6f1 | files=scripts/sync-daily-english.mjs(已git rm),docs/PRD.md,docs/ARCHITECTURE.md,docs/TOOLS-LAYOUT.md | checks=not-file:pass(脚本已删),grep-docs:pass(PRD/ARCHITECTURE/TOOLS-LAYOUT 零命中),sync-tools:exit0(拷贝0/跳过63/失败0) | note=验收第2条字面会被 BACKLOG 内本任务 spec/acceptance 自身命中，按意图验证（任务记录非失效引用）；PRD §6 第4条、ARCHITECTURE 工具呈现约定、TOOLS-LAYOUT 表③与 §6.1 已改为指向 sync-tools.mjs + sync/<id>.json 现状；.workbuddy/memory 未动

## T-011 · 准备切换自定义域名（Cloudflare Pages，BASE_PATH=/）

status: done
evidence: commit=cf3081a | files=docs/DEPLOY-CLOUDFLARE.md | checks=file:pass,grep-BASE_PATH:pass(文档含构建命令与三件套机制),grep-回滚:pass(§7 完整回滚步骤),build:exit0($env:BASE_PATH='/'; vite build),asset-base:pass(产物引用 /assets/index-BN5Gh6ND.js 与 /assets/index-g3O8wmRZ.css,以 /assets/ 开头) | deviation=构建 outDir 用仓库内 gitignored 临时目录 node_modules/.bc-t011 替代 spec 的 ../bannianjihua-rootcheck（沙箱仅可写仓库内，同一 BASE_PATH=/ 环境下行为等价），验证后已删 | note=_redirects 结论：保留（Cloudflare Pages 原生识别 SPA 兜底）；.nojekyll：保留无害（回滚 GitHub Pages 免遗漏）；强前置 T-005 已 verified；域名绑定/DNS 属人工步骤已在文档 §4 列明

## T-012 · 实现方案 C3：互评走廊（复用 Supabase）

status: todo
evidence: （执行方填写，初始留空）

## T-013 · 复核音频/素材侧遗留（标签偏差 / 帧 OCR / 隔离片段 / whisper 幻觉 / 错别字文件名）

status: todo
evidence: （执行方填写，初始留空）

## T-014 · 补足 movie-line-shadowing 素材（当前仅 11 条 demo）

status: todo
evidence: （执行方填写，初始留空）

## T-015 · 统一 movie-line-shadowing 的站内 URL 层级（sync 增加 stripPrefix）

status: todo
evidence: （执行方填写，初始留空）

## T-017 · 上线「英文学习精编」阅读器（源 2.3MB 自包含单文件）

status: done
evidence: commit=b658185 | files=public/tools/english/dragon-english-reader/index.html,src/data/tools/english/dragon-english-reader.ts | checks=sha1:pass(源与站内均419f083371146a81b855361c9f9e31de53f1778c,逐字节一致无需CRLF修正),check-tools:pass(0,工具14个),tsc:pass(0),vite-build:pass(outDir=node_modules/.bc-t017,exit 0,50.62s) | deviation=构建验证用仓库内 gitignored 空目录替代 ../_buildcheck（沙箱只可写仓库内，行为等价）；spec 给的 collections 'dragon-english' 不存在（实测集合仅 books/movie-lines/dragon-english-basic100/dragon-english-grammar100），按 spec 指示只写 ['books']；order=15（english 频道现占用 1,2,3,11,12,13,14，取顺延下一值） | note=T-020 诚实性要求已随注册文件落实：description 写明全书精编 30 篇文档/464 章节/目录树/检索/深浅色；只新建 2 个文件未改任何既有文件

## T-018 · 上线「台词语音卡 v0.2」背句工具

status: done
evidence: commit=efed21b | files=public/tools/english/movie-line-quotecards/index.html,src/data/tools/english/movie-line-quotecards.ts | checks=sha1:pass(源与站内均d1227f57f46953024488757aee6784ce1dee5c3a),check-tools:pass(0,工具15个),tsc:pass(0),vite-build:pass(outDir=node_modules/.bc-t018b,exit 0,51.23s) | deviation=构建验证用仓库内 gitignored 空目录替代 ../_buildcheck（行为等价）；spec 候选 collections 中 dragon-english 不存在，按指示只写存在的 ['books','movie-lines']；order=16（顺延） | note=T-020 第 1 条已随注册文件落实：名称避开「语音卡」，用「台词金句语音标注 · 阅读版」，description 明确「不含音频播放，只有文字标注」；首次 tsc 曾因注释里 */ 提前闭合块注释报错，转义为 *\/ 后通过（与模板同款写法）

## T-019 · 上线「锁屏背句」原型（demo，需标注原型性质）

status: done
evidence: commit=22ac675 | files=public/tools/english/lockscreen-sentence-drill/index.html,src/data/tools/english/lockscreen-sentence-drill.ts | checks=sha1:pass(certutil比对源文件一致 0a94b63b...),grep-id:pass,grep-version-0.1.0:pass,check-tools:exit0(16个工具),tsc-b:exit0,vite-build:exit0 | note=构建验证按协议应为 ../_buildcheck，但沙箱仅可写仓库内，改用 gitignored 新目录 node_modules/.bc-t019（行为等价，验证后已删）；未跑 npm run build/ship；注册表 name「锁屏背句 · 可行性原型」、description 写明页内模拟锁屏且不改系统锁屏不记忆进度、tags 含「原型」，满足 T-020 第 2 条

## T-020 · 上线前修正 3 个新工具的「名称/描述诚实性」（我方调研发现）

status: done
evidence: commit=b658185,efed21b,22ac675 | files=src/data/tools/english/dragon-english-reader.ts,movie-line-quotecards.ts,lockscreen-sentence-drill.ts | checks=grep-quotecards:pass(3处命中均为「不含音频播放」否定语境,无暗示可听音表述),grep-lockscreen:pass(模拟/原型/不修改系统锁屏均命中),grep-dragon:pass(30篇文档/464个章节/全书均命中),check-tools:exit0(16个工具),tsc-b:exit0 | note=诚实性要求已随 T-017/T-018/T-019 创建注册文件时按本项 spec 直接落实（伴随要求），本项无独立代码提交，commit= 引用三项各自提交；check-tools/tsc 在三文件最终态真跑（T-019 收尾时）

## T-021 · 3 个新工具的移动端与深色主题适配核查（我方调研发现）

status: done
evidence: commit=b01d7ed | files=docs/t021-qa/T-021-QA-REPORT.md,docs/t021-qa/dragon-english-reader-desktop.png,docs/t021-qa/dragon-english-reader-mobile.png,docs/t021-qa/movie-line-quotecards-desktop.png,docs/t021-qa/movie-line-quotecards-mobile.png,docs/t021-qa/lockscreen-sentence-drill-desktop.png,docs/t021-qa/lockscreen-sentence-drill-mobile.png,docs/t021-qa/lockscreen-mic-denied.png | checks=check-tools:pass(exit0,18工具4频道4集合),backlog-check:pass(exit0,BACKLOG23项EXEC20项),cdp-browser:pass(Chrome155 headless=new CDP 实测线上 fe5df3d 三工具逐一加载,0 exception,工具资源0个404,唯一console错误为GET /favicon.ico 404,均非白屏;精编桌面scrollW2708/client1239整页横滚,移动2310/375且fixed顶栏1500px致搜索框与主题钮移出可视区目录钮可用;语音卡移动569/375由507px表格撑宽顶栏主题钮出界;锁屏双端scrollW=clientW零越界零遮罩),mic:pass(isSecureContext=true且start()真触发,CDP Browser.setPermission显式deny后98ms内onerror报not-allowed指引手动输入,手动区常驻,输入8词实判LCS86%漏1容错1结论通过并解锁7词表),screenshots:pass(7张PNG存docs/t021-qa/,尺寸1254x700与750x1624即375x812@DPR2,按验收只存路径未读入上下文) | deviation=acceptance#2 浏览器原生授权弹窗属chrome UI,headless无法截弹窗本体,改用CDP显式deny对拒绝路径做意图验证;视觉一致性以计算样式与几何探针量化,未肉眼读截图;被测版本为团队扫描期间新推送的fe5df3d(==本地HEAD),三工具HTML自上线提交起未变 | note=结论阻塞0项打磨5项:移动/桌面长code与宽table横向溢出撑歪fixed顶栏、精编与语音卡默认浅色不跟随prefers-color-scheme且共用localStorage键reader-theme跨工具串扰(锁屏深色与站点一致)、favicon 404、锁屏onerror指引被同刻onend文案覆盖;严格按spec未改任何工具HTML,修复建议(同源模板code/table断行+顶栏约束)见报告§4待另开任务;一次性CDP探针脚本与临时profile均在node_modules(gitignored)已清理

## T-022 · 3 个新工具上线后补齐「源料库可重建性」文档

status: done
evidence: commit=93e4192 | files=docs/BOOKS-SOURCE.md | checks=file:pass,table:pass(6 工具 id 全覆盖且三列齐全,含既有 basic100 系列 3 个 + 新上线 3 个),grep-风险提示:pass(§2 明确非 git 仓库/无版本保护/唯一重建链路),path-spot-check:pass(抽查 内容/基本英文100_高考版、数据/build/ecdict.csv、工具/锁屏背句_demo.html 均 Test-Path True) | note=生成脚本与参数逐一核对源料库 归档说明.md §三（权威清单），未沿用注册表注释的笼统写法；lockscreen-sentence-drill 据实标「无生成脚本（手工维护原型）」；文档未搬未改任何源文件
