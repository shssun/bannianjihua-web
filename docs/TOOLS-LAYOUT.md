# 工具目录与模块规划（TOOLS LAYOUT）

> 目的：让「英语 / 数学 / 认知 / 通用」下的工具可以**由不同的人（或不同的 AI）同时开发、同时提交而不互相冲突**。
> 状态：**已按老板澄清修订并执行迁移**（二级 = 频道、三级 = 具体工具）
> 关联文档：`docs/PRD.md`、`docs/ARCHITECTURE.md`

---

## 0. 一句话结论

把「工具」当成**一条独立的子树**：每个工具在磁盘上独占一个目录、在注册表里独占一个文件、在构建期独占一份同步清单。
于是「新增一个工具」= **只新建文件，不改任何既有文件** —— 这是唯一能真正杜绝并行冲突的做法。

---

## 1. 层级模型

固定三层，**每一层都强制**：

| 层级 | 名称 | 英文 key | 例子 | 说明 |
|---|---|---|---|---|
| L1 | **容器** | — | `public/tools/` | 所有工具的根，**不计入层级** |
| L2 | **频道** | `channel` | `english` 英语 / `math` 数学 / `cognition` 认知 / `general` 通用 | 学科大类；英语与数学**同级** |
| L3 | **具体工具** | `tool` | `movie-line-shadowing` 影视台词跟读 | 名字必须**具体、体现该工具的适用范围** |

> ⚠️ **老板明确否掉「每日英语」这类笼统总称**。三级目录名 = 描述性的英文 kebab slug，
> 一眼能看出这个工具**干什么、用在什么范围**。不要用「每日 / 综合 / 学习 / 工具」这类无信息量的词。
> 例：`movie-line-shadowing`（影视台词跟读）、`dict-reader`（英文句读点词查音标）、`shuangpin-practice`（双拼键位练习）。

**深度上限 3 层**（`public/tools/` 不计入）。工具自己的素材子目录（如 `tool/`、`voices/`）算**工具内部结构**，不计层级。

---

## 2. 磁盘目录规范

### 2.1 仓库内（= 部署产物，`public/` 会被原样发布）

```
public/tools/                              ← L1 容器
├── english/                               ← L2 频道 · 英语
│   ├── movie-line-shadowing/              ← L3 工具 · 影视台词跟读（多文件）
│   │   ├── *.mp4                          （11 个视频素材，与本地工作目录镜像）
│   │   └── tool/
│   │       ├── index.html
│   │       ├── data.json
│   │       ├── zh.json
│   │       └── voices/                    （多说话人音轨）
│   └── dict-reader/                       ← L3 工具 · 英文句读（单文件）
│       └── index.html
│   └── moear/                             ← L3 工具 · 影视台词磨耳朵（多文件）
│       ├── index.html                     （源文件名 player.html，经 rename 映射而来）
│       ├── tool/phrases.json
│       ├── audio_norm/                    （1900 条响度归一真人原声 + 清单）
│       └── tool_phrase/voices/            （692 条短语级标准音 TTS）
├── math/                                  ← L2 频道 · 数学
│   └── set-theory-cards/                  ← 集合论卡片（规划中，无产物）
├── cognition/                             ← L2 频道 · 认知
│   ├── logic-fallacy-cards/               ← 逻辑谬误卡片
│   │   └── index.html
│   └── intuition-cards/                   ← 直觉训练卡片（规划中）
└── general/                               ← L2 频道 · 通用（兜底：不属于任何学科的实用小工具）
    ├── shuangpin-practice/                ← 双拼键位练习
    │   └── index.html
    ├── md-to-html-reader/                 ← Markdown 阅读器
    │   └── index.html
    └── markdown-slide/                    ← Markdown 幻灯（规划中）
```

**硬规则**

1. 工具目录名 = 工具 `id`，**必须一致**（`src/data/tools/<channel>/<id>.ts`）。
2. 单文件工具统一命名为 **`index.html`**（而不是 `<tool>.html`）——
   这样「一个工具 = 一个目录」，日后要加素材/数据文件时有地方放，不必改路径。
3. 工具内部的相对路径以**工具自己的目录**为根 —— 保持「本地工作目录 ↔ 站内目录」镜像，工具本体零改动。
4. **拷贝而非移动**：迁移过程中旧路径（`public/tools/*.html`、`public/tools/daily-english/`）暂不删除，
   待线上确认无误后再清理。旧 URL 会失效（`/tools/xxx.html` → `/tools/<channel>/xxx/index.html`），
   站内所有入口都从注册表生成会自动跟着变，只有用户收藏的旧链接会 404（站点自用为主，判定可接受）。

