import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';

import { useLoginTheme } from '@/components/auth/loginTheme';

export function DentalBackdrop() {
  const { width, height } = useWindowDimensions();
  const { dental, dentalSoft, glow } = useLoginTheme();
  const glowSize = Math.round(Math.min(Math.max(width, 360), 430) * 0.7);
  const svgHeight = Math.round(height * 0.58);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={{
          position: 'absolute',
          top: -glowSize * 0.32,
          right: -glowSize * 0.3,
          width: glowSize,
          height: glowSize,
          borderRadius: glowSize / 2,
          backgroundColor: glow,
        }}
      />
      <Svg
        width="100%"
        height={svgHeight}
        viewBox="0 0 390 520"
        preserveAspectRatio="xMaxYMin meet"
      >
        <G opacity={0.85}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Line
              key={`h-${i}`}
              x1="0"
              y1={48 + i * 36}
              x2="390"
              y2={48 + i * 36}
              stroke={dentalSoft}
              strokeWidth={1}
            />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <Line
              key={`v-${i}`}
              x1={36 + i * 64}
              y1="20"
              x2={36 + i * 64}
              y2="360"
              stroke={dentalSoft}
              strokeWidth={1}
            />
          ))}
        </G>

        <Path
          d="M318 36c-44 0-78 36-78 82 0 50 21 118 50 158 10 15 21 26 32 26s22-11 32-26c29-40 50-108 50-158 0-46-34-82-78-82Z"
          fill="none"
          stroke={dental}
          strokeWidth={1.25}
        />
        <Path
          d="M318 72c-26 0-48 23-48 52 0 34 13 84 32 112 7 10 13 17 16 17s9-7 16-17c19-28 32-78 32-112 0-29-22-52-48-52Z"
          fill="none"
          stroke={dentalSoft}
          strokeWidth={1.1}
        />

        <G>
          {Array.from({ length: 11 }).map((_, i) => {
            const t = (i / 10) * Math.PI;
            const cx = 214 + Math.cos(t) * 108;
            const cy = 278 + Math.sin(t) * 42;
            return (
              <Circle key={`arch-${i}`} cx={cx} cy={cy} r={i === 5 ? 2.2 : 1.5} fill={dental} />
            );
          })}
        </G>
      </Svg>
    </View>
  );
}
