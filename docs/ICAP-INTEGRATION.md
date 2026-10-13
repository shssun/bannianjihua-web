# ICAP × 半年计划 —— 诊断与四个结合方案

> 生成：2026-10-13　依据：Chi & Wylie (2014) 原始框架 + **本项目一手实测**（非推测）
> 用途：决策文档。选定方向后再派实现。

---

## 0. TL;DR

- ICAP 把认知投入分四层，学习效果递增：**被动 → 主动 → 建构 → 互动**。
- 我们 12 个工具的实测落点是 **10 / 2 / 0 / 0** —— 底座极宽、腰极窄、**上面两层完全空白**。
- 更关键：**唯二能产生「学习者产出」的工具，产出都发生在工具之外**（跟读出声音、默写在本子上）。按 ICAP 自己的判定规则（看产品，不看意图），**我们连判据都没有**。
- 四个方案：
  | | 方案 | 补哪一层 | 成本 | 杠杆 |
  |---|---|---|---|---|
  | **A** | 标注尺子（`Tool.icap` + 覆盖图） | 无（只让缺口可见） | 极低 | 低 |
  | **B** | 变体生成器 | **建构** | 中 | 高 |
  | **C** | 互评走廊 / 双人互测 | **互动** | 中～高 | 中（受制于无推广） |
  | **D** | ICAP 阶梯编排（集合页→学习路径） | 贯通用现有各层 | 中 | **最高** |
- 建议次序：**A → D → B → C**。
- **不自欺**：ICAP 的层级之争**未决**（有实证显示被动 > 主动；新手身上直接讲授 > 自主学习材料），二语研究还证明被动/主动对「输入处理 + 模式注意」**不可替代**。所以 —— **不能把 ICAP 当评分表，不能把「爬到互动」当目标**。

---

## 1. ICAP 是什么

### 1.1 四层

| 层级 | 学习者行为 | 知识变化机制 | 学习结果 |
|---|---|---|---|
| **Passive 被动** | 接收信息：听、看、读 | **存储** storing | 逐字回忆；**无迁移** |
| **Active 主动** | 对材料动手：划线、抄笔记、复述、**跟读**、做题 | **整合** integrating | 浅层理解；仅**近迁移**（非常相似的情境） |
| **Constructive 建构** | **生成超出所给材料之物**：自我解释、做概念图、预测、反思、概括、比较、提问 | **推断** inferring | 深度理解；**可远迁移到新情境** |
| **Interactive 互动** | 两人以上**共同推断**：轮流生成 + 吸收反馈、辩护立场、互相质问、辩论 | **共同创造** co-creating | 最深理解 |

> 「生成性（Generative）」= Constructive + Interactive 的合称。

### 1.2 两条铁律

1. **必要条件**：高层模式**包含**低层模式的特征。判断依据是**可观测的外显行为**与**学习者产出的产品** —— 不是任务的名字，不是设计者的意图。
2. **意图 ≠ 实际**。这是 ICAP 最著名的警告：被要求「自我解释」的学生，可能只是在复述内容 → 实际仍停在 Active。**必须分析学习者真实产出的产品**来判定实际层级。

### 1.3 必须诚实交代的争议（不是免责声明，是设计约束）

| 争议 | 出处 | 含义 |
|---|---|---|
| **层级本身实证基础不牢** | `PMC10652002`《Questioning central assumptions of the ICAP framework》 | 原始实验中 **Interactive vs Constructive 差异不显著**；Conley 等发现**被动活动 > 主动活动**；Ziegler 等发现**直接讲授 > 精心设计的自主学习材料**（对新手尤其如此） |
| **粒度太粗** | `PMC11250844` | 同属 passive，学生做 presentation 对兴趣是**正**效应，听老师讲对愉悦是**负**效应 —— 一平均就互相抵消 |
| **只看外显行为** | Frontiers（2026） | 捕捉不到内隐心理、情感共鸣、身份认同 |
| **局限于实施阶段** | MDPI 15/3/261 | 各层级过宽、难以诊断，且难以评估学习目标 |

学界给出的**补充手段**：用**形成性评估（formative assessment）**替代 / 补充单纯的行为观察。

### 1.4 二语教学的既有先例（已验证有先例，不是我们首创）

