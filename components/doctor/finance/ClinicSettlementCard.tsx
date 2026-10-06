import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { AlertTriangle, Building2, Lock } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import type {
  ClinicFinance,
  ClinicFinanceObligation,
  ClinicFinancePayment,
} from '@/services/clinicFinanceService';
import { formatSom } from '@/utils/slots';

const HISTORY_LIMIT = 6;
const androidPad = Platform.OS === 'android' ? { paddingRight: 2 } : null;

function formatYmd(ymd: string): string {
  const [y, m, d] = ymd.split('-');
  return y && m && d ? `${d}.${m}.${y}` : ymd;
}

type HistoryRow = {
  id: string;
  date: string;
  label: string;
  amountUzs: number;
  tone: 'debt' | 'paid' | 'muted' | 'pending';
  note?: string;
};

function historyRows(
  data: ClinicFinance,
  t: (key: string, opts?: Record<string, unknown>) => string,
): HistoryRow[] {
  const fromObligations = data.obligations
    .filter((o: ClinicFinanceObligation) => o.status !== 'CANCELLED' && o.dueDate <= data.today)
    .map<HistoryRow>((o) => ({
      id: `o:${o.id}`,
      date: o.dueDate,
      label: t(o.kind === 'OPENING_BALANCE' ? 'doctorApp.clinicFinance.opening' : 'doctorApp.clinicFinance.rent'),
      amountUzs: o.amountUzs,
      tone: o.outstandingUzs > 0 ? 'debt' : 'muted',
      note:
        o.status === 'OVERDUE' && o.daysOverdue > 0
          ? t('doctorApp.clinicFinance.overdue_days', { count: o.daysOverdue })
          : undefined,
    }));
  const fromPayments = data.payments.map<HistoryRow>((p: ClinicFinancePayment) => {
    const voided = p.status === 'VOIDED' || Boolean(p.voidedAt);
    const note = voided
      ? t('doctorApp.clinicFinance.voided')
      : p.status === 'REJECTED'
        ? t('doctorApp.clinicFinance.rejected')
        : p.status === 'SUBMITTED'
          ? t('doctorApp.clinicFinance.pending')
          : undefined;
    return {
      id: `p:${p.id}`,
      date: p.paidDate,
      label: t('doctorApp.clinicFinance.paid'),
      amountUzs: p.amountUzs,
      tone: voided || p.status === 'REJECTED' ? 'muted' : p.status === 'SUBMITTED' ? 'pending' : 'paid',
      note,
    };
  });
  return [...fromObligations, ...fromPayments]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, HISTORY_LIMIT);
}

