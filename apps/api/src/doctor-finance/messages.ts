export type RentMessageKind = 'D3' | 'D1' | 'DUE' | 'OVERDUE' | 'PAYMENT_RECEIVED' | 'PAYMENT_SUBMITTED';

type Vars = {
  amount: number;
  date: string;
  clinicName: string;
  doctorName: string;
  daysOverdue?: number;
};

type Locale = 'uz' | 'uz-Cyrl' | 'ru' | 'en';

function money(amount: number, locale: Locale): string {
  const n = new Intl.NumberFormat('ru-RU').format(amount).replace(/\u00a0/g, ' ');
  if (locale === 'ru') return `${n} сум`;
  if (locale === 'uz-Cyrl') return `${n} сўм`;
  if (locale === 'en') return `${n} UZS`;
  return `${n} so'm`;
}

function day(ymd: string): string {
  const [y, m, d] = ymd.split('-');
  return `${d}.${m}.${y}`;
}

const DOCTOR: Record<Locale, Record<RentMessageKind, (v: Vars, l: Locale) => { title: string; body: string }>> = {
  uz: {
    D3: (v, l) => ({ title: "Arenda to'lovi yaqinlashmoqda", body: `${v.clinicName}: ${money(v.amount, l)} — to'lov muddati ${day(v.date)} (3 kun qoldi).` }),
    D1: (v, l) => ({ title: "Ertaga arenda to'lovi", body: `${v.clinicName}: ${money(v.amount, l)} — to'lov muddati ertaga, ${day(v.date)}.` }),
    DUE: (v, l) => ({ title: "Bugun arenda to'lovi", body: `${v.clinicName}: bugun ${money(v.amount, l)} to'lash kerak.` }),
    OVERDUE: (v, l) => ({ title: "Arenda to'lovi kechikdi", body: `${v.clinicName}: to'lov ${v.daysOverdue} kun kechikdi. Qolgan qarz: ${money(v.amount, l)}.` }),
    PAYMENT_RECEIVED: (v, l) => ({ title: "To'lov qabul qilindi", body: `${v.clinicName}: ${money(v.amount, l)} to'lovingiz qayd etildi (${day(v.date)}).` }),
    PAYMENT_SUBMITTED: (v, l) => ({ title: "To'lov tasdiqlashni kutmoqda", body: `${v.doctorName}: ${money(v.amount, l)} to'lov yubordi (${day(v.date)}).` }),
  },
  'uz-Cyrl': {
    D3: (v, l) => ({ title: 'Ижара тўлови яқинлашмоқда', body: `${v.clinicName}: ${money(v.amount, l)} — тўлов муддати ${day(v.date)} (3 кун қолди).` }),
    D1: (v, l) => ({ title: 'Эртага ижара тўлови', body: `${v.clinicName}: ${money(v.amount, l)} — тўлов муддати эртага, ${day(v.date)}.` }),
    DUE: (v, l) => ({ title: 'Бугун ижара тўлови', body: `${v.clinicName}: бугун ${money(v.amount, l)} тўлаш керак.` }),
    OVERDUE: (v, l) => ({ title: 'Ижара тўлови кечикди', body: `${v.clinicName}: тўлов ${v.daysOverdue} кун кечикди. Қолган қарз: ${money(v.amount, l)}.` }),
    PAYMENT_RECEIVED: (v, l) => ({ title: 'Тўлов қабул қилинди', body: `${v.clinicName}: ${money(v.amount, l)} тўловингиз қайд этилди (${day(v.date)}).` }),
    PAYMENT_SUBMITTED: (v, l) => ({ title: 'Тўлов тасдиқлашни кутмоқда', body: `${v.doctorName}: ${money(v.amount, l)} тўлов юборди (${day(v.date)}).` }),
  },
  ru: {
    D3: (v, l) => ({ title: 'Скоро оплата аренды', body: `${v.clinicName}: ${money(v.amount, l)} — срок оплаты ${day(v.date)} (через 3 дня).` }),
    D1: (v, l) => ({ title: 'Завтра оплата аренды', body: `${v.clinicName}: ${money(v.amount, l)} — срок оплаты завтра, ${day(v.date)}.` }),
    DUE: (v, l) => ({ title: 'Сегодня оплата аренды', body: `${v.clinicName}: сегодня нужно оплатить ${money(v.amount, l)}.` }),
    OVERDUE: (v, l) => ({ title: 'Оплата аренды просрочена', body: `${v.clinicName}: просрочка ${v.daysOverdue} дн. Остаток долга: ${money(v.amount, l)}.` }),
    PAYMENT_RECEIVED: (v, l) => ({ title: 'Оплата принята', body: `${v.clinicName}: ваш платёж ${money(v.amount, l)} зарегистрирован (${day(v.date)}).` }),
    PAYMENT_SUBMITTED: (v, l) => ({ title: 'Платёж ждёт подтверждения', body: `${v.doctorName}: отправил платёж ${money(v.amount, l)} (${day(v.date)}).` }),
  },
  en: {
    D3: (v, l) => ({ title: 'Rent payment coming up', body: `${v.clinicName}: ${money(v.amount, l)} is due on ${day(v.date)} (in 3 days).` }),
    D1: (v, l) => ({ title: 'Rent due tomorrow', body: `${v.clinicName}: ${money(v.amount, l)} is due tomorrow, ${day(v.date)}.` }),
    DUE: (v, l) => ({ title: 'Rent due today', body: `${v.clinicName}: ${money(v.amount, l)} is due today.` }),
    OVERDUE: (v, l) => ({ title: 'Rent payment overdue', body: `${v.clinicName}: ${v.daysOverdue} days overdue. Remaining balance: ${money(v.amount, l)}.` }),
    PAYMENT_RECEIVED: (v, l) => ({ title: 'Payment received', body: `${v.clinicName}: your payment of ${money(v.amount, l)} was recorded (${day(v.date)}).` }),
    PAYMENT_SUBMITTED: (v, l) => ({ title: 'Payment awaiting confirmation', body: `${v.doctorName} submitted a payment of ${money(v.amount, l)} (${day(v.date)}).` }),
  },
};