`What do we mean by active learning in language lessons? An ICAP-based analysis of Estonian as a second language lessons` —— 分析 6 节录课：

- **67% 课堂时间属 passive**；真正 interactive 极少
- 强调 **passive / active 对「语言输入处理 + 模式注意（noticing）」不可替代**

> 对我们的意义：**磨耳朵（moear）这类被动工具是必要的，不是「低级要淘汰的」**。这一点和第 1.3 节的争议一起，构成我们**不应该**盲目往上爬的理由。

---

## 2. 我们自己的诊断（全部一手实测）

### 2.1 四条硬证据

| # | 实测内容 | 命令 / 结果 | 含义 |
|---|---|---|---|
| 1 | 英语工具内**零个文本输入框** | grep `textarea\|contentEditable\|<input type=text` over `public/tools/english` → **No matches** | 学习者**没有地方写下产出** |
| 2 | 只有影视台词跟读有录音能力 | grep `MediaRecorder\|getUserMedia` → 仅 `movie-line-shadowing/tool/index.html` **3 处** | 唯一会收下「学习者产出物」的工具 |
| 3 | 书籍工具**零学习者产出留存** | grep `localStorage` → 仅 `reader-theme`（主题偏好） | 完全没有形成性评估的数据基础 |
| 4 | moear 的 `variants` 字段**预留但为空** | `phrases.json.stats = {"clips":386,"phrases":346,"variants":0}` | 数据结构已为变体留位；**但一条都没有** |

补充实测：`chinese-to-english-drill` 里的「为什么」**全部出现在讲解正文**（行 188 / 678 / 1142 是正文标题），**是作者在问，不是让学习者答** —— 配合「无输入框」，该工具的实际行为是「**翻答案 + 读讲解**」。

### 2.2 十二个工具的落点（按**实际可观测层级**，不按意图）

| 工具 | 设计意图 | **实际层级** | 依据 |
|---|---|---|---|
| `moear` 影视台词磨耳朵 | 被动 | **Passive** | 纯听，无产出 |
| `dict-reader` 英语句读器 | 被动 | **Passive** | 看 + 悬停查词 |
| `basic100-sentence-reader` 纯句点词阅读 | 被动 | **Passive** | 看 + 点词 |
| `grammar100-points-reader` 高考语法讲点 | 被动 | **Passive** | 讲义 + 例题 |
| `logic-fallacy-cards` 逻辑谬误卡片 | 被动 | **Passive** | 静态图集 |
| `set-theory-cards` 集合论卡片 | 被动 | **Passive** | 卡片（尚未做） |
| `intuition-cards` 直觉之卡 | 被动 | **Passive** | 卡片 |
| `md-to-html-reader` Markdown 阅读器 | 被动 | **Passive** | 阅读 |
| `markdown-slide` Markdown 幻灯 | 被动 | **Passive** | 演示 |
| `chinese-to-english-drill` 中译英默写 | **主动（想）** | ⚠️ **Passive（实际）** | **无输入框**；翻答案即读。真正的思考发生在工具外、无人观测 |
| `movie-line-shadowing` 影视台词跟读 | 主动 | ✅ **Active** | 跟读 + 录音 + 与原声比对 |
| `shuangpin-practice` 双拼练习 | 主动 | ✅ **Active** | 实时按键 + 正误统计 |

**统计：Passive 10 · Active 2 · Constructive 0 · Interactive 0。**

### 2.3 三个结构性结论

1. **金字塔头重脚轻到失衡**：不是「被动太多」的问题 —— 对语言输入来说被动的底座**本来就是对的**（见 §1.4）。问题是**上面没有任何出口**：学完只能停在「认得 / 想起」，没有一处通向「用得出来」。
2. **产出物零留存 = 无法判定实际层级**。ICAP 说「看产品」，而我们**一个产品都没接住**。这不只是 ICAP 的问题 —— 它同时意味着我们**做不了形成性评估**（§1.3 学界建议的补充手段）。
3. **`chinese-to-english-drill` 是「意图 ≠ 实际」的活标本**：这本书的方法内核是「反死记硬背、先想『为什么』」（工具正文自己写着 STEP-0～4），**意图明显偏建构**；但工具没有输入框，学习者想完就翻答案 → **实际层级被打回 Passive**。这是最好的证据，说明**光有好的方法不够，必须有能接住产出的容器**。

