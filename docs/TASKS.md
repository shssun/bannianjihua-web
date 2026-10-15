# 任务卡（TASKS.md）

> **唯一写者：team-lead（我方）。执行方只读，一个字都不要改。**
>
> **三条铁律**
> 1. **只追加，不修改。** 任何人不得删除、改写、重排已有行。
> 2. **不写别人的文件。** 我方只碰本文件 + `docs/OWNER-LOG.md`；执行方只碰 `docs/EXEC-LOG.md`。
> 3. **任务 id 单调递增、永不复用。** 改需求 = 追加一张**新卡**，旧卡在 `OWNER-LOG.md` 写一条 `supersede`；**绝不原地改旧卡**。
>
> **状态不存储，只推导**：取两条日志中该 id **时间戳最新**的一条事件（见 `docs/AI-HANDOFF.md` §7）。
>
> 通道切换：`2026-10-14T14:21:00Z` 起生效。此前 18 项已验证任务的定义与验收记录见
> `docs/archive/BACKLOG.md`（不删，可追溯）。

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

## T-023 · 把「每日英语」源料按需镜像进 `_src-tmp/` 并备好源侧改动（**我方自行执行，执行方请跳过**）

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

## T-025 · 参数实验室第二期：补齐 6 个跨章场景，升级为「高中数学参数实验室」

priority: P1
area: public/tools/math/function-param-lab/index.html, src/data/tools/math/function-param-lab.ts, src/data/collections.ts
depends: T-024
size: L
spec: ⚠️ **本项依赖 `T-024`，`T-024` 变 `verified` 之前请勿领取** —— 场景注册结构由 `T-024` 定型，提前做必然返工。

**目标**：`T-024` 交付的是 6 个「函数」场景。本项把它扩成覆盖**高中全章**的参数实验室 —— 老板原话：「高中数学有很多容易误解的点，所以我希望能有个全面的」。

**精确规格全文**：`docs/MATH-SCENARIOS.md`**第一~第八节**（共 8 个场景，每节含「场景配置 / 分支表 / 解析式精确读数规则 / 临界点徽标文案 / 断言列表」）。**以该文件为准**，本卡只写边界与判据。

**净新增 6 个场景**：

| # | 场景 id | 出处 | 一拖就现形 |
|---|---|---|---|
| 1 | `power-function-x-alpha` | #18 幂函数 | 定义域随 α **跳变** |
| 2 | `quadratic-fixed-axis-moving-interval` | #13 定轴动区间 | 顶点滑出区间，**最值换点** |
| 3 | `geometric-sum-q-one` | #30 等比 Sₙ | 指数型 → 直线型**突变** |
| 4 | `trig-phase-shift` | #24 三角平移 | 实际平移是 **φ/ω** 不是 φ |
| 5 | `slope-undefined` | #54 斜率不存在 | 倾角→90°，直线变竖直、点斜式**失效** |
| 6 | `ellipse-2a-2c` | #59 椭圆退化 | 椭圆 → 线段 → **消失** |

**并入已有场景（不要新增重复场景）**：
- `T-024` 的 `y = ax² + bx + c` 场景**增加**：`Δ = b²−4ac` 读数 + 与 x 轴交点个数（2 / 1 / 0）+ `Δ=0` 临界点徽标（见 `MATH-SCENARIOS.md` 第三节）。
- `T-024` 的 `y = aˣ` 场景**升级**：加 `a→1` 时曲线塌平 / 单调翻转的临界提示；补「值域恒 `(0,+∞)`，**不随 a 变**」这句反直觉结论（见第四节）。

