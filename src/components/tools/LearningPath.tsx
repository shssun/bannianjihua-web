import { useCallback, useEffect, useState } from 'react';
import { Box, Button, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import type { PathStep } from '@/data/collections';
import { getToolById, getToolEntryUrl } from '@/data/tools';
import { ICAP_LEVELS } from '@/data/icap';
import {
  getPathProgress,
  setStepManualDone,
  type PathStepProgress,
} from '@/lib/storage/progress';

interface LearningPathProps {
  collectionId: string;
  steps: PathStep[];
}

/**
 * 集合页的「学习路径」区块：把本集合下的工具按 ICAP 认知投入从低到高串成阶梯。
 *
 * 三种步骤状态（判据见 `src/lib/storage/progress.ts`）：
 *   - `pending`：这一步的工具还没做（路径缺口）；
 *   - `auto`：由该工具的产出记录自动判定（完成 = 记录数 > 0）；
 *   - `manual`：暂无自动判据，学习者**自评**（自评 ≠ 客观证据）。
 *
 * ⚠️ 路径是**编排**不是强制：跳步不拦人，但高层的产出会失去地垫。
 * ⚠️ 进度不可用（IndexedDB 被禁用 / 无痕模式）时，全部步骤退化为 `todo`，
 *    页面照常工作，不报错、不弹窗。
 */
export default function LearningPath({ collectionId, steps }: LearningPathProps): JSX.Element {
  const [progress, setProgress] = useState<PathStepProgress[] | null>(null);

  // 挂载时读一次进度；集合或步骤变化时重读。
  useEffect(() => {
    let active = true;
    void getPathProgress(collectionId, steps).then((result) => {
      if (active) {
        setProgress(result);
      }
    });
    return () => {
      active = false;
    };
  }, [collectionId, steps]);

  /** 手动标记后重新拉取进度（简单且不会与自动判据脱节）。 */
  const reload = useCallback(async () => {
    const result = await getPathProgress(collectionId, steps);
    setProgress(result);
  }, [collectionId, steps]);

  const handleToggle = useCallback(
    async (toolId: string, done: boolean) => {
      await setStepManualDone(collectionId, toolId, done);
      await reload();
    },
    [collectionId, reload],
  );

  const header = (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      spacing={2}
      sx={{ mb: 2 }}
    >
      <Box>
        <Typography variant="h3" sx={{ fontSize: '1.15rem' }}>
          学习路径
        </Typography>
        <Typography variant="body2" color="var(--muted)" sx={{ mt: 0.5, lineHeight: 1.6 }}>
          按认知投入从低到高；跳步不会拦你，但高层的产出会失去地垫。
        </Typography>
      </Box>
      {progress !== null && steps.some((step) => step.toolId) ? (
        <Typography variant="body2" color="var(--muted)" sx={{ whiteSpace: 'nowrap' }}>
          已完成 {steps.filter((step, index) => step.toolId && progress[index]?.status === 'done').length}{' '}
          / {steps.filter((step) => step.toolId).length} 步
        </Typography>
      ) : null}
    </Stack>
  );

  // 加载中：整块渲染骨架，不要闪白。
  if (progress === null) {
    return (
      <Box>
        {header}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="var(--muted)">
            正在读取本地进度…
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      {header}
      <Stack spacing={0}>
        {steps.map((step, index) => {
          const p = progress[index] ?? { status: 'todo', source: 'manual', count: 0 };
          const toolId = step.toolId;
          const tool = toolId ? getToolById(toolId) : undefined;
          // ICAP 徽章：取该工具声明的**最高**层级（order 最大者），与 ToolCard 同款写法。
          const topIcap = tool
            ? ICAP_LEVELS.filter((level) => tool.icap?.includes(level.id)).sort(
                (a, b) => b.order - a.order,
              )[0]
            : undefined;
          const isLast = index === steps.length - 1;

          return (
            <Stack key={`${index}-${step.label}`} direction="row" spacing={2} alignItems="stretch">
              {/* 左侧：圆形序号 + 竖线连接（最后一步不画线） */}
              <Stack alignItems="center" sx={{ width: 32, flexShrink: 0 }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'var(--primary-soft)',
                    color: 'var(--primary)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  {index + 1}
                </Box>
                {!isLast ? (
                  <Box sx={{ flex: 1, width: '2px', bgcolor: 'var(--border)', mt: 0.5 }} />
                ) : null}
              </Stack>

              {/* 步骤主体 */}
              <Paper variant="outlined" sx={{ flex: 1, minWidth: 0, p: 2, mb: 1.5 }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  justifyContent="space-between"
                  alignItems={{ xs: 'stretch', sm: 'flex-start' }}
                >
                  {/* 中间：标签 + 说明 + 工具入口 / 缺口说明 */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography variant="h3" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                        {step.label}
                      </Typography>
                      {topIcap ? (
                        <Chip
                          label={`ICAP · ${topIcap.name}`}
                          size="small"
                          variant="outlined"
                          title={`ICAP 认知层级（设计意图）：${topIcap.name} ${topIcap.en} —— ${topIcap.description}`}
                          sx={{ borderColor: 'var(--border)' }}
                        />
                      ) : null}
                    </Stack>

                    {step.note ? (
                      <Typography
                        variant="body2"
                        color="var(--muted)"
                        sx={{ mt: 0.5, lineHeight: 1.6 }}
                      >
                        {step.note}
                      </Typography>
                    ) : null}

                    {toolId ? (
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {tool ? tool.name : toolId}
                        </Typography>
                        {tool ? (
                          <Box
                            component="a"
                            href={getToolEntryUrl(tool)}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              color: 'var(--primary)',
                              fontSize: '0.85rem',
                              '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            打开
                          </Box>
                        ) : null}
                      </Stack>
                    ) : (
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                        useFlexGap
                        sx={{ mt: 1 }}
                      >
                        {step.todo ? (
                          <Typography variant="body2" color="var(--muted)">
                            {step.todo}
                          </Typography>
                        ) : null}
                        <Chip
                          label="待建"
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: 'var(--border)' }}
                        />
                      </Stack>
                    )}
                  </Box>

                  {/* 右侧：状态区 */}
                  <Box
                    sx={{
                      flexShrink: 0,
                      minWidth: { sm: 140 },
                      textAlign: { xs: 'left', sm: 'right' },
                    }}
                  >
                    {p.status === 'pending' ? (
                      <Chip
                        label="待建"
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: 'var(--border)' }}
                      />
                    ) : null}

                    {p.source === 'auto' ? (
                      <Box>
                        {p.status === 'done' ? (
                          <Chip
                            label={`已产出 ${p.count} 条`}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            label="尚无产出"
                            size="small"
                            variant="outlined"
                            sx={{ borderColor: 'var(--border)' }}
                          />
                        )}
                        <Typography
                          variant="caption"
                          display="block"
                          color="var(--muted)"
                          sx={{ mt: 0.5 }}
                        >
                          自动判据：该工具的产出记录
                        </Typography>
                      </Box>
                    ) : null}

                    {p.source === 'manual' && toolId ? (
                      <Box>
                        <Button
                          size="small"
                          variant={p.status === 'done' ? 'outlined' : 'contained'}
                          onClick={() => {
                            void handleToggle(toolId, p.status !== 'done');
                          }}
                        >
                          {p.status === 'done' ? '已完成 ✓' : '标记完成'}
                        </Button>
                        <Typography
                          variant="caption"
                          display="block"
                          color="var(--muted)"
                          sx={{ mt: 0.5 }}
                        >
                          自评 · 非客观证据
                        </Typography>
                      </Box>
                    ) : null}
                  </Box>
                </Stack>
              </Paper>
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}
