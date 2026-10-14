# T-021 核查报告：3 个新工具移动端 / 深色主题 / 子路径实测

- 任务：`docs/BACKLOG.md` T-021（只核查出报告，**未修改任何工具 HTML**）
- 执行：执行方 AI，2026-10-14 21:20 (+08:00)
- 被测部署：线上 `version.json` = `fe5df3d`（与本地 HEAD 一致；构建 2026-10-14T13:12:34Z，base `/bannianjihua-web/`）
- 浏览器：本机 Google Chrome **155.0.8059.41**，`--headless=new` + CDP 驱动（Page / Runtime / Network / Log / Emulation / Browser.setPermission）
- 视口：桌面 1239×700 CSS px（窗口 1254 含滚动条）；移动 **375×812 / DPR 2 / touch 模拟**
- 方法说明：acceptance 要求「真实浏览器」，本报告所有数据均来自真实 Chrome 对**线上 URL** 的加载与交互；
  视觉一致性以计算样式 / 布局几何探针量化（截图按 acceptance#3 仅存路径、未读入上下文）；
  探针脚本为一次性 CDP 脚本（gitignored，用后删除），关键复现要点随本报告记录。

---

## 结论速览

| 判定 | 数量 | 条目 |
|---|---|---|
| **阻塞上线** | **0** | 三工具均正常渲染（无白屏）、零 JS 异常、工具自身资源零 404、核心阅读与降级链路可用 |
| **可上线但需打磨** | 5 | ① 移动端横向溢出（精编/语音卡）② 精编桌面整页横向滚动 ③ 主题与站点各说各话 + 两工具共用 localStorage 键互相串扰 ④ `/favicon.ico` 404（唯一 console error）⑤ 锁屏 onerror 指引文案被同刻 onend 覆盖 |

三个线上 URL：
- `https://shssun.github.io/bannianjihua-web/tools/english/dragon-english-reader/index.html`
- `https://shssun.github.io/bannianjihua-web/tools/english/movie-line-quotecards/index.html`
- `https://shssun.github.io/bannianjihua-web/tools/english/lockscreen-sentence-drill/index.html`

---

## 1. dragon-english-reader（英文学习精编）

**渲染 / Console / 子路径**
- `<title>` = 「ドラゴン・イングリッシュ　中文精编」；`body.innerText` 294,132 字符，**非白屏**。
- console 报错 **1 条**（原文）：`[Log] Failed to load resource: the server responded with a status of 404 ()`
  —— Network 对应 `GET https://shssun.github.io/favicon.ico` → **404**（独立工具页无 `<link rel=icon>`，浏览器回退请求**域根** favicon；非 `/bannianjihua-web/` 下资源）。
- JS exception 0、`Network.loadingFailed` 0、**工具自身资源零 404** → 子路径部署无资源加载问题。
- 观察（非本项验收范围）：实测 `h1=15 / h2=232`，与 T-017/T-020 记录的「30 个 h1 / 464 个 h2」为一半关系；全文 294k 字符在位，疑似计数口径或渲染差异，提请团队知悉。

**深色主题**
- 全新配置（独立 user-data-dir，localStorage 为空）实测**默认浅色**：`<html data-theme="light">`，body `rgb(255,255,255)` / 字色 `rgb(30,31,36)`；**不跟随** `prefers-color-scheme: dark`（实测宿主偏好为 dark）。
- 自带切换可用：点「深色」→ `data-theme=dark`、body `rgb(25,25,24)`、按钮变「浅色」，选择存 localStorage(`reader-theme`)；再点恢复。
- 站点首页默认底色 `rgb(11,17,32)`（color-scheme: dark）→ 深色偏好用户从站点新标签页打开本工具，首屏是**亮白底**，且工具主题与站点主题互不相通。

**布局（桌面 1239 CSS px）**
- `documentElement.scrollWidth = 2708`（> clientWidth 1239）→ **整页可横向滚动**。
- 根因：最长行内 `<code>` 几何宽 **2290px**（`right=2708`），沿途无任何 `overflow-x` 容器祖先（探针 `inScroll=""`），长代码不折行直接撑宽页面。
- 桌面顶栏按钮几何在可视区内（菜单 / 搜索 / 深色均 ≤1239），桌面控件不受影响。

