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
 * ## 学习路径（`Collection.path`）
 *
 * 只有「有明确教学法次序」的集合才配路径：把本集合下的工具按 ICAP 认知投入
 * 从低到高串成阶梯，在集合页工具网格**之上**渲染。路径是**编排**，不是清单的重复。
 *
 * ⚠️ 本文件会被 `scripts/lib/registry.mjs` 用正则
 * `\bid\s*:\s*'([^']+)'` 解析出 id 列表（构建期校验用）。
 * 因此 `id` 必须写成**单引号字符串字面量**；其它字段（如 `parentId`、
 * `name`）不会命中该正则（`\b` 词边界 + 大小写敏感），可放心命名。
 *
 * `path[].toolId` **不参与**上述 `id` 列表解析（`toolId` 里的 `Id` 前是词字符 `l`，
 * `\b` 不成立，且正则大小写敏感）—— 它另有 `loadCollections()` 做结构化校验，
 * 见 `scripts/lib/registry.mjs` 与 `scripts/check-tools.mjs`。
 */

/**
 * 学习路径的一步（ICAP 阶梯编排的最小单元）。
 *
 * ⚠️ 路径描述的是**编排**（这一步在阶梯上的位置），不强制按序执行。
 * 但跳步会让高层产出失去输入侧地垫 —— 所以页面上会标出「上游未完成」。
 */
export interface PathStep {
  /** 步骤短标签，如「听读」「默写」「变体」 */
  label: string;
  /** 这一步为什么排在这里（一句话，展示在标签下方） */
  note?: string;
  /**
   * 这一步用哪个工具。必须是**已挂在本集合下**的工具 id（构建期 `check-tools.mjs` 校验）。
   * 省略 = 这一步的工具还没做（路径缺口），此时必须给 `todo` 说明缺口。
   */
  toolId?: string;
  /**
   * 哪一类产出记录算「这一步完成」（对应 `LearnerRecord.kind`）。
   * 省略 = 该步骤暂无自动判据，进度由学习者**手动标记**。
   */
  evidenceKind?: string;
  /** 路径缺口时展示的说明（`toolId` 省略时必填） */
  todo?: string;
}

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
  /**
   * ICAP 学习路径（可选）。把本集合下的工具按认知投入从低到高串成阶梯，
   * 在集合页工具网格**之上**渲染为「学习路径」区块。
   *
   * 只有「有明确教学法次序」的集合才配路径 —— 路径是**编排**，不是清单的重复。
   */
  path?: PathStep[];
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
    id: 'movie-lines',
    name: '影视台词',
    cover: '🎬',
    description: '从影视剧里挑出的 346 条地道口语 —— 先把耳朵磨出来，再用得出',
    order: 2,
    path: [
      {
        label: '磨耳朵',
        note: '随机抽条循环灌耳、按序串读，纯英文无中文干扰 —— 目标是听力反应速度，不是「看懂」。',
        toolId: 'moear',
      },
      {
        label: '变体',
        note: '抽一条短语，换语气 / 换场景把它改写出来，再写下你的改写理由 —— 让「听得懂」变成「用得出」。',
        toolId: 'phrase-variant-builder',
        evidenceKind: 'variant',
      },
    ],
  },
  {
    id: 'dragon-english-basic100',
    name: '《基本英文100》',
    cover: '🐉',
    description: '竹冈广信《Dragon English 基本英文100》· 输出侧：把想说的写出来',
    parentId: 'books',
    order: 10,
    path: [
      {
        label: '听读',
        note: '先把 100 句连着读熟，逐词可查音标与释义 —— 语言输入的底座，这一步不能省。',
        toolId: 'basic100-sentence-reader',
      },
      {
        label: '默写',
        note: '看中文提示写出英文，再对答案看讲解 —— 从「认得」到「写得出」。',
        toolId: 'chinese-to-english-drill',
      },
      {
        label: '变体',
        todo: '在 100 句的基础上换语气 / 换场景改写，把「背下来」变成「用得出」—— 这一步的工具还没做。',
      },
    ],
  },
  {
    id: 'dragon-english-grammar100',
    name: '《必修英文法100》',
    cover: '🐉',
    description: '竹冈广信《Dragon English 必修英文法100》· 输入侧：把语法想明白',
    parentId: 'books',
    order: 11,
  },
  {
    id: 'high-school-math',
    name: '高中数学',
    cover: '📐',
    description: '易错易误解点 · 数形结合：拖动参数，看图象怎么变',
    order: 3,
    path: [
      {
        label: '看图辨形',
        note: '拖动参数，看常见函数图象怎么变、位置怎么移',
        toolId: 'function-param-lab',
      },
      {
        label: '（待建）',
        note: '更多章节的易误解点',
        todo: '等「高中数学易误解点全清单」调研后按可视化性排序补入',
      },
    ],
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