---

## 3. 四个方案

### 方案 A｜标注尺子：把 ICAP 变成看得见、不会腐烂的说明

**机制**
- `Tool` 加字段 `icap?: ICAPLevel[]`（**与 `collections` 完全同构**：纯字面量数组，构建期校验 ∈ 枚举且不重复）
- 新建 `src/data/icap.ts`：`ICAP_LEVELS`（id / name / en / desc / order）+ 查询函数，**格式照抄 `collections.ts`**
- 工具箱与集合页：层级徽章 + 筛选 chips
- `/roadmap` 增一张「认知层级覆盖图」（就是刚才那张金字塔的网页版）

**复用**：零新工具。只动 12 个工具 ts 文件（各加一行）+ 1 处 UI + 1 处校验 + 1 个新数据文件。
**成本**：极低。
**风险**：层级标注天生模糊。**若被当成评分表会误导**（§1.3）。
**诚实边界**：只标注「**设计意图**」，UI 必须明示一句「意图 ≠ 实际，实际层级取决于你怎么用」。这不是免责，是 ICAP 原文的立场。
**验收**：`check-tools` 能拦下非法 icap 值；按层筛选后每层工具数正确；覆盖图如实露出两个空洞。

---

### 方案 B｜变体生成器：补「建构」，把「听得懂」接到「用得出」

**机制**：对每个短语，要求学习者**产出材料里没有的东西** —— 不是回忆，而是**变换**：换主语 / 换时态 / 换场景 / 换语用功能 / 改否定疑问。**必须写下来**（这是 ICAP 判定的唯一依据）。

**复用（本方案最漂亮的地方 —— 素材已现成）**
- moear 346 条短语**每条都带四个语用轴**：`function`（语用功能）/ `scene`（场景）/ `tone`（语气）/ `difficulty` → 直接拿「换场景」「换语气」当变换算子，**题干可半自动生成**
- `clips[].units[]` 里**已经存在自然变体**（如 `"Well, I'm flattered."`，`isCanonical:false`）→ 可作「参考答案」的真人示范
- 数据层只需补 `variants` 数组（**字段已预留**，目前是 0）
- 落地：`english` 频道新工具（如 `phrase-variant-builder`），或作为 moear 的「变体模式」第二入口

**成本**：中（要变体题面数据 + 自评机制）。
**风险**：**纯静态无服务器 → 没有真判官**，学习者写的变体对不对，机器判不了。
**缓解（三级，逐级加码）**
1. 存**参考答案**（人工预写 + 复用已有的非规范变体真人音频）
2. **自评闸门**：先写下自己的变体 → 再展开参考答案 → 自问「**我的和参考差在哪、为什么**」= **自我解释 = 标准 Constructive**
3. 可选「**哑管道**」：工具生成题面 → 学习者复制到外部 LLM → 把回答粘回来记录（**保住纯静态**，不引后端）

**验收**：**必须留存学习者产出的文本**（localStorage + 可导出 JSON/Markdown）→ 这个产出物本身就是 ICAP 要的「产品」，同时顺带补上形成性评估的数据基础。
**命中既定方向**：老板原话「记住短语**以及少量的变体**」—— 本方案就是这句话的载体。

---

### 方案 C｜互评走廊 / 双人互测：补「互动」

**机制**：两人以上**轮流生成 + 吸收反馈**。三个子形态：

| 子形态 | 做法 | 后端 |
|---|---|---|
| **C1 同屏轮换** | 一台设备两人轮流：A 出中文题干 → B 产出英文 → A 判分并**质问「为什么用这个时态」** → 交换角色。Chi 的定义只要求**轮流 + 反馈**，不要求联网 | **零后端** |
| **C2 单人 + AI 陪练** | 工具生成题面 → 学习者复制去外部 LLM → 把 LLM 的追问粘回来 → 学习者再答。工具只做「题面生成 + 轮次记录」 | 零后端 |
| **C3 互评走廊** | 复用 **Supabase 留言板**改造成「贴出你的句子 → 别人挑错/追问」 | **复用已有唯一后端** |

