# AI 交接协议（AI-HANDOFF）

> **本文件是唯一真相源。** 若与任何其他文档冲突，以本文件为准。
>
> **2026-10-14 改版**：沟通模型从「共享可变文档」换成「**只追加事件流**」。
> 旧协议（双文件契约）全文见 `docs/archive/AI-HANDOFF-v1.md`。

---

## 0. 一句话

**三个文件、三个写者、只追加、状态靠推导。**

打个比方：旧做法是两个人共用一块白板、各写半边，还得规定「你不能擦我的字」—— 只要有人手滑整块重写，对方的字就没了。新做法是**两本各自独立的本子，而且只准往后翻页写、不许涂改**。

---

## 1. 角色

| 角色 | 是谁 | 干什么 |
|---|---|---|
| **我方**（team-lead） | 半年计划团队 | 定义任务、**独立验收**、`git push`（= 部署） |
| **执行方** | 外部 AI 工具 | 按卡片实现、自测、写事件、`git commit`（**不 push**） |
| **老板** | 人类 | 定方向、拍板 |

---

## 2. 三个文件 —— 一个文件只有一个写者

| 文件 | **唯一写者** | 内容 |
|---|---|---|
| `docs/TASKS.md` | **我方** | 任务卡（`priority` / `area` / `depends` / `size` / `spec` / `acceptance`）。**只追加、写出即冻结** |
| `docs/OWNER-LOG.md` | **我方** | 我方事件流 |
| `docs/EXEC-LOG.md` | **执行方** | 执行方事件流 |

⚠️ `TASKS.md` 里**没有** `status`、**没有** `evidence`、**没有**轨迹 —— 状态**不被存储**（见 §5）。

---

## 3. 三条铁律

1. **只追加，不修改。** 任何一方都不得删除、改写、重排已有行。
2. **不写别人的文件。** 我方只碰 `TASKS.md` + `OWNER-LOG.md`；执行方只碰 `EXEC-LOG.md`。
3. **任务 id 单调递增、永不复用。** 改需求 = 追加一张**新卡**，旧卡在 `OWNER-LOG.md` 写一条 `supersede` 指向新 id；**绝不原地改旧卡**。

> ⚠️ 为什么死守「不写别人的文件」：**写了就必然要协调，协调就必然要抢。** 这不是礼貌条款，是结构条款 —— 旧模型那 12 条例律、1444 行校验器、5 次补丁，全都是为了补偿「两个写者共用一个会变的文件」这一件事。

---

## 4. 事件行格式

```
<ISO8601-UTC> | <id> | <verb> | k=v | k=v | ...
```

| 位置 | 说明 |
|---|---|
| `<ISO8601-UTC>` | 形如 `2026-10-14T14:30:00Z`，**必须 Z 结尾** |
| `<id>` | `T-0NN`；**全局事件写 `-`** |
| `<verb>` | 见下表，**按文件区分白名单** |
| `k=v` | 键匹配 `^[a-z_]+$`；值非空、**不得含 `|`** |

**verb 白名单**

| 文件 | 允许的 verb |
|---|---|
| `docs/EXEC-LOG.md` | `claim` `done` `blocked` `note` |
| `docs/OWNER-LOG.md` | `dispatch` `hold` `claim` `blocked` `verify` `reject` `supersede` `note` |

**格式细节**：分隔符 `|` 前后**恰好各一个空格**。解析时忽略空行、`#` 开头行、`>` 开头行。

**`done` 的推荐写法**（沿用旧 `evidence` 的键名，便于对照）：

```
2026-10-14T15:40:00Z | T-024 | done | commit=abc1234 | files=public/tools/math/function-param-lab/index.html,src/data/tools/math/function-param-lab.ts | checks=tsc:0,check-tools:0 | note=6 个场景均实测
```

---

## 5. 状态是**推导**的，不是存储的

```
任务状态 = 两条日志里所有提到该 id 的事件中，时间戳最新的那一条
```

| verb | 推导出的状态 |
|---|---|
| `dispatch` / `hold` | **todo** |
| `claim` | **doing** |
| `blocked` | **blocked** |
| `done` | **done**（等我方验收） |
| `verify` | **verified**（终态） |
| `reject` | **doing**（打回，等重做） |
| `supersede` | **superseded**（旧卡作废） |