**布局（移动 375×812）**
- `scrollWidth = 2310`（vs clientWidth 375）；宽元素均为长 `<code>`（2290 / 1942 / 1491 …，无滚动容器）。
- 连带：fixed `header.topbar` 被撑到 **1500px**（x=0, z-index 50）→ 顶栏右侧控件移出可视区：
  - `#menuBtn`「目录」x=16–65：**可见可点**（`elementFromPoint(20,28)` 命中），侧栏抽屉 x=−312 屏外待开，导航可用；
  - `#search` 搜索框 x=1273–1423：**移出可视区**；
  - `#themeBtn`「深色」x=1435–1484：**移出可视区**（`elementFromPoint(360,28)` 命中空白 header）。
- 结论：移动端正文章节可读、目录导航可用；整页横向可扫，**搜索与主题切换在移动端不可达**。

截图：`docs/t021-qa/dragon-english-reader-desktop.png`（1254×700）、`docs/t021-qa/dragon-english-reader-mobile.png`（750×1624）

## 2. movie-line-quotecards（台词金句语音标注 · 阅读版）

**渲染 / Console / 子路径**
- `<title>` = 「台词语音卡 v0.2 ｜ 背句优先版」；`h1=1 / h2=13`（与 T-020 记录「1 文档 13 章节」一致）；正文 10,810 字符，**非白屏**。
- console error 0、exception 0、404 0（favicon 404 在同浏览器会话内被同源缓存，首个请求方记录）；**工具资源零加载失败，子路径安全**。

**深色主题**
- 全新配置实测**默认浅色**（`rgb(255,255,255)` / `rgb(30,31,36)`，localStorage 为空）；自带「深色」按钮，切换后 `rgb(25,25,24)`，与精编同一套模板配色。
- ⚠️ 两工具共用**同一个 localStorage 键 `reader-theme`**（同 origin）：在精编里选过主题后再打开语音卡，语音卡直接继承该值（实测可见）——工具间主题状态互相串扰；且均不跟随站点 / 系统深色偏好。

**布局**
- 桌面：`scrollWidth = clientWidth = 1239`，**无整页横向滚动**（1 个 1285px 的 `<code>` 处于折叠/裁剪容器内，不撑宽页面）。
- 移动 375×812：`scrollWidth = 569`（vs 375）→ **整页横向可扫 194px**；主因为 **507px 宽的 `<table>`**（无滚动容器祖先），长 `<code>` 次之。
- fixed `header.topbar` 同步被撑到 569px：`#menuBtn` 可见可点；`#themeBtn` x=504–553 **移出可视区**；`#search` x=342–492 仅左缘 33px 露边（`elementFromPoint(360,28)` 勉强命中输入框），实际不可用。

截图：`docs/t021-qa/movie-line-quotecards-desktop.png`（1254×700）、`docs/t021-qa/movie-line-quotecards-mobile.png`（750×1624）

## 3. lockscreen-sentence-drill（锁屏背句 · 可行性原型）

**渲染 / Console / 子路径 / 布局**
- `<title>` = 「锁屏背句 · 可行性原型 v0.1」；h1=1 / h2=4，**非白屏**。
- console error 0、exception 0、404/加载失败 0。
- 自带深色：body `rgb(11,13,18)` / 字色 `rgb(232,236,243)`，与站点首页底色 `rgb(11,17,32)` 接近，**视觉一致，无独立主题切换**。
- 桌面 `scrollWidth=clientWidth=1239`、移动 `scrollWidth=clientWidth=375`：两轮**零越界元素**；移动端无 fixed/sticky 元素（**零横向溢出、零遮挡**），三工具中移动端表现最干净。

截图：`docs/t021-qa/lockscreen-sentence-drill-desktop.png`（1254×700）、`docs/t021-qa/lockscreen-sentence-drill-mobile.png`（750×1624）

### 3.1 麦克风权限与手动降级专项（acceptance#2）

- **安全上下文**：页面 `window.isSecureContext === true`（线上 HTTPS，满足 Web Speech API 要求）；`window.webkitSpeechRecognition` 原型存在。
- **真实浏览器的权限弹窗属浏览器原生 chrome UI**，headless 环境无法渲染/截取弹窗本体；拒绝路径改用 CDP `Browser.setPermission({name:'microphone'}, 'denied')` 对该 origin **显式拒绝**后真点按钮实测。
- 点击 `#mainBtn`（🎤 按住说话）后按钮立即变「⏹ 结束并判定」、状态「聆听中…请说出英文原文」→ **`recog.start()` 确实被触发**。
- 权限拒绝后，98ms 内 `#status` 变化序列（MutationObserver 实录）：
  1. `聆听中…请说出英文原文`
  2. `麦克风不可用（not-allowed）——请用下方「手动输入复述」。`（`onerror`，e.error=`not-allowed`）
  3. `没有捕捉到语音。`（`onend`，**同一毫秒覆盖上一条**）
