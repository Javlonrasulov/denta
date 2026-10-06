import {
  checkIntervalAgainstClinic,
  clinicDayRule,
  parseClinicWorkingHours,
  validateClinicWorkingHours,
} from './clinic-hours';

const monday = (patch: Record<string, unknown> = {}) => ({
  day: 1,
  open: '09:00',
  close: '18:00',
  closed: false,
  lunchEnabled: true,
  lunchStart: '13:00',
  lunchEnd: '14:00',
  ...patch,
});

describe('clinic hours', () => {
  it('accepts lunch inside working hours', () => {
    expect(validateClinicWorkingHours([monday()])).toEqual([]);
  });

  it('accepts a day without lunch', () => {
    expect(validateClinicWorkingHours([monday({ lunchEnabled: false })])).toEqual([]);
  });

  it('rejects lunch before opening (08:00–09:00)', () => {
    const issues = validateClinicWorkingHours([
      monday({ lunchStart: '08:00', lunchEnd: '09:00' }),
    ]);
    expect(issues[0]?.code).toBe('LUNCH_OUTSIDE_HOURS');
  });

  it('rejects lunch past closing (17:30–18:30)', () => {
    const issues = validateClinicWorkingHours([
      monday({ lunchStart: '17:30', lunchEnd: '18:30' }),
    ]);
    expect(issues[0]?.code).toBe('LUNCH_OUTSIDE_HOURS');
  });

  it('rejects reversed hours and lunch', () => {
    expect(validateClinicWorkingHours([monday({ open: '18:00', close: '09:00' })])[0]?.code).toBe(
      'HOURS_ORDER',
    );
    expect(
      validateClinicWorkingHours([monday({ lunchStart: '14:00', lunchEnd: '13:00' })])[0]?.code,
    ).toBe('LUNCH_ORDER');
  });

  it('ignores times of a closed day', () => {
    expect(
      validateClinicWorkingHours([monday({ closed: true, open: '18:00', close: '09:00' })]),
    ).toEqual([]);
  });

  it('treats legacy entries as lunch disabled', () => {
    const [d] = parseClinicWorkingHours([{ day: 1, open: '09:00', close: '18:00' }])!;
    expect(d.lunchEnabled).toBe(false);
    const rule = clinicDayRule([{ day: 1, open: '09:00', close: '18:00' }], 1);
    expect(rule).toEqual({
      kind: 'open',
      hours: { start: '09:00', end: '18:00' },
      lunch: null,
    });
  });

  it('distinguishes unconfigured clinics from closed days', () => {
    expect(clinicDayRule(null, 0).kind).toBe('unconfigured');
    expect(clinicDayRule([monday()], 0).kind).toBe('closed');
  });

  it('checks the full appointment interval', () => {
    const rule = clinicDayRule([monday()], 1);
    expect(checkIntervalAgainstClinic(rule, 12 * 60 + 45, 13 * 60 + 15)).toBe('lunch');
    expect(checkIntervalAgainstClinic(rule, 12 * 60, 13 * 60)).toBe('ok');
    expect(checkIntervalAgainstClinic(rule, 17 * 60 + 30, 18 * 60 + 30)).toBe('outside_hours');
  });
});
