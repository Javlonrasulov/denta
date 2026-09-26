import { io, type Socket } from 'socket.io-client';

import { readPersistedSession } from '@/lib/auth/session';

const APPOINTMENT_EVENTS = [
  'appointment.created',
  'appointment.updated',
  'appointment.cancelled',
] as const;

export type AppointmentRealtimeEvent = (typeof APPOINTMENT_EVENTS)[number];

let activeSocket: Socket | null = null;

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

  if (activeSocket) {
    activeSocket.removeAllListeners();
    activeSocket.disconnect();
    activeSocket = null;
  }

  const socket: Socket = io(`${origin}/realtime`, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
  activeSocket = socket;

  for (const event of APPOINTMENT_EVENTS) {
    socket.on(event, (payload: unknown) => onEvent(event, payload));
  }

  return () => {
    socket.removeAllListeners();
    socket.disconnect();
    if (activeSocket === socket) activeSocket = null;
  };
}

/** After workspace switch: leave old clinic room and join new via server ack. */
export function notifyRealtimeWorkspaceSwitch(clinicId: string): void {
  const token = readPersistedSession()?.accessToken;
  if (!activeSocket?.connected || !token) return;
  activeSocket.emit('workspace.switch', { clinicId, token });
}
