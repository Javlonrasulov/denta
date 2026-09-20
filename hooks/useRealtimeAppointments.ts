import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/hooks/queries';
import { apiBaseUrl, getAccessToken, useMockApi } from '@/services/apiClient';

/**
 * Invalidate appointment queries when Socket.IO realtime events arrive.
 * No-op when API URL / token missing or mock mode.
 */
export function useRealtimeAppointments() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (useMockApi()) return;

    let socket: { disconnect: () => void; on: (e: string, fn: () => void) => void } | null =
      null;
    let cancelled = false;

    void (async () => {
      const base = apiBaseUrl();
      const token = await getAccessToken();
      if (!base || !token || cancelled) return;

      const origin = base.replace(/\/api\/v1\/?$/, '');
      try {
        const { io } = await import('socket.io-client');
        if (cancelled) return;
        const s = io(`${origin}/realtime`, {
          auth: { token },
          transports: ['websocket', 'polling'],
        });
        socket = s;
        const invalidate = () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
          void queryClient.invalidateQueries({ queryKey: ['doctors', 'me', 'dashboard'] });
          void queryClient.invalidateQueries({ queryKey: queryKeys.finance.all });
        };
        s.on('appointment.created', invalidate);
        s.on('appointment.updated', invalidate);
        s.on('appointment.cancelled', invalidate);
        s.on('slot.updated', invalidate);
      } catch {
        // socket.io-client optional until installed
      }
    })();

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [queryClient]);
}
