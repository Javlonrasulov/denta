import type { LegalDocumentBuilder } from '../types';
import { contactLinesUz, operatorLabelUz } from './shared.uz';

export const buildPrivacyUz: LegalDocumentBuilder = (ctx) => {
  const { brand } = ctx;
  const operator = operatorLabelUz(ctx);

  return {
    kind: 'privacy',
    title: 'Maxfiylik siyosati',
    summary: `Ushbu siyosat ${brand} platformasida qanday ma’lumotlar yig‘ilishi, ular qanday maqsadda ishlatilishi, kimga uzatilishi, qanday himoya qilinishi va sizning bu boradagi huquqlaringizni tushuntiradi.`,
    sections: [
      {
        id: 'general',
        title: 'Umumiy qoidalar',
        blocks: [
          {
            type: 'p',
            text: `Ushbu Maxfiylik siyosati (keyingi o‘rinlarda — “Siyosat”) ${operator} (keyingi o‘rinlarda — “${brand}”, “biz”) tomonidan Clinic CRM veb-ilovasi, Doctor App, Client App va ular bilan bog‘liq xizmatlar (birgalikda — “Platforma”) orqali qayta ishlanadigan shaxsga doir ma’lumotlarga nisbatan qo‘llaniladi.`,
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
              `Foydalanuvchi akkauntlari (Owner, xodimlar, bemorlar) va Platformaning texnik ma’lumotlariga nisbatan ${brand} ma’lumotlar egasi va operatori hisoblanadi.`,
              `Klinika Platformaga kiritadigan bemorlar ma’lumotlari va tibbiy yozuvlarga nisbatan klinika ma’lumotlar egasi hisoblanadi; ${brand} bu ma’lumotlarni faqat klinika topshirig‘iga ko‘ra, Platforma xizmatini ko‘rsatish uchun qayta ishlaydi.`,
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
              'interfeys tili, email tasdiqlangan sana, rozilik berilgan hujjat versiyalari va sanasi.',
            ],
          },
          { type: 'p', text: 'Klinika ma’lumotlari:' },
          {
            type: 'ul',
            items: [
              'klinika nomi, manzili, telefon va email, ish vaqti, xizmatlar va narxlar;',
              'logotip, klinika rasmlari, marketplace’da ko‘rsatiladigan tavsif;',
              'xodimlar ro‘yxati, ularning rollari, ruxsatlari va a’zolik tarixi.',
            ],
          },
          { type: 'p', text: 'Bemorlar ma’lumotlari:' },
          {
            type: 'ul',
            items: [
              'ism, familiya, telefon raqami, jins, tug‘ilgan sana va klinika kiritgan boshqa aloqa ma’lumotlari;',
              'qabullar, ularning holati va tarixi.',
            ],
          },
          { type: 'p', text: 'Tibbiy (sog‘liq) va stomatologik ma’lumotlar:' },
          {
            type: 'ul',
            items: [
              'stomatologik yozuvlar va tish kartasi (odontogramma);',
              'davolash rejalari va ularning bandlari;',
              'shifokor izohlari;',
              'qabullar va ko‘rsatilgan xizmatlar tarixi.',
            ],
          },
          { type: 'p', text: 'Moliyaviy ma’lumotlar:' },
          {
            type: 'ul',
            items: [
              'xizmatlar uchun hisoblangan summalar, to‘lovlar, qarzdorlik, xarajatlar va ombor hisobi;',
              'klinikaning obuna holati va obuna tarixi.',
            ],
          },
          { type: 'p', text: 'Texnik ma’lumotlar:' },
          {
            type: 'ul',
            items: [
              'IP manzil, brauzer yoki qurilma turi (user agent), qurilma nomi va platformasi;',
              'sessiya va yangilash (refresh) tokenlari — tokenlar serverda xesh ko‘rinishida saqlanadi;',
              'audit jurnali: kim, qachon va qaysi klinikada qanday muhim amalni bajargani;',
              'push-bildirishnomalar uchun qurilma tokenlari.',
            ],
          },
          { type: 'p', text: 'Joylashuv ma’lumotlari:' },
          {
            type: 'ul',
            items: [
              'Client App yaqin atrofdagi klinikalarni ko‘rsatish uchun qurilma joylashuvidan faqat siz qurilma sozlamalarida ruxsat berganingizdan keyin foydalanadi. Ruxsatni istalgan vaqtda qurilma sozlamalarida bekor qilishingiz mumkin.',
            ],
          },
          { type: 'p', text: 'Media fayllar:' },
          {
            type: 'ul',
            items: [
              'profil rasmlari, klinika logotipi va rasmlari hamda Platformaga yuklangan boshqa fayllar.',
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
              'akkaunt yaratish, kirishni tasdiqlash va foydalanuvchini autentifikatsiya qilish;',
              'Platforma funksiyalarini taqdim etish: qabullar, jadval, bemorlar kartasi, stomatologik yozuvlar, moliya va ombor;',
              'marketplace orqali klinikalarni ko‘rsatish va onlayn qabulga yozilishni ta’minlash;',
              'qabul, xavfsizlik va xizmat bilan bog‘liq bildirishnomalarni yuborish;',
              'sinov davri va obunani boshqarish, hisob-kitob va qarzdorlik bo‘yicha xabarnomalar;',
              'Platforma xavfsizligini ta’minlash, ruxsatsiz kirish va suiiste’mollarning oldini olish;',
              'texnik nosozliklarni aniqlash va Platforma barqarorligini oshirish;',
              'qonunchilikda belgilangan majburiyatlarni bajarish va vakolatli organlarning qonuniy so‘rovlariga javob berish.',
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
              'ma’lumotlar subyektining roziligi (masalan, ro‘yxatdan o‘tishda berilgan rozilik, joylashuvga ruxsat, marketing xabarlariga rozilik);',
              'Foydalanish shartlari yoki klinika bilan tuzilgan shartnomani bajarish;',
              'qonunchilikda belgilangan majburiyatlarni bajarish.',
            ],
          },
          {
            type: 'p',
            text: 'Bemorlardan ularning ma’lumotlari va tibbiy ma’lumotlarini qayta ishlash uchun zarur roziliklarni olish klinika zimmasida.',
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
              'tibbiy ma’lumotlarni faqat shu bemorga xizmat ko‘rsatayotgan klinikaning tegishli ruxsatga ega xodimlari ko‘radi;',
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
        id: 'access-control',
        title: 'Kirish huquqi va klinikalar ajratilishi',
        blocks: [
          {
            type: 'p',
            text: 'Platformadagi har bir so‘rov quyidagi tekshiruvlardan o‘tadi:',
          },
          {
            type: 'ul',
            items: [
              'foydalanuvchi autentifikatsiyadan o‘tganmi;',
              'qaysi klinika ish maydoni (workspace) faol;',
              'foydalanuvchining shu klinikada faol a’zoligi bormi;',
              'foydalanuvchining roli va ruxsatlari so‘ralgan amalga imkon beradimi.',
            ],
          },
          {
            type: 'p',
            text: 'Bir nechta klinikada ishlaydigan shifokor bitta foydalanuvchi akkauntiga ega bo‘ladi, lekin har bir klinikadagi ma’lumotlar alohida saqlanadi va faqat faol ish maydonida ko‘rinadi. Klinika xodimning a’zoligini faolsizlantirgach, xodim shu klinika ma’lumotlariga kira olmaydi.',
          },
        ],
      },
      {
        id: 'third-parties',
        title: 'Uchinchi tomonlarga uzatish',
        blocks: [
          {
            type: 'p',
            text: `${brand} shaxsga doir ma’lumotlarni sotmaydi. Ma’lumotlar faqat Platforma ishlashi uchun zarur bo‘lgan hajmda quyidagi toifadagi xizmat ko‘rsatuvchilarga uzatilishi mumkin:`,
          },
          {
            type: 'ul',
            items: [
              'email yuborish (SMTP) xizmatlari — tasdiqlash kodlari, taklifnomalar va xizmat xabarlarini yuborish uchun;',
              'Firebase Cloud Messaging — push-bildirishnomalarni yetkazish uchun;',
              'Google Maps — xaritada klinikalarni ko‘rsatish va manzillarni aniqlash uchun;',
              'S3-mos fayl saqlash xizmatlari — rasmlar va fayllarni saqlash uchun;',
              'hosting va infratuzilma provayderlari — Platforma serverlari va ma’lumotlar bazasini joylashtirish uchun;',
              'monitoring va xatoliklarni kuzatish vositalari — Platforma barqarorligini ta’minlash uchun.',
            ],
          },
          {
            type: 'p',
            text: 'Kelajakda Platformaga onlayn to‘lov provayderlari qo‘shilishi mumkin. Bunday holatda ularga uzatiladigan ma’lumotlar ushbu Siyosatning yangilangan tahririda ko‘rsatiladi.',
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
            type: 'p',
            text: 'Biz ma’lumotlarni ruxsatsiz kirish, o‘zgartirish, oshkor qilish yoki yo‘q qilishdan himoya qilish uchun tashkiliy va texnik choralarni qo‘llaymiz, jumladan:',
          },
          {
            type: 'ul',
            items: [
              'parollar va sessiya tokenlarini xeshlangan holda saqlash;',
              'qisqa muddatli kirish tokenlari va sessiyalarni bekor qilish imkoniyati;',
              'rollar va ruxsatlarga asoslangan kirish nazorati hamda klinikalar ma’lumotlarini ajratish;',
              'muhim amallarni audit jurnalida qayd etish;',
              'production muhitida ma’lumotlarni shifrlangan ulanish (HTTPS/TLS) orqali uzatish;',
              'ma’lumotlar bazasining zaxira nusxalarini yuritish.',
            ],
          },
          {
            type: 'p',
            text: 'Hech bir internet xizmati xavfsizlikni mutlaq darajada kafolatlay olmaydi. Biz xavflarni kamaytirish uchun oqilona choralarni ko‘ramiz va xavfsizlik hodisasi aniqlansa, qonunchilikda belgilangan tartibda harakat qilamiz hamda zarur hollarda ta’sirlangan foydalanuvchilarni xabardor qilamiz.',
          },
          {
            type: 'p',
            text: 'Ma’lumotlarni saqlash joyi va usuli amaldagi qonunchilik talablarini hisobga olgan holda belgilanadi.',
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
              'Obuna yoki sinov davrining tugashi ma’lumotlarning o‘chirilishini anglatmaydi; klinika obunani qayta faollashtirib, o‘z ma’lumotlari bilan ishlashni davom ettirishi mumkin.',
              'Tibbiy hujjatlar, buxgalteriya va moliyaviy yozuvlar qonunchilikda belgilangan muddatlar davomida saqlanishi lozim bo‘lishi mumkin.',
              'Audit jurnali va xavfsizlik bilan bog‘liq yozuvlar suiiste’mollarni aniqlash va qonuniy talablarni bajarish uchun zarur muddat davomida saqlanadi.',
              'Zaxira nusxalar belgilangan aylanma (rotatsiya) jadvali asosida yangilanadi; o‘chirilgan ma’lumotlar zaxira nusxalardan ular navbatdagi yangilanishda almashtirilgunga qadar to‘liq yo‘qolmasligi mumkin.',
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
            type: 'p',
            text: 'Qonunchilikka muvofiq siz quyidagi huquqlarga egasiz:',
          },
          {
            type: 'ul',
            items: [
              'o‘zingiz haqingizdagi qaysi ma’lumotlar qayta ishlanayotgani haqida ma’lumot olish;',
              'noto‘g‘ri yoki eskirgan ma’lumotlarni tuzatishni talab qilish;',
              'rozilikka asoslangan qayta ishlash uchun rozilikni qaytarib olish (bu avval amalga oshirilgan qayta ishlashning qonuniyligiga ta’sir qilmaydi);',
              'ma’lumotlaringizni o‘chirish yoki qayta ishlashni cheklashni so‘rash;',
              'huquqlaringiz buzilgan deb hisoblasangiz, vakolatli davlat organiga yoki sudga murojaat qilish.',
            ],
          },
          {
            type: 'p',
            text: 'O‘chirish so‘rovi qonunchilikda saqlash majburiyati belgilangan ma’lumotlarga (masalan, tibbiy yoki buxgalteriya yozuvlariga) nisbatan darhol bajarilmasligi mumkin. Bunday hollarda ma’lumotlar faqat qonuniy maqsadlar uchun cheklangan tartibda saqlanadi va muddat tugagach o‘chiriladi yoki anonimlashtiriladi.',
          },
          {
            type: 'p',
            text: 'So‘rovni ko‘rib chiqishdan oldin shaxsingizni tasdiqlash so‘ralishi mumkin. So‘rovlar qonunchilikda belgilangan muddatlarda ko‘rib chiqiladi.',
          },
        ],
      },
      {
        id: 'patient-requests',
        title: 'Bemorlarning klinika ma’lumotlari bo‘yicha murojaatlari',
        blocks: [
          {
            type: 'p',
            text: `Klinika tomonidan kiritilgan bemor ma’lumotlari va tibbiy yozuvlar bo‘yicha murojaatlar (ko‘rish, tuzatish, o‘chirish) birinchi navbatda tegishli klinikaga yuborilishi kerak, chunki bu ma’lumotlarning egasi klinika hisoblanadi. ${brand} bunday murojaatlarni bajarishda klinikaga texnik yordam ko‘rsatadi.`,
          },
          {
            type: 'p',
            text: `Agar murojaat ${brand}ga kelib tushsa, biz uni imkon qadar tegishli klinikaga yo‘naltiramiz.`,
          },
        ],
      },
      {
        id: 'cookies',
        title: 'Cookie, sessiya va brauzer xotirasi',
        blocks: [
          {
            type: 'p',
            text: 'Clinic CRM veb-ilovasi ishlashi uchun zarur bo‘lgan quyidagi texnik vositalardan foydalanadi:',
          },
          {
            type: 'ul',
            items: [
              'sessiya cookie’si — tizimga kirganingizni aniqlash va himoyalangan sahifalarga kirishni boshqarish uchun;',
              'brauzerning localStorage xotirasi — sessiya ma’lumotlari, tanlangan ish maydoni va interfeys tilini saqlash uchun;',
              'mobil ilovalarda — sessiya ma’lumotlarini qurilma xotirasida saqlash.',
            ],
          },
          {
            type: 'p',
            text: 'Hozirgi vaqtda Platforma reklama yoki marketing maqsadidagi kuzatuv cookie’laridan foydalanmaydi. Bunday vositalar qo‘shilsa, bu Siyosatda ko‘rsatiladi va qonunchilik talab qilgan hollarda alohida rozilik so‘raladi.',
          },
          {
            type: 'p',
            text: 'Brauzer sozlamalarida cookie va sayt ma’lumotlarini o‘chirishingiz mumkin, biroq bu holda tizimdan chiqib ketasiz va ayrim funksiyalar ishlamasligi mumkin.',
          },
        ],
      },
      {
        id: 'notifications',
        title: 'Bildirishnomalar va xabarlar',
        blocks: [
          {
            type: 'ul',
            items: [
              'Xizmat xabarlari — email tasdiqlash kodlari, parolni tiklash, xodim taklifnomalari, qabul eslatmalari, obuna va to‘lov bo‘yicha xabarnomalar — Platformadan foydalanish uchun zarur va ular alohida rozilikni talab qilmaydi.',
              'Push-bildirishnomalar faqat qurilmangizda ruxsat berganingizdan keyin yuboriladi; ruxsatni qurilma sozlamalarida o‘chirishingiz mumkin.',
              'Marketing va reklama xabarlari faqat siz alohida rozilik berganingizdan keyin yuboriladi va istalgan vaqtda ulardan voz kechishingiz mumkin.',
            ],
          },
        ],
      },
      {
        id: 'minors',
        title: 'Voyaga yetmaganlar',
        blocks: [
          {
            type: 'p',
            text: 'Clinic CRM va Doctor App faqat klinika xodimlari uchun mo‘ljallangan.',
          },
          {
            type: 'p',
            text: 'Voyaga yetmagan bemorlarning ma’lumotlari klinika tomonidan ularning ota-onasi yoki qonuniy vakili roziligi bilan, qonunchilikda belgilangan tartibda kiritiladi va qayta ishlanadi. Client App orqali voyaga yetmagan shaxs nomidan qabulga yozilish uning ota-onasi yoki qonuniy vakili tomonidan amalga oshirilishi kerak.',
          },
        ],
      },
      {
        id: 'changes',
        title: 'Siyosatni o‘zgartirish',
        blocks: [
          {
            type: 'p',
            text: 'Biz ushbu Siyosatni yangilashimiz mumkin. Har bir tahrir versiya raqami va kuchga kirish sanasi bilan e’lon qilinadi. Muhim o‘zgarishlar haqida email yoki Platforma bildirishnomasi orqali oldindan xabar beramiz, qonunchilik talab qilgan hollarda esa yangi rozilik so‘raymiz.',
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