**结构要求**：
- 场景必须走**可扩展的注册结构**：一个 `SCENARIOS` 数组，每项自带 `{id, group, label, params[], eval, readout, conclude}`。若 `T-024` 未这样实现，**本期顺带重构**成该结构。
- 12 个场景按章分**三组**标签：`函数与基本初等` / `数列与三角` / `解析几何`，组内再切场景 tab。
- 注册表 `name` 由「函数参数实验室」改为「**数学参数实验室**」；⚠️ **`id` 与文件路径保持不变**（仍是 `function-param-lab`），避免全站链接与路径 churn。
- 集合 `high-school-math` 的 `path` 补齐：把 `T-024` 留的「（待建）」缺口步换成**真实步骤**（引用本工具的 `toolId`），保持 `check-tools` 通过。

**继承 `T-024` 的全部技术硬约束（一个字都不放宽）**：手写 Canvas 2D、**零第三方库**、**禁 `eval` / `new Function`**、断点处**绝不画穿屏竖线**、按画布像素列采样、高 DPI（`devicePixelRatio` + `setTransform`）。

**新增场景的断点要求**：
- `y = x^α`：α<0 时 `x=0` 处**必须断开**
- 若场景涉及 `y = tan x`：`x = π/2 + kπ` 处**必须断开**
- 椭圆退化（`2a ≤ 2c`）：**不得画出复数解**，只给退化提示与图形（线段 / 点 / 消失）

**参数必须能取到临界值**（本项目核心设计原则）：滑块范围**不得排除**临界值（α=0、q=1、φ=0、α=90°、2a=2c……），临界处必须出徽标文案，且每个滑块配「归零」小按钮。

acceptance:
- `node scripts/check-tools.mjs` 退出码 0（工具总数仍 **19**、`math` 频道仍 **2** —— 本项**不新增工具**，只扩场景）
- `npx tsc -b` 退出码 0
- **零外部引用**：`grep -nE "<(script|link)[^>]*(src|href)=" public/tools/math/function-param-lab/index.html` **无输出**
- **不用动态求值**：`! grep -qE "\b(eval|new Function)\s*\(" public/tools/math/function-param-lab/index.html`
- **6 个新场景 id 全部出现在产物里**：对 `power-function-x-alpha`、`quadratic-fixed-axis-moving-interval`、`geometric-sum-q-one`、`trig-phase-shift`、`slope-undefined`、`ellipse-2a-2c` 逐条 `grep -q`，全部命中
- 注册表 `name` 已更新：`grep -q "数学参数实验室" src/data/tools/math/function-param-lab.ts`
- 集合 `path` 缺口已补齐：`node scripts/check-tools.mjs` 通过即为证（它会校验 `path[].toolId` 在注册表、属于本集合、且缺口步必须带 `todo`）
- 不跑 `npm run build`；构建验证用 `npx vite build --outDir ../_buildcheck`，退出码 0
- 真跑（人工项，**我方会用无头浏览器独立复验**）：① `y=x^α` 拖到 α=−1，`x=0` 处**断开、无穿屏竖线**；② 定轴动区间把顶点拖出区间，**最值换点**且读数随之变；③ 等比 Sₙ 把 q 拖到 **1**，图象从指数型**突变成直线**且有临界徽标；④ 三角平移拖 φ，读数显示的**实际平移量 = φ/ω**；⑤ 椭圆把 2a 拖到 `< 2c`，退化提示出现；⑥ 控制台零报错。

## T-026 · 线上从未注入 Supabase 环境变量 —— 留言板实为 fallback 演示数据

