# movie-line-shadowing 数据修复清单（T-029 交付物）

> 任务卡：`docs/TASKS.md` → **T-029**（acceptance #1 指定本文件）
> 真源（仓库外，只读镜像见 `_src-tmp/`）：`D:/workspaces/每日英语台词/`
> 产物：`public/tools/english/movie-line-shadowing/`（368 条，由 `scripts/gen-mls-data.mjs` 从真源 386 条去重生成）
> 事件记录：`docs/OWNER-LOG.md`

## 0. 判据原则（先说清楚，再列清单）

| 项 | 判据 | **绝不能用的代理指标** |
|---|---|---|
| 错别字文件名 | **ASR 正字文本**（`data.json` 的 `text`/`sentences[].text`）与**中文正字**（`zh.json` 的值）——文件名与之不符即为错字 | 文件大小 / mtime / 「看着像错字」 |
| ASR 文本幻觉 | **零长词数**（`words[]` 中 `end - start <= 0` 的个数） | ⚠️ **重复次数**——本批素材按设计就把同一句重复 3~9 次（跟读/磨耳朵），用重复次数当判据会误伤 200+ 条 |
| 音频是否切错 | **语音段时长比**（ffmpeg 16k PCM + 20ms RMS，噪声底 +7dB） | 音频文件大小 / 总时长 |

**改名落点（四处，缺一即 404 —— T-028 已踩过该坑）**：真源 mp4 文件名 · `data.json` 的 `file` + `filenameText` · `zh.json` 的键 · `voices/manifest.json` 的 `items` 键。
实际实现只在**规则表**里加映射（`gen-mls-data.mjs` 的 `RENAME` + `sync-tools.json` 的 `rename`），由脚本自动同步四处，**不手改真源 JSON 键名**。

---

## 1. 错别字 / 格式异常文件名（任务卡 22 条逐条处置）

「批次」列：`一` = 2026-10-15 第一批（commit `14ffa58`）；`补` = 同批补做（卡面已列但首轮漏改，ASR 正字明文给出）；`不改` = 经核非错字。

| # | 现名 | 正确名 | 依据（正字真源） | 批次 |
|---|---|---|---|---|
| 1 | `don't ge me wrong.mp4` | `don't get me wrong.mp4` | ASR: "**don't get me wrong**"；`ge` → `get` 漏字母 | 一 |
| 2 | `don't sett;e.mp4` | `don't settle.mp4` | ASR: "**don't settle**"；`;` 误击（应为 `l`） | 一 |
| 3 | `give me break.mp4` | `give me a break.mp4` | ASR: "Give me **a** break!"；漏冠词 `a` | 一 |
| 4 | `his bark is worse than hit bite.mp4` | `his bark is worse than his bite.mp4` | ASR: "worse than **his** bite"；`hit` → `his` | 一 |
| 5 | `hold your hourses.mp4` | `hold your horses.mp4` | ASR: "Hold your **horses**"；`hourses` → `horses` | 一 |
| 6 | `tahta makes two of us.mp4` | `that makes two of us.mp4` | ASR: "**that** makes two of us"；`tahta` 字母换位 | 一 |
| 7 | `the heart wants what the hearts wants.mp4` | `the heart wants what it wants.mp4` | ASR 末句: "what **it** wants"；`the hearts` → `it` | 一 |
| 8 | `what a conincidence.mp4` | `what a coincidence.mp4` | ASR: "What a **coincidence**"；多 `n` | 一 |
| 9 | `do Dutch.mp4` | `go Dutch.mp4` | ASR: "I don't **go Dutch** on the first day." / "We'll **go Dutch**."；漏首字母 `g` | **补** |
| 10 | `you are way of line.mp4` | `you are way out of line.mp4` | ASR: "way **out** of line"；漏 `out` | 一 |
| 11 | `mind you own business.mp4` | `mind your own business.mp4` | ASR: "mind **your** own business"；`you` → `your` | 一 |
| 12 | `take days.mp4` | **不改** | ASR: "It would **take days**."；文件名即句中短语，**非错字**（仅标签偏短） | 不改 |
| 13 | `从新开始.mp4` | `从头开始.mp4` | ASR: "**From the beginning.**"；`从新` → `从头` | 一 |
| 14 | `对我又什么好处.mp4` | `对我有什么好处.mp4` | zh: "我能得到什么好处？"；`又` → `有`（同音误写） | 一 |
| 15 | `你是万一挑一.mp4` | `你是万里挑一.mp4` | zh: "你是万里挑一的。"；`万一` → `万里` | 一 |
| 16 | `你还记得我妈.mp4` | `你还记得我吗.mp4` | ASR: "**Do you remember me?**"；`妈` → `吗` | **补** |
| 17 | `你出个价把.mp4` | `你出个价吧.mp4` | zh: "开个价吧。"；`把` → `吧` | 一 |
| 18 | `你再开玩笑把.mp4` | `你再开玩笑吧.mp4` | zh: "你在开玩笑吧。"；`把` → `吧` | 一 |
| 19 | `在努力一点.mp4` | `再努力一点.mp4` | ASR: "**Try harder.**"；`在` → `再` | **补** |
| 20 | `淡定点.mp4` | **不改** | ASR: "Don't freak out."；「淡定点」为通顺口语（= 淡定些），**非错字** | 不改 |
| 21 | `it is what it is .mp4` | `it is what it is.mp4` | **尾部多余空格**（`JSON.stringify` 可见 `"is "`） | 一 |
| 22 | `what am i to you .mp4` | `what am i to you.mp4` | **尾部多余空格** | 一 |

