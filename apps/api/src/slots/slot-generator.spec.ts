import { generateTimeSlots } from './slot-generator';

describe('generateTimeSlots', () => {
  const base = {
    workingHours: { start: '09:00', end: '12:00' },
    breakTime: { start: '10:00', end: '10:30' },
    durationMinutes: 30,
    date: '2026-09-20',
  };

  it('marks break slots unavailable', () => {
    const slots = generateTimeSlots({ ...base, bookings: [] });
    const times = Object.fromEntries(slots.map((s) => [s.time, s.available]));
    expect(times['09:00']).toBe(true);
    expect(times['09:30']).toBe(true);
    expect(times['10:00']).toBe(false);
    expect(times['10:30']).toBe(true);
  });

  it('blocks existing non-cancelled booking', () => {
    const slots = generateTimeSlots({
      ...base,
      bookings: [
        { date: '2026-09-20', time: '09:00', status: 'CONFIRMED' },
        { date: '2026-09-20', time: '09:30', status: 'CANCELLED' },
      ],
    });
    const map = Object.fromEntries(slots.map((s) => [s.time, s.available]));
    expect(map['09:00']).toBe(false);
    expect(map['09:30']).toBe(true);
  });
});
