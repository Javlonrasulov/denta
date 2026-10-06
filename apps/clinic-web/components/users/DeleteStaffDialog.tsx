'use client';

import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthButton } from '@/components/auth/AuthFields';
import { FormError, ModalFooter, ModalIcon, ModalShell } from '@/components/users/ModalShell';
import { clinicApi, type ClinicMember } from '@/lib/api/clinic-api';
import { readPersistedSession } from '@/lib/auth/session';
import { memberErrorKey } from '@/lib/staff';

export function DeleteStaffDialog({
  member,
  onClose,
  onDeleted,
}: {
  member: ClinicMember | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
  }, [member]);

  if (!member) return null;

  async function confirm() {
    if (!member) return;
    const token = readPersistedSession()?.accessToken;
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      await clinicApi.deactivateMember(token, member.id);
      onDeleted();
      onClose();
    } catch (err) {
      const key = memberErrorKey(err);
      setError(key ? t(key) : err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell
      open
      size="sm"
      onClose={onClose}
      closeLabel={t('crm.users.modal.close')}
      icon={
        <ModalIcon tone="danger">
          <Trash2 className="h-5 w-5" strokeWidth={2} />
        </ModalIcon>
      }
      title={t('crm.users.delete_modal.title')}
      subtitle={member.fullName}
    >
      <div className="space-y-3 px-5 py-5">
        <p className="text-sm leading-relaxed text-slate-600">
          {t('crm.users.delete_modal.hint', { name: member.fullName })}
        </p>
        {error ? <FormError>{error}</FormError> : null}
      </div>
      <ModalFooter>
        <AuthButton variant="secondary" onClick={onClose} className="tablet:w-auto tablet:px-5">
          {t('crm.users.cancel')}
        </AuthButton>
        <AuthButton
          variant="danger"
          onClick={() => void confirm()}
          loading={loading}
          className="tablet:w-auto tablet:px-6"
        >
          {!loading ? <Trash2 className="h-4 w-4" /> : null}
          {t('crm.users.delete_modal.confirm')}
        </AuthButton>
      </ModalFooter>
    </ModalShell>
  );
}
