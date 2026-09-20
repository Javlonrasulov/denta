import Svg, { Path, Rect } from 'react-native-svg';

import { useTheme } from '@/theme';

type BrandMarkSize = 24 | 28 | 32 | 36 | 40 | 48;

export function BrandMark({
  size = 32,
  color,
}: {
  size?: BrandMarkSize;
  color?: string;
}) {
  const { colors, isDark } = useTheme();
  const fill = color ?? (isDark ? '#4F46E5' : colors.primary);
  const tooth = '#FFFFFF';

  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" accessibilityRole="image">
      <Rect x="0" y="0" width="32" height="32" rx="9" fill={fill} />
      <Path
        d="M16 6.6c-3.1 0-5.4 2.4-5.4 5.2 0 3.2 1.3 7.8 3.2 10.4.7 1 1.4 1.7 2.2 1.7s1.5-.7 2.2-1.7c1.9-2.6 3.2-7.2 3.2-10.4 0-2.8-2.3-5.2-5.4-5.2Z"
        fill={tooth}
      />
    </Svg>
  );
}