### 2.2 本地工作目录（工具源码的「作战区」，不进仓库）

```
D:/workspaces/
├── 每日英语/                         ← 影视台词跟读（movie-line-shadowing）的数据工作区（保持现名，不动）
├── 每日英语台词/                     ← 影视台词磨耳朵（moear）的数据工作区（保持现名，不动）
└── ...
```

**不要求改名**。本地目录名与站内 `id` 的映射写在同步清单里（见 §6）。
理由：这些目录里已沉淀大量脚本、状态文件、审计产物，改名会牵动几十处硬编码路径，收益为零。

---

## 3. 防冲突设计（本规划的核心）

并行开发有且只有 4 个真实冲突点，逐个堵死：

| # | 冲突点 | 旧状 | 允许并行后会发生什么 | 对策 |
|---|---|---|---|---|
| ① | **注册表** | 所有工具都往 `src/data/tools.ts` **同一个数组**里加一项 | 两个 AI 同时改一个文件 → 必然 merge 冲突 | **一工具一文件**，用 `import.meta.glob` 自动收集（§5） |
| ② | **产物目录** | `public/tools/*.html` **平铺** | 可能撞名；后期几十个文件无法维护 | **按频道分目录**，每个工具独占子树（§2.1） |
| ③ | **构建期同步** | `scripts/sync-daily-english.mjs` 硬编码单个工具；新增多文件工具要**复制脚本 + 改 package.json** | 两个 AI 同时改 `package.json` 的 `prebuild` → 冲突 | **通用同步器 + 一工具一清单**，`package.json` 只保留一条命令、**永不再改**（§6） |
| ④ | **id 撞名** | 无约束 | 两个 AI 各建一个叫 `cards` 的工具 → 路由冲突、目录冲突 | **构建期校验**：id 唯一 + channel 合法 + 目录与 channel 一致 + entry 真实存在（§7） |

**目标状态：新增一个工具 = 新建文件，不改任何一个既有文件。**

```
新建 src/data/tools/<channel>/<tool>.ts        注册表条目（必建）
新建 public/tools/<channel>/<tool>/            产物目录（单文件工具放 index.html）
新建 scripts/sync/<tool>.json                   同步清单（仅多文件工具需要）
```

---

## 4. 频道定义

频道本身保留**唯一的汇总文件**（新增频道频率极低，允许直接改它）。

`src/data/channels.ts`：

```ts
export interface Channel {
  id: string;            // 'english'
  name: string;          // '英语'
  cover: string;         // '🔤'
  description: string;   // 频道页副标题
  order: number;         // 展示顺序
}

export const CHANNELS: Channel[] = [
  { id: 'english',   name: '英语', cover: '🔤', description: '听力、跟读、词汇', order: 1 },
  { id: 'math',      name: '数学', cover: '📐', description: '数理基础概念',     order: 2 },
  { id: 'cognition', name: '认知', cover: '🧩', description: '思维与逻辑训练',   order: 3 },
  { id: 'general',   name: '通用', cover: '🧰', description: '不属于学科的实用小工具', order: 9 },
];
```

- `general` 是**兜底频道**，任何不属于学科分类的工具都放这里 —— 避免为了一个新工具就新增频道（那也是改共享文件）。
- 工具数量等派生统计在页面里算，**不在 CHANNELS 里存冗余字段**。

---

## 5. 注册表：一工具一文件

### 5.1 目录

```
src/data/
├── tools/
│   ├── index.ts                 ← 汇总器，用 glob 自动收集，几乎不用改
│   ├── english/
│   │   ├── movie-line-shadowing.ts
│   │   ├── moear.ts
│   │   └── dict-reader.ts
│   ├── math/
│   │   └── set-theory-cards.ts
│   ├── cognition/
│   │   ├── logic-fallacy-cards.ts
│   │   └── intuition-cards.ts
│   └── general/
│       ├── shuangpin-practice.ts
│       ├── md-to-html-reader.ts
│       └── markdown-slide.ts
├── channels.ts
├── fallbackMessages.ts
└── fallbackPosts.ts
```

