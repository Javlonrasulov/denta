/* Merges shared CRM query-state keys (loading / empty / errors) into the locale files. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../../locales');

const data = {
  uz: {
    loading: 'Yuklanmoqda…',
    empty: 'Hozircha ma’lumot yo‘q',
    load_error: 'Ma’lumotlarni yuklab bo‘lmadi. Qayta urinib ko‘ring.',
    forbidden: 'Bu bo‘limga kirish huquqingiz yo‘q.',
  },
  'uz-Cyrl': {
    loading: 'Юкланмоқда…',
    empty: 'Ҳозирча маълумот йўқ',
    load_error: 'Маълумотларни юклаб бўлмади. Қайта уриниб кўринг.',
    forbidden: 'Бу бўлимга кириш ҳуқуқингиз йўқ.',
  },
  ru: {
    loading: 'Загрузка…',
    empty: 'Пока нет данных',
    load_error: 'Не удалось загрузить данные. Попробуйте ещё раз.',
    forbidden: 'У вас нет доступа к этому разделу.',
  },
  en: {
    loading: 'Loading…',
    empty: 'No data yet',
    load_error: 'Couldn’t load data. Please try again.',
    forbidden: 'You don’t have access to this section.',
  },
};

for (const [locale, state] of Object.entries(data)) {
  const file = path.join(root, locale, 'translation.json');
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  json.crm = json.crm || {};
  json.crm.state = { ...(json.crm.state || {}), ...state };
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
  console.log(`patched ${locale}`);
}
