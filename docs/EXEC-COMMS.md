# 执行方 ↔ 团队 沟通登记（EXEC-COMMS）

> 用途：执行方 AI 的疑问、阻塞与建议在此登记；团队 / WorkBuddy 直接在
> 「回复」区写答复并改状态（open → answered / closed）。互相沟通、
> 不必开会。协议仍以 `docs/AI-HANDOFF.md` 为准，本文件只承载沟通。

| # | 日期 | 主题 | 状态 |
|---|---|---|---|
| Q-01 | 2026-10-14 | T-004 与 T-017 为何仍停留 doing | **answered**（非被拨回，是漏改；已补正并 verified） |
| Q-02 | 2026-10-14 | T-001 需要 SUPABASE_URL（Secrets 或 .env） | **answered**（我方无法提供，已上报老板等待凭证） |
| Q-03 | 2026-10-14 | T-002 与「不动 .workbuddy/」规则冲突，需授权 | **answered**（不授权；本项改由我方自行执行） |
| Q-04 | 2026-10-14 | T-014 / T-015 需写仓库外源目录 | **answered**（新机制 `_src-tmp/` 已上线；「每日英语」源待镜像） |
| Q-05 | 2026-10-14 | T-021 等 push 部署后即可执行 | **answered**（已 push，见 `0eb5c19`，可开工） |

---

## Q-01 T-004 与 T-017 为何仍停留 doing（2026-10-14）

- **现象**：执行方本轮完成并登记 evidence 的任务（T-005/006/007/010/011/018/019/020/022）
  已全部被 team-lead verify，唯独 **T-004（commit=42f1699）与 T-017（commit=b658185）**
  的 status 被拨回 doing，但未写 reject/retract 轨迹、未注明原因。
- **执行方理解**：两任务 evidence 齐全、验收命令当时均真跑通过。
  若是核查中请忽略本条；若是需返工，请在回复中列出具体疑点，执行方优先处理。
- **回复**（team-lead, 2026-10-14 20:25）：
  **不是被拨回，也不是返工 —— 是「漏改 status」，现已补正并 verified。**
  已用 `git log -p -- docs/BACKLOG.md` 追查：在你的 `5b9fcbc` 提交里，你把 7 项从 `todo` 改成
  `done`，但 **T-004 与 T-017 不在其中** —— 这两项你填了 `evidence` 却漏了把 `status` 从
  `doing` 改成 `done`。所以它们既不是 `todo` 也不是 `done`，而是卡在 `doing`。

  **你的 evidence 与制品都没有问题**：我方已独立复核，T-004 **4/4 通过**（幂等风格
  `if not exists`/`drop policy if exists` 共 9 处）、T-017 **5/5 通过**（站内 `index.html`
  与源 sha1 逐字节一致 `419f0833...`）。两项现已 `verified`。

  **我方已就此加固**，避免再犯：
  1. `scripts/backlog.mjs` 的 `scan` 新增 **`staleDoing`** 检测 —— 专门报出「`doing` 但
     `evidence` 已填」的项并给处置建议（已做反证测试）。以后这类漏改会被自动发现。
  2. 协议 §6 纪律 #8 已写明：**`status` 与 `evidence` 是同一动作的两半，必须一起改**。

  **另订正一条协议错误（也是我方的错）**：上一版协议 #9 曾要求你「改完 BACKLOG 必须 `git push`」
  —— **那条是错的，已删除**。正确规则是 **你只 `commit`，绝不 `push`**（见 §6.2）。
  你在 Q-05 里说的「提交但未 push」**才是正确做法**，请继续保持。

## Q-02 T-001 需要 SUPABASE_URL（2026-10-14）

- **背景**：SUPABASE_URL 在仓库、.env、生产 bundle、git 全历史中均不存在
  ——线上从未注入，留言板当前实跑 fallback 演示数据（已写入 T-001 evidence）。
  acceptance#1 要求探活实测，无 URL 无法执行，任务已 blocked。
- **建议**：二选一——
  1. 团队在 GitHub 仓库 Secrets 配置 `SUPABASE_URL` / `SUPABASE_ANON_KEY`（推荐）；
  2. 或把 URL 交给执行方写入本地 `.env`（含于 gitignore，不入库）。
  配好后：用 T-004 的 `supabase/migrations/20261014000000_init.sql` 重建库即可接通。
- **回复**（team-lead, 2026-10-14 20:25）：
  **你的排查是准确的，这条已确认升级为「需老板提供凭证」，我方也无法代答。**
  `SUPABASE_URL` / `SUPABASE_ANON_KEY` 只有老板能拿到（GitHub Secrets 与 Supabase 控制台
  均在我方访问范围之外）。**T-001 保持 `blocked` 是正确的处置，不要硬凑 `done`。**
  你另发现的「线上部署从未注入 Supabase env、留言板跑的是 fallback 演示数据」是一条
  **超出本项范围的真实缺陷**，我方已记录并会单独立项。收到凭证后我方会在此登记解除阻塞。

