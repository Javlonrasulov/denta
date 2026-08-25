import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { SegmentedControl } from './SegmentedControl';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

type Range = '7d' | '30d' | '12m';

interface ChartCardProps {
  title: string;
  totalLabel?: string;
  totalValue?: string;
  range: Range;
  onRangeChange: (r: Range) => void;
  rangeLabels: { value: Range; label: string }[];
  points?: number[];
}

export function LineChartCard({
  title,
  totalLabel,
  totalValue,
  range,
  onRangeChange,
  rangeLabels,
  points = [42, 55, 48, 62, 70, 58, 75],
}: ChartCardProps) {
  const { colors, spacing, radius } = useTheme();
  const width = 320;
  const height = 120;
  const pad = 8;

  const polyline = useMemo(() => {
    const max = Math.max(...points, 1);
    const min = Math.min(...points, 0);
    const span = max - min || 1;
    return points
      .map((p, i) => {
        const x = pad + (i / Math.max(points.length - 1, 1)) * (width - pad * 2);
        const y = height - pad - ((p - min) / span) * (height - pad * 2);
        return `${x},${y}`;
      })
      .join(' ');
  }, [points]);

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md }}>
        <View style={{ gap: 2, flex: 1 }}>
          <Text variant="h3">{title}</Text>
          {totalValue ? (
            <Text variant="kpi" style={{ fontSize: 20 }}>
              {totalValue}
            </Text>
          ) : null}
          {totalLabel ? (
            <Text variant="caption" muted>
              {totalLabel}
            </Text>
          ) : null}
        </View>
        <SegmentedControl options={rangeLabels} value={range} onChange={onRangeChange} />
      </View>
      <View
        style={{
          borderRadius: radius.md,
          backgroundColor: colors.surfaceSoft,
          paddingVertical: spacing.md,
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <Polyline
            points={polyline}
            fill="none"
            stroke={colors.chartPrimary}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>
      </View>
    </View>
  );
}

interface DonutChartProps {
  title: string;
  segments: { label: string; value: number; color: string }[];
  centerLabel: string;
  centerValue: string;
}

export function DonutChartCard({ title, segments, centerLabel, centerValue }: DonutChartProps) {
  const { colors, spacing } = useTheme();
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const size = 140;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const len = (seg.value / total) * c;
    const item = { ...seg, len, offset };
    offset += len;
    return item;
  });

  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="h3">{title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xl }}>
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={size} height={size}>
            <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.borderSubtle} strokeWidth={stroke} fill="none" />
            {arcs.map((arc) => (
              <Circle
                key={arc.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={arc.color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${arc.len} ${c - arc.len}`}
                strokeDashoffset={-arc.offset}
                strokeLinecap="butt"
                rotation={-90}
                origin={`${size / 2}, ${size / 2}`}
              />
            ))}
          </Svg>
          <View style={{ position: 'absolute', alignItems: 'center' }}>
            <Text variant="h3">{centerValue}</Text>
            <Text variant="caption" muted>
              {centerLabel}
            </Text>
          </View>
        </View>
        <View style={{ flex: 1, gap: spacing.sm }}>
          {segments.map((seg) => (
            <View key={seg.label} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: seg.color }} />
              <Text variant="caption" style={{ flex: 1 }} muted>
                {seg.label}
              </Text>
              <Text variant="caption" weight="semibold">
                {Math.round((seg.value / total) * 100)}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/** Placeholder bar for reports */
export function MiniBars({ values }: { values: number[] }) {
  const { colors, spacing, radius } = useTheme();
  const max = Math.max(...values, 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 80 }}>
      {values.map((v, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: Math.max(8, (v / max) * 80),
            backgroundColor: colors.chartPrimary,
            opacity: 0.35 + (v / max) * 0.65,
            borderRadius: radius.sm,
          }}
        />
      ))}
    </View>
  );
}
