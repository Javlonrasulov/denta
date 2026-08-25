import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';
import { ToothCondition, ToothRecord } from '@/types';

const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const CONDITION_COLOR: Record<ToothCondition, string> = {
  healthy: '#059669',
  caries: '#DC2626',
  filled: '#0D9488',
  crown: '#D97706',
  missing: '#94A3B8',
  root_canal: '#6366F1',
  implant: '#0F3D7A',
  needs_treatment: '#F59E0B',
};

interface OdontogramProps {
  teeth: ToothRecord[];
  onSelect?: (tooth: ToothRecord) => void;
  selectedNumber?: number;
}

export function Odontogram({ teeth, onSelect, selectedNumber }: OdontogramProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const [selected, setSelected] = useState<ToothRecord | null>(
    teeth.find((x) => x.toothNumber === selectedNumber) ?? null,
  );

  const byNumber = new Map(teeth.map((t) => [t.toothNumber, t]));

  const renderRow = (nums: number[], y: number) =>
    nums.map((num, i) => {
      const record = byNumber.get(num);
      const condition = record?.condition ?? 'healthy';
      const cx = 22 + i * 22;
      const active = selected?.toothNumber === num;
      return (
        <G
          key={num}
          onPress={() => {
            if (!record) return;
            setSelected(record);
            onSelect?.(record);
          }}
        >
          <Circle
            cx={cx}
            cy={y}
            r={active ? 9 : 8}
            fill={CONDITION_COLOR[condition]}
            opacity={active ? 1 : 0.85}
            stroke={active ? colors.text : 'transparent'}
            strokeWidth={2}
          />
          <SvgText
            x={cx}
            y={y + 3}
            fontSize="7"
            fill="#fff"
            textAnchor="middle"
            fontWeight="600"
          >
            {num}
          </SvgText>
        </G>
      );
    });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="h3">{t('odontogram.title')}</Text>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          paddingVertical: spacing.lg,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          alignItems: 'center',
        }}
      >
        <Svg width={360} height={120} viewBox="0 0 360 120">
          {renderRow(UPPER, 36)}
          {renderRow(LOWER, 90)}
        </Svg>
      </View>

      {selected ? (
        <View
          style={{
            backgroundColor: colors.primaryMuted,
            borderRadius: radius.lg,
            padding: spacing.lg,
            gap: spacing.sm,
          }}
        >
          <Text variant="label" color={colors.primary}>
            {t('odontogram.tooth', { number: selected.toothNumber })}
          </Text>
          <Text variant="body">
            {t('odontogram.condition')}: {selected.condition}
          </Text>
          {selected.treatment ? (
            <Text variant="bodySmall" muted>
              {t('odontogram.treatment')}: {selected.treatment}
            </Text>
          ) : null}
          {selected.notes ? (
            <Text variant="bodySmall" muted>
              {t('odontogram.notes')}: {selected.notes}
            </Text>
          ) : null}
        </View>
      ) : (
        <Text muted center>
          {t('odontogram.select_tooth')}
        </Text>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {(Object.keys(CONDITION_COLOR) as ToothCondition[]).map((c) => (
          <View key={c} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: CONDITION_COLOR[c],
              }}
            />
            <Text variant="caption" muted>
              {c.replace('_', ' ')}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Pressable legend chip — kept for accessibility extension */
export function ToothChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const { colors, radius, spacing } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.full,
        backgroundColor: active ? colors.primary : colors.surfaceSoft,
      }}
    >
      <Text variant="caption" color={active ? colors.textInverse : colors.textSecondary}>
        {label}
      </Text>
    </Pressable>
  );
}