- **手动降级实测可用**：「兜底：手动输入复述」区块常驻（无麦克风也可见），输入
  `some birds are not meant to be caged` 点「按这段文本判定」→ 判定链路完整运行：
  标准答案 7 词 / 识别 8 词 / 顺序命中率（LCS）**86%** / 漏 1 词（容错 1）/ 结论「**通过 · 解锁**」/
  词表渲染 7 行 / 状态「命中 6/7，漏 1 词（容错 1）——词序都对上了。」
- 打磨点：拒绝后用户最终停留在「没有捕捉到语音。」，onerror 那句明确指引手动输入的文案只存在于同一事件循环的一瞬间（被 onend 覆盖）；好在手动输入区本就常驻且实测可用，**不构成阻塞**。

拒绝场景截图：`docs/t021-qa/lockscreen-mic-denied.png`（1254×700）

---

## 4. 打磨项与建议（修复请另开任务；本项按 spec 未改 HTML）

1. **移动端横向溢出（精编 2310 / 语音卡 569 @375）**：长 `<code>` 不折行、语音卡 507px `<table>` 无横向滚动容器；
   副作用是 fixed 顶栏被撑宽、搜索/主题按钮移出可视区。两工具系同一套页面模板，建议同源侧一次性修：
   代码/表格容器加 `overflow-x:auto`（或长 token 断行）+ 顶栏宽度约束（如 `width:100%;max-width:100vw`）。
2. **精编桌面整页横向滚动**（2708 vs 1239）：同一根因（长 `<code>`），随第 1 条一并修复。
3. **主题各说各话**：精编/语音卡默认浅色、不跟随系统/站点深色偏好；两工具又共用 `reader-theme` 键导致跨工具串扰。
   建议：默认值跟随 `prefers-color-scheme`（或站点约定）、localStorage 键按工具 id 区分。
4. **`/favicon.ico` 404**：独立工具页缺少 icon link（唯一 console error）。可在模板头加站点 favicon 引用（子路径需用相对/正确 base）。
5. **锁屏降级文案覆盖**：`onend` 在无结果时可保留 onerror 的指引（如 onerror 置标记，onend 不覆盖），或把「请用下方手动输入」做成常驻醒目提示。

> 以上 1/2/3/4 涉及的 HTML 均为**仓库外源料库生成物**（见 `docs/BOOKS-SOURCE.md` 与 T-021 spec），
> 应由源侧模板修改后重新生成/同步，执行方不在本项内直接改制品。

## 5. 截图清单（存盘路径，未读入上下文）

| 文件 | 尺寸(px) | 场景 |
|---|---|---|
| `docs/t021-qa/dragon-english-reader-desktop.png` | 1254×700 | 精编 · 桌面（默认浅色） |
| `docs/t021-qa/dragon-english-reader-mobile.png` | 750×1624 | 精编 · 375×812@DPR2（横向溢出） |
| `docs/t021-qa/movie-line-quotecards-desktop.png` | 1254×700 | 语音卡 · 桌面（浅色） |
| `docs/t021-qa/movie-line-quotecards-mobile.png` | 750×1624 | 语音卡 · 375×812@DPR2（横向溢出） |
| `docs/t021-qa/lockscreen-sentence-drill-desktop.png` | 1254×700 | 锁屏 · 桌面（深色） |
| `docs/t021-qa/lockscreen-sentence-drill-mobile.png` | 750×1624 | 锁屏 · 375×812@DPR2（零溢出） |
| `docs/t021-qa/lockscreen-mic-denied.png` | 1254×700 | 锁屏 · 麦克风被拒后的状态（手动区可见） |

## 6. 验收对照（acceptance 自述）

1. 三工具线上 URL 真实浏览器逐一打开：console 原文、白屏、视觉冲突均已逐工具记录（§1–3）—— **满足**。
2. 锁屏麦克风：安全上下文与 start() 触发已证；拒绝（CDP 显式 deny）后的行为与手动降级链路已实测（§3.1）—— **满足（意图验证，弹窗本体为浏览器原生 UI 无法在 headless 截取，已注明）**。
3. 三工具 375×812 截图各一张（含 1 张降级场景共 7 张），路径见 §5；横向溢出/遮挡以几何探针量化 —— **满足（截图按约定未读入上下文）**。
4. 阻塞 vs 打磨分类 —— 见「结论速览」：**阻塞 0 项、打磨 5 项**。
