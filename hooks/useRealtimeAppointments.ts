import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/hooks/queries';
import { inboxQueryKeys } from '@/hooks/useInboxNotifications';
import { apiBaseUrl, getAccessToken, useMockApi } from '@/services/apiClient';

/**
 * Invalidate appointment + inbox queries when Socket.IO realtime events arrive.
 * No-op when API URL / token missing or mock mode.
 */
export function useRealtimeAppointments() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (useMockApi()) return;

    let socket: { disconnect: () => void; on: (e: string, fn: (...args: unknown[]) => void) => void } | null =
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
        const invalidateAppointments = () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
          void queryClient.invalidateQueries({ queryKey: ['doctors', 'me', 'dashboard'] });
          void queryClient.invalidateQueries({ queryKey: queryKeys.finance.all });
        };
        const invalidateInbox = () => {
          void queryClient.invalidateQueries({ queryKey: inboxQueryKeys.all });
        };
        s.on('appointment.created', invalidateAppointments);
        s.on('appointment.updated', invalidateAppointments);
        s.on('appointment.cancelled', invalidateAppointments);
        s.on('slot.updated', invalidateAppointments);
        s.on('notification.created', invalidateInbox);
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
