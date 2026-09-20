'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { clinicApiEnabled } from '@/lib/api/clinic-api';
import { readPersistedSession } from '@/lib/auth/session';

export const API_NOT_CONFIGURED_MESSAGE = 'Configure NEXT_PUBLIC_API_URL';

export function useClinicQuery<T>(
  key: string,
  fetcher: (token: string) => Promise<T>,
) {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [empty, setEmpty] = useState(false);
  const apiConfigured = clinicApiEnabled();

  const refetch = useCallback(async () => {
    if (!apiConfigured) {
      setLoading(false);
      setData(null);
      setError(null);
      setEmpty(false);
      return;
    }

    const token = readPersistedSession()?.accessToken;
    if (!token) {
      setLoading(false);
      setData(null);
      setError(new Error('No session'));
      setEmpty(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcherRef.current(token);
      setData(result);
      setEmpty(
        result == null ||
          (Array.isArray(result) && result.length === 0) ||
          (typeof result === 'object' &&
            !Array.isArray(result) &&
            Object.keys(result as object).length === 0),
      );
    } catch (err) {
      setData(null);
      setEmpty(false);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [apiConfigured, key]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, empty, refetch, apiConfigured };
}
