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

  describe('clinic lunch', () => {
    const day = {
      workingHours: { start: '09:00', end: '18:00' },
      breakTime: null,
      clinicHours: { start: '09:00', end: '18:00' },
      clinicLunch: { start: '13:00', end: '14:00' },
      date: '2026-09-21',
      bookings: [],
    };

    it('creates no slot inside 13:00–14:00', () => {
      const slots = generateTimeSlots({ ...day, durationMinutes: 30 });
      const times = slots.map((s) => s.time);
      expect(times).not.toContain('13:00');
      expect(times).not.toContain('13:30');
      expect(times).toContain('12:30');
      expect(times).toContain('14:00');
    });

    it('excludes a 12:45–13:15 slot that only partially overlaps lunch', () => {
      const slots = generateTimeSlots({
        ...day,
        workingHours: { start: '09:00', end: '18:00' },
        clinicHours: { start: '09:00', end: '18:00' },
        durationMinutes: 45,
      });
      const times = slots.map((s) => s.time);
      expect(times).toContain('12:00');
      expect(times).not.toContain('12:45');
      expect(times).toContain('14:00');
      for (const s of slots) {
        const [h, m] = s.time.split(':').map(Number);
        const start = h * 60 + m;
        const end = start + 45;
        expect(start < 14 * 60 && end > 13 * 60).toBe(false);
      }
    });

    it('keeps generating normally when lunch is disabled', () => {
      const slots = generateTimeSlots({ ...day, clinicLunch: null, durationMinutes: 30 });
      expect(slots.map((s) => s.time)).toContain('13:00');
    });

    it('clips doctor schedule to clinic hours', () => {
      const slots = generateTimeSlots({
        ...day,
        workingHours: { start: '08:00', end: '20:00' },
        clinicLunch: null,
        durationMinutes: 60,
      });
      expect(slots[0].time).toBe('09:00');
      expect(slots[slots.length - 1].time).toBe('17:00');
    });

    it('blocks slots overlapping a long existing appointment', () => {
      const slots = generateTimeSlots({
        ...day,
        durationMinutes: 30,
        bookings: [
          { date: '2026-09-21', time: '10:00', endTime: '11:00', status: 'CONFIRMED' },
        ],
      });
      const map = Object.fromEntries(slots.map((s) => [s.time, s.available]));
      expect(map['10:00']).toBe(false);
      expect(map['10:30']).toBe(false);
      expect(map['11:00']).toBe(true);
    });
  });
});
