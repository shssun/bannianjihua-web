/**
 * 集合定义（工具的**来源 / 主题**维度，虚拟、多对多）。
 *
 * ## 为什么需要它 —— 频道与集合是两个正交维度
 *
 * | | 频道 `channel` | 集合 `collection` |
 * |---|---|---|
 * | 维度 | **科目**（英语 / 数学 / 认知…） | **来源 · 主题**（书籍 / 某本书 / 高考…） |
 * | 存在形态 | **物理目录**，唯一归属 | **虚拟**，多对多 |
 * | 回答 | 「在哪个学科下看」 | 「这东西从哪来的」 |
 * | 校验 | 目录名 == channel（`check-tools.mjs`） | id 存在于本文件（`check-tools.mjs`） |
 *
 * 典型场景：老板把某本书的学习法做成了一批工具，
 * 这些工具**既属于「英语」频道，又属于「书籍」集合和「那一本书」的集合**。
 * 物理上它们仍只存在一份（`public/tools/english/<id>/`），
 * 只是**展示**上多了一个归口 —— 所以不需要第二份物理副本。
 *
 * ## 一本书 → N 个工具
 *
 * 一本书产出的多个工具共享同一个「书」集合（`dragon-english-*`），
 * 该集合页天然就是这本书的落地页；而它们又都挂在 `books` 集合下，
 * 于是「书籍」这个来源维度自动聚合了全部书籍类工具。
 *
 * ## 增删规则
 *
 * 集合极少变更，因此与 `channels.ts` 一样保留这**一个**汇总文件。
 * 新增集合 = 在 `COLLECTIONS` 里加一项；给工具挂集合 = 在该工具的
 * `collections: []` 里加 id。**两者都不需要改任何其他文件。**
 *
 * ⚠️ 本文件会被 `scripts/lib/registry.mjs` 用正则
 * `\bid\s*:\s*'([^']+)'` 解析出 id 列表（构建期校验用）。
 * 因此 `id` 必须写成**单引号字符串字面量**；其它字段（如 `parentId`、
 * `name`）不会命中该正则（`\b` 词边界 + 大小写敏感），可放心命名。
 */

/** 集合（来源 / 主题）。 */
export interface Collection {
  /** 集合 id，同时也是 `/tools/collection/:collection` 的路由段（kebab-case） */
  id: string;
  /** 集合中文名 */
  name: string;
  /** 封面 / 图标（emoji） */
  cover: string;
  /** 一句话描述（集合页副标题） */
  description: string;
  /**
   * 上级集合 id（可选）。用于表达「书籍 → 某一本书」这类层级。
   * 上级集合页会把子集合作为入口区块渲染在工具网格之上。
   */
  parentId?: string;
  /** 展示顺序（升序） */
  order: number;
}

/** 全部集合（按 order 升序的原始声明）。 */
export const COLLECTIONS: Collection[] = [
  {
    id: 'books',
    name: '书与方法',
    cover: '📚',
    description: '把一本好书的学习方法做成能直接用的工具',
    order: 1,
  },
  {
    id: 'dragon-english-basic100',
    name: '《基本英文100》',
    cover: '🐉',
    description: '竹冈广信《Dragon English 基本英文100》· 输出侧：把想说的写出来',
    parentId: 'books',
    order: 10,
  },
  {
    id: 'dragon-english-grammar100',
    name: '《必修英文法100》',
    cover: '🐉',
    description: '竹冈广信《Dragon English 必修英文法100》· 输入侧：把语法想明白',
    parentId: 'books',
    order: 11,
  },
];

/**
 * 按 id 查找集合。
 * @param id 集合 id
 * @returns 匹配的 Collection，未找到返回 undefined
 */
export function getCollectionById(id: string): Collection | undefined {
  return COLLECTIONS.find((collection) => collection.id === id);
}

/** 按 order 升序排序后的集合列表（返回副本，避免污染源数组）。 */
export function getSortedCollections(): Collection[] {
  return [...COLLECTIONS].sort((a, b) => a.order - b.order);
}

/**
 * 取某个集合的直接子集合，按 order 升序。
 * @param parentId 上级集合 id
 */
export function getChildCollections(parentId: string): Collection[] {
  return getSortedCollections().filter((collection) => collection.parentId === parentId);
}

/**
 * 顶层集合（无 parentId），按 order 升序。
 * 用于「按来源浏览」入口，避免把「某一本书」和「书籍」平铺在一起。
 */
export function getTopLevelCollections(): Collection[] {
  return getSortedCollections().filter((collection) => !collection.parentId);
}
