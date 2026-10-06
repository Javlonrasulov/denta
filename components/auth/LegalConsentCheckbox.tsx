import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Trans, useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Check } from '@/components/icons';
import { Text } from '@/components/ui/Text';

/**
 * Required Terms + Privacy consent. Tapping the row toggles it; the inline
 * links are nested Text responders, so opening a document never toggles.
 */
export function LegalConsentCheckbox({
  checked,
  onChange,
  error,
  onOpenTerms,
  onOpenPrivacy,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  error?: boolean;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}) {
  const { t } = useTranslation();
  const { colors, isDark, field, hairline } = useLoginTheme();

  const toggle = () => {
    void Haptics.selectionAsync();
    onChange(!checked);
  };

  const borderColor = error
    ? colors.error
    : checked
      ? isDark
        ? 'rgba(129, 140, 248, 0.55)'
        : 'rgba(67, 56, 202, 0.35)'
      : hairline;
  const backgroundColor = checked
    ? isDark
      ? 'rgba(79, 70, 229, 0.14)'
      : 'rgba(67, 56, 202, 0.06)'
    : field;

  const linkStyle = {
    color: colors.primary,
    fontFamily: 'GolosText_600SemiBold',
    textDecorationLine: 'underline' as const,
  };

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={t('auth.register.legal_consent_a11y')}
      accessibilityHint={error ? t('auth.errors.legal_consent_required') : undefined}
      accessibilityActions={[
        { name: 'activate' },
        { name: 'openTerms', label: t('legal.terms_title') },
        { name: 'openPrivacy', label: t('legal.privacy_title') },
      ]}
      onAccessibilityAction={(event) => {
        switch (event.nativeEvent.actionName) {
          case 'activate':
            toggle();
            break;
          case 'openTerms':
            onOpenTerms();
            break;
          case 'openPrivacy':
            onOpenPrivacy();
            break;
        }
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        minHeight: 56,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor,
        backgroundColor,
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          marginTop: 1,
          borderRadius: 7,
          borderWidth: checked ? 0 : 1.5,
          borderColor: error ? colors.error : colors.textMuted,
          backgroundColor: checked ? colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked ? <Check size={16} color="#FFFFFF" strokeWidth={3} /> : null}
      </View>
      <Text
        maxFontSizeMultiplier={1.3}
        style={{
          flex: 1,
          fontFamily: 'GolosText_400Regular',
          fontSize: 14,
          lineHeight: 21,
          color: colors.textSecondary,
        }}
      >
        <Trans
          i18nKey="auth.register.legal_consent"
          components={{
            terms: <Text onPress={onOpenTerms} suppressHighlighting={false} style={linkStyle} />,
            privacy: <Text onPress={onOpenPrivacy} suppressHighlighting={false} style={linkStyle} />,
          }}
        />
      </Text>
    </Pressable>
  );
}
