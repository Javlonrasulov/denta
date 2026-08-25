import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppShell } from '@/components/layout/AppShell';
import { Section, StatusDot } from '@/components/crm';
import { Text } from '@/components/ui/Text';
import { MOCK_ROOMS } from '@/mocks/data';
import { useTheme } from '@/theme';

export default function ClinicRoomsScreen() {
  const { t } = useTranslation();
  const { colors, spacing, radius, isDesktop, isTablet, isMobile } = useTheme();

  return (
    <AppShell title={t('crm.rooms.title')} subtitle={t('crm.rooms.subtitle')}>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.md,
        }}
      >
        {MOCK_ROOMS.map((room) => {
          const tone =
            room.status === 'available' ? 'success' : room.status === 'occupied' ? 'warning' : 'neutral';
          const bg =
            room.status === 'available'
              ? colors.successMuted
              : room.status === 'occupied'
                ? colors.warningMuted
                : colors.surfaceSoft;
          return (
            <View
              key={room.id}
              style={{
                width: isDesktop ? '23%' : isTablet ? '31%' : '47%',
                minWidth: isMobile ? undefined : 150,
                flexGrow: 1,
                flexBasis: isMobile ? '46%' : undefined,
                maxWidth: '100%',
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                padding: spacing.lg,
                gap: spacing.sm,
                minHeight: 120,
              }}
            >
              <View
                style={{
                  alignSelf: 'flex-start',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: bg,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 4,
                  borderRadius: radius.full,
                }}
              >
                <StatusDot tone={tone} />
                <Text variant="caption" weight="semibold">
                  {room.status === 'available'
                    ? t('common.available')
                    : room.status === 'occupied'
                      ? t('common.occupied')
                      : t('common.maintenance')}
                </Text>
              </View>
              <Text variant="h3">{room.name}</Text>
              <Text variant="caption" muted>
                #{room.number}
              </Text>
              {room.doctorName ? (
                <Text variant="bodySmall" color={colors.textSecondary}>
                  {room.doctorName}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </AppShell>
  );
}
