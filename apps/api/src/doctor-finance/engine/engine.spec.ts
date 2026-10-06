import {
  agingBuckets,
  obligationStatus,
  planAllocations,
  reminderKeyFor,
  splitShare,
  type ReminderSettings,
} from './ledger';
import { nextDueAfter, planObligations, prorate, type RentRule } from './rent-schedule';

const base: RentRule = {
  agreementId: 'ag1',
  effectiveFrom: '2026-10-01',
  effectiveTo: null,
  amountUzs: 3_000_000,
  recurrence: 'MONTHLY',
  dueDayOfMonth: 5,
  prorateFirstPeriod: true,
};

describe('planObligations', () => {
  it('monthly: calendar month periods, due on the chosen day', () => {
    const plan = planObligations(base, { until: '2026-12-31' });
    expect(plan.map((p) => [p.periodStart, p.periodEnd, p.dueDate, p.amountUzs])).toEqual([
      ['2026-10-01', '2026-10-31', '2026-10-05', 3_000_000],
      ['2026-11-01', '2026-11-30', '2026-11-05', 3_000_000],
      ['2026-12-01', '2026-12-31', '2026-12-05', 3_000_000],
    ]);
  });

  it('monthly: day 31 clamps to the last day of shorter months', () => {
    const plan = planObligations(
      { ...base, effectiveFrom: '2027-01-01', dueDayOfMonth: 31 },
      { until: '2027-04-30' },
    );
    expect(plan.map((p) => p.dueDate)).toEqual(['2027-01-31', '2027-02-28', '2027-03-31', '2027-04-30']);
  });

  it('monthly: partial first month is prorated and due no earlier than the start', () => {
    const [first] = planObligations({ ...base, effectiveFrom: '2026-10-16' }, { until: '2026-10-31' });
    expect(first.periodStart).toBe('2026-10-16');
    expect(first.dueDate).toBe('2026-10-16');
    expect(first.amountUzs).toBe(prorate(3_000_000, 16, 31));
    expect(first.prorated).toBe(true);
  });

  it('respects the lookahead horizon and is deterministic (idempotent keys)', () => {
    const a = planObligations(base, { until: '2026-10-04' });
    expect(a).toHaveLength(0);
    const b = planObligations(base, { until: '2026-11-05' }).map((p) => p.periodKey);
    const c = planObligations(base, { until: '2026-11-05' }).map((p) => p.periodKey);
    expect(b).toEqual(c);
    expect(new Set(b).size).toBe(b.length);
  });

  it('weekly: due on the chosen weekday', () => {
    const plan = planObligations(
      { ...base, recurrence: 'WEEKLY', dueDayOfWeek: 1, amountUzs: 700_000, effectiveFrom: '2026-10-05' },
      { until: '2026-10-20' },
    );
    expect(plan.map((p) => p.dueDate)).toEqual(['2026-10-05', '2026-10-12', '2026-10-19']);
  });

  it('daily working days follow the doctor schedule and skip days off', () => {
    const plan = planObligations(
      { ...base, recurrence: 'DAILY', dailyBasis: 'WORKING_DAYS', amountUzs: 100_000 },
      { until: '2026-10-07', workingDays: [1, 2, 3, 4, 5], daysOff: ['2026-10-06'] },
    );
    // Oct 1 Thu, 2 Fri, 5 Mon, 7 Wed (6 is a day off, 3–4 weekend)
    expect(plan.map((p) => p.dueDate)).toEqual(['2026-10-01', '2026-10-02', '2026-10-05', '2026-10-07']);
  });

  it('daily calendar days bill every day', () => {
    const plan = planObligations(
      { ...base, recurrence: 'DAILY', dailyBasis: 'CALENDAR_DAYS', amountUzs: 100_000 },
      { until: '2026-10-07', workingDays: [1] },
    );
    expect(plan).toHaveLength(7);
  });

  it('every N months anchors on the start date', () => {
    const plan = planObligations(
      { ...base, recurrence: 'INTERVAL', intervalValue: 2, intervalUnit: 'MONTH', effectiveFrom: '2026-01-31' },
      { until: '2026-07-31' },
    );
    expect(plan.map((p) => [p.dueDate, p.periodEnd])).toEqual([
      ['2026-01-31', '2026-03-30'],
      ['2026-03-31', '2026-05-30'],
      ['2026-05-31', '2026-07-30'],
      ['2026-07-31', '2026-09-29'],
    ]);
  });

  it('custom schedule uses explicit dates and amounts', () => {
    const plan = planObligations(
      {
        ...base,
        recurrence: 'CUSTOM_SCHEDULE',
        scheduleItems: [
          { id: 'b', dueDate: '2026-12-10', amountUzs: 2_000_000 },
          { id: 'a', dueDate: '2026-10-10', amountUzs: 1_500_000 },
        ],
      },
      { until: '2027-01-01' },
    );
    expect(plan.map((p) => [p.periodStart, p.dueDate, p.amountUzs])).toEqual([
      ['2026-10-01', '2026-10-10', 1_500_000],
      ['2026-10-11', '2026-12-10', 2_000_000],
    ]);
  });

  it('one-time obligation', () => {
    const plan = planObligations(
      { ...base, recurrence: 'ONE_TIME', oneTimeDueDate: '2026-10-20' },
      { until: '2026-12-01' },
    );
    expect(plan).toHaveLength(1);
    expect(plan[0].dueDate).toBe('2026-10-20');
  });

  it('nothing is billed before effectiveFrom or twice after a version change', () => {
    const old = planObligations({ ...base, effectiveTo: '2026-11-14' }, { until: '2027-01-31' });
    expect(old.map((p) => p.periodStart)).toEqual(['2026-10-01', '2026-11-01']);
    expect(old[1].periodEnd).toBe('2026-11-14');
    const next = planObligations(
      { ...base, agreementId: 'ag2', effectiveFrom: '2026-11-15', amountUzs: 4_000_000 },
      { until: '2026-12-31', coveredUntil: '2026-11-30' },
    );
    expect(next[0].periodStart).toBe('2026-12-01');
  });

  it('nextDueAfter finds the next billing date', () => {
    expect(nextDueAfter(base, '2026-10-05')).toBe('2026-11-05');
  });

  it('nextDueAfter sees far-away dates (one-time, long intervals, future start)', () => {
    expect(
      nextDueAfter({ ...base, recurrence: 'ONE_TIME', oneTimeDueDate: '2028-03-01' }, '2026-10-05'),
    ).toBe('2028-03-01');
    expect(
      nextDueAfter({ ...base, recurrence: 'INTERVAL', intervalValue: 36, intervalUnit: 'MONTH' }, '2026-10-05'),
    ).toBe('2029-10-01');
    expect(nextDueAfter({ ...base, effectiveFrom: '2027-09-01' }, '2026-10-05')).toBe('2027-09-05');
  });
});

