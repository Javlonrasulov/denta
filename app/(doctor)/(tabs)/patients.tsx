import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/ui/Avatar';
import { SearchInput } from '@/components/ui/Input';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { usePatients } from '@/hooks/queries';
import { useTheme } from '@/theme';

export default function DoctorPatientsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const [query, setQuery] = useState('');
  const patients = usePatients(query);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.md }}>
        <Text variant="h1">{t('tabs.patients')}</Text>
        <SearchInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('patients.search')}
          onClear={() => setQuery('')}
        />
      </View>

      {patients.isLoading ? (
        <ListSkeleton rows={6} />
      ) : (
        <FlatList
          data={patients.data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(doctor)/patient/${item.id}`)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                backgroundColor: colors.surface,
                borderRadius: radius.xl,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Avatar name={item.fullName} size={48} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="h3" style={{ fontSize: 16 }}>
                  {item.fullName}
                </Text>
                <Text variant="bodySmall" muted>
                  {item.phone}
                </Text>
                <Text variant="caption" muted>
                  {t('patients.last_visit')}: {item.lastVisit ?? '—'}
                </Text>
              </View>
              <Text variant="caption" color={item.status === 'active' ? colors.success : colors.textMuted}>
                {item.status === 'active' ? t('patients.status_active') : t('patients.status_inactive')}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