**没有任何优先级表、没有合成函数、没有「谁说了算」。** 每条事件都带时间戳，**后写的赢** —— 这是自然次序，不是一条需要记忆的规则。

> 旧模型为什么会长出「抢夺许可权」：状态物理上存在**两个地方**，于是必须有合成规则 → 有优先级 → 有「谁说了算」。**新模型里，这个问题没有发生的位置。**

---

## 6. 打回：3 步变 1 步

| | 旧（已作废） | 新 |
|---|---|---|
| 我方打回 | `reject` 轨迹（不改 verdict）+ 执行方须 `retract` + 改回 `doing`（跨两文件、三步） | 我方追加**一行** `reject` → 状态自然是 `doing` |
| 执行方重做 | 必须「撤销」自己之前的声明 | 直接再做、再追加一行 `done`。**不需要撤销任何东西** |

---

## 7. 权限铁律

| 项 | 只有谁能做 | 为什么 |
|---|---|---|
| 写 `verified` | **我方** | 防「自己批自己作业」 |
| `git push` | **我方** | **push = 部署** |
| 写 `TASKS.md` / `OWNER-LOG.md` | **我方** | 见 §3 铁律 2 |
| 写 `EXEC-LOG.md` | **执行方** | 见 §3 铁律 2 |

执行方**永远不得**写 `verified`、不得 push、不得动我方两个文件 —— **连改一行也不要**。

---

## 8. 执行方工作纪律（只剩 3 条）

1. **只往 `docs/EXEC-LOG.md` 末尾追加一行。** 不改任何已有行。
2. **做完自测再写 `done`**：`npx tsc -b`、`npm run check:tools` 之类的判据真跑通，把结果写进 `checks=`。
3. **禁止 `git push`。** 只 `git commit`。

---

## 8.1 `_src-tmp/` —— 仓库外源料的**只读镜像**

有些任务的素材在仓库外，执行方看不见。把这些源料**按需镜像**进仓库内的 `_src-tmp/`（已 gitignore），让执行方「看得见」。

**三条规矩**：

1. **只读。** `_src-tmp/` 里的东西**一个字都不许改** —— 它是镜像，不是工作区。
2. **产出必须落在正式目录。** 你在 `_src-tmp/` 里读到的内容，产出的代码/文档要写到**对应的项目目录**（`src/`、`public/`、`docs/`），**不是**写在 `_src-tmp/` 里。
3. **如果你改了 `_src-tmp/工具/*.py`，必须在 `note=` 里写明改了哪一段。** 因为镜像 → 真源是**单向**的，我方需要把这处改动**回填到真源**。你不写，改动就会丢。

**判据必须三方比对**：真源 / 基准清单 / 镜像磁盘。只比前两者会**静默漏过「镜像被直接改动」**（且**两个方向都要查**：真源前进 → 镜像过期；镜像被写 → 脏镜像）。

命令：`npm run src-tmp:check` / `npm run src-tmp:refresh`

### 镜像范围（多源根，2026-10-15 起）

| 源根 | 真源路径 | 镜像落点 | 收哪些 | 文件数 |
|---|---|---|---|---|
| `(根)` | `C:/Users/ZhuanZ1/Documents/WS/英文学习/` | `_src-tmp/`（**不变**） | `内容/**` + `工具/*.{py,html}` + 根 `*.md` | 57 |
| `每日英语` | `D:/workspaces/每日英语/` | `_src-tmp/每日英语/` | `tool/`、`docs/`、`_qa/`、`_tts_logs/`（**不含** `tool/voices/` 的 49 个音频） | 43 |
| `每日英语台词` | `D:/workspaces/每日英语台词/` | `_src-tmp/每日英语台词/` | `_audit/`、`_logs/`、`_taxonomy/`、`_orphan_voices/`、`_zh/`、`tool/`、`tool_phrase/` + 根目录文本文件（**不含** 394 个 `.mp4` 与 `audio*/`） | 90 |

- **只收文本类**：扩展名不在白名单内的一律跳过；单文件 > 3 MB 跳过。这条是「零二进制大件」的**主判据**，不是靠事后扫描补救。
- 镜像**总体积上限 40 MB**（当前 8.91 MB），刷新时超限会**直接 exit 1**。
- `_manifest.json` 的 `sources[]` 逐源根独立成条（`name` / `root` / `prefix` / `count` / `bytes`），因此能区分多个源根。

