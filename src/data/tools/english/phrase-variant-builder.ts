import type { Tool } from '@/types';

/**
 * 短语变体练习（channel: english）。
 *
 * ## 为什么有这个工具 —— 补 ICAP「建构（constructive）」这一层
 *
 * 见 docs/ICAP-INTEGRATION.md §2：站内 12 个工具的实测落点是
 * Passive 10 · Active 2 · **Constructive 0** · Interactive 0 —— 上面两层完全空白。
 * ICAP（Chi & Wylie 2014）的核心判据是「看学习者产出的**产品**，不看意图」：
 * 建构 = 学习者**生成超出所给材料之物**，也是通往「用得出」的唯一低成本抓手。
 *
 * 因此本工具的两条铁律：
 *   1. 必须让学习者**写下文本**，并且**落盘**（否则无法判定实际层级）；
 *   2. 练习必须是**变换**（生成材料里没有的东西），「照抄 / 回忆」不算建构。
 *
 * ## 数据依赖（运行期同源拉取，不复制数据进仓库）
 *
 * 工具在 `public/tools/english/phrase-variant-builder/index.html`，
 * 相对路径 `fetch('../moear/tool/phrases.json')` 解析为
 * `public/tools/english/moear/tool/phrases.json`（346 条短语）。
 * 每条短语自带四个语用轴（function / scene / tone / difficulty），
 * 变换算子即由这些元数据**推导**得出，无需另撰题目数据。
 *
 * ## 存储约定（与主站共享同一 IndexedDB）
 *
 * 工具与主站**同 origin**，因此工具内联一份与 `src/lib/storage/idb.ts` **同名同结构**
 * 的逻辑（删掉 export、逻辑一字不改）：库名 `bannianjihua`、版本 1、对象仓库 `records`。
 * 学习者产出以 `LearnerRecord`（camelCase，`kind: 'variant'`）落库，主站以后能直接读到。
 */
const tool: Tool = {
  id: 'phrase-variant-builder',
  name: '短语变体练习',
  channel: 'english',
  description:
    '抽一条短语，按提示换语气 / 换场景 / 换语用功能把它改写出来，再对照示范写下你的改写理由。把「听得懂」练成「用得出」。',
  tags: ['英语', '写作', '产出', '变体'],
  status: 'online',
  runtime: 'client-only',
  entry: 'tools/english/phrase-variant-builder/index.html',
  cover: '🔀',
  version: '1.0.0',
  createdAt: '2026-10-13',
  order: 14,
  icap: ['passive', 'active', 'constructive'],
};

export default tool;
