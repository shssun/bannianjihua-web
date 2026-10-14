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
2026-10-14T15:57:13Z | T-025 | done | commit=333a61b | files=public/tools/math/function-param-lab/index.html,src/data/tools/math/function-param-lab.ts,src/data/collections.ts | checks=check-tools:0,tsc:0,vite-build:0 | note=净增 6 场景（幂函数 x^α / 二次定轴动区间 / 等比 Sₙ 突变 geometric-sum-q-one / 三角平移 φ-ω / 斜率不存在 slope-undefined / 椭圆退化 ellipse-2a-2c），12 场景按三章分组 tab 可切换；quadratic 并入 Δ 读数与交点个数（解析判定非采样）及 Δ=0 相切徽标；exp 升级 a=1 临界徽标、a≈1 塌平提示与定点 (0,1) 标注；注册表 name 改「数学参数实验室」（id 与路径不变），version 2.0.0。零外部引用与禁动态求值 grep 均通过。deviation①：vite build 用 node_modules/.bc-T-025（沙箱仅可写仓库内），与 ../_buildcheck 等价，验证后已删除。deviation②：卡面设想把集合 path 缺口步换成再引用本工具的真实步骤，但 check-tools 校验器禁止同一路径 toolId 重复，故删除缺口步并把第一步 note 扩为覆盖三章 12 场景。deviation③：ω 与 2a 两参数无归零按钮（0 不在滑块范围内，取 0 会破坏场景有效性），临界值改由预设按钮精确覆盖（q=1、2a=4、a=1、α=90° 等）
2026-10-14T16:08:30Z | - | note | kind=sched-race | detail=本扫描循环启动时 T-025 仅见 claim（doing）；执行中途发现并发的另一执行方实例已在同一 claim 之上完成 feat 提交 333a61b 与 done 事件 58329e9（15:57:13Z）。本轮丢弃自身未提交的重复实现、恢复到 HEAD，未产生 feat 提交；复跑闸门确认 comms-check=0,check-tools=0,tsc=0,vite-build=0（outDir 用 node_modules/.bc-T-025，验证后已删）。提请团队排查调度器重入：两个循环实例曾同时运行