**复用**：C3 不新增任何后端 —— 留言板本来就是这个站点唯一的强后端功能。
**成本**：C1 中 / C2 中 / C3 中～高（要改数据模型 + 基本内容审核）。
**风险**：C1/C3 都需要「另一个人」；C3 引入 UGC 审核风险；**无推广计划 → 互评走廊前期必然冷清**。
**诚实边界**：**ICAP 层级本身有争议** —— Interactive 与 Constructive 的差异在原始实验里并不显著。所以 **C 的价值不在「层级最高」，而在于它是唯一能提供「真实反馈」的机制**，而反馈是争议双方都认同有效的东西。
**验收**：能观察到**至少两个主体的往复产出**（轮次记录 / 留言的回复链）。

---

### 方案 D｜ICAP 阶梯编排：不造新引擎，把现有工具串成一门课

**机制**：**不给工具箱再加零件**，而是给「集合 / 书的落地页」编排三层阶梯：

```
听（磨耳朵 / 句读器）    →  写（默写 / 变体）   →  说与人评（跟读录音 / 互评）
     Passive                  Active→Constructive        Active→Interactive
```

让**集合页**从「工具清单」升级为「**学习路径**」。以《基本英文100》为例：勾选一条句子，走完全程。

**复用**：**集合机制上一轮刚做好**（`Collection.parentId` + `CollectionPage` 的子集合区块）→ **天然就是路径的骨架**；进度用 localStorage 即可。
**成本**：中（路径数据 + 集合页改版 + 进度串联）。
**风险**：路径是「编排」不是「强制」，学习者可能跳步。
**验收**：走完一条句子的全链路，产出物（默写文本 / 录音 / 自评）都在且可导出。
**杠杆最高的理由**：它**把「一堆工具」变成「一本书的教学法」**—— 直接回答老板的原问题「书上方法做成工具」；且因为是编排，**边际成本极低**。

---

## 4. 建议的推进次序

**A → D → B → C**

1. **A 先做**（半天内）：给后面所有讨论提供**共同语言**，且**零风险**（不改变任何学习行为，只做标注）
2. **D 紧随**：杠杆最高，且刚做好的集合机制是**现成地基**
3. **B 是真正的价值兑现点**：命中「变体」既定方向，也是唯一低成本打通「输入→输出」的抓手
4. **C 最后**：受制于「无服务器 + 无推广」，C3 的互评走廊要**等有人来**才有意义

---

## 5. 明确不做 / 不自欺的事

1. **不把 ICAP 当评分表。** 层级争议未决（有实证显示被动 > 主动；新手身上直接讲授 > 自主学习）；二语研究更证明 passive/active 对「输入处理 + 模式注意」**不可替代**。→ **moear 这类被动工具是必要的，不是低级。**
2. **不看意图，只看产品。** ICAP 最硬的规矩：判层级必须看学习者产出。→ 本文件所有新方案的**第一验收条件都是「产出物是否被留下来」**，而不是「按钮点了没有」。
3. **补形成性评估。** 文献明说单靠行为观察不够 → 自评 / 互评 / 进度回顾要一起做，这正好是 B / C / D 顺带产出的数据。

---

## 6. 落地细节：`Tool.icap` 字段设计（方案 A）—— ✅ 已实现

> 状态：**方案 A 已实现**（标注 + 展示；不含筛选路由、不含新工具）。与「集合 `collections`」完全同构。

### 6.1 类型（`src/types/index.ts`，已加）

```ts
/** ICAP 认知投入层级（学习效果递增：passive → active → constructive → interactive）。取值见 src/data/icap.ts。 */
export type ICAPLevel = 'passive' | 'active' | 'constructive' | 'interactive';

export interface Tool {
  // ...既有字段
  /**
   * 该工具**设计上**要唤起的 ICAP 认知层级（可多值，如同时含 active + passive）。
   *
   * ⚠️ 这是**设计意图**，不是实际层级 —— ICAP 原文强调「意图 ≠ 实际」：
   * 被要求「自我解释」的学习者可能只是在复述，实际仍停在 active。
   * 实际层级取决于**学习者是否真的产出了「超出所给材料之物」**，
   * 因此 UI 上必须与「产出物留存」信息并列展示，不可单独立论。
   *
   * id 取值见 `src/data/icap.ts`；构建期 `scripts/check-tools.mjs`
   * 校验每个值 ∈ ICAPLevel 且数组内不重复。与 `collections` 同构（纯字面量数组）。
   */
  icap?: ICAPLevel[];
}
```

