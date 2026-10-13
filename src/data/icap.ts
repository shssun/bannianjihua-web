/**
 * ICAP 认知层级定义（工具的**认知投入**维度，虚拟、多对多）。
 *
 * ## ICAP 是什么 —— Chi & Wylie (2014)
 *
 * 把学习者的**认知投入**分四层，学习效果递增：
 * `passive` → `active` → `constructive` → `interactive`。
 * 每层由「可观测的外显行为」与「学习者产出的产品」判定，**不是**任务的名字，
 * 也**不是**设计者的意图。
 *
 * | 层级 | 学习者行为 | 机制 | 学习结果 |
 * |---|---|---|---|
 * | passive 被动 | 接收：听、看、读 | 存储 | 逐字回忆，无迁移 |
 * | active 主动 | 操弄材料：划线、跟读、做题 | 整合 | 浅层理解，仅近迁移 |
 * | constructive 建构 | **生成超出所给材料之物**：自我解释、变体、预测、比较 | 推断 | 深度理解，可远迁移 |
 * | interactive 互动 | 两人以上轮流生成 + 吸收反馈、辩护、质问 | 共同创造 | 最深理解 |
 *
 * ## 与「集合」的关系 —— 又一层正交维度
 *
 * | | 频道 `channel` | 集合 `collection` | 认知层级 `icap` |
 * |---|---|---|---|
 * | 维度 | **科目** | **来源 · 主题** | **认知投入** |
 * | 存在形态 | 物理目录，唯一归属 | 虚拟，多对多 | 虚拟，多对多 |
 * | 落库字段 | `Tool.channel`（必填） | `Tool.collections?` | `Tool.icap?` |
 *
 * ## 增删规则
 *
 * ICAP 层级是**固定四层**（Chi & Wylie 2014），**不会**新增或删除；
 * 因此与 `channels.ts` / `collections.ts` 一样保留这**一个**汇总文件。
 * 给工具挂层级 = 在该工具的 `icap: []` 里加 id，**不需要改任何其他文件**。
 *
 * ## ⚠️ 字段设计与「意图 ≠ 实际」
 *
 * `Tool.icap` 记录的是工具**设计上**要唤起的层级（**设计意图**），
 * **不等于**学习者的实际层级。ICAP 原文最硬的规矩是：
 * 判实际层级必须**分析学习者真实产出的产品** ——
 * 被要求「自我解释」的学习者可能只是在复述，实际仍停在 active。
 * 因此 UI 上必须明示「意图 ≠ 实际」，不可把它当成评分表。
 *
 * ## ⚠️ id 必须写成单引号字符串字面量
 *
 * 本文件会被 `scripts/lib/registry.mjs` 的正则
 * `\bid\s*:\s*'([^']+)'`（`loadDeclaredIds`）解析出 id 列表（构建期校验用）。
 * 因此每层的 `id` **必须**写成单引号字符串字面量。
 * 该正则**不会**误收本文件 interface 里的 `id: ICAPLevel;`（无引号），
 * 也**不会**误收 `parentId` 这类字段（`\b` 词边界 + 大小写敏感双挡）。
 */

import type { ICAPLevel } from '@/types';

/** ICAP 认知层级。 */
export interface IcapLevel {
  /** 层级 id，同时也是 `Tool.icap` 的取值 */
  id: ICAPLevel;
  /** 层级中文名 */
  name: string;
  /** 层级英文名 */
  en: string;
  /** 行为 · 机制 · 结果（一句话） */
  description: string;
  /** 展示顺序（1..4，学习效果递增） */
  order: number;
}

/** 全部 ICAP 层级（按 order 升序的原始声明）。 */
export const ICAP_LEVELS: IcapLevel[] = [
  {
    id: 'passive',
    name: '被动',
    en: 'Passive',
    description: '接收：听、看、读 → 存储 → 逐字回忆，无迁移',
    order: 1,
  },
  {
    id: 'active',
    name: '主动',
    en: 'Active',
    description: '操作材料：划线、跟读、做题 → 整合 → 浅层理解，仅近迁移',
    order: 2,
  },
  {
    id: 'constructive',
    name: '建构',
    en: 'Constructive',
    description: '生成超出所给材料之物：自我解释、变体、预测、比较 → 推断 → 深度理解，可远迁移',
    order: 3,
  },
  {
    id: 'interactive',
    name: '互动',
    en: 'Interactive',
    description: '两人以上轮流生成 + 吸收反馈、辩护、质问 → 共同创造 → 最深理解',
    order: 4,
  },
];

/**
 * 按 id 查找 ICAP 层级。
 * @param id 层级 id
 * @returns 匹配的 IcapLevel，未找到返回 undefined
 */
export function getIcapLevelById(id: string): IcapLevel | undefined {
  return ICAP_LEVELS.find((level) => level.id === id);
}

/** 按 order 升序排序后的层级列表（返回副本，避免污染源数组）。 */
export function getSortedIcapLevels(): IcapLevel[] {
  return [...ICAP_LEVELS].sort((a, b) => a.order - b.order);
}
