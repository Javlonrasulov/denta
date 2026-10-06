'use client';

import { Lock, Pencil } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthButton, AuthField } from '@/components/auth/AuthFields';
import {
  FormError,
  ModalBody,
  ModalFooter,
  ModalIcon,
  ModalSection,
  ModalShell,
} from '@/components/users/ModalShell';
import { PageAccessPicker } from '@/components/users/StaffPickers';
import { clinicApi, type ClinicMember } from '@/lib/api/clinic-api';
import { readPersistedSession } from '@/lib/auth/session';
import { formatUzPhoneDisplay } from '@/lib/auth/phone';
import {
  PAGE_ACCESS,
  accessFromPermissions,
  memberErrorKey,
  permissionOverrides,
  type AccessMap,
} from '@/lib/staff';

const PAGE_PERMISSIONS = new Set(PAGE_ACCESS.flatMap((p) => [...(p.view ?? []), ...(p.manage ?? [])]));

function sameAccess(a: AccessMap, b: AccessMap): boolean {
  return PAGE_ACCESS.every((p) => a[p.key] === b[p.key]);
}

export function EditStaffModal({
  member,
  onClose,
  onSaved,
}: {
  member: ClinicMember | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [access, setAccess] = useState<AccessMap>({});
  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string;
    lastName?: string;
    access?: string;
  }>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!member) return;
    setFirstName(member.firstName);
    setLastName(member.lastName);
    setAccess(accessFromPermissions(member.effectivePermissions));
    setFieldErrors({});
    setError('');
  }, [member]);

  if (!member) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!member) return;
    setError('');

    const errs: typeof fieldErrors = {};
    if (!firstName.trim()) errs.firstName = t('crm.users.modal.required');
    if (!lastName.trim()) errs.lastName = t('crm.users.modal.required');
    if (Object.values(access).every((level) => level === 'none')) {
      errs.access = t('crm.users.access.required');
    }
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const token = readPersistedSession()?.accessToken;
    if (!token) return;

    const nameChanged =
      firstName.trim() !== member.firstName || lastName.trim() !== member.lastName;
    const accessChanged = !sameAccess(access, accessFromPermissions(member.effectivePermissions));

    setLoading(true);
    try {
      if (nameChanged) {
        await clinicApi.updateMember(token, member.id, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
      }

      if (accessChanged) {
        await clinicApi.updateMemberPermissions(token, member.id, [
          ...permissionOverrides(access),
          ...member.permissionOverrides.filter((o) => !PAGE_PERMISSIONS.has(o.permission)),
        ]);
      }

      onSaved();
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
      onClose={onClose}
      closeLabel={t('crm.users.modal.close')}
      icon={
        <ModalIcon>
          <Pencil className="h-5 w-5" strokeWidth={2} />
        </ModalIcon>
      }
      title={t('crm.users.edit_modal.title')}
      subtitle={member.fullName}
    >
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <ModalBody>
          <ModalSection title={t('crm.users.modal.section_personal')}>
            <div className="grid gap-3 tablet:grid-cols-2">
              <AuthField
                label={t('crm.users.modal.first_name')}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                error={fieldErrors.firstName}
                autoComplete="off"
              />
              <AuthField
                label={t('crm.users.modal.last_name')}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                error={fieldErrors.lastName}
                autoComplete="off"
              />
            </div>
            <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 py-3">
              <Lock className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-700">
                  {[member.phone ? formatUzPhoneDisplay(member.phone) : null, member.email]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </p>
                <p className="text-xs text-slate-500">{t('crm.users.edit_modal.login_locked')}</p>
              </div>
            </div>
          </ModalSection>

          <ModalSection title={t('crm.users.access.title')}>
            <PageAccessPicker
              value={access}
              onChange={(next) => {
                setAccess(next);
                setFieldErrors((prev) => ({ ...prev, access: undefined }));
              }}
              error={fieldErrors.access}
            />
          </ModalSection>

          {error ? <FormError>{error}</FormError> : null}
        </ModalBody>

        <ModalFooter>
          <AuthButton variant="secondary" onClick={onClose} className="tablet:w-auto tablet:px-5">
            {t('crm.users.cancel')}
          </AuthButton>
          <AuthButton type="submit" loading={loading} className="tablet:w-auto tablet:px-6">
            {t('crm.users.save')}
          </AuthButton>
        </ModalFooter>
      </form>
    </ModalShell>
  );
}