**卡面 22 条已逐条闭环**（英文 12 / 中文 8 / 格式异常 2），其中 **20 条实改、2 条经核判定「非错字」不改**（#12 / #20）。

**补充登记（卡面未列，调研时发现）**：`cut in front of sb.mp4` —— `sb` = `somebody` 的源站占位写法，非拼写错误，**不改**。

**合计实改 20 条**（第一批 17 + 补做 3）。全部**不留旧链接**（老板拍板）。

### 1.1 两处需要显式说明的决策

- **`从新开始.mp4` 为什么改成 `从头开始.mp4` 而不是 `重新开始.mp4`？**
  该条 ASR 为 "From the beginning."（从头开始），而真源中**已存在**另一条 `重新开始.mp4`（ASR "A fresh start."，语义不同）。若改成 `重新开始.mp4` 会**撞名** → `gen-mls-data.mjs` 自检报「重复 file」并 exit 1 阻断构建。故取「从头开始」。
- **为什么 `do Dutch` / `你还记得我妈` / `在努力一点` 是补做而非第一批？**
  首轮依据调研报告的「确定性错别字 12 条 + 中文 4 条」口径执行（共 17 条），这三条被归入「待确认」而未处理。复核时直接读 ASR 正字文本，三者均有明文正字（见上表依据列），属**确凿错字**，故补做。教训：**「待确认」项必须在关闭任务前逐条落实结论**，不能留在清单里悬空。

---

## 2. ASR 时间戳塌缩（任务卡「13 条硬幻觉」）

### 2.1 缺陷本质纠正

任务卡原假设是「ASR 文本幻觉」（认错了词），**实测推翻**：`不在乎.mp4` 同一句出现 9 次、其中 8 次时间戳正常 → 缺陷**在时间戳不在文本**。

真机制是 **Whisper 口吃式重复切分（stutter-split）**：同一段真实语音被输出成**两条句**，其中一条的边界词时间戳**塌缩为零长**，使该句 `end - start` 小到物理不可能。

**真判据 = 零长词数**（不是「时长 < 0.4s」本身）：
- 11 个真异常点均有 **2~4 个零长词**；
- `你是不是傻.mp4` 的 `What are you doing?`（0.40s / 4 词）**零长词 = 0**，属**正常快句** → 从清单剔除。

→ 候选清单由 14 条收敛为 **13 条**。

**音频实证**（决定性证据，修复前）：异常句窗口几乎全无声 —— `对我有什么好处` voiced ≈ 8%、`我们不要草率了` ≈ 5%、`我多希望你在身边` ≈ 11%；而合并后的窗口 voiced 升到 **48~55%**。直接证明旧时间戳把切点落在了**静音区**。

### 2.2 逐条处置（14 句 / 13 文件）

| # | 文件 | 受影响句 | 处置 | 合并区间 | 说明 |
|---|---|---|---|---|---|
| 1 | `不在乎.mp4` | s6+s7 | ✅ 已修 | 合并 | 高置信 |
| 2 | `你以为你是谁.mp4` | s4+s5 | ✅ 已修 | 合并 | 高置信 |
| 3 | `对我有什么好处.mp4` | s5+s6 | ✅ 已修 | 合并 | 高置信（原名 `对我又什么好处`） |
| 4 | `我们不要草率了.mp4` | s4+s5 | ✅ 已修 | 合并 | 高置信 |
| 5 | `我再也受不了了.mp4` | s7+s8 | ✅ 已修 | 合并 | 高置信 |
| 6 | `我多希望你在身边.mp4` | s4+s5 | ✅ 已修 | 合并 | 高置信 |
| 7 | `我没意见.mp4` | s5+s6 | ✅ 已修 | 合并 | 高置信（另修 `Find` → `Fine`，全 9 句 + 顶层 words） |
| 8 | `改天吧.mp4` | s4+s5 | ✅ 已修 | 合并 | 高置信 |
| 9 | `没门.mp4` | s6+s7 | ✅ 已修 | 合并 | 高置信 |
| 10 | `试试看.mp4` | s6+s7 | ✅ 已修 | 合并 | 高置信（该文件 2 处命中） |
| 11 | `别往心里去.mp4` | s5+s6 | ⏸ 未修 | [6.34, 6.84] = **0.50s** | 低置信：略低于该文件健康 min 0.64s，可能语速快或有第三半句未被识别 → **需人工听音频**（→ T-030） |
| 12 | `你想我了吗.mp4` | s5+s6 | ⏸ 未修 | [5.84, 7.26] = **1.42s** | 低置信：略高于该文件健康重复 max 1.12s，可能是末次拖长（一句）或两句被并 → **需人工听音频**（→ T-030） |
| 13 | `你是不是傻.mp4` | s6 | ⏸ 未修 | — | **B 类，从清单剔除**：`What are you doing?` 0.40s/4 词但**零长词 = 0**，属正常快句，非缺陷 |