## Q-03 T-002 与「不动 .workbuddy/」规则冲突（2026-10-14）

- **背景**：T-002 要求压缩 `.workbuddy/memory/MEMORY.md`，但协议规定执行方不碰该目录。
- **建议**：团队明确授权后执行方再动；或改由 WorkBuddy 侧自行压缩。
- **回复**（team-lead, 2026-10-14 20:25）：
  **不授权，本项改由我方自行执行** —— 你的建议 2 被采纳。
  原因：`.workbuddy/` 整个在 `.gitignore` 里，**它不在版本库中，你根本看不到它**，
  所以这项从物理上就做不了（不是权限问题）。且该文件的维护依赖「当前注入上限」这类
  本地实测知识，属我方职责。
  **我方实际上已在做**（MEMORY.md 已重写并订正了多处过时事实）。T-002 将由我方自行收口，
  你会看到它被标为 `verified`；**请跳过它，不要领。** 我方会把它的 spec 改写清楚以免误导。

## Q-04 T-014 / T-015 需写仓库外源目录（2026-10-14）

- **背景**：两任务的源在 `D:/workspaces/每日英语*/`（仓库外），执行方沙箱仅可写仓库内：
  - T-014：素材补足本身在源侧生产（转写/中文/TTS）；
  - T-015：必须同时把源 HTML 的 `'../'` 改 `'./'`，否则同步后视频 404。
- **建议**：源侧修改由团队/WorkBuddy 完成，执行方接手仓库内侧
  （T-015 的 `sync-tools.mjs` stripPrefix 实现与清单启用可先行准备，
  但完整验收依赖源修改后的一次 `sync:tools`）；或为本机执行方开放这两个目录写权限。
- **回复**（team-lead, 2026-10-14 20:25）：
  **我方已建立通用机制，但尚未覆盖「每日英语」这一支** —— 你的分析方向对，采纳你的建议。
  机制叫 **`_src-tmp/`**（协议新增 §6.1）：把**仓库外的源料镜像进仓库内**，让你「看得见」，
  从而能独立完成「改源 → 重新生成」这类活。
  **但本轮镜像的是「英文学习」源料库**（内容 md + Python 生成脚本，57 文件 / 1.4MB），
  **`D:/workspaces/每日英语*/` 还没镜像** —— 所以 T-014/T-015 目前仍按你说的方式办：
  **源侧改动由我方完成**（含 T-015 必须改的源 HTML `'../'` → `'./'`），
  你在仓库内侧先做 `sync-tools.mjs` 的 `stripPrefix` 实现准备。
  我方会择机把「每日英语」源也纳入 `_src-tmp/`，届时会在此登记并知会你。

## Q-05 T-021 等 push 部署后即可执行（2026-10-14）

- **背景**：3 个新工具（T-017/018/019）已在 main 分支提交但未 push，
  线上 URL 不存在，浏览器实测/移动端截图/麦克风授权流程无从执行。
- **建议**：团队 push main 触发 Pages 部署后知会执行方，即刻执行 T-021 全部实测项。
- **回复**（team-lead, 2026-10-14 20:25）：
  **已 push，T-021 可以开工。**
  三个工具均已上线（`b658185` 精编 / `efed21b` 台词金句阅读版 / `22ac675` 锁屏背句），
  其注册表也已按 T-020 要求修正名称与描述；最新线上 commit 为 `0eb5c19`。
  线上 URL 形如：
  - `https://shssun.github.io/bannianjihua-web/tools/english/dragon-english-reader/index.html`
  - `https://shssun.github.io/bannianjihua-web/tools/english/movie-line-quotecards/index.html`
  - `https://shssun.github.io/bannianjihua-web/tools/english/lockscreen-sentence-drill/index.html`

  ⚠️ 执行 T-021 前请先确认 CI 部署已完成（我方已核对线上 `version.json` 与本地 HEAD 一致）。
  你自报的「等部署再执行」判断正确，**这种「依赖外部状态」的阻塞就该标 blocked 并说明**，
  比硬凑完成好得多。

---

## 已解决 / 已订正记录

- **2026-10-14**：T-022 verify 附注指出的 BOOKS-SOURCE.md §2 事实性小错
  已订正——生成脚本数 **15→13 个**、`build_pure_dict.py` **29KB→35,620 B**（实测值），
  并注明 spec 原文与实测的出入。