const STAFF: Record<Locale, Partial<Record<RentMessageKind, (v: Vars, l: Locale) => { title: string; body: string }>>> = {
  uz: {
    DUE: (v, l) => ({ title: 'Bugun arenda muddati', body: `${v.doctorName}: bugun ${money(v.amount, l)} to'lashi kerak.` }),
    OVERDUE: (v, l) => ({ title: 'Shifokor arendasi kechikdi', body: `${v.doctorName}: ${v.daysOverdue} kundan beri qarzdor. Qarz: ${money(v.amount, l)}.` }),
  },
  'uz-Cyrl': {
    DUE: (v, l) => ({ title: 'Бугун ижара муддати', body: `${v.doctorName}: бугун ${money(v.amount, l)} тўлаши керак.` }),
    OVERDUE: (v, l) => ({ title: 'Шифокор ижараси кечикди', body: `${v.doctorName}: ${v.daysOverdue} кундан бери қарздор. Қарз: ${money(v.amount, l)}.` }),
  },
  ru: {
    DUE: (v, l) => ({ title: 'Сегодня срок аренды', body: `${v.doctorName}: сегодня должен оплатить ${money(v.amount, l)}.` }),
    OVERDUE: (v, l) => ({ title: 'Просрочка аренды врача', body: `${v.doctorName}: долг ${v.daysOverdue} дн. Сумма: ${money(v.amount, l)}.` }),
  },
  en: {
    DUE: (v, l) => ({ title: 'Doctor rent due today', body: `${v.doctorName} owes ${money(v.amount, l)} today.` }),
    OVERDUE: (v, l) => ({ title: 'Doctor rent overdue', body: `${v.doctorName} is ${v.daysOverdue} days overdue. Balance: ${money(v.amount, l)}.` }),
  },
};

function normLocale(locale: string | null | undefined): Locale {
  if (locale === 'ru' || locale === 'en' || locale === 'uz-Cyrl') return locale;
  return 'uz';
}

export function rentMessage(
  audience: 'doctor' | 'staff',
  kind: RentMessageKind,
  locale: string | null | undefined,
  vars: Vars,
): { title: string; body: string } {
  const l = normLocale(locale);
  const table = audience === 'staff' ? STAFF[l][kind] ?? DOCTOR[l][kind] : DOCTOR[l][kind];
  return table(vars, l);
}
