/* Merges doctor specialty catalog (multi-select + manage) keys into the shared locale files. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../../locales');

const data = {
  uz: {
    manage: 'Boshqarish',
    manage_title: 'Mutaxassisliklarni boshqarish',
    done: 'Tayyor',
    add: 'Qo‘shish',
    add_new: 'Yangi mutaxassislik qo‘shish',
    new_placeholder: 'Masalan: Endodont',
    save: 'Saqlash',
    cancel: 'Bekor qilish',
    edit: 'Tahrirlash',
    delete: 'O‘chirish',
    delete_confirm: '«{{name}}» o‘chirilsinmi?',
    delete_confirm_used: '«{{name}}» o‘chirilsinmi? U {{count}} ta shifokordan ham olib tashlanadi.',
    doctor_count: '{{count}} shifokor',
    hint: 'Bir nechta mutaxassislikni tanlash mumkin',
    selected: '{{count}} ta tanlandi',
    required: 'Kamida bitta mutaxassislik tanlang',
    empty: 'Hali mutaxassislik yo‘q',
    retry: 'Qayta yuklash',
    errors: {
      exists: 'Bunday mutaxassislik allaqachon bor',
      invalid: 'Nom 1–60 belgidan iborat bo‘lsin, vergul ishlatmang',
      generic: 'Amalni bajarib bo‘lmadi. Qayta urinib ko‘ring.',
    },
  },
  'uz-Cyrl': {
    manage: 'Бошқариш',
    manage_title: 'Мутахассисликларни бошқариш',
    done: 'Тайёр',
    add: 'Қўшиш',
    add_new: 'Янги мутахассислик қўшиш',
    new_placeholder: 'Масалан: Эндодонт',
    save: 'Сақлаш',
    cancel: 'Бекор қилиш',
    edit: 'Таҳрирлаш',
    delete: 'Ўчириш',
    delete_confirm: '«{{name}}» ўчирилсинми?',
    delete_confirm_used: '«{{name}}» ўчирилсинми? У {{count}} та шифокордан ҳам олиб ташланади.',
    doctor_count: '{{count}} шифокор',
    hint: 'Бир нечта мутахассисликни танлаш мумкин',
    selected: '{{count}} та танланди',
    required: 'Камида битта мутахассислик танланг',
    empty: 'Ҳали мутахассислик йўқ',
    retry: 'Қайта юклаш',
    errors: {
      exists: 'Бундай мутахассислик аллақачон бор',
      invalid: 'Ном 1–60 белгидан иборат бўлсин, вергул ишлатманг',
      generic: 'Амални бажариб бўлмади. Қайта уриниб кўринг.',
    },
  },
  ru: {
    manage: 'Управлять',
    manage_title: 'Управление специализациями',
    done: 'Готово',
    add: 'Добавить',
    add_new: 'Добавить специализацию',
    new_placeholder: 'Например: Эндодонт',
    save: 'Сохранить',
    cancel: 'Отмена',
    edit: 'Изменить',
    delete: 'Удалить',
    delete_confirm: 'Удалить «{{name}}»?',
    delete_confirm_used: 'Удалить «{{name}}»? Она также будет снята у врачей: {{count}}.',
    doctor_count: 'Врачей: {{count}}',
    hint: 'Можно выбрать несколько специализаций',
    selected: 'Выбрано: {{count}}',
    required: 'Выберите хотя бы одну специализацию',
    empty: 'Специализаций пока нет',
    retry: 'Загрузить снова',
    errors: {
      exists: 'Такая специализация уже есть',
      invalid: 'Название — от 1 до 60 символов, без запятых',
      generic: 'Не удалось выполнить действие. Попробуйте ещё раз.',
    },
  },
  en: {
    manage: 'Manage',
    manage_title: 'Manage specializations',
    done: 'Done',
    add: 'Add',
    add_new: 'Add specialization',
    new_placeholder: 'e.g. Endodontist',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    delete_confirm: 'Delete “{{name}}”?',
    delete_confirm_used: 'Delete “{{name}}”? It will also be removed from {{count}} doctor(s).',
    doctor_count: 'Doctors: {{count}}',
    hint: 'You can select several specializations',
    selected: 'Selected: {{count}}',
    required: 'Select at least one specialization',
    empty: 'No specializations yet',
    retry: 'Reload',
    errors: {
      exists: 'This specialization already exists',
      invalid: 'Use 1–60 characters without commas',
      generic: 'Could not complete the action. Please try again.',
    },
  },
};

for (const [locale, specialty] of Object.entries(data)) {
  const file = path.join(root, locale, 'translation.json');
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  const doctors = ((json.crm = json.crm || {}).doctors = json.crm.doctors || {});
  doctors.specialty = specialty;
  delete doctors.specialties;
  if (doctors.modal) {
    delete doctors.modal.specialty;
    delete doctors.modal.specialty_placeholder;
  }
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
  console.log(`patched ${locale}`);
}
