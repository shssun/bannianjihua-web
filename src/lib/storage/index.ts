/**
 * 统一存储门面（Facade）。
 *
 * 站点是**纯静态、无服务器**的，数据分两类（见 docs/DATABASE.md）：
 *   - **私有学习记录**（学习者产出物 / 进度 / 自评）→ 浏览器本地（本模块）；
 *   - **共享数据**（留言板）→ Supabase（本模块**不涉及**）。
 *
 * 本模块提供两个门面：
 *   - `localStore`：小数据（偏好 / 指针），复用 utils 的 safeGetItem / safeSetItem，
 *     键统一带 `bannianjihua:` 前缀（`shssun.github.io` 是所有 project pages 共享的 origin，
 *     不带前缀会与其他站点互相污染）。
 *   - `recordsStore`：结构化记录，走零依赖的 `./idb`（IndexedDB），带导入 / 导出。
 *
 * ⚠️ 为将来可能切换到 SQLite-WASM 预留：届时只需替换 `recordsStore` 的实现，
 *    调用方一行不改 —— 因此对外只暴露语义化方法，不泄漏 IndexedDB 细节。
 *
 * 约定：**绝不抛异常**；失败返回 `null` / `[]` / `false` / 失败标记。
 */

import { STORAGE_PREFIX, safeGetItem, safeSetItem, uuid } from '@/lib/utils';
import { RECORDS_STORE, put, get, getAll, del, clearStore } from './idb';

/** 导出文件的 schema 标识（用于未来识别 / 迁移导入包）。 */
export const RECORDS_SCHEMA = 'bannianjihua.records';

/** 导出文件的 schema 版本号；记录结构变更时 +1。 */
export const RECORDS_SCHEMA_VERSION = 1;

/**
 * 一条「学习者产出物」记录（ICAP 判定所依赖的「产品」）。
 *
 * 字段一律 camelCase，与项目其它类型约定一致。
 */
export interface LearnerRecord {
  /** 唯一 ID（用 src/lib/utils.ts 的 uuid() 生成）。 */
  id: string;
  /** 产出该记录的工具 id，如 'phrase-variant-builder'。 */
  toolId: string;
  /** 记录类别：'variant' | 'progress' | 'self-rating' 等。 */
  kind: string;
  /** 关联对象 id（如短语 id），可选。 */
  refId?: string;
  /** 具体内容（任意结构化数据）。 */
  payload: unknown;
  /** 创建时间（ISO 字符串）。 */
  createdAt: string;
}

/** `listRecords` 的过滤条件；提供的字段之间为「与」关系。 */
export interface RecordFilter {
  toolId?: string;
  kind?: string;
  refId?: string;
}

/** 导出包：**可直接 JSON.stringify**，含 schema 版本号，便于长期归档 / 迁移。 */
export interface RecordsExport {
  schema: string;
  version: number;
  exportedAt: string;
  records: LearnerRecord[];
}

/** 导入结果标记（失败不抛异常，用 `ok` 表达）。 */
export interface ImportResult {
  ok: boolean;
  imported: number;
  skipped: number;
  error?: string;
}