**修法 = 方案 A′**：把塌缩句与其**兄弟句**合并为一句 —— 在 `[spanStart, spanEnd]` 内按各词**自身时长等比缩放**重分配（每词保底 20ms）；若权重全塌缩则退化为**等分**。随后重编号 `index`，重建顶层 `words` / `text` / `wordCount`。

**结果**：受影响 10 个文件句数精确变化，未受影响文件**零漂移**；总句数 1822 → **1812**；条目数仍 368。

---

## 3. 有意未做 / 另行立卡项

| 项 | 状态 | 原因 |
|---|---|---|
| 2 处低置信时间戳（上表 #11/#12） | → **T-030** | 需人工听音频后在「合并」与「保持」之间定夺，不能靠统计量单方面决定 |
| 切句聚合缺陷：`洗澡.mp4` 单句 `Take a shower.` ×19 仅 0.44s / 57 词；`别得寸进尺.mp4` 单句 「…」×31 仅 1.60s / 125 词 | → **T-030** | **不是幻觉**（非零长词塌缩），是**句聚合缺陷**（`text` 含整段重复块但 `end` 只盖一句），与时间戳塌缩是**不同缺陷类型**，不能套用同一套修法 |
| `do Dutch` / `你还记得我妈` / `在努力一点` | ✅ 本轮补做 | —— |

---

## 4. 同步链路（脚本，无需手改真源 JSON）

```
真源 mp4 改名（真源目录）
   ↓ 同步两处规则表（唯一需要手工编辑的地方）
scripts/gen-mls-data.mjs    → RENAME  （真源 JSON 旧键名 → 新键名）
scripts/sync/movie-line-shadowing.json → rename（镜像 mp4 源名 → 目标名）
   ↓ npm run sync:tools（scripts/sync-tools.mjs，逐字节镜像 *.mp4 / tool/index.html / tool/voices/*.mp3）
   ↓ npx gen-mls-data（scripts/gen-mls-data.mjs，386 → 368 去重 + 改名 + 时间戳修复）
产物 public/tools/english/movie-line-shadowing/{368 mp4, tool/data.json, tool/zh.json, tool/voices/manifest.json, 1886 mp3}
```

`package.json` 的 `prebuild = sync-tools && check-tools && gen-mls-data` —— ⚠️ **顺序不可对调**。

---

## 5. 验证结果（T-029 全量，2026-10-15）

| 判据 | 命令 / 方法 | 结果 |
|---|---|---|
| 四集合一致 | `data.file` / `zh` 键 / `manifest.items` 键 / 磁盘 mp4 双向对称差 | **0**（368 / 368 / 368） |
| 404 检查 | `data.file` ⊆ 磁盘 mp4 | **0 个 404**（7 个磁盘孤儿全部是 `quarantine.json` 主动隔离，非漏跑） |
| 新增 3 名 | 新名 4 集合齐备 + HTTP 200 | ✅ 全 200 |
| 旧名清除 | 旧名 4 集合缺席 + HTTP 404 | ✅ 全 404 |
| 幂等 | `node scripts/gen-mls-data.mjs --check` | exit 0，「未变化」×3 |
| 构建期校验 | `node scripts/check-tools.mjs` | exit 0（频道 4 / 集合 5 / ICAP 4 / 工具 19 / 路径 3） |
| 类型 | `npx tsc -b` | exit 0 |
| **真跑** | `chrome --headless=new --dump-dom`（阴性对照 `about:blank` = 41 B） | exit 0，DOM **103529 B**，`data-idx` = 368，`item active` 恰 1，`#stat` = 「368 段 · 模型 small」，控制台 0 条告警 |
| 上屏核对 | DOM 文本含新名、不含旧名 | 新名各 1 处命中；旧名 0 处 |
| 阳性对照 | 同一探针跑必然命中/必然不命中样串 | 「368 段」= 1，「___absurd___」= 0 → 探针有效，非假阴性 |
| git 改名保真 | `git diff --cached --name-status -M` | 3 项均 **R100**（100% rename）→ 证明是纯改名，**内容零改动** |

*所有数字可复现。真源在仓库外，本文件只描述事实，不复制素材。*
