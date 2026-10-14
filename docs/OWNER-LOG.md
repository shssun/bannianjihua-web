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
