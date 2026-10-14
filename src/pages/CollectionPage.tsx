import { useMemo } from 'react';
import { Box, Grid, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import type { Tool } from '@/types';
import { getToolsByCollection } from '@/data/tools';
import type { Collection } from '@/data/collections';
import { getChildCollections, getCollectionById } from '@/data/collections';
import ToolCard from '@/components/tools/ToolCard';
import LearningPath from '@/components/tools/LearningPath';
import EmptyState from '@/components/common/EmptyState';
import Section from '@/components/common/Section';

/** 已上线优先，其次按 order 升序。 */
function rankTools(tools: Tool[]): Tool[] {
  return [...tools].sort((a, b) => {
    const onlineRank = (tool: Tool): number => (tool.status === 'online' ? 0 : 1);
    const diff = onlineRank(a) - onlineRank(b);
    if (diff !== 0) {
      return diff;
    }
    return (a.order ?? 9999) - (b.order ?? 9999);
  });
}

/** 子集合入口卡片：图标 + 名称 + 工具数 + 描述。 */
function ChildCollectionCard({
  collection,
  count,
}: {
  collection: Collection;
  count: number;
}): JSX.Element {
  return (
    <Paper
      component={RouterLink}
      to={`/tools/collection/${collection.id}`}
      variant="outlined"
      sx={{
        display: 'block',
        p: 2,
        height: '100%',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color .15s ease, transform .15s ease',
        '&:hover': { borderColor: 'var(--primary)', transform: 'translateY(-2px)' },
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 0.5 }}>
        <Typography component="span" sx={{ fontSize: '1.4rem' }} aria-hidden>
          {collection.cover}
        </Typography>
        <Typography variant="h3" sx={{ fontSize: '1.05rem' }}>
          {collection.name}
          <Typography component="span" variant="body2" color="var(--muted)" sx={{ ml: 1 }}>
            {count}
          </Typography>
        </Typography>
      </Stack>
      <Typography variant="caption" color="var(--muted)">
        {collection.description}
      </Typography>
    </Paper>
  );
}

/**
 * 单集合页 `/tools/collection/:collection`。
 *
 * 集合是**来源 / 主题**维度的**虚拟多对多归口**，与物理唯一的频道正交：
 * 同一个工具在频道页和任意多个集合页里都会出现，但物理上只有一份产物。
 *
 * 页面结构：
 * 1. 学习路径（若本集合配了 `path`）—— 把工具按 ICAP 认知投入从低到高串成阶梯，
 *    渲染在工具网格**之上**；
 * 2. 若有子集合（如「书与方法」下的各本书），再渲染子集合入口区块；
 * 3. 最后渲染该集合下的全部工具（已上线在前、研发中在后）；
 * 4. 集合 id 非法、或既无子集合也无工具时，给出友好占位（不白屏）。
 */
export default function CollectionPage(): JSX.Element {
  const { collection: collectionId } = useParams<{ collection: string }>();
  const collection = collectionId ? getCollectionById(collectionId) : undefined;

  const children = useMemo<Collection[]>(() => {
    if (!collectionId) {
      return [];
    }
    return getChildCollections(collectionId);
  }, [collectionId]);

  const tools = useMemo<Tool[]>(() => {
    if (!collectionId) {
      return [];
    }
    return rankTools(getToolsByCollection(collectionId));
  }, [collectionId]);

  if (!collection) {
    return (
      <Box className="container-page py-10">
        <EmptyState
          icon="🧭"
          title="未找到该集合"
          description="集合可能不存在，或链接有误。"
          actionLabel="返回工具箱"
          actionTo="/tools"
        />
      </Box>
    );
  }

  const isEmpty = tools.length === 0 && children.length === 0;

  return (
    <Section
      title={`${collection.cover} ${collection.name}`}
      subtitle={collection.description}
      actionLabel="返回工具箱"
      actionTo="/tools"
    >
      {isEmpty ? (
        <EmptyState
          icon="🧰"
          title="该集合暂无内容"
          description="新的工具正在路上，敬请期待。"
          actionLabel="返回工具箱"
          actionTo="/tools"
        />
      ) : (
        <Stack spacing={4}>
          {collection.path && collection.path.length > 0 ? (
            <LearningPath collectionId={collection.id} steps={collection.path} />
          ) : null}

          {children.length > 0 ? (
            <Box>
              <Typography variant="caption" color="var(--muted)">
                收录的书 · {children.length}
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {children.map((child) => (
                  <Grid item xs={12} sm={6} md={4} key={child.id}>
                    <ChildCollectionCard
                      collection={child}
                      count={getToolsByCollection(child.id).length}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : null}

          {tools.length > 0 ? (
            <Box>
              <Typography variant="body2" color="var(--muted)">
                共 {tools.length} 个工具
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {tools.map((tool) => (
                  <Grid item xs={12} sm={6} md={4} key={tool.id}>
                    <ToolCard tool={tool} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : null}

          <Typography variant="body2" component="div">
            <Box
              component={RouterLink}
              to="/tools"
              sx={{ color: 'var(--primary)', '&:hover': { textDecoration: 'underline' } }}
            >
              ← 返回工具箱
            </Box>
          </Typography>
        </Stack>
      )}
    </Section>
  );
}
