# 数据层决策（DATABASE）

> 状态：已决策。本文件记录「为什么这样存」，避免以后反复论证。
> 关联：`docs/ICAP-INTEGRATION.md`（§2 说明为什么「学习者产出物留存」是本项目当前最关键的能力）。

---

## 0. TL;DR

- 站点**纯静态、无服务器**，部署在 GitHub Pages 子路径 `/bannianjihua-web/`。
- 数据分两类：**私有学习记录 → 浏览器本地**；**共享数据（留言板）→ Supabase（本期完全不动）**。
- **不上 SQLite**（含 SQLite-WASM）。原因见 §2。
- 本地存储分两层：**localStorage（小数据）** + **IndexedDB（结构化记录）**，统一封装在 `src/lib/storage/`（零依赖）。
- 所有存储键带前缀 `bannianjihua:`（origin 共享，见 §4）。
- 工具与主站**同 origin → 存储天然共享、零 IPC**（见 §5，这是本设计的核心优点）。

---

## 1. 两类数据对照表

| 维度 | 私有学习记录 | 共享数据 |
|---|---|---|
| 内容 | 学习者产出物（变体文本 / 录音引用）、学习进度、自评 / 互评打分 | 留言板 |
| 归属 | **单用户、本机** | **所有人可见** |
| 存放 | **浏览器本地**：`localStorage`（小数据）+ `IndexedDB`（结构化记录） | **Supabase**（唯一强后端功能） |
| 代码位置 | `src/lib/storage/`（`localStore` / `recordsStore`） | `src/services/messagesService.ts` + `src/lib/supabase.ts` |
| 本期改动 | **新增** | **完全不动** |
| 生命周期 | 存在本机浏览器；清缓存 / 换设备即丢（→ 靠导出 / 导入兜底） | 存在云端数据库 |
| 降级 | 存储不可用时静默失败，调用方不崩 | 未配置 / 请求失败时走 fallback 演示数据 |

> 判断口径：**只有「给所有人看」的数据才上 Supabase**；凡是「我自己学的痕迹」一律留在本地。

---

## 2. 为什么不上 SQLite（含 SQLite-WASM）

结论：**在 GitHub Pages 上跑不了可用的 SQLite**。论证链如下。

### 2.1 `opfs` VFS 需要 COOP/COEP 响应头 —— GitHub Pages 设不了

- SQLite-WASM 默认持久化 VFS 是 **`opfs`**（Origin Private File System）。
- `opfs` VFS 依赖 `SharedArrayBuffer`，而浏览器启用 `SharedArrayBuffer` 的**前提**是页面返回：
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Embedder-Policy: require-corp`
- **GitHub Pages 不允许自定义响应头**（它只提供静态文件托管，没有配置响应头的入口）。
- → 因此在 GH Pages 上 **`opfs` VFS 直接不可用**。

### 2.2 唯一能在 GH Pages 跑的是 `opfs-sahpool` VFS —— 但代价很大

- `opfs-sahpool`（SyncAccessHandle Pool）**不依赖 `SharedArrayBuffer`**，因此**不需要 COOP/COEP**，是唯一能在 GH Pages 落地的持久化 VFS。
- 但它有两个硬性代价：
  1. **必须在 Worker 线程**中使用（`FileSystemSyncAccessHandle` 只在 worker 可用）；
  2. **单连接**（同一时刻只有一个连接可持有 SAH pool）。
- 对本项目而言，这意味着：为存一点学习记录，要引入 Worker + 连接管理 + 初始化时序 + 单连接互斥 —— **复杂度远超收益**。

### 2.3 结论

- 我们的记录是**少量、结构化、单用户**的数据 → **IndexedDB 完全够用**，且**零依赖、无需响应头、主线程即可**。
- 因此本期**明确不上 SQLite**。选择 IndexedDB 不是「退而求其次」，而是**在当前部署约束下的正解**。

---

## 3. 什么时候才该上 SQLite（触发器）

以下是**三个触发条件**，满足**任一**才重新评估 SQLite-WASM（且必须重新评估 §2.2 的 VFS 代价）：

1. **需要跨记录的 SQL 聚合** —— 例如要 `GROUP BY` / `JOIN` 多张表做统计报表，IndexedDB 的游标 + 手动聚合已明显吃力。
2. **需要可分发的单文件档案** —— 例如希望导出/分享一个「**单个 .sqlite 文件**」就能带走全部数据（而不是 JSON）。
3. **数据量 > 100MB** —— IndexedDB 在超大体积（尤其二进制音频）下性能与配额表现变差。

> 现状：记录是文本级、量级小，三条**均不满足** → 继续用 IndexedDB。

### 3.1 切换成本已被隔离

`recordsStore`（`src/lib/storage/index.ts`）刻意做成**唯一替换点**：

- 调用方只依赖语义化方法（`saveRecord` / `listRecords` / `exportAll` / `importAll` …），**不接触任何 IndexedDB 细节**。
- 将来换 SQLite-WASM，**只替换 `recordsStore` 的内部实现**，调用方一行不改。

---

## 4. origin 共享的坑（前缀必需）

- `shssun.github.io` 这**一个 origin** 被该用户**所有 project pages 共用**（`https://shssun.github.io/<repo>/` 形式）。
- 浏览器给 `localStorage` / `IndexedDB` 的隔离粒度是 **origin**，不是路径 → **同一 origin 下所有站点共享同一份存储**。
- 因此**所有存储键必须带前缀** `bannianjihua:`（已存在于 `src/lib/utils.ts` 的 `STORAGE_PREFIX`），否则会与其他站点互相覆盖 / 污染。