### 6.2 数据文件（新增 `src/data/icap.ts`，格式照抄 `src/data/collections.ts`）

```ts
export interface IcapLevel {
  id: ICAPLevel;       // 'passive' | 'active' | 'constructive' | 'interactive'
  name: string;        // 中文名：被动 / 主动 / 建构 / 互动
  en: string;          // 英文名：Passive / Active / Constructive / Interactive
  description: string; // 行为 · 机制 · 结果
  order: number;       // 1..4，学习效果递增
}
export const ICAP_LEVELS: IcapLevel[] = [ /* 4 项 */ ];
export function getIcapLevelById(id: string): IcapLevel | undefined;
export function getSortedIcapLevels(): IcapLevel[];
```

按层级筛选工具的函数放在 `src/data/tools/index.ts`：

```ts
export function getToolsByIcap(level: ICAPLevel): Tool[] {
  return TOOLS.filter((tool) => tool.icap?.includes(level)).sort(sortByOrder);
}
```

> `id` **必须**写成单引号字符串字面量 —— `src/data/icap.ts` 会被 `scripts/lib/registry.mjs`
> 的正则 `\bid\s*:\s*'([^']+)'`（`loadDeclaredIds`）解析出 id 列表。该正则**不会**误收
> interface 里的 `id: ICAPLevel;`（无引号），也**不会**误收 `parentId` 这类字段（`\b` 词边界 + 大小写敏感）。

### 6.3 构建期校验（`scripts/check-tools.mjs`，已加）

- 新增 `loadIcapLevelIds(repoRoot)`（`scripts/lib/registry.mjs`）与 `icapIds` 集合。
- 与 `collections` 同款校验块（放在 collections 校验块**之后**）：`icap` 必须是字符串数组 /
  每项是非空字符串 / 每个值存在于 `ICAP_LEVELS` / 数组内不重复 —— 任一不通过即 `exit 1`。
- 汇总行：`频道 N 个 · 集合 N 个 · ICAP 4 层 · 工具 N 个`。
- ⚠️ `RESERVED_IDS` **不变**（仍是 `channel` / `collection`）—— `icap` 不是路由段。

### 6.4 12 个工具的实际标注（已加）

| 工具文件 | `icap` |
|---|---|
| `src/data/tools/english/moear.ts` | `['passive']` |
| `src/data/tools/english/movie-line-shadowing.ts` | `['passive', 'active']` |
| `src/data/tools/english/dict-reader.ts` | `['passive']` |
| `src/data/tools/english/chinese-to-english-drill.ts` | `['passive', 'active']` |
| `src/data/tools/english/basic100-sentence-reader.ts` | `['passive']` |
| `src/data/tools/english/grammar100-points-reader.ts` | `['passive', 'active']` |
| `src/data/tools/math/set-theory-cards.ts` | `['passive']` |
| `src/data/tools/cognition/logic-fallacy-cards.ts` | `['passive']` |
| `src/data/tools/cognition/intuition-cards.ts` | `['passive']` |
| `src/data/tools/general/shuangpin-practice.ts` | `['active']` |
| `src/data/tools/general/md-to-html-reader.ts` | `['passive']` |
| `src/data/tools/general/markdown-slide.ts` | `['passive']` |

### 6.5 展示（UI，最小改动）

- `src/components/tools/ToolCard.tsx`：卡片上加 ICAP 徽章，显示该工具 `icap` 里**最高**层级的 `name`
  （沿用组件已有的 MUI `Chip` 写法，无新样式体系）。
- `src/pages/ToolListPage.tsx`：在「按来源浏览」入口条下方加一行「按认知层级」**图例**
  （用 `getSortedIcapLevels()` 渲染 4 个层级名 + 描述）。**只作图例、不可点击** ——
  可点击筛选需新增路由，属方案 D，本期不做。
- 两处均明示「**设计意图 ≠ 实际层级**」，符合 §1.2 的第二条铁律。

