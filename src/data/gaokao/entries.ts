/**
 * 「考点图谱」栏目条目注册表（/gaokao）。
 *
 * 与工具注册表（src/data/tools）刻意分离：本栏目收纳的是
 * 「备考知识点」类交互页面 —— 思维导图、考点清单、知识图谱等，
 * 不占用工具箱的频道/集合/ICAP 三维度。
 *
 * 扩展约定：
 * - 新增知识点只需在 GAOKAO_ENTRIES 数组追加一个纯字面量对象；
 * - `entry` 是 public/ 下的绝对路径（以 '/' 开头），经 publicUrl()
 *   补 base 前缀后以新标签直开（同工具的打开方式，不用 iframe）；
 * - `externalUrl` 用于同时保留外部托管版（如资料库发布页）。
 */

export interface GaokaoEntry {
  /** 唯一 id（同时用作页面锚点） */
  id: string;
  name: string;
  description: string;
  tags: string[];
  /** public/ 下独立 HTML 的绝对路径，如 '/gaokao/xxx/index.html' */
  entry?: string;
  /** 外部托管版本链接（可选） */
  externalUrl?: string;
  cover: string;
  addedAt: string;
}

export const GAOKAO_ENTRIES: GaokaoEntry[] = [
  {
    id: 'exam-weight-map',
    name: '六科考点权重思维导图',
    description:
      '甘肃新高考（物化生）六科考点权重全景：S/A/B/C 四级权重、近三年分值、考查形式与备考提示；默认按模块折叠展示（可逐层下钻），支持权重筛选、关键词定位与缩放。',
    tags: ['思维导图', '六科', '2027届', '权重分级'],
    entry: '/gaokao/exam-weight-map/index.html',
    externalUrl: 'https://workbuddy.link/p/GNy6OhxWRrFUvuG7RSFDdv',
    cover: '🧭',
    addedAt: '2026-10-20',
  },
  {
    id: 'exam-knowledge-tree',
    name: '六科知识树 · 星级考点清单',
    description:
      '按教材册序梳理六科 158 个主题：★1–5 星级 + 中文短语双标识、每主题附真题痕迹；含试卷结构总览、提分性价比梯队、跨学科关联与 36 个五星题型模板。',
    tags: ['知识树', '星级清单', '题型模板', '跨学科'],
    entry: '/gaokao/knowledge-tree/index.html',
    cover: '🌳',
    addedAt: '2026-10-20',
  },
];
