/* Merges personal-cabinet (admin account) keys into the shared locale files. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../../locales');

const data = {
  uz: {
    errors: {
      wrong_password: 'Joriy parol noto‘g‘ri.',
      same_password: 'Yangi parol joriy paroldan farq qilishi kerak.',
      same_email: 'Yangi email joriy email bilan bir xil.',
      unauthorized: 'Sessiya muddati tugagan. Qaytadan tizimga kiring.',
    },
    account: {
      title: 'Shaxsiy kabinet',
      subtitle: 'Login, parol va email manzilingizni boshqaring',
      open: 'Shaxsiy kabinetni ochish',
      close: 'Yopish',
      verified: 'Tasdiqlangan',
      unverified: 'Tasdiqlanmagan',
      login_label: 'Login',
      email_label: 'Email',
      current_password: 'Joriy parol',
      current_password_hint: 'Xavfsizlik uchun joriy parolingizni kiriting.',
      tabs: { phone: 'Login', password: 'Parol', email: 'Email' },
      phone: {
        title: 'Loginni o‘zgartirish',
        hint: 'Login — telefon raqamingiz. Tizimga kirishda yangi raqamdan foydalanasiz.',
        new: 'Yangi telefon raqam',
        same: 'Bu raqam allaqachon sizning loginingiz.',
        save: 'Loginni saqlash',
        success: 'Login muvaffaqiyatli yangilandi.',
      },
      password: {
        title: 'Parolni o‘zgartirish',
        hint: 'Kamida 8 belgi, 1 harf va 1 raqam.',
        new: 'Yangi parol',
        confirm: 'Yangi parolni takrorlang',
        save: 'Parolni saqlash',
        success: 'Parol yangilandi. Boshqa qurilmalardagi sessiyalar yakunlandi.',
      },
      email: {
        title: 'Email manzilni o‘zgartirish',
        hint: 'Yangi emailga tasdiqlash kodi yuboriladi. Kod tasdiqlanmaguncha email o‘zgarmaydi.',
        new: 'Yangi email',
        send_code: 'Kod yuborish',
        code_sent: '{{email}} manziliga 6 xonali tasdiqlash kodi yubordik.',
        confirm: 'Tasdiqlash va saqlash',
        resend: 'Kodni qayta yuborish',
        resend_in: 'Qayta yuborish: {{time}}',
        change_address: 'Boshqa email kiritish',
        success: 'Email muvaffaqiyatli o‘zgartirildi va tasdiqlandi.',
      },
    },
  },
  'uz-Cyrl': {
    errors: {
      wrong_password: 'Жорий пароль нотўғри.',
      same_password: 'Янги пароль жорий паролдан фарқ қилиши керак.',
      same_email: 'Янги email жорий email билан бир хил.',
      unauthorized: 'Сессия муддати тугаган. Қайтадан тизимга киринг.',
    },
    account: {
      title: 'Шахсий кабинет',
      subtitle: 'Логин, пароль ва email манзилингизни бошқаринг',
      open: 'Шахсий кабинетни очиш',
      close: 'Ёпиш',
      verified: 'Тасдиқланган',
      unverified: 'Тасдиқланмаган',
      login_label: 'Логин',
      email_label: 'Email',
      current_password: 'Жорий пароль',
      current_password_hint: 'Хавфсизлик учун жорий паролингизни киритинг.',
      tabs: { phone: 'Логин', password: 'Пароль', email: 'Email' },
      phone: {
        title: 'Логинни ўзгартириш',
        hint: 'Логин — телефон рақамингиз. Тизимга киришда янги рақамдан фойдаланасиз.',
        new: 'Янги телефон рақам',
        same: 'Бу рақам аллақачон сизнинг логинингиз.',
        save: 'Логинни сақлаш',
        success: 'Логин муваффақиятли янгиланди.',
      },
      password: {
        title: 'Паролни ўзгартириш',
        hint: 'Камида 8 белги, 1 ҳарф ва 1 рақам.',
        new: 'Янги пароль',
        confirm: 'Янги паролни такрорланг',
        save: 'Паролни сақлаш',
        success: 'Пароль янгиланди. Бошқа қурилмалардаги сессиялар якунланди.',
      },
      email: {
        title: 'Email манзилни ўзгартириш',
        hint: 'Янги emailга тасдиқлаш коди юборилади. Код тасдиқланмагунча email ўзгармайди.',
        new: 'Янги email',
        send_code: 'Код юбориш',
        code_sent: '{{email}} манзилига 6 хонали тасдиқлаш кодини юбордик.',
        confirm: 'Тасдиқлаш ва сақлаш',
        resend: 'Кодни қайта юбориш',
        resend_in: 'Қайта юбориш: {{time}}',
        change_address: 'Бошқа email киритиш',
        success: 'Email муваффақиятли ўзгартирилди ва тасдиқланди.',
      },
    },
  },
  ru: {
    errors: {
      wrong_password: 'Текущий пароль неверный.',
      same_password: 'Новый пароль должен отличаться от текущего.',
      same_email: 'Новый email совпадает с текущим.',
      unauthorized: 'Сессия истекла. Войдите снова.',
    },
    account: {
      title: 'Личный кабинет',
      subtitle: 'Управляйте логином, паролем и email',
      open: 'Открыть личный кабинет',
      close: 'Закрыть',
      verified: 'Подтверждён',
      unverified: 'Не подтверждён',
      login_label: 'Логин',
      email_label: 'Email',
      current_password: 'Текущий пароль',
      current_password_hint: 'Для безопасности введите текущий пароль.',
      tabs: { phone: 'Логин', password: 'Пароль', email: 'Email' },
      phone: {
        title: 'Изменить логин',
        hint: 'Логин — ваш номер телефона. Для входа будет использоваться новый номер.',
        new: 'Новый номер телефона',
        same: 'Этот номер уже является вашим логином.',
        save: 'Сохранить логин',
        success: 'Логин успешно обновлён.',
      },
      password: {
        title: 'Изменить пароль',
        hint: 'Минимум 8 символов, 1 буква и 1 цифра.',
        new: 'Новый пароль',
        confirm: 'Повторите новый пароль',
        save: 'Сохранить пароль',
        success: 'Пароль обновлён. Сеансы на других устройствах завершены.',
      },
      email: {
        title: 'Изменить email',
        hint: 'На новый email будет отправлен код подтверждения. Email не изменится, пока код не подтверждён.',
        new: 'Новый email',
        send_code: 'Отправить код',
        code_sent: 'Мы отправили 6-значный код на {{email}}.',
        confirm: 'Подтвердить и сохранить',
        resend: 'Отправить код повторно',
        resend_in: 'Повторная отправка: {{time}}',
        change_address: 'Ввести другой email',
        success: 'Email успешно изменён и подтверждён.',
      },
    },
  },
  en: {
    errors: {
      wrong_password: 'Current password is incorrect.',
      same_password: 'The new password must differ from the current one.',
      same_email: 'The new email is the same as the current one.',
      unauthorized: 'Your session has expired. Please sign in again.',
    },
    account: {
      title: 'Personal account',
      subtitle: 'Manage your login, password and email',
      open: 'Open personal account',
      close: 'Close',
      verified: 'Verified',
      unverified: 'Not verified',
      login_label: 'Login',
      email_label: 'Email',
      current_password: 'Current password',
      current_password_hint: 'Enter your current password to confirm it is you.',
      tabs: { phone: 'Login', password: 'Password', email: 'Email' },
      phone: {
        title: 'Change login',
        hint: 'Your login is your phone number. You will sign in with the new number.',
        new: 'New phone number',
        same: 'This number is already your login.',
        save: 'Save login',
        success: 'Login updated successfully.',
      },
      password: {
        title: 'Change password',
        hint: 'At least 8 characters, 1 letter and 1 digit.',
        new: 'New password',
        confirm: 'Repeat new password',
        save: 'Save password',
        success: 'Password updated. Sessions on other devices were signed out.',
      },
      email: {
        title: 'Change email',
        hint: 'A verification code will be sent to the new email. Your email will not change until the code is confirmed.',
        new: 'New email',
        send_code: 'Send code',
        code_sent: 'We sent a 6-digit code to {{email}}.',
        confirm: 'Confirm and save',
        resend: 'Resend code',
        resend_in: 'Resend in {{time}}',
        change_address: 'Use a different email',
        success: 'Email changed and verified successfully.',
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
  json.clinicAuth = json.clinicAuth || {};
  merge(json.clinicAuth, patch);
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
  console.log(`patched ${locale}`);
}
