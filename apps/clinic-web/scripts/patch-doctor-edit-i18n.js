/* Merges the "edit doctor" modal keys into the shared locale files. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../../locales');

const data = {
  uz: {
    open: 'Tahrirlash',
    title: 'Shifokorni tahrirlash',
    save: 'Saqlash',
    price_from: 'Qabul narxi (dan), so‘m',
    price_hint: 'Mijozlar ilovasida «...dan» bo‘lib ko‘rinadi',
    login_locked: 'Ilovaga kirish logini — o‘zgartirilmaydi',
    reset_title: 'Parolni tiklash',
    reset_hint: 'Shifokor parolni unutgan bo‘lsa, uni {{password}} ga qaytaring.',
    reset_confirm: 'Parol {{password}} ga tiklanadi va shifokor barcha qurilmalardan chiqariladi. Davom etasizmi?',
    reset_button: 'Parolni tiklash',
    reset_confirm_yes: 'Ha, tiklash',
    reset_done: 'Parol tiklandi. Shifokor kirgach yangi parol o‘rnatadi.',
    errors: {
      reset_forbidden: 'Bu akkaunt boshqa klinikada ham ishlatiladi — parolni bu yerdan tiklab bo‘lmaydi.',
      generic: 'Saqlab bo‘lmadi. Qayta urinib ko‘ring.',
    },
  },
  'uz-Cyrl': {
    open: 'Таҳрирлаш',
    title: 'Шифокорни таҳрирлаш',
    save: 'Сақлаш',
    price_from: 'Қабул нархи (дан), сўм',
    price_hint: 'Мижозлар иловасида «...дан» бўлиб кўринади',
    login_locked: 'Иловага кириш логини — ўзгартирилмайди',
    reset_title: 'Паролни тиклаш',
    reset_hint: 'Шифокор паролни унутган бўлса, уни {{password}} га қайтаринг.',
    reset_confirm: 'Парол {{password}} га тикланади ва шифокор барча қурилмалардан чиқарилади. Давом этасизми?',
    reset_button: 'Паролни тиклаш',
    reset_confirm_yes: 'Ҳа, тиклаш',
    reset_done: 'Парол тикланди. Шифокор киргач янги парол ўрнатади.',
    errors: {
      reset_forbidden: 'Бу аккаунт бошқа клиникада ҳам ишлатилади — паролни бу ердан тиклаб бўлмайди.',
      generic: 'Сақлаб бўлмади. Қайта уриниб кўринг.',
    },
  },
  ru: {
    open: 'Редактировать',
    title: 'Редактирование врача',
    save: 'Сохранить',
    price_from: 'Стоимость приёма (от), сум',
    price_hint: 'В приложении пациента отображается как «от ...»',
    login_locked: 'Логин для входа в приложение — не меняется',
    reset_title: 'Сброс пароля',
    reset_hint: 'Если врач забыл пароль, сбросьте его на {{password}}.',
    reset_confirm: 'Пароль будет сброшен на {{password}}, врач выйдет со всех устройств. Продолжить?',
    reset_button: 'Сбросить пароль',
    reset_confirm_yes: 'Да, сбросить',
    reset_done: 'Пароль сброшен. После входа врач задаст новый пароль.',
    errors: {
      reset_forbidden: 'Этот аккаунт используется и в другой клинике — сбросить пароль отсюда нельзя.',
      generic: 'Не удалось сохранить. Попробуйте ещё раз.',
    },
  },
  en: {
    open: 'Edit',
    title: 'Edit doctor',
    save: 'Save',
    price_from: 'Visit price (from), UZS',
    price_hint: 'Shown as “from ...” in the patient app',
    login_locked: 'App login — cannot be changed',
    reset_title: 'Reset password',
    reset_hint: 'If the doctor forgot their password, reset it to {{password}}.',
    reset_confirm: 'The password will be reset to {{password}} and the doctor signed out of all devices. Continue?',
    reset_button: 'Reset password',
    reset_confirm_yes: 'Yes, reset',
    reset_done: 'Password reset. The doctor will set a new one after signing in.',
    errors: {
      reset_forbidden: 'This account is also used in another clinic — the password cannot be reset here.',
      generic: 'Could not save. Please try again.',
    },
  },
};

const colPrice = {
  uz: 'Qabul narxi',
  'uz-Cyrl': 'Қабул нархи',
  ru: 'Стоимость приёма',
  en: 'Visit price',
};

const appPresence = {
  uz: {
    online: 'Onlayn',
    never: 'Hali kirmagan',
    today: 'Bugun, {{time}}',
    yesterday: 'Kecha, {{time}}',
    last_seen_exact: 'Ilovada oxirgi faollik: {{value}}',
  },
  'uz-Cyrl': {
    online: 'Онлайн',
    never: 'Ҳали кирмаган',
    today: 'Бугун, {{time}}',
    yesterday: 'Кеча, {{time}}',
    last_seen_exact: 'Иловада охирги фаоллик: {{value}}',
  },
  ru: {
    online: 'В сети',
    never: 'Ещё не входил',
    today: 'Сегодня, {{time}}',
    yesterday: 'Вчера, {{time}}',
    last_seen_exact: 'Последняя активность в приложении: {{value}}',
  },
  en: {
    online: 'Online',
    never: 'Not signed in yet',
    today: 'Today, {{time}}',
    yesterday: 'Yesterday, {{time}}',
    last_seen_exact: 'Last activity in the app: {{value}}',
  },
};

for (const [locale, edit] of Object.entries(data)) {
  const file = path.join(root, locale, 'translation.json');
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  const doctors = ((json.crm = json.crm || {}).doctors = json.crm.doctors || {});
  doctors.edit = edit;
  doctors.col_price = colPrice[locale];
  doctors.app = appPresence[locale];
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
  console.log(`patched ${locale}`);
}
