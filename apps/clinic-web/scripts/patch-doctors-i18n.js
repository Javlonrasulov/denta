/* Merges "add doctor" (CRM) and doctor-app password keys into the shared locale files. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../../locales');

const data = {
  uz: {
    crm: {
      doctors: {
        add: 'Shifokor qo‘shish',
        col_app: 'Ilova',
        status_default_password: 'Parol o‘zgartirilmagan',
        status_default_password_hint: 'Shifokor hali boshlang‘ich parol (123456) bilan kiradi',
        status_active: 'Faol',
        empty_title: 'Hali shifokor qo‘shilmagan',
        empty_hint:
          'Shifokor qo‘shing — u telefon raqami orqali shifokor ilovasiga kiradi va mijozlar ilovasida ko‘rinadi.',
        modal: {
          title: 'Yangi shifokor',
          subtitle: 'Shifokor ilovasiga kirish ma’lumotlari avtomatik yaratiladi',
          preview_label: 'Mijozlar ilovasida shunday ko‘rinadi',
          preview_name: 'Ism Familiya',
          preview_specialty: 'Mutaxassislik',
          preview_badge: 'Yangi',
          section_personal: 'Shaxsiy ma’lumotlar',
          section_specialty: 'Mutaxassislik',
          section_access: 'Ilovaga kirish',
          first_name: 'Ism',
          last_name: 'Familiya',
          experience_years: 'Tajriba (yil)',
          phone: 'Telefon raqam (login)',
          phone_hint: 'Shifokor ilovaga shu raqam bilan kiradi',
          default_password: 'Boshlang‘ich parol',
          default_password_hint:
            'Birinchi kirishda shifokordan parolni o‘zgartirish so‘raladi. Keyin ham ilovadagi Profil → Parolni o‘zgartirish bo‘limida yangilashi mumkin.',
          submit: 'Shifokorni qo‘shish',
          cancel: 'Bekor qilish',
          close: 'Yopish',
          required: 'Majburiy maydon',
          invalid_phone: 'Telefon raqam noto‘g‘ri',
          invalid_experience: '0 dan 60 gacha son kiriting',
          errors: {
            already_member: 'Bu raqamdagi foydalanuvchi allaqachon klinikangizda ishlaydi',
            generic: 'Shifokorni qo‘shib bo‘lmadi. Qayta urinib ko‘ring.',
          },
          done_created_title: 'Shifokor qo‘shildi',
          done_created_hint:
            '{{name}} endi shifokor ilovasiga kira oladi va mijozlar ilovasida ko‘rinadi.',
          done_attached_title: 'Shifokor klinikaga biriktirildi',
          done_attached_hint:
            '{{name}} tizimda allaqachon ro‘yxatdan o‘tgan — ilovaga o‘zining joriy paroli bilan kiradi.',
          login: 'Login (telefon)',
          password: 'Parol',
          steps_title: 'Shifokorga yuboring',
          step_download: 'ORADENT Doctor ilovasini o‘rnatsin',
          step_login: 'Telefon raqam va 123456 paroli bilan kirsin',
          step_change: 'Birinchi kirishda shaxsiy parol o‘rnatsin',
          add_another: 'Yana qo‘shish',
        },
      },
    },
    doctor_profile: {
      password_rules: 'Kamida 8 belgi: kamida 1 harf va 1 raqam',
      password_same: 'Yangi parol joriy paroldan farq qilishi kerak',
      password_changed: 'Parol muvaffaqiyatli o‘zgartirildi',
      password_force_title: 'Parolingizni yangilang',
      password_force_body:
        'Siz klinika bergan boshlang‘ich parol bilan kirdingiz. Xavfsizlik uchun shaxsiy parol o‘rnating.',
      password_force_current_hint: 'Joriy parol — klinika bergan boshlang‘ich parol (123456)',
      password_force_later: 'Keyinroq',
    },
  },
  'uz-Cyrl': {
    crm: {
      doctors: {
        add: 'Шифокор қўшиш',
        col_app: 'Илова',
        status_default_password: 'Пароль ўзгартирилмаган',
        status_default_password_hint: 'Шифокор ҳали бошланғич пароль (123456) билан киради',
        status_active: 'Фаол',
        empty_title: 'Ҳали шифокор қўшилмаган',
        empty_hint:
          'Шифокор қўшинг — у телефон рақами орқали шифокор иловасига киради ва мижозлар иловасида кўринади.',
        modal: {
          title: 'Янги шифокор',
          subtitle: 'Шифокор иловасига кириш маълумотлари автоматик яратилади',
          preview_label: 'Мижозлар иловасида шундай кўринади',
          preview_name: 'Исм Фамилия',
          preview_specialty: 'Мутахассислик',
          preview_badge: 'Янги',
          section_personal: 'Шахсий маълумотлар',
          section_specialty: 'Мутахассислик',
          section_access: 'Иловага кириш',
          first_name: 'Исм',
          last_name: 'Фамилия',
          experience_years: 'Тажриба (йил)',
          phone: 'Телефон рақам (логин)',
          phone_hint: 'Шифокор иловага шу рақам билан киради',
          default_password: 'Бошланғич пароль',
          default_password_hint:
            'Биринчи киришда шифокордан паролни ўзгартириш сўралади. Кейин ҳам иловадаги Профиль → Паролни ўзгартириш бўлимида янгилаши мумкин.',
          submit: 'Шифокорни қўшиш',
          cancel: 'Бекор қилиш',
          close: 'Ёпиш',
          required: 'Мажбурий майдон',
          invalid_phone: 'Телефон рақам нотўғри',
          invalid_experience: '0 дан 60 гача сон киритинг',
          errors: {
            already_member: 'Бу рақамдаги фойдаланувчи аллақачон клиникангизда ишлайди',
            generic: 'Шифокорни қўшиб бўлмади. Қайта уриниб кўринг.',
          },
          done_created_title: 'Шифокор қўшилди',
          done_created_hint:
            '{{name}} энди шифокор иловасига кира олади ва мижозлар иловасида кўринади.',
          done_attached_title: 'Шифокор клиникага бириктирилди',
          done_attached_hint:
            '{{name}} тизимда аллақачон рўйхатдан ўтган — иловага ўзининг жорий пароли билан киради.',
          login: 'Логин (телефон)',
          password: 'Пароль',
          steps_title: 'Шифокорга юборинг',
          step_download: 'ORADENT Doctor иловасини ўрнатсин',
          step_login: 'Телефон рақам ва 123456 пароли билан кирсин',
          step_change: 'Биринчи киришда шахсий пароль ўрнатсин',
          add_another: 'Яна қўшиш',
        },
      },
    },
    doctor_profile: {
      password_rules: 'Камида 8 белги: камида 1 ҳарф ва 1 рақам',
      password_same: 'Янги пароль жорий паролдан фарқ қилиши керак',
      password_changed: 'Пароль муваффақиятли ўзгартирилди',
      password_force_title: 'Паролингизни янгиланг',
      password_force_body:
        'Сиз клиника берган бошланғич пароль билан кирдингиз. Хавфсизлик учун шахсий пароль ўрнатинг.',
      password_force_current_hint: 'Жорий пароль — клиника берган бошланғич пароль (123456)',
      password_force_later: 'Кейинроқ',
    },
  },
  ru: {
    crm: {
      doctors: {
        add: 'Добавить врача',
        col_app: 'Приложение',
        status_default_password: 'Пароль не изменён',
        status_default_password_hint: 'Врач всё ещё входит с начальным паролем (123456)',
        status_active: 'Активен',
        empty_title: 'Врачи ещё не добавлены',
        empty_hint:
          'Добавьте врача — он войдёт в приложение для врачей по номеру телефона и появится в приложении для пациентов.',
        modal: {
          title: 'Новый врач',
          subtitle: 'Данные для входа в приложение врача создаются автоматически',
          preview_label: 'Так врач будет виден в приложении для пациентов',
          preview_name: 'Имя Фамилия',
          preview_specialty: 'Специализация',
          preview_badge: 'Новый',
          section_personal: 'Личные данные',
          section_specialty: 'Специализация',
          section_access: 'Вход в приложение',
          first_name: 'Имя',
          last_name: 'Фамилия',
          experience_years: 'Стаж (лет)',
          phone: 'Телефон (логин)',
          phone_hint: 'Врач входит в приложение по этому номеру',
          default_password: 'Начальный пароль',
          default_password_hint:
            'При первом входе врача попросят сменить пароль. Позже его можно изменить в приложении: Профиль → Сменить пароль.',
          submit: 'Добавить врача',
          cancel: 'Отмена',
          close: 'Закрыть',
          required: 'Обязательное поле',
          invalid_phone: 'Неверный номер телефона',
          invalid_experience: 'Введите число от 0 до 60',
          errors: {
            already_member: 'Пользователь с этим номером уже работает в вашей клинике',
            generic: 'Не удалось добавить врача. Попробуйте ещё раз.',
          },
          done_created_title: 'Врач добавлен',
          done_created_hint:
            '{{name}} теперь может войти в приложение врача и виден в приложении для пациентов.',
          done_attached_title: 'Врач привязан к клинике',
          done_attached_hint:
            '{{name}} уже зарегистрирован в системе — входит со своим текущим паролем.',
          login: 'Логин (телефон)',
          password: 'Пароль',
          steps_title: 'Отправьте врачу',
          step_download: 'Установить приложение ORADENT Doctor',
          step_login: 'Войти по номеру телефона и паролю 123456',
          step_change: 'При первом входе задать личный пароль',
          add_another: 'Добавить ещё',
        },
      },
    },
    doctor_profile: {
      password_rules: 'Минимум 8 символов: хотя бы 1 буква и 1 цифра',
      password_same: 'Новый пароль должен отличаться от текущего',
      password_changed: 'Пароль успешно изменён',
      password_force_title: 'Обновите пароль',
      password_force_body:
        'Вы вошли с начальным паролем, выданным клиникой. Для безопасности задайте личный пароль.',
      password_force_current_hint: 'Текущий пароль — начальный пароль от клиники (123456)',
      password_force_later: 'Позже',
    },
  },
  en: {
    crm: {
      doctors: {
        add: 'Add doctor',
        col_app: 'App',
        status_default_password: 'Default password',
        status_default_password_hint: 'The doctor still signs in with the initial password (123456)',
        status_active: 'Active',
        empty_title: 'No doctors yet',
        empty_hint:
          'Add a doctor — they sign in to the doctor app with their phone number and appear in the patient app.',
        modal: {
          title: 'New doctor',
          subtitle: 'Doctor app sign-in details are created automatically',
          preview_label: 'How patients will see the doctor',
          preview_name: 'First Last',
          preview_specialty: 'Specialization',
          preview_badge: 'New',
          section_personal: 'Personal details',
          section_specialty: 'Specialization',
          section_access: 'App sign-in',
          first_name: 'First name',
          last_name: 'Last name',
          experience_years: 'Experience (years)',
          phone: 'Phone (login)',
          phone_hint: 'The doctor signs in to the app with this number',
          default_password: 'Initial password',
          default_password_hint:
            'The doctor is asked to change it on first sign-in, and can change it any time in the app under Profile → Change password.',
          submit: 'Add doctor',
          cancel: 'Cancel',
          close: 'Close',
          required: 'Required',
          invalid_phone: 'Invalid phone number',
          invalid_experience: 'Enter a number from 0 to 60',
          errors: {
            already_member: 'A user with this phone already works at your clinic',
            generic: 'Could not add the doctor. Please try again.',
          },
          done_created_title: 'Doctor added',
          done_created_hint:
            '{{name}} can now sign in to the doctor app and is visible in the patient app.',
          done_attached_title: 'Doctor linked to the clinic',
          done_attached_hint:
            '{{name}} already has an account — they sign in with their existing password.',
          login: 'Login (phone)',
          password: 'Password',
          steps_title: 'Send to the doctor',
          step_download: 'Install the ORADENT Doctor app',
          step_login: 'Sign in with the phone number and password 123456',
          step_change: 'Set a personal password on first sign-in',
          add_another: 'Add another',
        },
      },
    },
    doctor_profile: {
      password_rules: 'At least 8 characters with 1 letter and 1 digit',
      password_same: 'The new password must differ from the current one',
      password_changed: 'Password changed successfully',
      password_force_title: 'Update your password',
      password_force_body:
        'You signed in with the initial password issued by the clinic. Set a personal password to keep your account safe.',
      password_force_current_hint: 'Current password is the clinic-issued one (123456)',
      password_force_later: 'Later',
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
  merge(json, patch);
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
  console.log(`patched ${locale}`);
}