### ⚠️ 已登记但**故意未落地**的源侧改动（供 T-015 使用）

`D:/workspaces/每日英语/tool/index.html` **第 288 行**（镜像内同位置可见）：

```js
function mediaUrl(file) { return '../' + encodeURIComponent(file); }   // 现状
function mediaUrl(file) { return './' + encodeURIComponent(file); }    // T-015 落地时应改成这样
```

**已定位并复核，但尚未施加到真源。** 原因：这个改动**必须与 T-015 的仓库内侧改动同一批落地**，否则——仓库副本目前位于 `public/tools/english/movie-line-shadowing/tool/index.html`（多一层 `tool/`），其 `'../'` 是**正确**的；一旦真源先改而 `sync:tools`（`prebuild` 会调它）跑过，就会把 `'./'` 灌进这个**仍在 `tool/` 层**的副本 → 线上视频全 404。

**T-015 领卡时请按下述顺序做**（顺序错了就 404）：

1. 先给 `scripts/sync-tools.mjs` 加 `stripPrefix` 并在 `scripts/sync/movie-line-shadowing.json` 启用 `"stripPrefix": "tool/"`；
2. **同一批**里改真源第 288 行 `'../'` → `'./'`；
3. 再跑 `npm run sync:tools`（产物上移到 `.../movie-line-shadowing/index.html`）+ 更新 `Tool.entry`；
4. `npm run check:tools` exit 0。

⚠️ **注意删除配额**：仓库 `public/tools/english/movie-line-shadowing/tool/` 下有 **52 个文件**（49 个在 `voices/`），上移后旧目录被清掉会**超过单回合 50 次删除的宿主闸门**。**这道闸门是对的，不要绕过** —— 应把它设计成增量移动（例如分批 `git mv`，或先移文件再单独删空目录），而不是「清空重拷」。

---

## 8.2 提交与推送的职责边界

- **执行方**：`git commit`（**不 push**）。一个任务一个提交，commit message 里带上 `T-0NN`。
- **我方**：复核通过后统一 `git push` → 触发 GitHub Actions → 部署到
  `https://shssun.github.io/bannianjihua-web/`（**子路径** `/bannianjihua-web/`）。
- ⚠️ **我方不得把未复核的提交一起推上去。** push 前逐条确认每个待推提交都已复核。

---

## 9. 我方扫描 / 验证 / 部署流程

### 9.1 固定动作序列

```bash
node scripts/comms.mjs check      # 格式 + 终态不可逆 + 纯追加
node scripts/comms.mjs status     # 看「done 但未 verified」= 待验收
```

1. `status` 列出待验收 id
2. 逐项**独立复核**（见 9.2）—— **不看执行方自评，自己重跑判据**
3. `OWNER-LOG.md` 追加一行 `verify`（或 `reject`）
4. 我方自己提交 → `git push` → `npm run check:deploy` 核对线上 = 本地

### 9.2 按 `acceptance` 验证（分类型）

| 类型 | 怎么验 |
|---|---|
| 文件存在 / 内容 grep | 真跑那条命令，**看输出**，不要凭印象 |
| 构建 / 类型检查 | `npx tsc -b`、`npm run check:tools`，**退出码必须是 0** |
| 页面行为 | 真浏览器（见 9.3 的 Chrome headless 探针），看 console 有没有 error |
| 「输出为空」类断言 | **先做阳性对照**：故意造一个必然命中的样例，确认探针本身有效 |

⚠️ **只看 `acceptance` 条目。** acceptance 之外的瑕疵只作**附注**，不构成打回。

### 9.3 ⚠️ 本机环境约束（**必须写进所有给执行方的提示**）