> ⚠️ 原来的 `src/data/tools.ts` **已删除**，由 `src/data/tools/index.ts` 取代
> （两者同名会导致 Node/TS 优先解析 `tools.ts`，必须删掉旧文件）。
> 所有 `import ... from '@/data/tools'` **无需改动**（Vite/TS 会解析目录下的 `index.ts`）。

### 5.2 汇总器 `src/data/tools/index.ts`

```ts
import type { Tool } from '@/types';

/** 自动收集 src/data/tools/<channel>/<tool>.ts 的 default 导出。 */
const modules = import.meta.glob<{ default: Tool }>('./*/*.ts', { eager: true });

export const TOOLS: Tool[] = Object.values(modules).map((m) => m.default);

// 其余查询函数原样保留：
// getToolById / getToolsByChannel / getOnlineTools / getUpcomingTools
// / sortByOrder / TOOL_STATUS_LABEL / TOOL_RUNTIME_LABEL / getToolEntryUrl
```

**关键点**：glob 模式只匹配「一层目录下的一层文件」= `<channel>/<tool>.ts`，
不会误收 `index.ts`、`channels.ts`，也不会收更深层的文件。**目录结构本身就是过滤器。**

### 5.3 单个工具文件长什么样

`src/data/tools/english/movie-line-shadowing.ts`：

```ts
import type { Tool } from '@/types';

const tool: Tool = {
  id: 'movie-line-shadowing',
  name: '影视台词跟读',
  channel: 'english',
  description: '精听影视与口语短视频台词：逐词高亮、变速循环跟读、录音与原声比对，专攻连读弱读。',
  tags: ['英语', '听力', '口语'],
  status: 'online',
  runtime: 'client-only',
  entry: 'tools/english/movie-line-shadowing/tool/index.html',  // ← 显式完整路径
  cover: '🎧',
  version: '0.1.0',
  createdAt: '2026-10-12',
  order: 1,
};

export default tool;
```

**纪律**

- **`entry` 必须写完整路径**，任何地方都不许用 `channel`/`id` 去「拼」路径 —— 这样目录层级变化对代码完全透明。
- 对象必须是**纯字面量**（字符串/数字/布尔/数组），不要写函数、模板字符串或变量引用 ——
  构建期校验脚本会直接解析该字面量。

### 5.4 类型扩展（`src/types/index.ts`）

```ts
export interface Tool {
  id: string;
  name: string;
  /** 所属频道 id（L2 目录名），必须与工具注册表文件所在目录、以及产物目录一致 */
  channel: string;
  // ... 其余字段不变
}
```

`channel` 设为**必填**，靠 TypeScript 强制每个工具都归位。

---

## 6. 同步脚本通用化

### 6.1 现状问题

旧脚本 `scripts/sync-daily-english.mjs` **为单个工具写死**：源目录、目标目录、白名单全部硬编码。
每来一个多文件工具，就要复制一份脚本，再去 `package.json` 里加一条 `prebuild` ——
**两个 AI 同时加 → `package.json` 冲突**，正是要避免的。

### 6.2 改法：一工具一清单 + 一个通用器

清单 `scripts/sync/movie-line-shadowing.json`：

```json
{
  "id": "movie-line-shadowing",
  "src": "D:/workspaces/每日英语",
  "srcEnv": "MOVIE_LINE_SRC",
  "dest": "public/tools/english/movie-line-shadowing",
  "include": ["*.mp4", "tool/index.html", "tool/data.json", "tool/zh.json", "tool/voices/**"],
  "exclude": ["**/_qa/**", "**/__pycache__/**", "**/*.py", "**/*.part", "**/.*"],
  "required": ["tool/index.html", "tool/data.json", "tool/zh.json"],
  "optional": true
}
```

通用器 `scripts/sync-tools.mjs`（**只写一次、不再改**）：

1. 扫描 `scripts/sync/*.json`，逐个比对「源 → 目标」。
2. **幂等判据 = 大小 + 内容 sha1 双判据**（⚠️ **绝不只看大小** —— 见下）。
3. 源目录不存在 → 打印警告并 **继续（整体 `exit 0`）**，复用仓库中已提交的产物，不阻断构建。
4. **白名单拷贝**：include 显式列出的才带，exclude 再兜底，绝不把 `*.py` / `_qa/` / `__pycache__/` / `.part` 带进站点。
5. 增量策略：正常构建 **0 拷贝 / 0 清理**。
6. 只做**增量新增/覆盖**，**绝不做「清空重拷」**。

`package.json` 里**永远只有这一条**：

