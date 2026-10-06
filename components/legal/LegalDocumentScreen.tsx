import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { BrandMark } from '@/components/brand/BrandMark';
import { AlertTriangle, ArrowLeft, RefreshCw } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import {
  type LegalBlock,
  type LegalDocumentKind,
  useClientLegalDocument,
} from '@/services/legalService';
import { useSettingsStore } from '@/store/settingsStore';
import { formatLegalDate } from '@/utils/legalDate';

const KINDS: LegalDocumentKind[] = ['terms', 'privacy'];

export function LegalDocumentScreen({ kind }: { kind: LegalDocumentKind }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, isDark, canvas, canvasMid, authSurface, field, hairline } = useLoginTheme();
  const locale = useSettingsStore((s) => s.locale);
  const query = useClientLegalDocument(kind, locale);
  const doc = query.data;
  const otherKind: LegalDocumentKind = kind === 'terms' ? 'privacy' : 'terms';

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const openKind = (next: LegalDocumentKind) => {
    if (next === kind) return;
    router.replace(`/legal/${next}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: canvas }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <LinearGradient
        colors={[canvas, canvasMid, authSurface]}
        locations={[0, 0.4, 1]}
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />

      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('legal.back')}
          onPress={goBack}
          hitSlop={12}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: field,
            borderWidth: 1,
            borderColor: hairline,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={18} color={colors.text} strokeWidth={1.8} />
        </Pressable>
        <View
          accessible
          accessibilityLabel="ORADENT"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
        >
          <BrandMark size={28} />
          <Text
            style={{
              fontFamily: 'Geologica_700Bold',
              fontSize: 17,
              letterSpacing: 0.4,
              color: colors.text,
            }}
          >
            ORADENT
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View
        accessibilityRole="tablist"
        style={{
          marginHorizontal: 20,
          marginBottom: 12,
          flexDirection: 'row',
          padding: 4,
          borderRadius: 14,
          backgroundColor: field,
          borderWidth: 1,
          borderColor: hairline,
        }}
      >
        {KINDS.map((k) => {
          const active = k === kind;
          return (
            <Pressable
              key={k}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => openKind(k)}
              style={{
                flex: 1,
                minHeight: 40,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 8,
                backgroundColor: active ? colors.primary : 'transparent',
              }}
            >
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={1.2}
                style={{
                  fontFamily: 'GolosText_600SemiBold',
                  fontSize: 13,
                  color: active ? '#FFFFFF' : colors.textSecondary,
                  includeFontPadding: false,
                }}
              >
                {t(`legal.${k}_title`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {query.isPending ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ fontFamily: 'GolosText_400Regular', fontSize: 14, color: colors.textMuted }}>
            {t('common.loading')}
          </Text>
        </View>
      ) : query.isError || !doc ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
            gap: 14,
          }}
        >
          <AlertTriangle size={28} color={colors.warning} strokeWidth={1.8} />
          <Text
            style={{
              fontFamily: 'GolosText_500Medium',
              fontSize: 15,
              lineHeight: 22,
              color: colors.text,
              textAlign: 'center',
            }}
          >
            {t('legal.load_error')}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void query.refetch()}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              minHeight: 44,
              paddingHorizontal: 18,
              borderRadius: 14,
              backgroundColor: field,
              borderWidth: 1,
              borderColor: hairline,
            }}
          >
            <RefreshCw size={16} color={colors.primary} strokeWidth={2} />
            <Text style={{ fontFamily: 'GolosText_600SemiBold', fontSize: 14, color: colors.primary }}>
              {t('common.retry')}
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          }}
        >
          <View
            style={{
              backgroundColor: authSurface,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: hairline,
              padding: 20,
            }}
          >
            <Text
              style={{
                fontFamily: 'GolosText_600SemiBold',
                fontSize: 12,
                letterSpacing: 1.2,
                color: colors.primary,
              }}
            >
              ORADENT
            </Text>
            <Text
              accessibilityRole="header"
              style={{
                marginTop: 6,
                fontFamily: 'Geologica_700Bold',
                fontSize: 26,
                lineHeight: 32,
                color: colors.text,
              }}
            >
              {doc.title}
            </Text>
            <Text
              style={{
                marginTop: 10,
                fontFamily: 'GolosText_400Regular',
                fontSize: 15,
                lineHeight: 23,
                color: colors.textSecondary,
              }}
            >
              {doc.summary}
            </Text>

            <View
              style={{
                marginTop: 16,
                paddingTop: 14,
                borderTopWidth: 1,
                borderTopColor: hairline,
                gap: 6,
              }}
            >
              <MetaRow label={t('legal.effective_date')} value={formatLegalDate(doc.effectiveDate, locale)} />
              {doc.updatedDate !== doc.effectiveDate ? (
                <MetaRow label={t('legal.updated_date')} value={formatLegalDate(doc.updatedDate, locale)} />
              ) : null}
              <MetaRow label={t('legal.version')} value={doc.version} />
            </View>

            {doc.isFallback ? (
              <View
                style={{
                  marginTop: 14,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  backgroundColor: colors.warningMuted,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'GolosText_500Medium',
                    fontSize: 13,
                    lineHeight: 19,
                    color: isDark ? colors.warning : '#92400E',
                  }}
                >
                  {t('legal.fallback_notice')}
                </Text>
              </View>
            ) : null}

            <View style={{ marginTop: 22, gap: 26 }}>
              {doc.sections.map((section, i) => (
                <View key={section.id} style={{ gap: 12 }}>
                  <Text
                    accessibilityRole="header"
                    style={{
                      fontFamily: 'Geologica_600SemiBold',
                      fontSize: 18,
                      lineHeight: 25,
                      color: colors.text,
                    }}
                  >
                    <Text style={{ color: colors.primary }}>{`${i + 1}. `}</Text>
                    {section.title}
                  </Text>
                  {section.blocks.map((block, bi) => (
                    <BlockView key={`${section.id}-${bi}`} block={block} />
                  ))}
                </View>
              ))}
            </View>

            <View
              style={{
                marginTop: 28,
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: hairline,
                gap: 12,
              }}
            >
              <Text style={{ fontFamily: 'GolosText_400Regular', fontSize: 12, lineHeight: 18, color: colors.textMuted }}>
                {`© ${doc.effectiveDate.slice(0, 4)} ORADENT · oradent.uz · ${t('legal.version')} ${doc.version}`}
              </Text>
              <Pressable
                accessibilityRole="link"
                onPress={() => openKind(otherKind)}
                hitSlop={8}
                style={{ alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' }}
              >
                <Text style={{ fontFamily: 'GolosText_600SemiBold', fontSize: 14, color: colors.primary }}>
                  {`${t(`legal.${otherKind}_title`)} →`}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  const { colors } = useLoginTheme();
  return (
    <Text style={{ fontFamily: 'GolosText_400Regular', fontSize: 13, lineHeight: 19, color: colors.textMuted }}>
      {`${label}: `}
      <Text style={{ fontFamily: 'GolosText_600SemiBold', color: colors.text }}>{value}</Text>
    </Text>
  );
}

function BlockView({ block }: { block: LegalBlock }) {
  const { colors, isDark } = useLoginTheme();
  const body = {
    fontFamily: 'GolosText_400Regular',
    fontSize: 15,
    lineHeight: 24,
    color: colors.textSecondary,
  } as const;

  if (block.type === 'ul') {
    return (
      <View style={{ gap: 8 }}>
        {block.items.map((item) => (
          <View key={item} style={{ flexDirection: 'row', gap: 10, paddingRight: 4 }}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                marginTop: 9,
                backgroundColor: isDark ? 'rgba(165, 180, 252, 0.7)' : 'rgba(67, 56, 202, 0.55)',
              }}
            />
            <Text style={[body, { flex: 1 }]}>{item}</Text>
          </View>
        ))}
      </View>
    );
  }
  if (block.type === 'note') {
    return (
      <View
        style={{
          borderLeftWidth: 4,
          borderLeftColor: colors.primary,
          backgroundColor: colors.primaryMuted,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
        }}
      >
        <Text style={[body, { fontFamily: 'GolosText_500Medium', color: colors.text }]}>{block.text}</Text>
      </View>
    );
  }
  return <Text style={body}>{block.text}</Text>;
}
