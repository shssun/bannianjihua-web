import { useRef, useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import Section from '@/components/common/Section';
import { recordsStore, type ImportResult } from '@/lib/storage';

/**
 * 数据页 `/data`：本地学习记录的导出 / 导入入口。
 *
 * 为什么需要本页（见 docs/DATABASE.md §4.1）：
 *   localStorage / IndexedDB 的隔离粒度是 **origin** —— 一旦换域名（换 origin），
 *   旧 origin 下的全部本地数据在新域名下读不到（表现为「数据凭空消失」）。
 *   因此换域名前必须先「导出 JSON」→ 新 origin 上「导入」。
 *
 * 约定：存储不可用时静默降级（结果内联展示，**不弹窗**）；**绝不抛异常**。
 */

/** 导出状态提示（null = 尚未导出）。 */
type ExportNotice = { level: 'info' | 'warn'; text: string } | null;

/** 生成导出文件名中的日期段，如 2026-10-14。 */
function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 触发浏览器下载一个文本文件（纯前端，无服务器）。 */
function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * 数据管理页：导出全部学习记录 / 导入记录文件。
 */
export default function DataPage(): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportNotice, setExportNotice] = useState<ExportNotice>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importFileName, setImportFileName] = useState<string>('');

  /** 导出全部记录为 JSON 文件（文件名带日期）。 */
  const handleExport = async (): Promise<void> => {
    const data = await recordsStore.exportAll();
    if (data.records.length === 0) {
      // 存储不可用或暂无记录：静默降级，内联提示，不下载空文件。
      setExportNotice({ level: 'warn', text: '暂无可导出的记录（存储不可用或还没有学习产出）。' });
      return;
    }
    downloadTextFile(`bannianjihua-records-${todayStamp()}.json`, JSON.stringify(data, null, 2));
    setExportNotice({ level: 'info', text: `已导出 ${data.records.length} 条记录（schema v${data.version}）。` });
  };

  /** 读取用户选择的 JSON 文件并导入（幂等合并：同 id 覆盖）。 */
  const handleImportFile = async (file: File): Promise<void> => {
    setImportFileName(file.name);
    setImportResult(null);
    let data: unknown;
    try {
      data = JSON.parse(await file.text());
    } catch {
      setImportResult({ ok: false, imported: 0, skipped: 0, error: '文件内容不是合法 JSON。' });
      return;
    }
    setImportResult(await recordsStore.importAll(data));
  };

  return (
    <Section title="我的数据" subtitle="学习记录保存在本机浏览器里 —— 换设备 / 换域名前请先导出备份。">
      <Typography variant="body1" color="var(--muted)" sx={{ lineHeight: 1.9, maxWidth: 760, mb: 4 }}>
        本站的学习产出（变体句子、进度、自评等）只存在你本机浏览器的 IndexedDB 里，没有账号体系。
        浏览器的数据隔离按「域名（origin）」划分：如果将来站点更换域名，旧域名下的数据在新域名下将无法读取
        —— 所以换域名 / 换设备 / 清缓存前，请先在这里导出一份 JSON 备份，再到新环境导入恢复。
      </Typography>

      <Stack spacing={2} sx={{ maxWidth: 760, mb: 4 }}>
        {/* 导出 */}
        <Box className="surface-card" sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
            导出全部记录
          </Typography>
          <Typography variant="body2" color="var(--muted)" sx={{ mb: 2 }}>
            把本机全部学习记录打包成一个带日期的 JSON 文件下载到本地。
          </Typography>
          <Button variant="outlined" onClick={() => void handleExport()}>
            导出全部记录（JSON）
          </Button>
          {exportNotice !== null && (
            <Typography variant="body2" sx={{ mt: 1.5, color: exportNotice.level === 'warn' ? 'var(--muted)' : 'var(--primary)' }}>
              {exportNotice.text}
            </Typography>
          )}
        </Box>

        {/* 导入 */}
        <Box className="surface-card" sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
            导入记录文件
          </Typography>
          <Typography variant="body2" color="var(--muted)" sx={{ mb: 2 }}>
            选择之前导出的 JSON 文件恢复记录；相同 id 的记录会被覆盖，不会重复插入。
          </Typography>
          <Button variant="outlined" onClick={() => fileInputRef.current?.click()}>
            选择 JSON 文件…
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            aria-label="选择要导入的记录 JSON 文件"
            style={{ display: 'none' }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleImportFile(file);
              event.target.value = ''; // 允许连续选择同一文件
            }}
          />
          {importResult !== null && (
            <Typography variant="body2" sx={{ mt: 1.5, color: importResult.ok ? 'var(--primary)' : 'var(--muted)' }}>
              {importResult.ok
                ? `导入完成（${importFileName}）：写入 ${importResult.imported} 条，跳过 ${importResult.skipped} 条。`
                : `导入失败（${importFileName}）：${importResult.error ?? '未知错误。'}`}
            </Typography>
          )}
        </Box>
      </Stack>
    </Section>
  );
}
