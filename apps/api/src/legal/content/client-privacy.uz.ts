import type { LegalDocumentBuilder } from '../legal.types';
import { contactLinesUz, operatorLabelUz } from './shared.uz';

/**
 * Client App (patient) edition of the ORADENT Privacy Policy. Derived from the
 * full policy in clinic-web `lib/legal/content/privacy.uz.ts`. List only data
 * the backend actually stores for patients (see Prisma `User`,
 * `PatientProfile`, `Appointment`, `LegalConsent`, `DeviceToken`).
 */
export const buildClientPrivacyUz: LegalDocumentBuilder = (ctx) => {
  const { brand } = ctx;
  const operator = operatorLabelUz(ctx);

  return {
    kind: 'privacy',
    title: 'Maxfiylik siyosati',
    summary: `Ushbu siyosat ${brand} Client App orqali qanday ma’lumotlar yig‘ilishi, ular qanday maqsadda ishlatilishi, kimga uzatilishi, qanday himoya qilinishi va sizning bu boradagi huquqlaringizni tushuntiradi.`,
    sections: [
      {
        id: 'general',
        title: 'Umumiy qoidalar',
        blocks: [
          {
            type: 'p',
            text: `Ushbu Maxfiylik siyosati (keyingi o‘rinlarda — “Siyosat”) ${operator} (keyingi o‘rinlarda — “${brand}”, “biz”) tomonidan Client App mobil ilovasi va u bilan bog‘liq xizmatlar orqali qayta ishlanadigan shaxsga doir ma’lumotlarga nisbatan qo‘llaniladi.`,
          },
          {
            type: 'p',
            text: 'Siyosat O‘zbekiston Respublikasining shaxsga doir ma’lumotlar to‘g‘risidagi qonunchiligi talablarini hisobga olgan holda tuzilgan va Foydalanish shartlarining ajralmas qismi hisoblanadi.',
          },
          {
            type: 'p',
            text: 'Ma’lumotlarga nisbatan rollar quyidagicha taqsimlanadi:',
          },
          {
            type: 'ul',
            items: [
              `Sizning foydalanuvchi akkauntingiz va Client App’ning texnik ma’lumotlariga nisbatan ${brand} ma’lumotlar egasi va operatori hisoblanadi.`,
              `Klinika kiritadigan tibbiy yozuvlar va bemor kartasi ma’lumotlariga nisbatan tegishli klinika ma’lumotlar egasi hisoblanadi; ${brand} bu ma’lumotlarni faqat Platforma xizmatini ko‘rsatish uchun qayta ishlaydi.`,
            ],
          },
        ],
      },
      {
        id: 'data-we-collect',
        title: 'Qanday ma’lumotlarni qayta ishlaymiz',
        blocks: [
          { type: 'p', text: 'Akkaunt ma’lumotlari:' },
          {
            type: 'ul',
            items: [
              'ism va familiya, telefon raqami, email manzili;',
              'parol — faqat qaytarib bo‘lmaydigan xesh (hash) ko‘rinishida saqlanadi, parolning o‘zi saqlanmaydi;',
              'interfeys tili, email tasdiqlangan sana;',
              'rozilik berilgan Foydalanish shartlari va Maxfiylik siyosati versiyalari hamda rozilik sanasi.',
            ],
          },
          { type: 'p', text: 'Profil ma’lumotlari (ixtiyoriy, o‘zingiz kiritsangiz):' },
          {
            type: 'ul',
            items: ['jins;', 'tug‘ilgan sana;', 'profil rasmi.'],
          },
          { type: 'p', text: 'Qabullar bo‘yicha ma’lumotlar:' },
          {
            type: 'ul',
            items: [
              'tanlangan klinika, filial, shifokor va xizmat;',
              'qabul sanasi va vaqti, qabul holati (masalan, kutilmoqda, tasdiqlangan, bekor qilingan);',
              'qabullar tarixi;',
              'sevimli klinikalar va shifokorlar, siz qoldirgan sharhlar va baholar.',
            ],
          },
          { type: 'p', text: 'Klinika kiritadigan tibbiy va moliyaviy ma’lumotlar:' },
          {
            type: 'ul',
            items: [
              'stomatologik yozuvlar va tish kartasi (odontogramma);',
              'davolash rejalari va shifokor izohlari;',
              'qabullar va ko‘rsatilgan xizmatlar tarixi;',
              'klinika qayd etgan xizmat summalari va to‘lovlar.',
            ],
          },
          { type: 'p', text: 'Texnik ma’lumotlar:' },
          {
            type: 'ul',
            items: [
              'IP manzil, qurilma turi (user agent), qurilma nomi va platformasi;',
              'sessiya va yangilash (refresh) tokenlari — tokenlar serverda xesh ko‘rinishida saqlanadi;',
              'push-bildirishnomalar uchun qurilma tokenlari;',
              'audit jurnali: muhim amallar qachon va qaysi akkaunt tomonidan bajarilgani.',
            ],
          },
        ],
      },
      {
        id: 'purposes',
        title: 'Ma’lumotlardan foydalanish maqsadlari',
        blocks: [
          {
            type: 'ul',
            items: [
              'akkaunt yaratish va sizni autentifikatsiya qilish;',
              'klinikalar va shifokorlarni ko‘rsatish, qabulga yozilishni ta’minlash;',
              'qabul so‘rovingizni siz tanlagan klinikaga yetkazish;',
              'qabul eslatmalari, qabul holati va xizmat bilan bog‘liq bildirishnomalarni yuborish;',
              'Platforma xavfsizligini ta’minlash, ruxsatsiz kirish va suiiste’mollarning oldini olish;',
              'texnik nosozliklarni aniqlash va ilova barqarorligini oshirish;',
              'qonunchilikda belgilangan majburiyatlarni bajarish.',
            ],
          },
        ],
      },
      {
        id: 'legal-basis',
        title: 'Qayta ishlash asoslari',
        blocks: [
          {
            type: 'p',
            text: 'Shaxsga doir ma’lumotlar quyidagi asoslardan biri bo‘yicha qayta ishlanadi:',
          },
          {
            type: 'ul',
            items: [
              'sizning roziligingiz (ro‘yxatdan o‘tishda berilgan rozilik; joylashuv va push-bildirishnomalar uchun qurilmada alohida beriladigan ruxsatlar);',
              'Foydalanish shartlarini bajarish, jumladan qabul so‘rovingizni klinikaga yetkazish;',
              'qonunchilikda belgilangan majburiyatlarni bajarish.',
            ],
          },
          {
            type: 'note',
            text: 'Ro‘yxatdan o‘tishda belgilanadigan rozilik siz Foydalanish shartlari va ushbu Siyosat bilan tanishganingiz va ularni qabul qilganingizni qayd etadi. U ma’lumotlarni qayta ishlashning yagona asosi emas: xizmat ko‘rsatish uchun zarur qayta ishlash Foydalanish shartlarini bajarish asosida, qonuniy talablar esa qonunchilik asosida amalga oshiriladi.',
          },
        ],
      },
      {
        id: 'location',
        title: 'Joylashuv ma’lumotlari',
        blocks: [
          {
            type: 'p',
            text: 'Client App yaqin atrofdagi klinikalarni ko‘rsatish va klinikagacha yo‘nalishni hisoblash uchun qurilmangiz joylashuviga faqat siz operatsion tizim (OS) ruxsatnomasi orqali ruxsat berganingizdan keyin kiradi.',
          },
          {
            type: 'ul',
            items: [
              'Foydalanish shartlari va Maxfiylik siyosatiga rozilik bildirish joylashuvga ruxsat berish degani emas — ruxsat alohida so‘raladi.',
              'Ruxsatni rad etishingiz yoki istalgan vaqtda qurilma sozlamalarida bekor qilishingiz mumkin. Bunda klinikalarni qo‘lda qidirish imkoniyati saqlanib qoladi.',
              'Yo‘nalish hisoblanganda joriy koordinatalar serverimizga va marshrut hisoblash xizmatiga (Google Directions yoki OSRM) yuboriladi.',
              'Joylashuv koordinatalari akkauntingizda saqlanmaydi va joylashuv tarixi shakllantirilmaydi.',
            ],
          },
        ],
      },
      {
        id: 'notifications',
        title: 'Bildirishnomalar',
        blocks: [
          {
            type: 'ul',
            items: [
              'Push-bildirishnomalar faqat qurilmangizda ruxsat berganingizdan keyin yuboriladi. Bu ruxsat Foydalanish shartlari va Maxfiylik siyosatiga rozilikdan alohida.',
              'Shartlarga rozi bo‘lib, bildirishnomalarga ruxsatni rad etishingiz mumkin; ruxsatni qurilma sozlamalarida istalgan vaqtda o‘chirishingiz mumkin.',
              'Push-bildirishnomalar qabul eslatmalari, qabul holati o‘zgarishlari va xizmat bilan bog‘liq xabarlar uchun ishlatiladi.',
              'Marketing va reklama xabarlari faqat siz alohida rozilik berganingizdan keyin yuboriladi va istalgan vaqtda ulardan voz kechishingiz mumkin.',
            ],
          },
        ],
      },
      {
        id: 'health-data',
        title: 'Tibbiy ma’lumotlarni alohida himoya qilish',
        blocks: [
          {
            type: 'p',
            text: 'Tibbiy ma’lumotlar alohida toifadagi maxfiy ma’lumotlar hisoblanadi va ularga kirish qat’iy cheklangan:',
          },
          {
            type: 'ul',
            items: [
              'tibbiy ma’lumotlaringizni faqat sizga xizmat ko‘rsatayotgan klinikaning tegishli ruxsatga ega xodimlari ko‘radi;',
              'bir klinikaning tibbiy ma’lumotlari boshqa klinikaga ko‘rsatilmaydi;',
              `${brand} xodimlari tibbiy ma’lumotlarga faqat texnik yordam, xavfsizlik hodisasini tekshirish yoki qonuniy talab bo‘lgan hollarda, zarur hajmda kirishi mumkin;`,
              'tibbiy ma’lumotlar bilan bog‘liq muhim amallar audit jurnalida qayd etiladi.',
            ],
          },
          {
            type: 'note',
            text: `${brand} tibbiy ma’lumotlarni reklama, marketing yoki profillash maqsadida ishlatmaydi, sotmaydi va uchinchi shaxslarga bunday maqsadda bermaydi.`,
          },
        ],
      },
      {
        id: 'clinic-sharing',
        title: 'Klinikalarga uzatiladigan ma’lumotlar',
        blocks: [
          {
            type: 'p',
            text: 'Qabulga yozilganingizda ismingiz, familiyangiz, telefon raqamingiz va qabul tafsilotlari siz tanlagan klinikaga uzatiladi. Klinika bu ma’lumotlardan sizga xizmat ko‘rsatish uchun foydalanadi va o‘zi kiritgan yozuvlar uchun ma’lumotlar egasi hisoblanadi.',
          },
          {
            type: 'p',
            text: 'Siz murojaat qilmagan klinikalarga ma’lumotlaringiz uzatilmaydi.',
          },
        ],
      },
      {
        id: 'third-parties',
        title: 'Uchinchi tomonlarga uzatish',
        blocks: [
          {
            type: 'p',
            text: `${brand} shaxsga doir ma’lumotlarni sotmaydi. Ma’lumotlar faqat ilova ishlashi uchun zarur bo‘lgan hajmda quyidagi toifadagi xizmat ko‘rsatuvchilarga uzatilishi mumkin:`,
          },
          {
            type: 'ul',
            items: [
              'Google Maps — xaritada klinikalarni ko‘rsatish uchun;',
              'marshrut hisoblash xizmatlari (Google Directions yoki OSRM) — klinikagacha yo‘nalishni hisoblash uchun; bunda faqat boshlang‘ich nuqta va manzil koordinatalari yuboriladi;',
              'Firebase Cloud Messaging — push-bildirishnomalarni yetkazish uchun;',
              'email yuborish (SMTP) xizmatlari — tasdiqlash kodlari va xizmat xabarlarini yuborish uchun;',
              'S3-mos fayl saqlash xizmatlari — profil rasmlarini saqlash uchun;',
              'hosting va infratuzilma provayderlari — serverlar va ma’lumotlar bazasini joylashtirish uchun;',
              'monitoring va xatoliklarni kuzatish vositalari — ilova barqarorligini ta’minlash uchun.',
            ],
          },
          {
            type: 'p',
            text: 'Ma’lumotlar, shuningdek, qonunchilikda nazarda tutilgan hollarda vakolatli davlat organlarining qonuniy talabi asosida taqdim etilishi mumkin.',
          },
        ],
      },
      {
        id: 'security',
        title: 'Ma’lumotlar xavfsizligi',
        blocks: [
          {
            type: 'ul',
            items: [
              'parollar va sessiya tokenlari xeshlangan holda saqlanadi;',
              'mobil qurilmada sessiya ma’lumotlari xavfsiz tizim xotirasida (Keychain / Keystore) saqlanadi;',
              'qisqa muddatli kirish tokenlari va sessiyalarni bekor qilish imkoniyati qo‘llaniladi;',
              'klinikalar ma’lumotlari bir-biridan ajratilgan, kirish rollar va ruxsatlar asosida nazorat qilinadi;',
              'production muhitida ma’lumotlar shifrlangan ulanish (HTTPS/TLS) orqali uzatiladi.',
            ],
          },
          {
            type: 'p',
            text: 'Hech bir internet xizmati xavfsizlikni mutlaq darajada kafolatlay olmaydi. Xavfsizlik hodisasi aniqlansa, qonunchilikda belgilangan tartibda harakat qilamiz va zarur hollarda sizni xabardor qilamiz.',
          },
        ],
      },
      {
        id: 'retention',
        title: 'Ma’lumotlarni saqlash muddatlari',
        blocks: [
          {
            type: 'p',
            text: 'Ma’lumotlar ular yig‘ilgan maqsadga erishish uchun zarur bo‘lgan muddat davomida, shuningdek qonunchilikda belgilangan muddatlar davomida saqlanadi.',
          },
          {
            type: 'ul',
            items: [
              'Klinika kiritgan tibbiy yozuvlar qonunchilikda belgilangan muddatlar davomida saqlanishi lozim bo‘lishi mumkin.',
              'Rozilik yozuvlari va audit jurnali suiiste’mollarni aniqlash va qonuniy talablarni bajarish uchun zarur muddat davomida saqlanadi.',
              'Saqlash muddati tugagach, ma’lumotlar qonunchilik ruxsat bergan hollarda o‘chiriladi yoki anonimlashtiriladi.',
            ],
          },
        ],
      },
      {
        id: 'rights',
        title: 'Sizning huquqlaringiz',
        blocks: [
          {
            type: 'ul',
            items: [
              'o‘zingiz haqingizdagi qaysi ma’lumotlar qayta ishlanayotgani haqida ma’lumot olish;',
              'noto‘g‘ri yoki eskirgan ma’lumotlarni tuzatishni so‘rash;',
              'rozilikka asoslangan qayta ishlash uchun rozilikni qaytarib olish (bu avval amalga oshirilgan qayta ishlashning qonuniyligiga ta’sir qilmaydi);',
              'ma’lumotlaringizni o‘chirish yoki qayta ishlashni cheklashni so‘rash;',
              'huquqlaringiz buzilgan deb hisoblasangiz, vakolatli davlat organiga yoki sudga murojaat qilish.',
            ],
          },
          {
            type: 'p',
            text: 'Ushbu huquqlardan foydalanish, jumladan akkauntni yopish yoki ma’lumotlarni o‘chirishni so‘rash uchun “Aloqa ma’lumotlari” bo‘limida ko‘rsatilgan kanal orqali murojaat qiling. So‘rovni bajarishdan oldin murojaat qiluvchi akkaunt egasi ekanini tekshirishimiz mumkin.',
          },
          {
            type: 'p',
            text: 'Klinika kiritgan tibbiy yozuvlar bo‘yicha so‘rovlar birinchi navbatda tegishli klinikaga yuboriladi, chunki bu ma’lumotlarning egasi klinika hisoblanadi. Agar murojaat bizga kelib tushsa, uni imkon qadar tegishli klinikaga yo‘naltiramiz.',
          },
        ],
      },
      {
        id: 'minors',
        title: 'Voyaga yetmaganlar',
        blocks: [
          {
            type: 'p',
            text: 'Client App orqali voyaga yetmagan shaxs nomidan qabulga yozilish uning ota-onasi yoki qonuniy vakili tomonidan amalga oshirilishi kerak. Voyaga yetmagan bemorlarning ma’lumotlari ularning ota-onasi yoki qonuniy vakili roziligi bilan, qonunchilikda belgilangan tartibda qayta ishlanadi.',
          },
        ],
      },
      {
        id: 'changes',
        title: 'Siyosatni o‘zgartirish',
        blocks: [
          {
            type: 'p',
            text: 'Biz ushbu Siyosatni yangilashimiz mumkin. Har bir tahrir versiya raqami va kuchga kirish sanasi bilan e’lon qilinadi. Muhim o‘zgarishlar haqida ilova ichida yoki email orqali oldindan xabar beramiz, qonunchilik talab qilgan hollarda esa yangi rozilik so‘raymiz.',
          },
        ],
      },
      {
        id: 'contact',
        title: 'Aloqa ma’lumotlari',
        blocks: [
          {
            type: 'p',
            text: 'Shaxsga doir ma’lumotlar va ushbu Siyosat bo‘yicha savollar hamda so‘rovlar uchun:',
          },
          { type: 'ul', items: contactLinesUz(ctx, true) },
        ],
      },
    ],
  };
};
