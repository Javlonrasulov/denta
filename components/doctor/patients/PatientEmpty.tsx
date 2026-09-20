import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { UserPlus, Users } from '@/components/icons';
import { Text } from '@/components/ui/Text';

export function PatientEmpty({
  filtered,
  onAdd,
}: {
  filtered?: boolean;
  onAdd?: () => void;
}) {
  const { t } = useTranslation();
  const { colors, hairline, isDark } = useLoginTheme();

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        paddingHorizontal: 24,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? 'rgba(129,140,248,0.12)' : 'rgba(67,56,202,0.08)',
          borderWidth: 1,
          borderColor: hairline,
        }}
      >
        <Users size={28} color={colors.primary} strokeWidth={1.7} />
      </View>
      <Text
        center
        style={{
          fontFamily: 'Geologica_600SemiBold',
          fontSize: 18,
          lineHeight: 24,
          color: colors.text,
        }}
      >
        {filtered ? t('patients.empty_filtered') : t('patients.empty_title')}
      </Text>
      <Text
        center
        style={{
          fontFamily: 'GolosText_400Regular',
          fontSize: 14,
          lineHeight: 20,
          color: colors.textMuted,
          maxWidth: 280,
        }}
      >
        {filtered ? t('patients.empty_filtered_hint') : t('patients.empty_subtitle')}
      </Text>
      {!filtered && onAdd ? (
        <ScalePressable
          accessibilityLabel={t('patients.add_patient')}
          onPress={onAdd}
          style={{
            marginTop: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: colors.primary,
            paddingHorizontal: 16,
            height: 44,
            borderRadius: 22,
          }}
        >
          <UserPlus size={16} color="#FFFFFF" strokeWidth={2} />
          <Text
            style={{
              fontFamily: 'GolosText_600SemiBold',
              fontSize: 14,
              color: '#FFFFFF',
            }}
          >
            {t('patients.add_patient')}
          </Text>
        </ScalePressable>
      ) : null}
    </View>
  );
}
