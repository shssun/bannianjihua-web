import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import Section from '@/components/common/Section';
import { GAOKAO_ENTRIES, type GaokaoEntry } from '@/data/gaokao/entries';
import { publicUrl } from '@/lib/paths';

/**
 * 考点图谱页 `/gaokao`：备考知识点的统一入口。
 *
 * 第一张卡片是「甘肃新高考六科考点权重思维导图」（2027 届口径），
 * 后续知识点按同一注册表模式（src/data/gaokao/entries.ts）继续追加。
 *
 * 打开方式遵循站点架构约定：真实 <a target="_blank" rel="noopener noreferrer">
 * 新标签直开独立 HTML，不用 iframe、不走 window.open。
 */
function EntryCard({ item }: { item: GaokaoEntry }): JSX.Element {
  const openUrl: string | null = item.entry ? publicUrl(item.entry) : item.externalUrl ?? null;

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: '1px solid var(--border)',
        borderRadius: 3,
        bgcolor: 'var(--card, transparent)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, flex: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ fontSize: '1.9rem', lineHeight: 1 }} aria-hidden>
            {item.cover}
          </Box>
          <Typography variant="h3" sx={{ fontSize: '1.08rem', fontWeight: 700 }}>
            {item.name}
          </Typography>
        </Stack>

        <Typography variant="body2" sx={{ color: 'var(--muted)', lineHeight: 1.7 }}>
          {item.description}
        </Typography>

        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 'auto' }}>
          {item.tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
          ))}
        </Stack>

        {openUrl && (
          <Box sx={{ pt: 0.5 }}>
            {/* 架构约定：新标签直开，真实 <a>；不用 iframe、不用 window.open */}
            <a
              href={openUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '7px 18px',
                borderRadius: 10,
                background: 'var(--primary)',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              打开 ↗
            </a>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default function GaokaoPage(): JSX.Element {
  return (
    <Section
      title="考点图谱"
      subtitle={`甘肃新高考 · 2027届（现高三）｜ 语数英 新高考全国Ⅱ卷 · 物化生 甘肃自主命题 ｜ 共 ${GAOKAO_ENTRIES.length} 篇`}
    >
      <Typography variant="body2" sx={{ color: 'var(--muted)', mb: 2.5, lineHeight: 1.8 }}>
        本栏目汇集备考向的知识点可视化与结构化资料，持续扩充中。
        权重口径：S 每年必考（≥12分）／ A 高频（5–12分）／ B 中频轮换 ／ C 低频扫盲；
        甘肃 2024 年起进入新高考，权重以 2024–2026 三年为主口径。
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 2,
        }}
      >
        {GAOKAO_ENTRIES.map((item) => (
          <EntryCard key={item.id} item={item} />
        ))}
      </Box>
    </Section>
  );
}
