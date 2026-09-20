const fs = require('fs');

const patches = {
  'd:/Proect/Stomatologiya/locales/uz/translation.json': {
    financeExtra: {
      outstanding_charges: 'Qarzdorliklar',
      actions: 'Amallar',
      partial_pay: "Qisman to'lov",
      full_pay: "To'liq to'lov",
    },
    onboarding: {
      step4_body:
        'Katalogdan klinikangiz xizmatlarini tanlang va narx/davomiylikni belgilang.',
      services_required: 'Kamida bitta xizmatni tanlang',
      price_uzs: 'Narx (UZS)',
      duration_min: 'Davomiylik (daq)',
    },
    service: {
      consultation: 'Konsultatsiya',
      professional_cleaning: 'Professional tozalash',
      filling: 'Kariyes davolash / Plomba',
      root_canal: 'Kanal davolash',
      whitening: 'Oqartirish',
      orthodontic_consult: 'Ortodontik konsultatsiya',
      implant_consult: 'Implant konsultatsiyasi',
    },
  },
  'd:/Proect/Stomatologiya/locales/ru/translation.json': {
    financeExtra: {
      outstanding_charges: 'Задолженности',
      actions: 'Действия',
      partial_pay: 'Частичная оплата',
      full_pay: 'Оплатить полностью',
    },
    onboarding: {
      step4_body:
        'Выберите услуги клиники из каталога и укажите цену/длительность.',
      services_required: 'Выберите хотя бы одну услугу',
      price_uzs: 'Цена (UZS)',
      duration_min: 'Длительность (мин)',
    },
    service: {
      consultation: 'Консультация',
      professional_cleaning: 'Профессиональная чистка',
      filling: 'Лечение кариеса / Пломба',
      root_canal: 'Лечение каналов',
      whitening: 'Отбеливание',
      orthodontic_consult: 'Ортодонтическая консультация',
      implant_consult: 'Консультация по имплантации',
    },
  },
  'd:/Proect/Stomatologiya/locales/uz-Cyrl/translation.json': {
    financeExtra: {
      outstanding_charges: 'Қарздорликлар',
      actions: 'Амаллар',
      partial_pay: 'Қисман тўлов',
      full_pay: 'Тўлиқ тўлов',
    },
    onboarding: {
      step4_body:
        'Каталогдан клиника хизматларини танланг ва нарх/давомийликни белгиланг.',
      services_required: 'Камида битта хизматни танланг',
      price_uzs: 'Нарх (UZS)',
      duration_min: 'Давомийлик (дақ)',
    },
    service: {
      consultation: 'Консультация',
      professional_cleaning: 'Профессионал тозалаш',
      filling: 'Кариес даволаш / Пломба',
      root_canal: 'Канал даволаш',
      whitening: 'Оқартириш',
      orthodontic_consult: 'Ортодонтик консультация',
      implant_consult: 'Имплант консультацияси',
    },
  },
  'd:/Proect/Stomatologiya/locales/en/translation.json': {
    financeExtra: {
      outstanding_charges: 'Outstanding charges',
      actions: 'Actions',
      partial_pay: 'Partial pay',
      full_pay: 'Pay in full',
    },
    onboarding: {
      step4_body:
        'Select clinic services from the catalog and set price/duration.',
      services_required: 'Select at least one service',
      price_uzs: 'Price (UZS)',
      duration_min: 'Duration (min)',
    },
    service: {
      consultation: 'Consultation',
      professional_cleaning: 'Professional cleaning',
      filling: 'Caries treatment / Filling',
      root_canal: 'Root canal treatment',
      whitening: 'Whitening',
      orthodontic_consult: 'Orthodontic consultation',
      implant_consult: 'Implant consultation',
    },
  },
};

for (const [file, patch] of Object.entries(patches)) {
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (patch.financeExtra && j.crm?.finance) {
    Object.assign(j.crm.finance, patch.financeExtra);
  }
  if (j.clinicAuth?.onboarding && patch.onboarding) {
    Object.assign(j.clinicAuth.onboarding, patch.onboarding);
  }
  j.service = { ...(j.service || {}), ...patch.service };
  fs.writeFileSync(file, JSON.stringify(j, null, 2) + '\n');
  console.log('patched', file);
}
