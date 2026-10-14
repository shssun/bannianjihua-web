/**
 * 学习路径进度（基于 `recordsStore`，与工具共享同一 IndexedDB）。
 *
 * 判据分两类（见 `src/data/collections.ts` 的 `PathStep`）：
 *   - `evidenceKind` 有值 → **自动**：该工具该类产出记录数 > 0 即算完成；
 *   - 省略              → **手动**：学习者自评，写一条确定性 id 的 progress 记录
 *                        （确定性 id 让「重复标记」幂等，不会积累多条）。
 *
 * ⚠️ 手动标记是**自评**，不是客观证据 —— 与 ICAP「意图 ≠ 实际」一致，
 *    页面上会明确标出判据来源。
 */
import type { PathStep } from '@/data/collections';
import { createRecord, recordsStore } from './index';

/** 手动标记使用的伪工具 id（这些记录不属于任何工具，属于主站路径自评）。 */
export const PATH_PROGRESS_TOOL_ID = 'path-progress';
/** 手动标记记录的 kind。 */
export const PATH_PROGRESS_KIND = 'progress';

export type PathStepStatus = 'done' | 'todo' | 'pending';

export interface PathStepProgress {
  status: PathStepStatus;
  /** 'auto' = 由工具产出记录判定；'manual' = 学习者自评；'pending' = 步骤缺工具 */
  source: 'auto' | 'manual' | 'pending';
  /** auto 时的产出条数（manual / pending 恒为 0） */
  count: number;
}

/** 手动标记记录的主键（确定性 → 幂等）。 */
export function stepProgressRecordId(collectionId: string, toolId: string): string {
  return `${PATH_PROGRESS_TOOL_ID}:${collectionId}:${toolId}`;
}

/** 读取整条路径的进度（一次 listRecords，之后纯内存判定）。 */
export async function getPathProgress(
  collectionId: string,
  steps: PathStep[],
): Promise<PathStepProgress[]> {
  const all = await recordsStore.listRecords();
  return steps.map((step) => {
    const toolId = step.toolId;
    if (!toolId) {
      return { status: 'pending', source: 'pending', count: 0 } as PathStepProgress;
    }
    if (step.evidenceKind) {
      const count = all.filter(
        (record) => record.toolId === toolId && record.kind === step.evidenceKind,
      ).length;
      return {
        status: count > 0 ? 'done' : 'todo',
        source: 'auto',
        count,
      } as PathStepProgress;
    }
    const done = all.some((record) => record.id === stepProgressRecordId(collectionId, toolId));
    return { status: done ? 'done' : 'todo', source: 'manual', count: 0 } as PathStepProgress;
  });
}

/** 手动标记 / 取消标记一步（写或删确定性 id 的 progress 记录）。 */
export async function setStepManualDone(
  collectionId: string,
  toolId: string,
  done: boolean,
): Promise<boolean> {
  if (!done) {
    return recordsStore.deleteRecord(stepProgressRecordId(collectionId, toolId));
  }
  return recordsStore.saveRecord(
    createRecord({
      id: stepProgressRecordId(collectionId, toolId),
      toolId: PATH_PROGRESS_TOOL_ID,
      kind: PATH_PROGRESS_KIND,
      refId: `${collectionId}:${toolId}`,
      payload: { collectionId, stepToolId: toolId },
    }),
  );
}
