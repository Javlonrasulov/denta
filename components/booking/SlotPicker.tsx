import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';
import { TimeSlot } from '@/types';

interface SlotPickerProps {
  slots: TimeSlot[];
  selected?: string;
  onSelect: (time: string) => void;
}

export function SlotPicker({ slots, selected, onSelect }: SlotPickerProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();

  if (!slots.length) {
    return (
      <Text muted center>
        {t('doctor.no_slots')}
      </Text>
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="label" color={colors.textSecondary}>
        {t('doctor.available_slots')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {slots.map((slot) => {
          const isSelected = selected === slot.time;
          const disabled = !slot.available;
          return (
            <Pressable
              key={slot.time}
              disabled={disabled}
              onPress={() => onSelect(slot.time)}
              accessibilityRole="button"
              accessibilityState={{ disabled, selected: isSelected }}
              accessibilityLabel={`${slot.time} ${slot.available ? t('common.available') : t('common.booked')}`}
              style={{
                minWidth: 76,
                minHeight: 44,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm + 2,
                borderRadius: radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: disabled
                  ? colors.surfaceSoft
                  : isSelected
                    ? colors.primary
                    : colors.primaryMuted,
                opacity: disabled ? 0.55 : 1,
              }}
            >
              <Text
                variant="label"
                color={
                  disabled ? colors.textMuted : isSelected ? colors.textInverse : colors.primary
                }
              >
                {slot.time}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

interface DateStripProps {
  dates: { date: string; label: string; sub: string }[];
  selected: string;
  onSelect: (date: string) => void;
}

export function DateStrip({ dates, selected, onSelect }: DateStripProps) {
  const { colors, spacing, radius } = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
      {dates.map((d) => {
        const active = d.date === selected;
        return (
          <Pressable
            key={d.date}
            onPress={() => onSelect(d.date)}
            style={{
              width: 64,
              paddingVertical: spacing.md,
              borderRadius: radius.lg,
              alignItems: 'center',
              backgroundColor: active ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: active ? colors.primary : colors.border,
            }}
          >
            <Text variant="caption" color={active ? colors.textInverse : colors.textMuted}>
              {d.sub}
            </Text>
            <Text variant="h3" color={active ? colors.textInverse : colors.text} style={{ fontSize: 18 }}>
              {d.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
