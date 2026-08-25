import { router } from 'expo-router';
import { Users } from '@/components/icons';
import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { MobileEmpty, MobileHeader, MobileListRow } from '@/components/mobile';
import { Avatar } from '@/components/ui/Avatar';
import { SearchInput } from '@/components/ui/Input';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { usePatients } from '@/hooks/queries';
import { useTheme } from '@/theme';

export default function DoctorPatientsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const [query, setQuery] = useState('');
  const patients = usePatients(query);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.lg }}>
        <MobileHeader title={t('tabs.patients')} />
        <SearchInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('patients.search')}
          onClear={() => setQuery('')}
        />
      </View>

      {patients.isLoading ? (
        <ListSkeleton rows={6} />
      ) : !patients.data?.length ? (
        <MobileEmpty icon={Users} title={t('patients.search')} />
      ) : (
        <FlatList
          data={patients.data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: spacing.xl,
            gap: spacing.sm,
            paddingBottom: spacing['5xl'],
          }}
          renderItem={({ item }) => (
            <MobileListRow
              title={item.fullName}
              subtitle={item.phone}
              meta={`${t('patients.last_visit')}: ${item.lastVisit ?? '—'}`}
              leading={<Avatar name={item.fullName} size={44} />}
              trailing={
                <Text
                  variant="caption"
                  color={item.status === 'active' ? colors.success : colors.textMuted}
                >
                  {item.status === 'active'
                    ? t('patients.status_active')
                    : t('patients.status_inactive')}
                </Text>
              }
              onPress={() => router.push(`/(doctor)/patient/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}
