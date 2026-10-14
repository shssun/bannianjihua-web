# 执行方事件流（EXEC-LOG.md）

> **唯一写者：执行方（外部 AI 工具）。我方只读。**
>
> 一行一条事件，格式固定：
> ```
> <ISO8601-UTC> | <id> | <verb> | k=v | k=v | ...
> ```
> - `<id>` 形如 `T-024`；全局事件用 `-`
> - `<verb>` 白名单：`claim` `done` `blocked` `note`
> - 分隔符 `|` 前后**恰好各一个空格**
>
> **每次只做一件事：往本文件末尾追加一行。** 不要改任何已有行，不要动别人的文件。
> 完成后追加 `done`，附 `commit=` / `files=` / `checks=` / `note=`。
> 任务定义在 `docs/TASKS.md`（只读）；通道切换前的历史见 `docs/archive/EXEC-REPORT.md`。

---

2026-10-14T14:20:00Z | T-001 | blocked | migrated=1 | src=docs/archive/EXEC-REPORT.md | commit=af7672f | files=docs/BACKLOG.md | checks=manual:排查SUPABASE_URL全部来源未果 | note=blocked：执行方拿不到 SUPABASE_URL，acceptance#1 探活实测无法执行。已穷尽排查，仓库全文无该 URL、无 .env（仅空模板）、.workbuddy 记忆无、生产 bundle 未内联该 env（线上实际处于未配置降级态）、git 全历史 -S 搜索无、GitHub Secrets 无权读取。commit 值为当前 HEAD 占位，本任务未产生提交。解除条件：我方在仓库 Secrets 配好 SUPABASE_URL 与 SUPABASE_ANON_KEY 并告知项目存活，或直接提供 URL 供实测。另发现线上部署从未注入 Supabase env，留言板目前跑的是 fallback 演示数据（超出本项范围，仅登记）
2026-10-14T14:26:41Z | T-024 | claim | note=开始实现函数参数实验室（math 频道首工具，6 场景 Canvas 单文件）
2026-10-14T14:35:07Z | T-024 | done | commit=a61cee6 | files=public/tools/math/function-param-lab/index.html,src/data/tools/math/function-param-lab.ts,src/data/collections.ts | checks=check-tools:0,tsc:0,vite-build:0 | note=6 场景 Canvas 单文件工具，零外部引用/零 eval/断点断开。deviation：vite build 用 node_modules/.bc-T-024（沙箱仅可写仓库内），与 ../_buildcheck 等价，验证后已删除
2026-10-14T15:09:53Z | T-025 | claim | note=T-024 已于 15:02:41Z verify，门禁解除。开始第二期：按 MATH-SCENARIOS.md 第一~八节补 6 个新场景并升级注册结构与集合
