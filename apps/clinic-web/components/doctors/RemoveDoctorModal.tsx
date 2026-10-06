'use client';

import { AlertTriangle, CalendarClock, EyeOff, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthButton } from '@/components/auth/AuthFields';
import { FormError, ModalBody, ModalFooter, ModalIcon, ModalShell } from '@/components/users/ModalShell';
import { clinicApi, type ClinicDoctorRow } from '@/lib/api/clinic-api';
import { readPersistedSession } from '@/lib/auth/session';

export function RemoveDoctorModal({
  doctor,
  onClose,
  onRemoved,
}: {
  doctor: ClinicDoctorRow | null;
  onClose: () => void;
  onRemoved: () => void;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [upcoming, setUpcoming] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setUpcoming(null);
    setError('');
  }, [doctor]);

  if (!doctor) return null;

  async function remove(force: boolean) {
    if (!doctor) return;
    const token = readPersistedSession()?.accessToken;
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      await clinicApi.removeDoctor(token, doctor.id, force);
      onRemoved();
      onClose();
    } catch (err) {
      const e = err as { code?: string; details?: { upcoming?: number } };
      if (e.code === 'DOCTOR_HAS_UPCOMING') {
        setUpcoming(e.details?.upcoming ?? 1);
      } else {
        setError(
          e.code === 'FORBIDDEN' ? t('crm.doctors.remove.errors.owner') : t('crm.doctors.remove.errors.generic'),
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const points = [
    { icon: ShieldCheck, text: t('crm.doctors.remove.points.kept') },
    { icon: EyeOff, text: t('crm.doctors.remove.points.hidden') },
    { icon: RotateCcw, text: t('crm.doctors.remove.points.restore') },
  ];

  return (
    <ModalShell
      open
      size="sm"
      onClose={onClose}
      closeLabel={t('crm.doctors.modal.close')}
      icon={
        <ModalIcon tone="danger">
          <Trash2 className="h-5 w-5" strokeWidth={2} />
        </ModalIcon>
      }
      title={t('crm.doctors.remove.title')}
      subtitle={t('crm.doctors.remove.subtitle')}
    >
      <ModalBody>
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
          {doctor.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={doctor.photoUrl} alt="" className="h-11 w-11 rounded-xl object-cover" />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-muted text-sm font-semibold text-primary">
              {`${doctor.firstName.charAt(0)}${doctor.lastName.charAt(0)}`.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{doctor.fullName}</p>
            <p className="truncate text-xs text-slate-500">{doctor.specialization || '—'}</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-900">{t('crm.doctors.remove.only_here')}</p>
          <ul className="mt-3 space-y-2.5">
            {points.map((p) => (
              <li key={p.text} className="flex items-start gap-2.5 text-sm text-slate-600">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <p.icon className="h-3.5 w-3.5" />
                </span>
                <span className="leading-relaxed">{p.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {upcoming !== null ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
            <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-900">
                <AlertTriangle className="h-4 w-4" />
                {t('crm.doctors.remove.upcoming_title', { count: upcoming })}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-800/90">
                {t('crm.doctors.remove.upcoming_hint')}
              </p>
            </div>
          </div>
        ) : null}

        {error ? <FormError>{error}</FormError> : null}
      </ModalBody>
      <ModalFooter>
        <AuthButton variant="secondary" onClick={onClose} className="tablet:w-auto tablet:px-5">
          {t('crm.doctors.modal.cancel')}
        </AuthButton>
        <AuthButton
          variant="danger"
          loading={loading}
          onClick={() => void remove(upcoming !== null)}
          className="tablet:w-auto tablet:px-5"
        >
          {!loading ? <Trash2 className="h-4 w-4" /> : null}
          {upcoming !== null ? t('crm.doctors.remove.force') : t('crm.doctors.remove.confirm')}
        </AuthButton>
      </ModalFooter>
    </ModalShell>
  );
}
