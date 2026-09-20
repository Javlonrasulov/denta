import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BrandMark } from '@/components/brand/BrandMark';
import { Text } from '@/components/ui/Text';
import { APP_VARIANT, type AppVariant } from '@/constants/appVariant';
import { useTheme } from '@/theme';

const VARIANT_LABEL: Record<AppVariant, string> = {
  doctor: 'DOCTOR',
  client: 'CLIENT',
  clinic: 'CLINIC',
};

export function BrandLockup({
  variant = APP_VARIANT,
  size = 'lg',
  align = 'center',
  compact = false,
}: {
  variant?: AppVariant;
  size?: 'sm' | 'lg';
  align?: 'center' | 'left';
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const centered = align === 'center';
  const large = size === 'lg' && !compact;
  const markSize = large ? 40 : size === 'lg' ? 36 : 28;
  const titleSize = large ? 30 : size === 'lg' ? 28 : 20;
  const titleLine = large ? 36 : size === 'lg' ? 34 : 24;

  return (
    <View
      style={{
        alignSelf: 'stretch',
        width: '100%',
        alignItems: centered ? 'center' : 'flex-start',
        gap: large ? 16 : 12,
      }}
    >
      <BrandMark size={markSize} />
      <View
        style={{
          alignSelf: 'stretch',
          width: '100%',
          alignItems: centered ? 'center' : 'flex-start',
          gap: 6,
          paddingHorizontal: 4,
        }}
      >
        <Text
          style={{
            alignSelf: 'stretch',
            width: '100%',
            textAlign: centered ? 'center' : 'left',
            fontFamily: 'Geologica_700Bold',
            fontSize: titleSize,
            lineHeight: titleLine,
            letterSpacing: -0.2,
            color: colors.text,
            paddingRight: Platform.OS === 'android' ? 12 : 0,
            includeFontPadding: false,
          }}
        >
          {t('common.app_name')}
        </Text>
        <Text
          style={{
            alignSelf: 'stretch',
            width: '100%',
            textAlign: centered ? 'center' : 'left',
            fontFamily: 'Geologica_600SemiBold',
            fontSize: large ? 12 : 11,
            lineHeight: 16,
            letterSpacing: 1.8,
            color: colors.primary,
            paddingRight: Platform.OS === 'android' ? 8 : 0,
            includeFontPadding: false,
          }}
        >
          {VARIANT_LABEL[variant]}
        </Text>
      </View>
    </View>
  );
}