| 约束 | 说明 |
|---|---|
| `execFileSync('git', ...)` | **必须** `{ stdio: ['ignore','pipe','pipe'] }`。默认 stdio 在本机宿主沙箱下**稳定抛 `EBUSY`** |
| `npm install` | 必须加 `--include=optional` |
| 批量删除闸门 | 宿主 fs shim 拦截单次 **>50 文件**的删除。**这道闸门是对的，不要绕过** —— 改脚本设计（「清空重拷」→「增量同步」） |
| Vite `emptyOutDir` | 同样会撞上面那道闸门 → 本地验证的 outDir **一律放在仓库内** `node_modules/.bc-<唯一名>`（`node_modules` 已被 gitignore；**每次用全新名**，目录本不存在就不会触发清空删除），**验证后立即删除**。⚠️ **不要再用 `../_buildcheck` 这类仓库外路径** —— 它会把垃圾堆在工作空间上层（2026-10-15 一次性从 `D:\workspaces\` 清出 22 项 ≈1.6 GB） |
| 回收站 | **本沙箱不可用**：`Add-Type`、`[Reflection.Assembly]::Load`、`New-Object -ComObject`（含 `Shell.Application`）三条路全被安全策略拦截 → 做不到「移入回收站」。清理只有两条路：`Move-Item` 到待删目录（由老板自行清空），或永久删除（**须二次确认**） |
| `cpSync` 覆盖已存在文件 | 报 `ESRCH` → 拷单文件用 **`copyFileSync`** |
| 本地 curl 访问 localhost | 必须加 **`--noproxy '*'`** |
| `&` 起的后台进程 | 会随 Bash 调用一起被杀 → 用后台任务机制启动 |
| Windows `cmd.exe` | **`^` 与 `%` 都是元字符**，在 `execSync` 字符串里会被吃掉 |
| 真跑 UI 的探针 | **Chrome headless** 最可靠：`--dump-dom` + `--enable-logging=stderr --v=1`。页面 console 消息格式是 **`:CONSOLE:<行号>]`**（**不是** `:CONSOLE(` —— 写错会得**假阴性**） |
| `gh` CLI | **未登录** → 查 CI 状态靠 `npm run check:deploy` 轮询线上 `version.json` |

**规约（沙箱内）**：本地只做 `commit + push`；本地验证只用
`node scripts/sync-tools.mjs` / `node scripts/check-tools.mjs` / `npx tsc -b` / `npx vite build --outDir node_modules/.bc-<唯一名>`。
CI 里 2600+ 文件跑得通。

### 9.4 部署真相

- `git push origin main` → 触发 `.github/workflows/deploy.yml` → GitHub Pages。
- 站点**子路径** `/bannianjihua-web/`，**三件套缺一即白屏/内链断**：
  ① `vite.config.ts` 的 `base` ② `src/router.tsx` 的 `basename`（**必须带前导斜杠**）③ `src/lib/paths.ts` 的 `BASE_PREFIX`
- build 会注入 `dist/version.json`（`commit` / `commitFull` / `branch` / `buildTime` / `base`）。
- **一键核对：`npm run check:deploy`** —— 比本地 HEAD 与线上 `version.json`。
  判定要**精确比对 `commit` 字段**，别用宽泛 grep。
- ⚠️ **GH Pages SPA**：非物理路径返回 **404 码 + 完整 SPA 外壳**，仍能渲染 → **深链验收不能只看状态码**。

### 9.5 ⭐ 判据铁律

**判定「要不要重做/重拷」时，判据必须是「内容本身」，不是代理指标。**

四个**不成立**的代理：① mtime ② 音频总时长 ③ 文件是否存在 ④ 文件大小。
**第 5 变体**：⚠️ 别用原始字节数比对线上文件（`core.autocrlf` 把 CRLF→LF）→ 先 `tr -d '\r'` 再算 sha1。

**做法**：二进制素材比**内容 sha1**（大小只作预筛）；TTS 指纹记在**合成参数**上，**绝不比对音频字节**；音频正确性用 **silencedetect 语音段时长比**。

**派生铁律**：断言「输出为 0 / 无命中」之前，**先造一个必然命中的样例**，确认**探针本身有效**。

> 实例（本轮踩到）：`docs/BACKLOG.md` 是**全 CRLF**，而 JS 正则里 `.` 不匹配 `\r` → `^key: value$` 整行匹配失败、**静默走兜底分支**。更坑的是那条「必须解析到 `acceptance`」的护栏**靠巧合通过了**（`acceptance:\r` 的值为空，`\s?` 恰好吃掉 `\r`）→ 给了假安全感。修法：**读入即归一化行尾**。

### 9.6 ⭐ 角色边界与回退条件

> ⚠️ 这一条原本**只存在于老板与 team-lead 的对话里**，因此每次上下文压缩都有丢失风险。
> 2026-10-15 老板复核流程时发现该风险，遂固化到本文档。**改了本节要追加 OWNER-LOG 事件。**

**默认路径（不是可选项）**：

| 角色 | 干什么 |
|---|---|
| **老板** | 下任务、拍板决策 |
| **我方（team-lead）** | ① **上游**：调研、拆解、写任务卡与 `acceptance`　② **验收**：独立复核 `done`　③ **部署**：`push`（= 上线） |
| **执行方（Trae）** | 按卡实现、自测、`git commit`（不 push）、写 `EXEC-LOG.md`；**定时轮询**（约 20 分钟）自动认领 `todo` |

**回退条件（两个条件必须同时成立，缺一不可）**：仅当

1. 执行方**进度落后**（队列空转 / 长时间没有新 `done`），**并且**
2. 我方**手头没有上游工作**（没有待拆的任务、没有待写的卡、没有待验收项）

我方才**可以**自行实施具体任务。一旦自行实施，必须：

- 在卡面 title 或 `note` 里显式写明「**我方自行执行，执行方请跳过**」（范例：T-023、T-029、T-030）
- 仍按 §9.2 独立自验，并在 `OWNER-LOG.md` 追加对应 `note` / `verify`

**反过来的责任**：⚠️ **保持 `todo` 队列非空是我方的责任。**
执行方只有在 `todo` 非空时才有活干；**队列空 = 它空转 = 我方上游断供**，
这不是执行方的执行问题，**不要拿它当「执行方效率低」的证据**。
（2026-10-15 实测：执行方最后一次写 `EXEC-LOG.md` 是 `04:57:30Z`，
此后约 19 小时零动作，原因正是上游没喂卡。）

---

## 10. CLI 契约（`scripts/comms.mjs`）

```bash
node scripts/comms.mjs check              # 格式 + id 唯一单调 + 终态不可逆 + TASKS 卡无禁用字段
node scripts/comms.mjs status             # 推导各任务状态 + 汇总 + 待验收清单
node scripts/comms.mjs append-only        # 对三个文件跑 git diff，确认本次改动是纯追加
node scripts/comms.mjs selftest           # 校验器自测
```

- `check` 任一失败 → **exit 1**，打印 `文件:行号: 原因`
- `append-only --base <ref>`：`--base` 默认 `HEAD`

---

## 11. 给执行方的开场白（可直接复制）

> 我们的沟通方式改了。以后**只有一个文件是你的**：`docs/EXEC-LOG.md`。
>
> - **只往它末尾追加一行**，格式：`<ISO8601-UTC> | T-0NN | <verb> | k=v | k=v`
> - 可用的 verb 就四个：`claim`（开工）`done`（完成）`blocked`（卡住）`note`（备注）
> - 任务定义在 `docs/TASKS.md`（**只读**）。原来的 `docs/BACKLOG.md` / `docs/EXEC-REPORT.md` **已作废**，别再写。
> - **不要改任何已有行**。写错了就再追加一行修正，**不要回头改**。
> - 做完自测（`npx tsc -b`、`npm run check:tools`）再写 `done`，把结果放进 `checks=`。
> - **不要 `git push`**，只 `git commit`。push 是我们的事。
> - 有疑问 → 追加一行 `note` 问，不要改别人的文件。
>
> 细节看 `docs/AI-HANDOFF.md` §4~§8。

---

## 附：一次完整交接的时间线

```
OWNER-LOG  2026-10-14T14:40:00Z | T-024 | dispatch | priority=P1 | title=新建「函数参数实验室」
                                    ↓ 状态推导 = todo
EXEC-LOG   2026-10-14T15:10:00Z | T-024 | claim | note=开始实现
                                    ↓ 状态推导 = doing
EXEC-LOG   2026-10-14T16:02:00Z | T-024 | done | commit=a1b2c3d | checks=tsc:0,check-tools:0 | note=6 场景
                                    ↓ 状态推导 = done（待我方验收）
OWNER-LOG  2026-10-14T16:40:00Z | T-024 | verify | result=7/7 | note=独立复核：a=0 退化提示正常、k/x 无穿屏竖线
                                    ↓ 状态推导 = verified（终态）

全程：没有任何一方修改过任何一行，也没有任何一方碰过对方的文件。
```