priority: P1
area: .github/workflows/deploy.yml, src/services/, src/lib/, docs/DATABASE.md
depends: —
size: M
spec: **这是一条已实测确认的真缺陷，不是猜测**（首次登记在 `T-001` 的 blocked note 里，当时判为「超出 T-001 范围」故未立项）。事实链：① 生产 bundle 里**没有** `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 的值；② 仓库里只有空的 `.env.example`，`.env` 不入库；③ `.github/workflows/deploy.yml` 的构建步骤**没有**把仓库 Secrets 传进去 → 生产构建时这两个变量是 `undefined`；④ `src/services/` 的 Supabase 客户端因此拿不到地址，走 `APIResult` 的 `fallback` 分支；⑤ 结果：**留言板页面上显示的「留言」是代码里内联的演示数据，点提交也写不进任何地方**。用户看到的是一个"能用"的留言板，其实一个字节都没落库 —— 这比直接报错更糟，因为它**静默**。

**要求**：

1. **构建注入**：`deploy.yml` 的构建步骤从 `secrets.SUPABASE_URL` / `secrets.SUPABASE_ANON_KEY` 读入并注入为构建期环境变量（`VITE_` 前缀）。仓库内**禁止**出现明文密钥。
2. **缺失时不再静默降级**：env 缺失时，fallback 数据必须**可识别**——UI 上明确标出「未配置数据库，以下为演示数据」，并留 `console.warn`。**不得**把演示数据当作真实数据展示而不作任何提示。
3. **文档**：`docs/DATABASE.md` 写明「生产构建需要哪两个 Secrets」与「未配置时的行为」。

⚠️ 本项的**最终线上接通验证**与 `T-001` 共用同一个前置（仓库 Secrets 里得真有这两个值）。若 Secrets 仍未配置，本项做到「代码侧就绪 + 降级行为可验证」即可，**交付时不得声称线上已接通**。

acceptance:
- 构建注入已配置：`grep -q "VITE_SUPABASE_URL" .github/workflows/deploy.yml` 且 `grep -q "secrets\." .github/workflows/deploy.yml`
- 仓库内无明文密钥：`! grep -rInE "supabase\.co|eyJ[A-Za-z0-9_-]{10,}" .github/workflows/`
- 降级已可见（真跑）：在**不带** env 的构建产物上打开留言板，页面必须出现「演示数据 / 未配置」之类的明确提示；控制台有对应 warn
- 文档已更新：`grep -q "SUPABASE_ANON_KEY" docs/DATABASE.md`
- `npx tsc -b` 退出码 0；`npx vite build --outDir ../_buildcheck` 退出码 0（**不要**跑 `npm run build`）

## T-027 · 恢复「高中数学」集合的学习路径后续步骤（path 现仅剩一步）

priority: P3
area: src/data/collections.ts
depends: —
size: S
spec: `T-025` 交付时，`high-school-math` 集合的 `path` 原本是两步：第 1 步指向 `function-param-lab`，第 2 步是带 `todo` 的「（待建）」**缺口步**。`T-025` 按卡面要求「把缺口步换成真实步骤」，但实际做法是**删除**了缺口步而非替换 —— 原因是 `scripts/check-tools.mjs` **禁止同一 path 里重复出现同一个 `toolId`**，而 math 频道当时只有 `function-param-lab` 一个工具，凑不出第二个真实步骤。结果：`path` 只剩 1 步，集合页 `LearningPath.tsx` 的「后续步骤」语义丢失 —— 学习者看到的是「这个集合只有一步，走完就没了」。

本项**只补回这一步**：在 `path` 数组**末尾追加一个缺口步**，只写 `label` + `todo`，**不要**写 `toolId`。`check-tools` 对缺口步的要求正是「必须带 `todo`」，所以这是被允许、被鼓励的形态（缺口步本就该渲染成「待建」而不是假链接）。

⚠️ **不要**为了凑数而重复引用 `function-param-lab` —— 会直接撞校验。

acceptance:
- `node scripts/check-tools.mjs` 退出码 0
- 缺口步确实在集合段内：`node -e "const t=require('fs').readFileSync('src/data/collections.ts','utf8');const i=t.indexOf(\"id: 'high-school-math'\");const seg=t.slice(i,i+900);if(!/todo\s*:/.test(seg)){console.error('未在 high-school-math 段内找到缺口步');process.exit(1)}"` 退出码 0
- 真跑（人工项，我方独立复验）：打开 `/tools/collection/high-school-math`，学习路径出现**第二步**，且它以「待建」形态渲染而**非**假链接
- `npx tsc -b` 退出码 0


## T-028 · movie-line-shadowing 补全至 368 条并统一下沉 URL 层级（合并 T-014 + T-015）

priority: P1
area: scripts/sync/movie-line-shadowing.json, scripts/sync-tools.mjs, public/tools/english/movie-line-shadowing/, src/data/tools/english/movie-line-shadowing.ts
depends: T-023
size: L
spec: ⚠️ **本卡取代 T-014 与 T-015 的落地方式，两张旧卡不改动（只追加）。** 老板指令：「这个页面只有一部分视频，请补全并去重」。实测：线上 `tool/data.json` 仅 **11** 条，真源 `D:/workspaces/每日英语台词/tool/data.json` 有 **386** 条；真源根目录 394 个 mp4（386 条对应 **256 MB**）、`tool/voices/` **1887** 个 mp3（943 组 `_aria`/`_sonia`）。二者必须一次做完，理由：① 分两次 = 两次 256 MB 全量拷贝；② `npm run build` 的 `prebuild` 会调 `sync-tools.mjs`，**T-015 的源侧 `'../'`→`'./'` 与仓库内侧必须同批生效**这个坑根本绕不开；③ 三个 `index.html`（两个源 + 仓库副本）sha1 全为 `47a819c8011855244ba798a8a486b74a88edc93b`，是同一份前端。

**去重结论（老板两轮拍板）**：22 组 `(1)`/`1` 后缀同名变体，**sha1 内容比对全部不同**（0 组真重复）；其中 `你真美1.mp4` / `你鼓舞了我1.mp4` / `我们扯平了1.mp4` 磁盘上**没有无后缀版本** = 独有条目，**不得删除**，改为去掉后缀当正式名保留。真双版本的 18 条删除（`振作起来(1).mp4` 不在 data.json 内，故实际删 18）。**最终 368 条 / 245.9 MB 视频 + 31 MB 语音**。磁盘 394 个 mp4 的 sha1 比对 0 组同内容重复。

**落地步骤**（缺一即线上视频全 404）：
1. `scripts/sync-tools.mjs` 新增 `stripPrefix` 字段（rename 命中则直接作目标、不再 strip；`required` 仍按**源**路径判定）
2. `scripts/sync/movie-line-shadowing.json`：`src` 改为 `D:/workspaces/每日英语台词`，加 `stripPrefix: "tool/"`，加 `rename` 映射 3 条独有条目，exclude 挡住源侧 `*.py` / `__pycache__` / `_audit/` / `_logs/` / `audio*/` / `audio/` / `audio_norm/` / `tool_phrase/` / `*.sh` / `_preview.html`
3. **同批**把真源（两个源目录各一份）`tool/index.html` 第 288 行 `mediaUrl` 的 `'../'` 改为 `'./'` —— 与产物上移一层同步生效
4. 跑 `npm run sync:tools` 产出 368 条 → `npm run check:tools` → 更新 `Tool.entry` 为 `tools/english/movie-line-shadowing/index.html`
5. 真跑验证：`--dump-dom` 必须 exit 0 且 DOM 字节数正常（**静态检查必然假绿**，本项目曾有死循环让 check-tools/tsc/vite build 全绿的教训）

acceptance:
- 产物已上移：`test -f public/tools/english/movie-line-shadowing/index.html` 且 `test ! -d public/tools/english/movie-line-shadowing/tool`
- 条目数 = 368：`node -e "const j=require('./public/tools/english/movie-line-shadowing/data.json'); if(j.items.length!==368){console.error('期望 368 实得 '+j.items.length);process.exit(1)}"` 退出码 0
- 无残留后缀重复项：`! ls public/tools/english/movie-line-shadowing/*.mp4 | grep -qE '\(1\)\.mp4$'`
- 三个独有条目已改名保留：`test -f "public/tools/english/movie-line-shadowing/你真美.mp4"` 且同名 3 个均存在
- 源侧改动已生效：`grep -q "return './' + encodeURIComponent(file)" "D:/workspaces/每日英语台词/tool/index.html"`
- 入口已更新：`grep -q "tools/english/movie-line-shadowing/index.html" src/data/tools/english/movie-line-shadowing.ts`
- `npm run sync:tools` 与 `npm run check:tools` 退出码均 0
- 真跑（我方独立复验）：`chrome --headless=new --dump-dom` 打开线上页面 exit 0 且 DOM 非空；左侧列表项数 = 368
- `npx tsc -b` 退出码 0

## T-029 · 修 movie-line-shadowing 的错别字文件名与 13 条硬幻觉 ASR

priority: P3
area: D:/workspaces/每日英语台词/, scripts/gen-mls-data.mjs
depends: T-028
size: M
spec: 老板指令「补全并去重」已完成（T-028），本卡处理**同批素材的另一类质量问题**。老板 2026-10-15 拍板：**本轮不动，另立卡下轮修**。

**实测量（我方独立复算，非自评）**：
- **错别字文件名**：394 个 mp4 中有 22 个错别字 + 格式异常，两类：
  - 英文：`don't sett;e`（settle）、`hold your hourses`（horses）、`his bark is worse than hit bite`、`mind you own business`（your）、`tahta makes two of us`（that）、`what a conincidence`（coincidence）、`don't ge me wrong`（get）、`give me break`（a break）、`do Dutch`（go Dutch）、`you are way of line`（off）、`the heart wants what the hearts wants`、`take days`（不完整）
  - 中文：`从新开始`（重新）、`对我又什么好处`（有）、`你是万一挑一`（万里）、`你还记得我妈`（我吗）、`你出个价把`（吧）、`你再开玩笑把`（吧）、`在努力一点`（再）、`淡定点`
  - 格式异常：`it is what it is .mp4`、`what am i to you .mp4`（文件名尾部多余空格）
- **13 条硬幻觉 ASR**：判据 = **单句时长 <0.4s 且含 ≥4 词**（物理不可能）。我方三口径复算交集恰 13 条（口径A <0.55s且≥3词 = 70 句/51 条；口径B <0.4s且≥4词 = 14 句/13 条；口径C 每词<0.1s = 22 句/18 条）。

⚠️ **关键坑（必须写进实现）**：这批素材**本身就是按设计把同一句重复 3-9 次**（跟读/磨耳朵机制，如 `洗澡.mp4` 重复 27 次 `Take a shower.`）→ **「重复次数」绝不能当幻觉判据**，用它会误伤 200+ 条。真判据是**时长/词速**。

⚠️ **改名必须三处同改**（否则 404，T-028 已踩过这个坑）：① 真源 mp4 文件名 ② `data.json` 的 `file`/`filenameText` ③ `zh.json` 的 key ④ `voices/manifest.json` 的 key。且 `gen-mls-data.mjs` 的 `REMOVE`/`RENAME` 规则表要同步更新。

⚠️ **ASR 文本修正**只改 `text`/`sentences`，**不要动 `words` 时间戳**（页面靠它做词级跟读高亮）。

acceptance:
- 错别字清单落成文档：`docs/MOVIE-LINE-DATA-FIX.md`（含每条：现名 / 正确名 / 依据）
- 改名后四处一致：`node -e` 脚本校验 `data.json` 的 file 集合、`zh.json` 键集合、`manifest.json` 键集合、磁盘 mp4 文件名集合**四者相等**
- `node scripts/check-tools.mjs` 退出码 0
- `node scripts/gen-mls-data.mjs --check` 退出码 0
- 真跑：`chrome --headless=new --dump-dom` 打开工具页 exit 0 且 DOM 非空、列表项数 = 条目数
- `npx tsc -b` 退出码 0