describe('obligationStatus', () => {
  const o = { amountUzs: 3_000_000, paidUzs: 0, dueDate: '2026-10-05', cancelled: false };
  it('A) upcoming → due → overdue', () => {
    expect(obligationStatus(o, '2026-10-01')).toBe('UPCOMING');
    expect(obligationStatus(o, '2026-10-05')).toBe('DUE');
    expect(obligationStatus(o, '2026-10-06')).toBe('OVERDUE');
    expect(obligationStatus(o, '2026-10-06', 3)).toBe('DUE');
  });
  it('B/C) partial and paid', () => {
    expect(obligationStatus({ ...o, paidUzs: 1_000_000 }, '2026-10-05')).toBe('PARTIALLY_PAID');
    expect(obligationStatus({ ...o, paidUzs: 1_000_000 }, '2026-10-09')).toBe('OVERDUE');
    expect(obligationStatus({ ...o, paidUzs: 3_000_000 }, '2026-12-01')).toBe('PAID');
    expect(obligationStatus({ ...o, cancelled: true }, '2026-12-01')).toBe('CANCELLED');
  });
});

describe('planAllocations', () => {
  it('B) partial payment leaves the remainder outstanding', () => {
    const plan = planAllocations(
      [{ paymentId: 'p1', available: 1_000_000 }],
      [{ id: 'o1', outstanding: 3_000_000, dueDate: '2026-10-05' }],
    );
    expect(plan).toEqual([{ paymentId: 'p1', obligationId: 'o1', amountUzs: 1_000_000 }]);
  });
  it('E) surplus stays as advance and pays the oldest obligation first', () => {
    const plan = planAllocations(
      [{ paymentId: 'p1', available: 7_000_000 }],
      [
        { id: 'nov', outstanding: 3_000_000, dueDate: '2026-11-05' },
        { id: 'oct', outstanding: 3_000_000, dueDate: '2026-10-05' },
      ],
    );
    expect(plan.map((p) => [p.obligationId, p.amountUzs])).toEqual([
      ['oct', 3_000_000],
      ['nov', 3_000_000],
    ]);
    const used = plan.reduce((s, p) => s + p.amountUzs, 0);
    expect(7_000_000 - used).toBe(1_000_000);
  });
});