> `src/lib/storage/index.ts` 的 `localStore` 会**自动**给键补前缀（幂等，已带则不重复加），调用方只传裸键名。

### 4.1 换自定义域名 = 换 origin = 旧本地数据全部孤立

- 若将来从 `shssun.github.io` 换成自定义域名（如 `example.com`），**origin 变了** → 浏览器把新 origin 视为全新空间。
- 结果：**旧 origin 下的所有本地数据（localStorage + IndexedDB）在新域名下全部读不到**，表现为「数据凭空消失」。
- **迁移铁律**：**换域名 / 换 origin 之前，必须先导出**（`recordsStore.exportAll()` 下载 JSON）→ 在新 origin 上 `importAll()` 导入。
- 这也是 `exportAll()` 必须返回**可直接 `JSON.stringify`** 的包、并带 **schema 版本号**的原因。

---

## 5. 工具与主站同 origin → 存储天然共享、零 IPC（核心优点）

- 工具是**独立 HTML**（`public/tools/<channel>/<id>/index.html`），新标签页直开，**没有 iframe、没有 postMessage**。
- 但工具页面与主站**同 origin** → `localStorage` / `IndexedDB` **天然共享**：
  - 工具**写入**的产出物（变体文本、自评等），主站**直接能读到**；
  - 反之亦然。
- **不需要任何 IPC**（不需要 postMessage / 消息总线 / 后端中转）。
- 落地要求：工具的存储逻辑必须是**不依赖打包器**的纯逻辑，能被**原样抄进**自包含工具 HTML。
  → 这就是 `src/lib/storage/idb.ts` 顶部「复制声明」的由来：它**不许 import、不许用 `import.meta` 等打包器特性**，只有标准 Web API。

> 结论：**「同 origin + 纯逻辑可抄」= 工具与主站的数据自动打通**，这是本设计最省事、最可靠的一环。

---

## 6. 待办：Supabase 免费版「连续 1 周无流量即暂停」

- Supabase 免费版官方定价页明确：**项目连续 1 周（7 天）无任何流量会被暂停**（pause），需手动或自动唤醒。
- 留言板是本站唯一强后端；若无访客，可能被自动暂停 → 下次访问报错 / 不可用。
- **后续方案（本期不实现，仅登记待办）**：加 **GitHub Actions 定时探活**（cron 周期 < 7 天，如每日一次），对 Supabase 发起一次轻量只读请求保持活跃。
- 状态：**本期只写进本文件，不实现**。

---

## 7. 文件与 API 索引

| 文件 | 职责 |
|---|---|
| `src/lib/storage/idb.ts` | 零依赖 IndexedDB 封装（`put` / `get` / `getAll` / `del` / `clearStore`）；可原样抄进工具 HTML |
| `src/lib/storage/index.ts` | 门面：`localStore`（localStorage）+ `recordsStore`（结构化记录，含导入导出） |
| `src/lib/utils.ts` | `STORAGE_PREFIX` / `safeGetItem` / `safeSetItem` / `uuid` |

**`LearnerRecord`（camelCase）**

```ts
interface LearnerRecord {
  id: string;        // uuid()
  toolId: string;    // 'phrase-variant-builder'
  kind: string;      // 'variant' | 'progress' | 'self-rating' ...
  refId?: string;    // 关联对象 id（如短语 id）
  payload: unknown;  // 具体内容
  createdAt: string; // ISO
}
```

**`recordsStore` 方法**：`saveRecord` · `getRecord` · `listRecords(filter?)` · `deleteRecord` · `clearAll` · `exportAll` · `importAll`。

- `exportAll()` → `{ schema, version, exportedAt, records }`（可直接 `JSON.stringify`）。
- `importAll(data)` → **幂等合并**：同 `id` 覆盖、不重复插入；非法入参**安全返回失败标记、不抛异常**。
