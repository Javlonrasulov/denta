const fs = require('fs');
const files = [
  'locales/uz/translation.json',
  'locales/uz-Cyrl/translation.json',
  'locales/ru/translation.json',
  'locales/en/translation.json',
];

const patches = {
  uz: {
    tabs: { map: 'Xarita', my_appointments: 'Qabullarim', appointments: 'Qabullarim' },
    map: {
      title: 'Xarita',
      nearby: 'Yaqin-atrofda',
      view_clinic: 'Klinikani ko‘rish',
      nearest_slot: 'Eng yaqin bo‘sh vaqt',
      city_tashkent: 'Toshkent',
      search_placeholder: 'Stomatolog yoki klinika qidiring...',
      filter_nearby: 'Yaqin',
      filter_available_today: 'Bugun bo‘sh',
      filter_rating: '4.5+',
      filter_24h: '24/7',
      filter_price: 'Narx',
      filter_specialty: 'Mutaxassislik',
      slots_today: 'Bugun bo‘sh vaqt bor',
      my_location: 'Mening joylashuvim',
    },
    booking: {
      success_title: 'Qabul tasdiqlandi',
      confirm_booking: 'Qabulga yozilish',
      view_on_map: 'Xaritada ko‘rish',
      my_appointments: 'Mening qabullarim',
    },
    appointments: {
      upcoming: 'Yaqinlashayotgan',
      completed: 'Tugagan',
      cancelled: 'Bekor qilingan',
      empty_cta: 'Stomatolog topish',
    },
    favorites: {
      empty_clinics: 'Sevimli klinikalaringiz shu yerda',
      empty_cta: 'Klinika topish',
    },
  },
  'uz-Cyrl': {
    tabs: { map: 'Харита', my_appointments: 'Қабулларим', appointments: 'Қабулларим' },
    map: {
      title: 'Харита',
      nearby: 'Яқин-атрофда',
      view_clinic: 'Клиникани кўриш',
      nearest_slot: 'Энг яқин бўш вақт',
      city_tashkent: 'Тошкент',
      search_placeholder: 'Стоматолог ёки клиника қидиринг...',
      filter_nearby: 'Яқин',
      filter_available_today: 'Бугун бўш',
      filter_rating: '4.5+',
      filter_24h: '24/7',
      filter_price: 'Нарх',
      filter_specialty: 'Мутахассислик',
      slots_today: 'Бугун бўш вақт бор',
      my_location: 'Менинг жойлашувим',
    },
    booking: {
      success_title: 'Қабул тасдиқланди',
      confirm_booking: 'Қабулга ёзилиш',
      view_on_map: 'Харитада кўриш',
      my_appointments: 'Менинг қабулларим',
    },
    appointments: {
      upcoming: 'Яқинлашаётган',
      completed: 'Туган',
      cancelled: 'Бекор қилинган',
      empty_cta: 'Стоматолог топиш',
    },
    favorites: {
      empty_clinics: 'Севимли клиникаларингиз шу ерда',
      empty_cta: 'Клиника топиш',
    },
  },
  ru: {
    tabs: { map: 'Карта', my_appointments: 'Приёмы', appointments: 'Приёмы' },
    map: {
      title: 'Карта',
      nearby: 'Рядом',
      view_clinic: 'Смотреть клинику',
      nearest_slot: 'Ближайшее время',
      city_tashkent: 'Ташкент',
      search_placeholder: 'Найти стоматолога или клинику...',
      filter_nearby: 'Рядом',
      filter_available_today: 'Свободно сегодня',
      filter_rating: '4.5+',
      filter_24h: '24/7',
      filter_price: 'Цена',
      filter_specialty: 'Специальность',
      slots_today: 'Есть свободное время сегодня',
      my_location: 'Моё местоположение',
    },
    booking: {
      success_title: 'Запись подтверждена',
      confirm_booking: 'Записаться',
      view_on_map: 'Показать на карте',
      my_appointments: 'Мои приёмы',
    },
    appointments: {
      upcoming: 'Предстоящие',
      completed: 'Завершённые',
      cancelled: 'Отменённые',
      empty_cta: 'Найти стоматолога',
    },
    favorites: {
      empty_clinics: 'Любимые клиники появятся здесь',
      empty_cta: 'Найти клинику',
    },
  },
  en: {
    tabs: { map: 'Map', my_appointments: 'Bookings', appointments: 'Bookings' },
    map: {
      title: 'Map',
      nearby: 'Nearby',
      view_clinic: 'View clinic',
      nearest_slot: 'Next available',
      city_tashkent: 'Tashkent',
      search_placeholder: 'Search dentist or clinic...',
      filter_nearby: 'Nearby',
      filter_available_today: 'Available today',
      filter_rating: '4.5+',
      filter_24h: '24/7',
      filter_price: 'Price',
      filter_specialty: 'Specialty',
      slots_today: 'Slots available today',
      my_location: 'My location',
    },
    booking: {
      success_title: 'Booking confirmed',
      confirm_booking: 'Confirm booking',
      view_on_map: 'View on map',
      my_appointments: 'My appointments',
    },
    appointments: {
      upcoming: 'Upcoming',
      completed: 'Completed',
      cancelled: 'Cancelled',
      empty_cta: 'Find a dentist',
    },
    favorites: {
      empty_clinics: 'Your favorite clinics will appear here',
      empty_cta: 'Find a clinic',
    },
  },
};

for (const file of files) {
  const locale = file.includes('uz-Cyrl')
    ? 'uz-Cyrl'
    : file.includes('/uz/')
      ? 'uz'
      : file.includes('/ru/')
        ? 'ru'
        : 'en';
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  const p = patches[locale];
  Object.assign(j.tabs, p.tabs);
  Object.assign(j.map, p.map);
  Object.assign(j.booking, p.booking);
  Object.assign(j.appointments, p.appointments);
  Object.assign(j.favorites, p.favorites);
  fs.writeFileSync(file, JSON.stringify(j, null, 2) + '\n');
  console.log('patched', file);
}