/** 给 localStorage 键补上 `bannianjihua:` 前缀（幂等：已带前缀则不重复加）。 */
function prefixed(key: string): string {
  return key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`;
}

/**
 * 小数据门面（localStorage）。
 * 复用 utils 的安全读写，键统一带前缀，异常静默降级。
 */
export const localStore = {
  /** 读取字符串；缺失或异常返回 fallback。 */
  get(key: string, fallback: string | null = null): string | null {
    return safeGetItem(prefixed(key), fallback);
  },

  /** 写入字符串；异常静默失败。 */
  set(key: string, value: string): void {
    safeSetItem(prefixed(key), value);
  },

  /** 删除键；异常静默失败。 */
  remove(key: string): void {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(prefixed(key));
      }
    } catch {
      /* 隐私模式 / 配额满时静默失败 */
    }
  },

  /** 读取 JSON；解析失败返回 fallback。 */
  getJSON<T>(key: string, fallback: T): T {
    const raw = safeGetItem(prefixed(key));
    if (raw === null) {
      return fallback;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  /** 写入 JSON；序列化或写入异常静默失败。 */
  setJSON(key: string, value: unknown): void {
    try {
      safeSetItem(prefixed(key), JSON.stringify(value));
    } catch {
      /* 循环引用 / 隐私模式时静默失败 */
    }
  },
};

/**
 * 生成一条完整的 `LearnerRecord`（补齐 id 与 createdAt）。
 * 供调用方 / 工具便捷创建记录，避免各处手写 uuid() 与时间。
 */
export function createRecord(
  input: Omit<LearnerRecord, 'id' | 'createdAt'> & Partial<Pick<LearnerRecord, 'id' | 'createdAt'>>,
): LearnerRecord {
  return {
    id: input.id && input.id.length > 0 ? input.id : uuid(),
    toolId: input.toolId,
    kind: input.kind,
    refId: input.refId,
    payload: input.payload,
    createdAt: input.createdAt && input.createdAt.length > 0 ? input.createdAt : new Date().toISOString(),
  };
}

/** 判断任意值是否满足 `LearnerRecord` 的最小结构（用于导入校验）。 */
function isValidRecordShape(value: unknown): value is LearnerRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.toolId === 'string' &&
    typeof candidate.kind === 'string' &&
    typeof candidate.createdAt === 'string' &&
    'payload' in candidate
  );
}

/** 按过滤条件筛选记录（纯内存过滤，规模小，无需 IndexedDB 索引）。 */
function matchFilter(record: LearnerRecord, filter?: RecordFilter): boolean {
  if (!filter) {
    return true;
  }
  if (filter.toolId !== undefined && record.toolId !== filter.toolId) {
    return false;
  }
  if (filter.kind !== undefined && record.kind !== filter.kind) {
    return false;
  }
  if (filter.refId !== undefined && record.refId !== filter.refId) {
    return false;
  }
  return true;
}

/**
 * 结构化记录门面（IndexedDB）。
 *
 * ⚠️ 这是「为将来切换 SQLite-WASM 预留」的**唯一替换点**：
 *    换存储时只改本对象内部实现，对外签名保持不变。
 */
export const recordsStore = {
  /**
   * 保存一条记录（同 id 覆盖）。
   * @returns 是否写入成功
   */
  saveRecord(record: LearnerRecord): Promise<boolean> {
    if (!isValidRecordShape(record)) {
      return Promise.resolve(false);
    }
    return put(RECORDS_STORE, record);
  },

  /**
   * 按 id 读取一条记录。
   * @returns 命中记录，未命中或失败为 `null`
   */
  async getRecord(id: string): Promise<LearnerRecord | null> {
    const record = await get<LearnerRecord>(RECORDS_STORE, id);
    return record && isValidRecordShape(record) ? record : null;
  },

  /**
   * 列出记录（可按 toolId / kind / refId 过滤）。
   * @returns 记录数组（失败时为空数组）
   */
  async listRecords(filter?: RecordFilter): Promise<LearnerRecord[]> {
    const all = await getAll<LearnerRecord>(RECORDS_STORE);
    return all.filter((record) => isValidRecordShape(record) && matchFilter(record, filter));
  },

  /**
   * 按 id 删除一条记录。
   * @returns 是否删除成功
   */
  deleteRecord(id: string): Promise<boolean> {
    return del(RECORDS_STORE, id);
  },

  /**
   * 清空全部记录。
   * @returns 是否清空成功
   */
  clearAll(): Promise<boolean> {
    return clearStore(RECORDS_STORE);
  },

  /**
   * 导出全部记录为**可直接 JSON.stringify** 的包（含 schema 版本号）。
   * @returns 导出包（存储不可用时为空的 records 数组）
   */
  async exportAll(): Promise<RecordsExport> {
    const records = await recordsStore.listRecords();
    return {
      schema: RECORDS_SCHEMA,
      version: RECORDS_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      records,
    };
  },

  /**
   * 幂等导入：同 id **覆盖**、不重复插入；非法条目跳过；非法入参安全返回失败标记。
   * @param data 形如 `RecordsExport` 的对象（字段做宽松校验）
   * @returns 导入结果标记（**绝不抛异常**）
   */
  async importAll(data: unknown): Promise<ImportResult> {
    try {
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        return { ok: false, imported: 0, skipped: 0, error: '导入数据格式非法：期望对象。' };
      }

      const recordsField = (data as { records?: unknown }).records;
      if (!Array.isArray(recordsField)) {
        return { ok: false, imported: 0, skipped: 0, error: '导入数据缺少 records 数组。' };
      }

      // 批内先按 id 去重（后者覆盖前者），确保同一 id 只写一次。
      const merged = new Map<string, LearnerRecord>();
      let skipped = 0;
      for (const item of recordsField) {
        if (!isValidRecordShape(item)) {
          skipped += 1;
          continue;
        }
        merged.set(item.id, item);
      }

      let imported = 0;
      for (const record of merged.values()) {
        const success = await put(RECORDS_STORE, record);
        if (success) {
          imported += 1;
        } else {
          skipped += 1;
        }
      }

      if (imported !== merged.size) {
        return {
          ok: false,
          imported,
          skipped,
          error: '部分或全部记录未能写入本地存储。',
        };
      }
      return { ok: true, imported, skipped };
    } catch {
      return { ok: false, imported: 0, skipped: 0, error: '导入失败：未知错误。' };
    }
  },
};
