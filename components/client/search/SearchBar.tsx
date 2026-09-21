import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Search, SlidersHorizontal, X } from '@/components/icons';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  onOpenFilters: () => void;
  filterCount: number;
};

export function SearchBar({ value, onChangeText, onClear, onOpenFilters, filterCount }: Props) {
  const { t } = useTranslation();
  const { colors, shadows, isDark } = useTheme();

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.field,
          shadows.sm,
          {
            backgroundColor: colors.surface,
            borderColor: isDark ? colors.border : 'rgba(15,23,42,0.06)',
          },
        ]}
      >
        <Search size={20} color={colors.primary} strokeWidth={2} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={t('search.placeholder')}
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          accessibilityLabel={t('search.placeholder')}
          underlineColorAndroid="transparent"
          style={[
            styles.input,
            {
              color: colors.text,
              fontFamily: 'GolosText_400Regular',
              includeFontPadding: false,
              textAlignVertical: 'center',
            },
          ]}
        />
        {value.length > 0 ? (
          <Pressable
            onPress={onClear}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            style={[styles.clear, { backgroundColor: colors.surfaceSoft }]}
          >
            <X size={14} color={colors.textSecondary} strokeWidth={2.2} />
          </Pressable>
        ) : null}
      </View>

      <Pressable
        onPress={onOpenFilters}
        accessibilityRole="button"
        accessibilityLabel={t('search.filters')}
        style={({ pressed }) => [
          styles.filter,
          shadows.sm,
          {
            backgroundColor: filterCount > 0 ? colors.primary : colors.surface,
            borderColor: filterCount > 0 ? colors.primary : isDark ? colors.border : 'rgba(15,23,42,0.06)',
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <SlidersHorizontal
          size={20}
          color={filterCount > 0 ? colors.textInverse : colors.primary}
          strokeWidth={2}
        />
        {filterCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 10,
                lineHeight: 12,
                fontFamily: 'GolosText_600SemiBold',
              }}
            >
              {filterCount}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  field: {
    flex: 1,
    minWidth: 0,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    paddingVertical: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    fontSize: 14,
    lineHeight: 18,
    ...Platform.select({
      web: { outlineStyle: 'none' as never },
      default: {},
    }),
  },
  clear: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filter: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
