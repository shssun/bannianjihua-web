import { Chip } from '@mui/material';

interface TagChipProps {
  label: string;
  size?: 'small' | 'medium';
  clickable?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

/**
 * 标签 chip：用于工具与文章标签展示/筛选。
 */
export default function TagChip({
  label,
  size = 'small',
  clickable = false,
  selected = false,
  onClick,
}: TagChipProps): JSX.Element {
  return (
    <Chip
      label={label}
      size={size}
      clickable={clickable}
      onClick={onClick}
      variant={selected ? 'filled' : 'outlined'}
      color={selected ? 'primary' : 'default'}
      sx={{
        borderColor: 'var(--border)',
        '& .MuiChip-label': { px: 1 },
      }}
    />
  );
}
