/* Merges per-type notification texts and relative-time labels into the locale files. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../../locales');

const data = {
  uz: {
    time: { now: 'hozir', minutes: '{{count}} daq', hours: '{{count}} soat', days: '{{count}} kun' },
    types: {
      appointment_created: { title: 'Yangi qabul' },
      appointment_cancelled: { title: 'Qabul bekor qilindi' },
      appointment_rescheduled: { title: 'Qabul vaqti o‘zgardi' },
      payment_received: { title: 'To‘lov qabul qilindi' },
      low_inventory: { title: 'Omborda zaxira kamaydi' },
      trial_expiring: { title: 'Sinov muddati tugamoqda' },
      rent_due: {
        title: 'Bugun arenda muddati',
        body: '{{doctor}}: bugun {{amount}} to‘lashi kerak.',
      },
      rent_overdue: {
        title: 'Shifokor arendasi kechikdi',
        body: '{{doctor}}: {{days}} kundan beri qarzdor. Qarz: {{amount}}.',
      },
      rent_payment_submitted: {
        title: 'To‘lov tasdiqlashni kutmoqda',
        body: '{{doctor}}: {{amount}} to‘lov yubordi ({{date}}).',
      },
    },
  },
  'uz-Cyrl': {
    time: { now: 'ҳозир', minutes: '{{count}} дақ', hours: '{{count}} соат', days: '{{count}} кун' },
    types: {
      appointment_created: { title: 'Янги қабул' },
      appointment_cancelled: { title: 'Қабул бекор қилинди' },
      appointment_rescheduled: { title: 'Қабул вақти ўзгарди' },
      payment_received: { title: 'Тўлов қабул қилинди' },
      low_inventory: { title: 'Омборда захира камайди' },
      trial_expiring: { title: 'Синов муддати тугамоқда' },
      rent_due: {
        title: 'Бугун ижара муддати',
        body: '{{doctor}}: бугун {{amount}} тўлаши керак.',
      },
      rent_overdue: {
        title: 'Шифокор ижараси кечикди',
        body: '{{doctor}}: {{days}} кундан бери қарздор. Қарз: {{amount}}.',
      },
      rent_payment_submitted: {
        title: 'Тўлов тасдиқлашни кутмоқда',
        body: '{{doctor}}: {{amount}} тўлов юборди ({{date}}).',
      },
    },
  },
  ru: {
    time: { now: 'сейчас', minutes: '{{count}} мин', hours: '{{count}} ч', days: '{{count}} дн' },
    types: {
      appointment_created: { title: 'Новая запись' },
      appointment_cancelled: { title: 'Запись отменена' },
      appointment_rescheduled: { title: 'Запись перенесена' },
      payment_received: { title: 'Оплата получена' },
      low_inventory: { title: 'Заканчивается товар на складе' },
      trial_expiring: { title: 'Пробный период заканчивается' },
      rent_due: {
        title: 'Сегодня срок аренды',
        body: '{{doctor}}: сегодня должен оплатить {{amount}}.',
      },
      rent_overdue: {
        title: 'Просрочка аренды врача',
        body: '{{doctor}}: долг {{days}} дн. Сумма: {{amount}}.',
      },
      rent_payment_submitted: {
        title: 'Платёж ждёт подтверждения',
        body: '{{doctor}}: отправил платёж {{amount}} ({{date}}).',
      },
    },
  },
  en: {
    time: { now: 'now', minutes: '{{count}}m', hours: '{{count}}h', days: '{{count}}d' },
    types: {
      appointment_created: { title: 'New appointment' },
      appointment_cancelled: { title: 'Appointment cancelled' },
      appointment_rescheduled: { title: 'Appointment rescheduled' },
      payment_received: { title: 'Payment received' },
      low_inventory: { title: 'Low inventory' },
      trial_expiring: { title: 'Trial ending soon' },
      rent_due: {
        title: 'Doctor rent due today',
        body: '{{doctor}} owes {{amount}} today.',
      },
      rent_overdue: {
        title: 'Doctor rent overdue',
        body: '{{doctor}} is {{days}} days overdue. Balance: {{amount}}.',
      },
      rent_payment_submitted: {
        title: 'Payment awaiting confirmation',
        body: '{{doctor}} submitted a payment of {{amount}} ({{date}}).',
      },
    },
  },
};

function merge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      merge(target[key], value);
    } else {
      target[key] = value;
    }
  }
}

for (const [locale, patch] of Object.entries(data)) {
  const file = path.join(root, locale, 'translation.json');
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  json.notifications = json.notifications || {};
  merge(json.notifications, patch);
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
  console.log(`patched ${locale}`);
}