```json
"prebuild": "node scripts/sync-tools.mjs && node scripts/check-tools.mjs"
```

> **顺序是 `sync-tools → check-tools`，不能反。**
> `check-tools.mjs` 会校验 `entry` 指向的文件在 `public/` 下真实存在，
> 而这个文件正是**由 sync 产出的**。若 check 在前，新增多文件工具首次构建时
> 必然报「entry 指向的文件不存在」并 `exit 1`，**根本走不到 sync**，新工具永远上不去。

单文件工具**不需要**同步清单 —— 直接把 HTML 放进 `public/tools/<channel>/<tool>/index.html` 提交即可。

### 6.2.1 `rename` 字段（源文件名 ≠ 站内规范名时）

清单可给一个 `rename` 对象，把**源相对路径**精确映射为**目标相对路径**：

```json
{
  "rename": { "player.html": "index.html" }
}
```

- 用于「工具本体文件名不符合站内命名规范」的场合：源播放器叫 `player.html`
  （工具本体是已验收产物、零改动），而站内单文件工具统一要求 `index.html`，
  并由 `check-tools.mjs` 对非 `index.html` 的 entry 报 warn。
  **不许改工具本体文件名**，所以由同步器做映射。
- ⚠️ `required` 仍按**源**相对路径判定，不按映射后的。
- sync 的「期望集合 key」= 目标相对路径，因此拷贝 / 校验 / 孤儿清理自动基于目标名，无需额外处理。

### 6.3 ⚠️ 两条必须记住的坑

**（1）幂等判据必须比内容指纹，不能只看大小。**
本站音轨是 edge-tts 合成的 MP3，时长被量化在帧栅格（约 24ms）上，
所以**同一句话重新合成后大小极可能不变、字节内容却不同**。
这不是理论：clear 音轨全量重做 255 条后只有 9 条大小变化，其余 246 条被「大小相同即跳过」漏掉，
其中 **4 条恰是内容必须更新的**（念的是订正前的旧句子），站点上静默留了错句音频。
**结论：大小相同 ≠ 内容相同。** 需要强制重拷用 `--force`。

**（2）宿主的批量删除配额。**
宿主环境对**文件删除**有「每回合 50 次」的硬配额，超配额会**直接杀掉进程**（不抛异常）。
所以同步器只做增量、绝不清空重拷；另：Vite 的 `emptyOutDir` 内部会 `rmSync` 清空输出目录，
一旦输出目录文件数 >50，**本地 `npm run build` 必然失败**。
解法：本地验证改用 `npx vite build --outDir dist-check`，正式构建交给 GitHub Actions（CI 无此限制）。

---

## 7. 构建期校验：把规约变成硬约束

`scripts/check-tools.mjs` 接进 `prebuild`：

| 校验项 | 不通过的后果 |
|---|---|
| `id` 全局唯一 | **报错退出** |
| `channel` 存在于 `CHANNELS` | **报错退出** |
| `id` 未被保留字占用（`channel`） | **报错退出** |
| 注册表文件所在目录名 == `channel` | **报错退出** |
| 注册表文件名字 == 对象里的 `id` | **报错退出** |
| 有 `entry` 时 `public/<entry>` **真实存在** | **报错退出** |
| 有 `entry` 时文件名必须为 `index.html` | 警告 |
| 同频道内 `order` 重复 | 警告 |

**这才是「不冲突」的最后一道保险**：不靠人（或 AI）自觉，靠构建失败。
可直接运行 `npm run check:tools` 单独校验。

> 说明：`prebuild` 的顺序已确定为 **`sync-tools && check-tools`**（先同步后校验）。
> 因为 `entry` 指向的产物正是 sync 产出的，若 check 在前，新增多文件工具首次构建
> 必然因「entry 文件不存在」而 `exit 1`，永远走不到 sync。**顺序不可反。**

---

## 8. 路由与页面

| 路由 | 页面 | 说明 |
|---|---|---|
| `/tools` | `ToolListPage` | **按频道分区**展示已上线工具（每区一个频道标题 + 卡片网格），末尾单独一节展示「研发中」；筛选时退化为平铺结果 |
| `/tools/channel/:channel` | `ChannelPage` | 单频道页：频道名/描述 + 该频道下全部工具 |
| `/tools/:id` | `ToolViewPage` | 工具详情 + 「打开工具」（真实 `<a target="_blank">`） |