function Kpi({
  label,
  value,
  caption,
  color,
}: {
  label: string;
  value: string;
  caption?: string;
  color?: string;
}) {
  const { colors, field } = useLoginTheme();
  return (
    <View
      style={{
        flexBasis: '47%',
        flexGrow: 1,
        minWidth: 0,
        gap: 4,
        padding: 12,
        borderRadius: 14,
        backgroundColor: field,
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          fontFamily: 'Geologica_600SemiBold',
          fontSize: 10,
          lineHeight: 13,
          letterSpacing: 0.3,
          color: colors.textMuted,
        }}
      >
        {label}
      </Text>
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1}
        style={{
          fontFamily: 'Geologica_700Bold',
          fontSize: 15,
          lineHeight: 20,
          letterSpacing: -0.2,
          color: color ?? colors.text,
          ...androidPad,
        }}
      >
        {value}
      </Text>
      {caption ? (
        <Text
          numberOfLines={1}
          style={{ fontFamily: 'GolosText_400Regular', fontSize: 11, lineHeight: 14, color: colors.textSecondary }}
        >
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

export function ClinicSettlementCard({ data }: { data: ClinicFinance }) {
  const { t } = useTranslation();
  const { colors, hairline, authSurface, dentalSoft } = useLoginTheme();
  const currency = t('common.currency');
  const money = (amount: number) => `${formatSom(amount)} ${currency}`;
  const { summary, agreement } = data;
  const rows = historyRows(data, t);

  const toneColor: Record<HistoryRow['tone'], string> = {
    debt: colors.error,
    paid: colors.success,
    pending: colors.warning,
    muted: colors.textMuted,
  };

  const agreementLine = agreement
    ? [
        t(`doctorApp.clinicFinance.models.${agreement.model}`),
        agreement.model === 'REVENUE_SHARE' || agreement.model === 'CUSTOM'
          ? t('doctorApp.clinicFinance.share', { percent: agreement.clinicPercent })
          : null,
        t('doctorApp.clinicFinance.since', { date: formatYmd(agreement.effectiveFrom) }),
      ]
        .filter(Boolean)
        .join(' · ')
    : null;

  return (
    <Animated.View
      entering={FadeInDown.duration(250).delay(160)}
      style={{
        backgroundColor: authSurface,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: hairline,
        padding: 14,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: dentalSoft,
          }}
        >
          <Building2 size={18} color={colors.primary} strokeWidth={1.9} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={1}
            style={{ fontFamily: 'Geologica_700Bold', fontSize: 16, lineHeight: 21, color: colors.text, ...androidPad }}
          >
            {t('doctorApp.clinicFinance.title')}
          </Text>
          <Text
            numberOfLines={1}
            style={{ fontFamily: 'GolosText_400Regular', fontSize: 12, lineHeight: 16, color: colors.textSecondary }}
          >
            {data.clinic.name}
          </Text>
        </View>
      </View>

      {!data.configured ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            padding: 12,
            borderRadius: 12,
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
          }}
        >
          <AlertTriangle size={16} color={colors.warning} strokeWidth={2} />
          <Text style={{ flex: 1, fontFamily: 'GolosText_500Medium', fontSize: 13, lineHeight: 18, color: colors.text }}>
            {t('doctorApp.clinicFinance.not_configured')}
          </Text>
        </View>
      ) : (
        <>
          {agreementLine ? (
            <Text style={{ fontFamily: 'GolosText_400Regular', fontSize: 12, lineHeight: 17, color: colors.textSecondary }}>
              {t('doctorApp.clinicFinance.agreement')}: {agreementLine}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Kpi
              label={t('doctorApp.clinicFinance.debt')}
              value={money(summary.totalDebtUzs)}
              color={summary.totalDebtUzs > 0 ? colors.error : undefined}
            />
            <Kpi
              label={t('doctorApp.clinicFinance.overdue')}
              value={money(summary.overdueUzs)}
              color={summary.overdueUzs > 0 ? colors.error : undefined}
            />
            <Kpi
              label={t('doctorApp.clinicFinance.next_due')}
              value={summary.nextDue ? money(summary.nextDue.amountUzs) : '—'}
              caption={summary.nextDue ? formatYmd(summary.nextDue.date) : undefined}
            />
            <Kpi
              label={t('doctorApp.clinicFinance.advance')}
              value={money(summary.advanceUzs)}
              color={summary.advanceUzs > 0 ? colors.success : undefined}
            />
          </View>
          {summary.pendingSubmissions > 0 ? (
            <Text style={{ fontFamily: 'GolosText_500Medium', fontSize: 12, lineHeight: 16, color: colors.warning }}>
              {t('doctorApp.clinicFinance.pending')}: {summary.pendingSubmissions}
            </Text>
          ) : null}
        </>
      )}

      <View style={{ gap: 2 }}>
        <Text
          style={{
            fontFamily: 'Geologica_600SemiBold',
            fontSize: 11,
            lineHeight: 14,
            letterSpacing: 0.3,
            color: colors.textMuted,
            marginBottom: 4,
          }}
        >
          {t('doctorApp.clinicFinance.history')}
        </Text>
        {rows.length === 0 ? (
          <Text style={{ fontFamily: 'GolosText_400Regular', fontSize: 13, lineHeight: 18, color: colors.textSecondary }}>
            {t('doctorApp.clinicFinance.empty')}
          </Text>
        ) : (
          rows.map((row, index) => (
            <View
              key={row.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 8,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: hairline,
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={{ fontFamily: 'GolosText_500Medium', fontSize: 13, lineHeight: 18, color: colors.text }}
                >
                  {row.label}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{ fontFamily: 'GolosText_400Regular', fontSize: 11, lineHeight: 15, color: colors.textSecondary }}
                >
                  {row.note ? `${formatYmd(row.date)} · ${row.note}` : formatYmd(row.date)}
                </Text>
              </View>
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={1}
                style={{
                  fontFamily: 'Geologica_600SemiBold',
                  fontSize: 13,
                  lineHeight: 18,
                  color: toneColor[row.tone],
                  textDecorationLine: row.tone === 'muted' && row.id.startsWith('p:') ? 'line-through' : 'none',
                  ...androidPad,
                }}
              >
                {money(row.amountUzs)}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
        <Lock size={13} color={colors.textMuted} strokeWidth={2} style={{ marginTop: 2 }} />
        <Text style={{ flex: 1, fontFamily: 'GolosText_400Regular', fontSize: 11, lineHeight: 15, color: colors.textMuted }}>
          {t('doctorApp.clinicFinance.read_only')}
        </Text>
      </View>
    </Animated.View>
  );
}
