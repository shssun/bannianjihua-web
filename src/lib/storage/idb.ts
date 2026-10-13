/**
 * 零依赖 · 极小 IndexedDB 封装（本地结构化学习记录）。
 *
 * ⚠️ 复制声明（务必先读）
 *   本文件是一段**可被原样抄进自包含工具 HTML** 的纯逻辑。
 *   `public/tools/<channel>/<id>/index.html` 下的工具走不了 Vite 打包、没有模块系统，
 *   工具作者会**直接把这一段粘贴进 <script>** —— 因为工具与主站同 origin，
 *   二者的 IndexedDB / localStorage 天然共享，**不需要任何 IPC**。
 *   因此本文件**硬性禁止**：
 *     1. import 任何模块（本文件对外只导出纯函数与常量）；
 *     2. 任何打包器 / 构建期特性：`import.meta`、`?raw`、环境变量注入、`@/` 路径别名等；
 *     3. 任何第三方依赖。
 *   只允许使用标准 Web API（indexedDB / Promise / 普通对象）。
 *   （粘贴进老式 `<script>` 时，把 `export function` 改成 `function`、
 *     `export const` 改成 `const` 即可，逻辑一字不动。）
 *
 * 设计约定（对齐项目「service 绝不抛异常」）：
 *   - 所有函数**返回 Promise**；
 *   - **任何异常都不向上抛**，失败时返回 `null` / `[]` / `false`，交由调用方判断；
 *   - `indexedDB` 不可用（隐私模式 / 老浏览器 / SSR）时**优雅降级**，绝不让调用方崩。
 */

/** IndexedDB 数据库名（与 localStorage 前缀 `bannianjihua:` 同名同义）。 */
export const DB_NAME = 'bannianjihua';

/** 数据库版本号；新增对象仓库 / 索引时 +1。 */
export const DB_VERSION = 1;

/** 结构化记录所在的对象仓库名（主键路径为 `id`）。 */
export const RECORDS_STORE = 'records';

/** 打开数据库的 Promise 缓存（懒加载 + 去重，解析为 IDBDatabase 或 null）。 */
let dbPromise: Promise<IDBDatabase | null> | null = null;

/**
 * 懒打开数据库，并在升级时补齐缺失的对象仓库。
 * @returns 数据库实例；不可用时为 `null`（**绝不抛出**）。
 */
function openDatabase(): Promise<IDBDatabase | null> {
  if (dbPromise) {
    return dbPromise;
  }
  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    try {
      if (typeof indexedDB === 'undefined' || indexedDB === null) {
        resolve(null);
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(RECORDS_STORE)) {
          db.createObjectStore(RECORDS_STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

/**
 * 在指定仓库上执行一次事务，事务完成即视为成功。
 * 用于不需要读取返回值的写操作（put / delete / clear）。
 */
function writeTx(
  store: string,
  run: (objectStore: IDBObjectStore) => void,
): Promise<boolean> {
  return openDatabase().then((db) => {
    if (!db) {
      return false;
    }
    return new Promise<boolean>((resolve) => {
      try {
        const tx = db.transaction(store, 'readwrite');
        run(tx.objectStore(store));
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
        tx.onabort = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  });
}

/**
 * 写入（新增或按主键覆盖）一条记录。
 * @param store 仓库名
 * @param value 结构化可克隆的值（本仓库主键为 `value.id`）
 * @returns 是否写入成功
 */
export function put(store: string, value: unknown): Promise<boolean> {
  return writeTx(store, (objectStore) => {
    objectStore.put(value);
  });
}

/**
 * 按主键读取一条记录。
 * @param store 仓库名
 * @param key 主键值
 * @returns 命中的记录，未命中或失败时为 `null`
 */
export function get<T = unknown>(store: string, key: IDBValidKey): Promise<T | null> {
  return openDatabase().then((db) => {
    if (!db) {
      return null;
    }
    return new Promise<T | null>((resolve) => {
      try {
        const tx = db.transaction(store, 'readonly');
        const request = tx.objectStore(store).get(key);
        request.onsuccess = () => resolve((request.result as T) ?? null);
        request.onerror = () => resolve(null);
        tx.onabort = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  });
}

/**
 * 读取仓库内全部记录。
 * @param store 仓库名
 * @returns 记录数组；失败或不可用时为空数组 `[]`
 */
export function getAll<T = unknown>(store: string): Promise<T[]> {
  return openDatabase().then((db) => {
    if (!db) {
      return [];
    }
    return new Promise<T[]>((resolve) => {
      try {
        const tx = db.transaction(store, 'readonly');
        const request = tx.objectStore(store).getAll();
        request.onsuccess = () =>
          resolve(Array.isArray(request.result) ? (request.result as T[]) : []);
        request.onerror = () => resolve([]);
        tx.onabort = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  });
}

/**
 * 按主键删除一条记录。
 * @param store 仓库名
 * @param key 主键值
 * @returns 是否删除成功
 */
export function del(store: string, key: IDBValidKey): Promise<boolean> {
  return writeTx(store, (objectStore) => {
    objectStore.delete(key);
  });
}

/**
 * 清空整个仓库（保留对象仓库本身）。
 * @param store 仓库名
 * @returns 是否清空成功
 */
export function clearStore(store: string): Promise<boolean> {
  return writeTx(store, (objectStore) => {
    objectStore.clear();
  });
}
