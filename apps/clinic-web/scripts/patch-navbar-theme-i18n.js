/* Merges top-navbar, theme switcher and trial pill keys into the locale files. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../../locales');

const data = {
  uz: {
    theme: {
      label: 'Mavzu',
      light: 'Yorug‘',
      dark: 'Qorong‘i',
      system: 'Tizim',
      switch_to_dark: 'Qorong‘i mavzuga o‘tish',
      switch_to_light: 'Yorug‘ mavzuga o‘tish',
    },
    header: {
      search_label: 'Qidiruv',
      search_placeholder: 'Bemor: ism yoki telefon…',
      open_search: 'Qidiruvni ochish',
      clear_search: 'Qidiruvni tozalash',
      profile_menu: 'Profil menyusi',
      account: 'Shaxsiy kabinet',
      account_hint: 'Login, parol va email',
      switch_workspace: 'Klinikani almashtirish',
      breadcrumb: 'Navigatsiya yo‘li',
    },
    trial: {
      days_short: '{{days}} kun',
      remaining: '{{days}} kun qoldi',
      progress: 'Sinov muddati',
    },
  },
  'uz-Cyrl': {
    theme: {
      label: 'Мавзу',
      light: 'Ёруғ',
      dark: 'Қоронғи',
      system: 'Тизим',
      switch_to_dark: 'Қоронғи мавзуга ўтиш',
      switch_to_light: 'Ёруғ мавзуга ўтиш',
    },
    header: {
      search_label: 'Қидирув',
      search_placeholder: 'Бемор: исм ёки телефон…',
      open_search: 'Қидирувни очиш',
      clear_search: 'Қидирувни тозалаш',
      profile_menu: 'Профил менюси',
      account: 'Шахсий кабинет',
      account_hint: 'Логин, парол ва email',
      switch_workspace: 'Клиникани алмаштириш',
      breadcrumb: 'Навигация йўли',
    },
    trial: {
      days_short: '{{days}} кун',
      remaining: '{{days}} кун қолди',
      progress: 'Синов муддати',
    },
  },
  ru: {
    theme: {
      label: 'Тема',
      light: 'Светлая',
      dark: 'Тёмная',
      system: 'Системная',
      switch_to_dark: 'Включить тёмную тему',
      switch_to_light: 'Включить светлую тему',
    },
    header: {
      search_label: 'Поиск',
      search_placeholder: 'Пациент: имя или телефон…',
      open_search: 'Открыть поиск',
      clear_search: 'Очистить поиск',
      profile_menu: 'Меню профиля',
      account: 'Личный кабинет',
      account_hint: 'Логин, пароль и email',
      switch_workspace: 'Сменить клинику',
      breadcrumb: 'Навигационная цепочка',
    },
    trial: {
      days_short: '{{days}} дн.',
      remaining: 'Осталось {{days}} дн.',
      progress: 'Пробный период',
    },
  },
  en: {
    theme: {
      label: 'Theme',
      light: 'Light',
      dark: 'Dark',
      system: 'System',
      switch_to_dark: 'Switch to dark theme',
      switch_to_light: 'Switch to light theme',
    },
    header: {
      search_label: 'Search',
      search_placeholder: 'Patient name or phone…',
      open_search: 'Open search',
      clear_search: 'Clear search',
      profile_menu: 'Profile menu',
      account: 'My account',
      account_hint: 'Login, password and email',
      switch_workspace: 'Switch clinic',
      breadcrumb: 'Breadcrumb',
    },
    trial: {
      days_short: '{{days}}d',
      remaining: '{{days}} days left',
      progress: 'Trial period',
    },
  },
};

for (const [locale, keys] of Object.entries(data)) {
  const file = path.join(root, locale, 'translation.json');
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  json.crm = json.crm || {};
  json.crm.theme = { ...(json.crm.theme || {}), ...keys.theme };
  json.crm.header = { ...(json.crm.header || {}), ...keys.header };
  json.clinicAuth = json.clinicAuth || {};
  json.clinicAuth.trial = { ...(json.clinicAuth.trial || {}), ...keys.trial };
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
  console.log(`patched ${locale}`);
}
