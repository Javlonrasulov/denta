import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import {
  PatientDentalPreview,
  PatientDetailHeader,
  PatientDetailTabs,
  PatientOverviewStats,
  PatientPaymentSummary,
  PatientStatusBadge,
  PatientTreatmentTimeline,
  type PatientDetailTab,
} from '@/components/doctor/patients';
import { Odontogram } from '@/components/odontogram/Odontogram';
import { ErrorState } from '@/components/states/EmptyState';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { PatientsSkeleton } from '@/components/doctor/patients/PatientsSkeleton';
import { queryKeys, useAppointments, usePatient } from '@/hooks/queries';
import { addPatientNote, getPatientOdontogram } from '@/services/patientService';
import { useToastStore } from '@/store/toastStore';
import { formatPatientDate } from '@/utils/doctorPatients';

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { canvas, colors, hairline, authSurface } = useLoginTheme();
  const patientQuery = usePatient(id);
  const appointments = useAppointments();
  const odontogramQuery = useQuery({
    queryKey: ['patients', id, 'odontogram'],
    enabled: Boolean(id),
    queryFn: () => getPatientOdontogram(id),
  });
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);
  const [tab, setTab] = useState<PatientDetailTab>('overview');
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  if (patientQuery.isLoading) return <PatientsSkeleton />;
  if (!patientQuery.data) {
    return (
      <ErrorState
        title={t('error.something_wrong')}
        onRetry={() => patientQuery.refetch()}
        retryLabel={t('common.retry')}
      />
    );
  }

  const patient = patientQuery.data;
  const visits = (appointments.data ?? []).filter((a) => a.patientId === patient.id);

  const saveNote = async () => {
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      await addPatientNote(patient.id, note.trim());
      setNote('');
      await queryClient.invalidateQueries({ queryKey: queryKeys.patients.detail(patient.id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      showToast({
        tone: 'success',
        title: t('patients.note_saved'),
        message: t('patients.note_saved'),
      });
    } finally {
      setSavingNote(false);
    }
  };

  const payHint = () => {
    showToast({
      tone: 'info',
      title: t('patients.action_pay'),
      message: t('patients.pay_hint'),
    });
    setTab('payments');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: canvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 40,
          gap: 16,
        }}
      >
        <PatientDetailHeader
          patient={patient}
          onNote={() => setTab('notes')}
          onPay={payHint}
        />
        <PatientOverviewStats patient={patient} />
        <PatientDetailTabs value={tab} onChange={setTab} />

        <Animated.View key={tab} entering={FadeIn.duration(180)} style={{ gap: 14 }}>
          {tab === 'overview' ? (
            <>
              <PatientPaymentSummary patient={patient} compact onAdd={payHint} />
              <PatientDentalPreview patient={patient} onOpen={() => setTab('chart')} />
              <View
                style={{
                  backgroundColor: authSurface,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: hairline,
                  padding: 14,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Geologica_600SemiBold',
                    fontSize: 15,
                    color: colors.text,
                    marginBottom: 12,
                  }}
                >
                  {t('patients.overview_recent')}
                </Text>
                <PatientTreatmentTimeline patient={patient} limit={3} />
              </View>
            </>
          ) : null}

          {tab === 'treatment' ? <PatientTreatmentTimeline patient={patient} /> : null}

          {tab === 'appointments' ? (
            visits.length ? (
              <View style={{ gap: 8 }}>
                {visits.map((apt) => (
                  <View
                    key={apt.id}
                    style={{
                      backgroundColor: authSurface,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: hairline,
                      padding: 14,
                      gap: 6,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          flex: 1,
                          fontFamily: 'GolosText_600SemiBold',
                          fontSize: 14,
                          color: colors.text,
                        }}
                      >
                        {apt.serviceName}
                      </Text>
                      <PatientStatusBadge
                        kind={
                          apt.status === 'completed'
                            ? 'completed'
                            : apt.status === 'cancelled'
                              ? 'planned'
                              : 'new'
                        }
                        label={t(`appointments.status_${apt.status}`)}
                        treatment={apt.status === 'completed'}
                      />
                    </View>
                    <Text
                      style={{
                        fontFamily: 'GolosText_400Regular',
                        fontSize: 12,
                        color: colors.textMuted,
                      }}
                    >
                      {formatPatientDate(apt.date, i18n.language)} · {apt.time} · {apt.doctorName}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={{ color: colors.textMuted }}>{t('patients.no_appointments')}</Text>
            )
          ) : null}

          {tab === 'chart' ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ minWidth: 320 }}>
                <Odontogram teeth={odontogramQuery.data ?? []} />
              </View>
            </ScrollView>
          ) : null}

          {tab === 'payments' ? (
            <PatientPaymentSummary patient={patient} onAdd={payHint} />
          ) : null}

          {tab === 'notes' ? (
            <View
              style={{
                backgroundColor: authSurface,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: hairline,
                padding: 14,
                gap: 12,
              }}
            >
              {patient.notes ? (
                <Text
                  style={{
                    fontFamily: 'GolosText_400Regular',
                    fontSize: 14,
                    lineHeight: 22,
                    color: colors.textSecondary,
                  }}
                >
                  {patient.notes}
                </Text>
              ) : (
                <Text style={{ color: colors.textMuted }}>{t('patients.no_notes')}</Text>
              )}
              <Input
                value={note}
                onChangeText={setNote}
                placeholder={t('patients.add_note_placeholder')}
                multiline
              />
              <ScalePressable
                accessibilityLabel={t('common.save')}
                disabled={savingNote || !note.trim()}
                onPress={() => void saveNote()}
                style={{
                  height: 44,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.primary,
                  opacity: savingNote || !note.trim() ? 0.5 : 1,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'GolosText_600SemiBold',
                    fontSize: 14,
                    color: '#FFFFFF',
                  }}
                >
                  {t('common.save')}
                </Text>
              </ScalePressable>
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
