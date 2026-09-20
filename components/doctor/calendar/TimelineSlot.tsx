import { AppointmentBlock } from '@/components/doctor/calendar/AppointmentBlock';
import { BreakBlock } from '@/components/doctor/calendar/BreakBlock';
import { FreeSlotBlock } from '@/components/doctor/calendar/FreeSlotBlock';
import type { CalendarSlot } from '@/utils/doctorCalendar';

export function TimelineSlot({
  slot,
  onAppointment,
  onAddFree,
}: {
  slot: CalendarSlot;
  onAppointment?: (slot: CalendarSlot) => void;
  onAddFree?: (slot: CalendarSlot) => void;
}) {
  if (slot.kind === 'break') return <BreakBlock slot={slot} />;
  if (slot.kind === 'free') return <FreeSlotBlock slot={slot} onAdd={() => onAddFree?.(slot)} />;
  return <AppointmentBlock slot={slot} onPress={() => onAppointment?.(slot)} />;
}
