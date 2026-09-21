import { useEffect, useRef, useState } from 'react';

import { apiPost, ApiError, useMockApi } from '@/services/apiClient';
import { isValidEmail } from '@/utils/phone';

export type EmailCheckState =
  | 'idle'
  | 'checking'
  | 'valid'
  | 'invalid'
  | 'taken'
  | 'error';

export type CheckEmailResponse = {
  available: boolean;
  formatValid: boolean;
  domainValid: boolean;
  reason?: 'INVALID_EMAIL' | 'INVALID_DOMAIN' | 'EMAIL_ALREADY_EXISTS';
};

const DEBOUNCE_MS = 500;

export async function checkEmailAvailability(
  email: string,
): Promise<CheckEmailResponse> {
  if (useMockApi()) {
    const normalized = email.trim().toLowerCase();
    if (!isValidEmail(normalized)) {
      return {
        available: false,
        formatValid: false,
        domainValid: false,
        reason: 'INVALID_EMAIL',
      };
    }
    if (normalized.includes('taken@') || normalized.startsWith('exists@')) {
      return {
        available: false,
        formatValid: true,
        domainValid: true,
        reason: 'EMAIL_ALREADY_EXISTS',
      };
    }
    if (normalized.includes('invalid-domain') || normalized.endsWith('.zzz')) {
      return {
        available: false,
        formatValid: true,
        domainValid: false,
        reason: 'INVALID_DOMAIN',
      };
    }
    return { available: true, formatValid: true, domainValid: true };
  }

  return apiPost<CheckEmailResponse>(
    '/auth/check-email',
    { email: email.trim().toLowerCase() },
    false,
  );
}

export function useEmailAvailability(email: string) {
  const [state, setState] = useState<EmailCheckState>('idle');
  const [reason, setReason] = useState<CheckEmailResponse['reason']>();
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = email.trim();
    if (!trimmed) {
      setState('idle');
      setReason(undefined);
      return;
    }

    if (!isValidEmail(trimmed)) {
      setState('invalid');
      setReason('INVALID_EMAIL');
      return;
    }

    setState('checking');
    setReason(undefined);
    const id = ++requestId.current;

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const result = await checkEmailAvailability(trimmed);
          if (id !== requestId.current) return;

          if (!result.formatValid) {
            setState('invalid');
            setReason('INVALID_EMAIL');
            return;
          }
          if (!result.domainValid) {
            setState('invalid');
            setReason('INVALID_DOMAIN');
            return;
          }
          if (!result.available) {
            setState('taken');
            setReason(result.reason ?? 'EMAIL_ALREADY_EXISTS');
            return;
          }
          setState('valid');
          setReason(undefined);
        } catch (err) {
          if (id !== requestId.current) return;
          if (err instanceof ApiError && err.code === 'RATE_LIMITED') {
            setState('error');
            return;
          }
          setState('error');
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [email]);

  return { state, reason, isValid: state === 'valid' };
}
