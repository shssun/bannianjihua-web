# 我方事件流（OWNER-LOG.md）

> **唯一写者：team-lead（我方）。**
>
> 一行一条事件，格式同 `docs/EXEC-LOG.md`。
> `<verb>` 白名单：`dispatch` `hold` `claim` `blocked` `verify` `reject` `supersede` `note`
> 全局事件 id 位写 `-`。
>
> `migrated=1` 表示该行由旧双文件契约迁移而来，时间戳是**迁移时刻**而非原始时刻；
> 原始记录见 `docs/archive/BACKLOG.md`。

## 归档（18 项已验证任务）

> T-002 ~ T-022 中状态为 verified 的 18 项，定义 / evidence / 我方验收轨迹见 `docs/archive/BACKLOG.md`。
> 本文件不再复制它们的内容 —— **一个事实只有一个家**。

## 事件

2026-10-14T14:19:00Z | T-001 | dispatch | migrated=1 | priority=P1 | title=补 GitHub Actions 定时探活（防 Supabase 免费版被暂停）
2026-10-14T14:19:00Z | T-013 | dispatch | migrated=1 | priority=P3 | title=复核音频/素材侧遗留（标签偏差 / 帧 OCR / 隔离片段 / whisper 幻觉 / 错别字文件名）
2026-10-14T14:19:00Z | T-014 | dispatch | migrated=1 | priority=P3 | title=补足 movie-line-shadowing 素材（当前仅 11 条 demo）
2026-10-14T14:19:00Z | T-015 | dispatch | migrated=1 | priority=P3 | title=统一 movie-line-shadowing 的站内 URL 层级（sync 增加 stripPrefix）
2026-10-14T14:19:00Z | T-023 | dispatch | migrated=1 | priority=P1 | title=把「每日英语」源料按需镜像进 `_src-tmp/` 并备好源侧改动（**我方自行执行，执行方请跳过**）
2026-10-14T14:19:00Z | T-024 | dispatch | migrated=1 | priority=P1 | title=新建「函数参数实验室」工具（math 频道第一个落地工具）
2026-10-14T14:20:00Z | T-023 | claim | note=我方自办：按需镜像「每日英语」源料进 _src-tmp/（执行方请跳过）
2026-10-14T14:21:00Z | - | note | kind=cutover | detail=沟通通道由 BACKLOG.md/EXEC-REPORT.md 切换为 TASKS.md/OWNER-LOG.md/EXEC-LOG.md
2026-10-14T14:23:00Z | T-025 | dispatch | priority=P1 | depends=T-024 | title=参数实验室第二期：补齐 6 个跨章场景，升级为「高中数学参数实验室」
2026-10-14T15:02:41Z | T-024 | verify | result=pass | commit=1b5441e | files=public/tools/math/function-param-lab/index.html,src/data/tools/math/function-param-lab.ts,src/data/collections.ts | checks=check-tools:0,tsc:0,vite-build:0,probe:pass | note=独立复验 10/10 通过。真跑用子路径计数法：y=k/x 曲线绘为 2 个独立子路径（左支 x∈[0,394]、右支 x∈[396,790]），y 轴像素列 x0=395 无曲线落笔，即 x=0 处断开且无穿屏竖线；判别器经阳性对照（正确 2 支）与阴性对照（人为穿屏连线 1 支）双向自证有效；二次场景同法测得子路径数=1，证明判据有区分度。另：a=0 图象退化为直线且带 warn 文案、a 取负开口与值域同步翻转、控制台零异常
2026-10-14T16:38:30Z | T-025 | reject | result=fail | commit=333a61b | files=public/tools/math/function-param-lab/index.html | checks=check-tools:0,tsc:0,external-ref:0,dynamic-eval:0,scenario-ids:6of6,name-updated,build:0 | probe=deadloop | note=打回：真跑阻塞。public/tools/math/function-param-lab/index.html 的 drawGrid 纵向刻度循环被写成 for (var gy = ...; gy <= yMax; y += yStep)——自增变量错写成外层残留的 y，gy 永不递增，循环不终止，渲染器主线程永久阻塞、整页卡死，故真跑 acceptance ①~⑥ 全部无法判定（页面根本不渲染）。回归溯源：T-024 提交 a61cee6 该行为 gy += yStep（正确），T-025 提交 333a61b 把这一行改错。证据①（独立于自建 CDP）：chrome --headless=new --dump-dom 对本仓库该文件 15s 超时被杀、输出 0 字节；仅把这一处改回 gy += yStep（副本落在仓库外，未动仓库任何文件）后同一命令退出码 0、输出 50137 字节 DOM。证据②：自建 CDP 探针在该页面上连 Runtime.enable 都超时，而同一 Chrome 与探针在 about:blank 与修复副本上均正常。证据③（阳性对照）：修复副本上我方 11 项真跑判据全绿——幂函数 α=−1 曲线被拆成 2 个子路径、0 个子路径跨 y 轴、两侧断口距 y 轴 0.5px（对照：连续曲线 y=aˣ 被判为跨 y 轴 1 条，说明判据有区分度；合成样例阴阳双向自证通过）；定轴动区间最值换点读数与探针内独立复算逐项一致（a=2 最小值 −1 @ 顶点、a=5 −18 @ x=3 端点、a=0.5 3 @ x=1 端点）；q=1 十点精确共线且出临界徽标、q=2 明显非共线；φ=π/3 时 ω=2 读数 π/6、ω=4 读数 π/12 且 φ 仍显示 π/3；2a<2c 不画任何曲线并出空集提示、2a=2c 退化线段、2a>2c 闭曲线 361 点；控制台 onerror 0、console.error 0、CDP 异常 0。结论：唯一阻塞点就是这一行，静态 acceptance（check-tools 0、tsc 0、零外部引用、无 eval 与 new Function、6 个新场景 id 全命中、注册表 name 已是数学参数实验室、集合 path 校验通过、仓库外 vite build 0）我方已独立复跑全绿，修复后可直接 verify。需补判据：把该行改回 gy += yStep，并随 done 附一条真跑证据（无头浏览器加载该页 dump-dom 退出码 0 且输出非空，或等价 CDP 探针能取到 DOM 与读数）。附注（不构成打回）：deviation② 以删除（待建）缺口步代替「换成真实步骤」，因 check-tools 禁止同一路径重复 toolId，而本卡 acceptance 对该项的判据就是「check-tools 通过」，故验收可接受；但高中数学集合的学习路径因此只剩一步，若要保留「后续步骤」语义须另立新卡。deviation①③（构建 outDir 用仓库内临时目录、ω 与 2a 无归零按钮）不影响验收。