- `/tools/channel/x` 有 3 段、`/tools/:id` 只匹配 2 段，**不会冲突**；且静态段 `channel` 优先级高于动态段。
- 因此 **`channel` 是保留字**，不许当工具 id（由 §7 校验兜住）。
- 路由 `basename` 取自 `src/lib/paths.ts` 的 `BASE_PREFIX`（适配 GitHub Pages 子路径部署）。

---

## 9. 现有工具归位（迁移清单 · 已执行）

| id | 名称 | 迁移前路径 | 迁移后路径 | channel |
|---|---|---|---|---|
| `shuangpin-practice` | 双拼练习 | `tools/shuangpin-practice.html` | `tools/general/shuangpin-practice/index.html` | `general` |
| `md-to-html-reader` | Markdown 阅读器 | `tools/md-to-html-reader.html` | `tools/general/md-to-html-reader/index.html` | `general` |
| `dict-reader` | 英语句读器 | `tools/english-dict-reader.html` | `tools/english/dict-reader/index.html` | `english` |
| `movie-line-shadowing` | 影视台词跟读 | `tools/daily-english/tool/index.html` | `tools/english/movie-line-shadowing/tool/index.html` | `english` |
| `logic-fallacy-cards` | 逻辑谬误卡片 | `tools/logic-fallacy-cards.html` | `tools/cognition/logic-fallacy-cards/index.html` | `cognition` |
| `set-theory-cards` | 集合论卡片 | —（规划中） | `tools/math/set-theory-cards/index.html` | `math` |
| `intuition-cards` | 直觉之卡 | —（规划中） | `tools/cognition/intuition-cards/index.html` | `cognition` |
| `markdown-slide` | Markdown 幻灯 | —（规划中） | `tools/general/markdown-slide/index.html` | `general` |
| `moear` | 影视台词磨耳朵 | —（新增） | `tools/english/moear/index.html` | `english` |

**id 变更**：`daily-english` → `movie-line-shadowing`；`english-dict-reader` → `dict-reader`；`intuition-zhika` → `intuition-cards`。
**名称变更**：`每日英语跟读` → `影视台词跟读`（其余名称不变）。

### 迁移执行顺序（一次成型）

1. 先**建新目录并拷贝**（`copyFileSync`，**不删除**旧路径）
2. `src/data/tools.ts` → 拆成 `src/data/tools/**` 一工具一文件（并删除旧文件）
3. `src/types/index.ts` 加 `channel`（必填）
4. `scripts/sync-tools.mjs` + `scripts/sync/*.json` + `scripts/check-tools.mjs`，改 `package.json` 的 `prebuild`
5. 跑 `npx tsc -b` + `npx vite build --outDir dist-check` + `npm run check:tools`，确认全绿
6. **确认线上无问题后**，才删除旧的平铺产物

---

## 10. 命名规范速查

| 对象 | 规则 | 例子 |
|---|---|---|
| 频道 id（L2） | 小写英文单词 | `english` / `math` / `cognition` / `general` |
| 工具 id（L3） | 小写 kebab，**全局唯一、体现适用范围** | `movie-line-shadowing` |
| 工具目录名 | == 工具 id | `public/tools/english/movie-line-shadowing/` |
| 工具入口文件 | 恒为 `index.html` | — |
| 注册表文件名 | == 工具 id | `src/data/tools/english/movie-line-shadowing.ts` |
| 同步清单文件名 | == 工具 id | `scripts/sync/movie-line-shadowing.json` |
| 内容主键（工具内数据） | `sha1(内容)[:10]`，**不用文件名** | `tool/voices/<hash>/s00.mp3` |

**id 为什么足够独特**：注册表是**全局平铺**的，路由 `/tools/:id` 也是全局的，
再加上「目录名 = channel / 文件名 = id」的强约束与构建期唯一性校验，
「两个 AI 各自起名」在结构上不可能撞车。

---

## 11. 待确认

1. **旧路径是否需要 301 兼容层？** 迁移后 `/tools/xxx.html` 与 `/tools/daily-english/...` 会 404。
   若要保守，可在 `public/_redirects` 里加 301。当前判定：站点自用为主，暂不加。
2. **`general` 这个兜底频道名**是否换成「其他 / 实用 / 杂项」？
3. **~~`prebuild` 顺序~~** —— **已定**：`sync-tools && check-tools`（先同步后校验），
   见 §6.2 / §7 说明。原因：`entry` 产物由 sync 产出，check 在前会阻断新增工具。
