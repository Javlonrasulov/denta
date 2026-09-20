import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { PatientAvatar } from '@/components/doctor/patients/PatientAvatar';
import { PatientStatusBadge } from '@/components/doctor/patients/PatientStatusBadge';
import { ArrowLeft, CalendarPlus, Pencil, Phone, Wallet } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import type { Patient } from '@/types';
import {
  formatPatientPhone,
  patientClinicalStatus,
  patientDisplayId,
  patientFullName,
} from '@/utils/doctorPatients';
import { useToastStore } from '@/store/toastStore';

function Action({
  icon: Icon,
  label,
  onPress,
}: {
  icon: typeof Phone;
  label: string;
  onPress?: () => void;
}) {
  const { colors, field, hairline } = useLoginTheme();
  return (
    <ScalePressable
      accessibilityLabel={label}
      onPress={onPress}
      style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: 6 }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: field,
          borderWidth: 1,
          borderColor: hairline,
        }}
      >
        <Icon size={18} color={colors.primary} strokeWidth={1.8} />
      </View>
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1}
        style={{
          fontFamily: 'GolosText_500Medium',
          fontSize: 11,
          lineHeight: 14,
          color: colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </ScalePressable>
  );
}

export function PatientDetailHeader({
  patient,
  onNote,
  onPay,
}: {
  patient: Patient;
  onNote?: () => void;
  onPay?: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useLoginTheme();
  const showToast = useToastStore((s) => s.showToast);
  const name = patientFullName(patient);
  const androidPad = Platform.OS === 'android' ? { paddingRight: 8 } : null;

  const call = async () => {
    try {
      await Linking.openURL(`tel:${patient.phone}`);
    } catch {
      showToast({
        tone: 'error',
        title: t('common.error'),
        message: t('patients.call_failed'),
      });
    }
  };

  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <ScalePressable
          accessibilityLabel={t('common.back')}
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={20} color={colors.text} strokeWidth={1.8} />
        </ScalePressable>
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontFamily: 'Geologica_600SemiBold',
            fontSize: 16,
            color: colors.text,
            ...androidPad,
          }}
        >
          {t('doctor_app.patient_card')}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <PatientAvatar name={name} uri={patient.avatar} size={64} />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={1.05}
            style={{
              fontFamily: 'Geologica_700Bold',
              fontSize: 22,
              lineHeight: 28,
              letterSpacing: -0.4,
              color: colors.text,
              ...androidPad,
            }}
          >
            {name}
          </Text>
          <Text
            style={{
              fontFamily: 'GolosText_400Regular',
              fontSize: 14,
              lineHeight: 20,
              color: colors.textSecondary,
            }}
          >
            {formatPatientPhone(patient.phone)}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: 'GolosText_500Medium',
                fontSize: 12,
                color: colors.textMuted,
              }}
            >
              {t('patients.patient_id')}: #{patientDisplayId(patient)}
            </Text>
            <PatientStatusBadge kind={patientClinicalStatus(patient)} />
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Action icon={Phone} label={t('patients.action_call')} onPress={() => void call()} />
        <Action
          icon={CalendarPlus}
          label={t('patients.action_book')}
          onPress={() => {
            showToast({
              tone: 'info',
              title: t('patients.action_book'),
              message: t('patients.book_hint'),
            });
            router.push('/(doctor)/(tabs)/calendar');
          }}
        />
        <Action icon={Pencil} label={t('patients.action_note')} onPress={onNote} />
        <Action icon={Wallet} label={t('patients.action_pay')} onPress={onPay} />
      </View>
    </View>
  );
}