describe('splitShare', () => {
  it('J) 70/30 on 600 000', () => {
    expect(splitShare(600_000, 3000)).toEqual({ clinic: 180_000, doctor: 420_000 });
  });
  it('K) refunds mirror the split and always sum exactly', () => {
    expect(splitShare(-600_000, 3000)).toEqual({ clinic: -180_000, doctor: -420_000 });
    for (const amount of [1, 7, 333_333, 999_999]) {
      const s = splitShare(amount, 3333);
      expect(s.clinic + s.doctor).toBe(amount);
      expect(Number.isInteger(s.clinic) && Number.isInteger(s.doctor)).toBe(true);
    }
  });
});

describe('reminderKeyFor (M: dedupe keys)', () => {
  const settings: ReminderSettings = {
    remind3Days: true,
    remind1Day: true,
    remindDueDay: true,
    remindOverdue: true,
    overdueFrequency: 'EVERY_3_DAYS',
  };
  const o = { dueDate: '2026-10-05', outstanding: 3_000_000, cancelled: false };
  it('fires once per stage', () => {
    expect(reminderKeyFor(o, '2026-10-02', settings)?.key).toBe('D3');
    expect(reminderKeyFor(o, '2026-10-03', settings)).toBeNull();
    expect(reminderKeyFor(o, '2026-10-04', settings)?.key).toBe('D1');
    expect(reminderKeyFor(o, '2026-10-05', settings)?.key).toBe('DUE');
    expect(reminderKeyFor(o, '2026-10-06', settings)?.key).toBe('OD:2026-10-06');
    expect(reminderKeyFor(o, '2026-10-07', settings)).toBeNull();
    expect(reminderKeyFor(o, '2026-10-09', settings)?.key).toBe('OD:2026-10-09');
  });
  it('respects toggles and paid obligations', () => {
    expect(reminderKeyFor(o, '2026-10-02', { ...settings, remind3Days: false })).toBeNull();
    expect(reminderKeyFor({ ...o, outstanding: 0 }, '2026-10-05', settings)).toBeNull();
  });
});

describe('agingBuckets', () => {
  it('groups outstanding by days past due', () => {
    const b = agingBuckets(
      [
        { dueDate: '2026-10-05', outstanding: 100 },
        { dueDate: '2026-09-20', outstanding: 200 },
        { dueDate: '2026-08-20', outstanding: 300 },
        { dueDate: '2026-06-01', outstanding: 400 },
        { dueDate: '2026-11-01', outstanding: 999 },
      ],
      '2026-10-06',
    );
    expect(b).toEqual({ d0_7: 100, d8_30: 200, d31_60: 300, d60_plus: 400 });
  });
});
