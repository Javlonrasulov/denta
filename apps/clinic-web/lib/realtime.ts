import { io, type Socket } from 'socket.io-client';

import { readPersistedSession } from '@/lib/auth/session';

const APPOINTMENT_EVENTS = [
  'appointment.created',
  'appointment.updated',
  'appointment.cancelled',
] as const;

export type AppointmentRealtimeEvent = (typeof APPOINTMENT_EVENTS)[number];

function realtimeOrigin(): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
  if (!base) return '';
  return base.replace(/\/api\/v1$/, '');
}

export function connectClinicRealtime(
  onEvent: (event: AppointmentRealtimeEvent, payload: unknown) => void,
): () => void {
  const origin = realtimeOrigin();
  const token = readPersistedSession()?.accessToken;
  if (!origin || !token) return () => {};

  const socket: Socket = io(`${origin}/realtime`, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  for (const event of APPOINTMENT_EVENTS) {
    socket.on(event, (payload: unknown) => onEvent(event, payload));
  }

  return () => {
    socket.removeAllListeners();
    socket.disconnect();
  };
}
