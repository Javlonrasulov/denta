import type { LegalDocumentBuilder } from '../legal.types';
import { contactLinesUz, operatorLabelUz } from './shared.uz';

/**
 * Client App (patient) edition of the ORADENT Terms of Use. Derived from the
 * full Terms in clinic-web `lib/legal/content/terms.uz.ts` — keep wording of
 * shared clauses (medical disclaimer, bookings, prices, third parties,
 * disputes) consistent with it when either document changes.
 */
export const buildClientTermsUz: LegalDocumentBuilder = (ctx) => {
  const { brand, domain } = ctx;
  const operator = operatorLabelUz(ctx);

  return {
    kind: 'terms',
    title: 'Foydalanish shartlari',
    summary: `Ushbu hujjat ${brand} Client App mobil ilovasidan bemor va mijozlar sifatida foydalanish tartibini, sizning va ${brand}ning huquq va majburiyatlarini belgilaydi.`,
    sections: [
      {
        id: 'general',
        title: 'Umumiy qoidalar',
        blocks: [
          {
            type: 'p',
            text: `Ushbu Foydalanish shartlari (keyingi o‘rinlarda — “Shartlar”) ${operator} (keyingi o‘rinlarda — “${brand}”, “biz”) va ${brand} Client App ilovasidan foydalanuvchi shaxslar o‘rtasidagi munosabatlarni tartibga soladi.`,
          },
          {
            type: 'p',
            text: 'Ro‘yxatdan o‘tish formasida rozilik belgisini qo‘yish va ro‘yxatdan o‘tishni yakunlash orqali siz ushbu Shartlar hamda Maxfiylik siyosatini o‘qib chiqqaningizni, tushunganingizni va ularga to‘liq rozi ekaningizni tasdiqlaysiz.',
          },
          {
            type: 'p',
            text: `Ushbu tahrir ${brand} Foydalanish shartlarining Client App foydalanuvchilariga tegishli qoidalarini bayon qiladi. Klinikalar va ularning xodimlari uchun Clinic CRM va Doctor App’dan foydalanish tartibi Shartlarning to‘liq tahririda (${domain}/terms) belgilangan.`,
          },
          {
            type: 'p',
            text: 'Agar siz Shartlarning biror qoidasiga rozi bo‘lmasangiz, Client App’dan foydalanmang.',
          },
        ],
      },
      {
        id: 'definitions',
        title: 'Atamalar va ta’riflar',
        blocks: [
          {
            type: 'ul',
            items: [
              `Platforma — ${brand} veb-ilovasi (Clinic CRM), Doctor App, Client App mobil ilovalari, ular bilan bog‘liq API va xizmatlar majmui.`,
              `Client App — bemor va mijozlar uchun mo‘ljallangan ${brand} mobil ilovasi.`,
              'Klinika — Platformada ro‘yxatdan o‘tgan stomatologiya klinikasi (yuridik shaxs yoki yakka tartibdagi tadbirkor).',
              'Shifokor — klinikada faoliyat yurituvchi va Platformada ko‘rsatiladigan mutaxassis.',
              'Foydalanuvchi (bemor, mijoz) — Client App’da akkaunt yaratgan va klinika xizmatlaridan foydalanuvchi jismoniy shaxs.',
              'Qabul so‘rovi — Client App orqali klinikaga yuborilgan qabulga yozilish so‘rovi.',
              'Tibbiy ma’lumotlar — bemorning stomatologik holati, tish kartasi (odontogramma), davolash rejalari, shifokor izohlari, qabullar tarixi va shunga o‘xshash sog‘liq bilan bog‘liq ma’lumotlar.',
            ],
          },
        ],
      },
      {
        id: 'platform',
        title: `${brand} nima?`,
        blocks: [
          {
            type: 'p',
            text: `${brand} — stomatologiya klinikalari va ularning bemorlarini bog‘laydigan texnik platforma. Client App orqali siz quyidagilarni amalga oshirishingiz mumkin:`,
          },
          {
            type: 'ul',
            items: [
              'klinikalarni topish, jumladan xaritada yaqin atrofdagi klinikalarni ko‘rish;',
              'shifokorlarni topish va ular haqidagi ma’lumotlar bilan tanishish;',
              'qabulga yozilish;',
              'o‘z qabullaringizni ko‘rish va boshqarish;',
              'qabullar bo‘yicha bildirishnomalar olish;',
              'klinika va shifokorlarni sevimlilarga qo‘shish, ular haqidagi sharhlar va baholarni ko‘rish.',
            ],
          },
          {
            type: 'note',
            text: `${brand} tibbiy muassasa emas, tashxis qo‘ymaydi va tibbiy xizmat ko‘rsatmaydi. Platforma faqat klinika va bemorlar o‘rtasidagi aloqani tashkil etish uchun texnik vosita hisoblanadi.`,
          },
          {
            type: 'p',
            text: 'Client App funksiyalari vaqt o‘tishi bilan yangilanishi, kengaytirilishi yoki o‘zgartirilishi mumkin.',
          },
        ],
      },
      {
        id: 'account',
        title: 'Akkaunt va ro‘yxatdan o‘tish',
        blocks: [
          {
            type: 'p',
            text: 'Ro‘yxatdan o‘tish uchun ism, familiya, email manzili, telefon raqami va parol kiritiladi. Email manzilini keyinroq profil sahifasi orqali tasdiqlashingiz mumkin.',
          },
          {
            type: 'ul',
            items: [
              'Akkauntni faqat o‘z nomingizdan yarating; boshqa shaxs nomidan uning ruxsatisiz akkaunt yaratmang.',
              'Siz kiritgan ma’lumotlar to‘g‘ri, dolzarb va to‘liq bo‘lishi shart.',
              'Parolingiz va kirish ma’lumotlaringiz maxfiyligi uchun siz javobgarsiz; ularni boshqa shaxslarga bermang.',
              'Akkauntingizdan ruxsatsiz foydalanilganiga shubha qilsangiz, darhol parolni o‘zgartiring va bizga xabar bering.',
              'Bitta shaxs uchun bitta foydalanuvchi akkaunti yuritiladi.',
              'Akkaunt orqali amalga oshirilgan harakatlar, agar boshqacha isbotlanmasa, akkaunt egasi tomonidan bajarilgan deb hisoblanadi.',
            ],
          },
        ],
      },
      {
        id: 'booking',
        title: 'Qabulga yozilish',
        blocks: [
          {
            type: 'p',
            text: 'Client App orqali yuborilgan qabul so‘rovi avtomatik ravishda yakuniy tibbiy qabul kafolati hisoblanmaydi.',
          },
          {
            type: 'ul',
            items: [
              'Klinika qabul so‘rovini tasdiqlashi, uning vaqtini o‘zgartirishi yoki bekor qilishi mumkin.',
              'Yakuniy qabul vaqti klinika tomonidan tasdiqlanadi.',
              'Qabul holati o‘zgarganda bu haqda ilova ichida yoki bildirishnoma orqali xabar beriladi.',
              'Qabulga kela olmasangiz, uni imkon qadar oldindan bekor qiling.',
              'Qabulga yozilishda ismingiz, telefon raqamingiz va qabul tafsilotlari siz tanlagan klinikaga uzatiladi.',
            ],
          },
        ],
      },
      {
        id: 'prices',
        title: 'Narxlar va to‘lovlar',
        blocks: [
          {
            type: 'ul',
            items: [
              'Xizmatlarning narxi, davomiyligi va shartlari klinika tomonidan belgilanadi va o‘zgarishi mumkin.',
              'Ilovada ko‘rsatilgan narxlar ma’lumot uchun; yakuniy narx ko‘rik va davolash rejasiga qarab klinika tomonidan belgilanadi.',
              'Xizmatlar uchun to‘lov klinika bilan uning qoidalariga muvofiq amalga oshiriladi.',
              'Platforma ichida onlayn to‘lov tizimlari kelajakda qo‘shilishi mumkin; ular qo‘shilganda, tegishli shartlar alohida e’lon qilinadi.',
            ],
          },
          {
            type: 'note',
            text: `${brand} klinika belgilagan narxlar va ko‘rsatilgan tibbiy xizmat sifati uchun javobgar emas.`,
          },
        ],
      },
      {
        id: 'medical-disclaimer',
        title: 'Tibbiy xizmat',
        blocks: [
          {
            type: 'note',
            text: `${brand} klinika emas, tibbiy xizmat ko‘rsatmaydi, tashxis qo‘ymaydi va davolash bo‘yicha qaror qabul qilmaydi. Platforma shifokor maslahati yoki tibbiy ko‘rikning o‘rnini bosmaydi.`,
          },
          {
            type: 'ul',
            items: [
              'Tashxis, davolash usuli va tibbiy qarorlar uchun faqat klinika va shifokor javobgar.',
              'Klinika yoki shifokorning ilovada ko‘rsatilishi, reytingi yoki sharhlari davolash natijasi yoki xizmat sifati kafolati hisoblanmaydi.',
              'Shoshilinch tibbiy holatlarda ilovaga emas, tez tibbiy yordam xizmatiga murojaat qiling.',
            ],
          },
        ],
      },
      {
        id: 'medical-data',
        title: 'Klinika kiritgan ma’lumotlar',
        blocks: [
          {
            type: 'p',
            text: `Klinika Platformaga kiritadigan tibbiy yozuvlar, davolash rejalari va qabullar tarixiga nisbatan tegishli klinika ma’lumotlar egasi hisoblanadi. ${brand} bu ma’lumotlarni faqat Platforma xizmatini ko‘rsatish uchun qayta ishlaydi.`,
          },
          {
            type: 'ul',
            items: [
              'Tibbiy yozuvlarning to‘g‘riligi va to‘liqligi uchun klinika va tegishli shifokor javobgar.',
              'Bunday ma’lumotlarni ko‘rish, tuzatish yoki o‘chirish bo‘yicha murojaatlar birinchi navbatda tegishli klinikaga yuboriladi.',
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
            text: 'Voyaga yetmagan shaxs nomidan qabulga yozilish uning ota-onasi yoki qonuniy vakili tomonidan amalga oshirilishi kerak. Bunday holatda ota-ona yoki qonuniy vakil kiritilgan ma’lumotlarning to‘g‘riligi uchun javobgar.',
          },
        ],
      },
      {
        id: 'device-permissions',
        title: 'Qurilma ruxsatlari',
        blocks: [
          {
            type: 'p',
            text: 'Joylashuv va push-bildirishnomalar uchun ruxsatlar ushbu Shartlarga rozilikdan alohida, qurilmangizning operatsion tizimi orqali so‘raladi.',
          },
          {
            type: 'ul',
            items: [
              'Shartlar va Maxfiylik siyosatiga rozilik bildirish joylashuv yoki bildirishnomalarga ruxsat berish degani emas.',
              'Ruxsatlarni rad etishingiz yoki keyinroq qurilma sozlamalarida bekor qilishingiz mumkin.',
              'Ruxsat berilmagan taqdirda ilovaning ayrim funksiyalari (masalan, yaqin atrofdagi klinikalarni avtomatik ko‘rsatish yoki qabul eslatmalari) cheklanishi mumkin.',
            ],
          },
        ],
      },
      {
        id: 'prohibited',
        title: 'Taqiqlangan foydalanish',
        blocks: [
          {
            type: 'p',
            text: 'Client App’dan foydalanishda quyidagilar taqiqlanadi:',
          },
          {
            type: 'ul',
            items: [
              'boshqa shaxs akkauntidan uning ruxsatisiz foydalanish yoki kirish ma’lumotlarini boshqalarga berish;',
              'soxta yoki boshqa shaxsga tegishli ma’lumotlarni kiritish;',
              'qabulga yozilish imkoniyatini suiiste’mol qilish, jumladan ataylab soxta qabul so‘rovlari yuborish;',
              'soxta sharhlar yoki reytinglar yaratish;',
              'xavfsizlik choralarini chetlab o‘tish, zararli dastur, spam yoki avtomatlashtirilgan ommaviy so‘rovlar yuborish;',
              'Platformadan qonunchilikka zid har qanday maqsadda foydalanish.',
            ],
          },
        ],
      },
      {
        id: 'third-party',
        title: 'Uchinchi tomon xizmatlari',
        blocks: [
          {
            type: 'p',
            text: 'Client App ishlashi uchun uchinchi tomon xizmatlaridan foydalanadi yoki foydalanishi mumkin, jumladan: xarita va marshrut xizmatlari (Google Maps, OSRM), push-bildirishnomalar xizmati (Firebase), email yuborish (SMTP) xizmatlari, fayllarni saqlash xizmatlari (S3-mos saqlash), hosting va monitoring xizmatlari.',
          },
          {
            type: 'ul',
            items: [
              'Uchinchi tomon xizmatlari o‘z shartlari va maxfiylik siyosatlari asosida ishlaydi.',
              `${brand} uchinchi tomon xizmatlarining uzilishi yoki ular tomonidan yuzaga kelgan nosozliklar uchun, o‘zining aybi bo‘lmagan hollarda, javobgar emas.`,
              'Uchinchi tomonlarga ma’lumotlar faqat Maxfiylik siyosatida ko‘rsatilgan maqsad va hajmda uzatiladi.',
            ],
          },
        ],
      },
      {
        id: 'intellectual-property',
        title: 'Intellektual mulk',
        blocks: [
          {
            type: 'p',
            text: `Client App, uning dasturiy kodi, dizayni, interfeysi, logotiplari, “${brand}” nomi va boshqa materiallari ${brand}ga yoki uning litsenziarlariga tegishli va qonun bilan himoyalangan. Sizga ilovadan ushbu Shartlarga muvofiq shaxsiy foydalanish uchun cheklangan, mutlaq bo‘lmagan huquq beriladi.`,
          },
        ],
      },
      {
        id: 'availability',
        title: 'Xizmatdagi uzilishlar',
        blocks: [
          {
            type: 'p',
            text: `${brand} Platformaning barqaror ishlashi uchun oqilona choralar ko‘radi, biroq uzluksiz yoki xatosiz ishlashni kafolatlamaydi. Texnik ishlar, tarmoq muammolari yoki uchinchi tomon xizmatlaridagi uzilishlar tufayli ilova vaqtincha ishlamasligi mumkin.`,
          },
        ],
      },
      {
        id: 'termination',
        title: 'Akkauntni yopish va bloklash',
        blocks: [
          {
            type: 'ul',
            items: [
              'Siz istalgan vaqtda Client App’dan foydalanishni to‘xtatishingiz va akkauntni yopish uchun bizga murojaat qilishingiz mumkin.',
              `${brand} Shartlar jiddiy yoki takroran buzilganda akkauntni ogohlantirish bilan yoki, xavfsizlik tahdidi bo‘lsa, darhol bloklashi mumkin.`,
              'Akkaunt yopilgach, ma’lumotlar Maxfiylik siyosatidagi saqlash qoidalariga muvofiq saqlanadi, o‘chiriladi yoki anonimlashtiriladi.',
            ],
          },
        ],
      },
      {
        id: 'liability',
        title: 'Javobgarlik chegaralari',
        blocks: [
          {
            type: 'p',
            text: 'Qonunchilikda ruxsat etilgan darajada:',
          },
          {
            type: 'ul',
            items: [
              'Client App “mavjud holicha” taqdim etiladi.',
              `${brand} klinika yoki shifokorning tibbiy qarorlari, xatolari, xizmat sifati yoki narxlari uchun javobgar emas.`,
              `${brand} foydalanuvchi tomonidan noto‘g‘ri kiritilgan ma’lumotlar yoki kirish ma’lumotlarining foydalanuvchi aybi bilan oshkor bo‘lishi oqibatlari uchun javobgar emas.`,
            ],
          },
          {
            type: 'p',
            text: 'Ushbu bo‘lim qoidalari qonunchilikka, jumladan iste’molchilar huquqlarini himoya qilish to‘g‘risidagi qonunchilikka ko‘ra cheklanishi mumkin bo‘lmagan javobgarlikni cheklamaydi.',
          },
        ],
      },
      {
        id: 'disputes',
        title: 'Nizolarni hal qilish',
        blocks: [
          {
            type: 'p',
            text: 'Ushbu Shartlar O‘zbekiston Respublikasi qonunchiligi asosida tartibga solinadi va talqin qilinadi.',
          },
          {
            type: 'p',
            text: 'Nizolar avvalo muzokaralar yo‘li bilan hal qilinadi. Kelishuvga erishilmasa, nizo O‘zbekiston Respublikasi qonunchiligiga muvofiq vakolatli sudda ko‘rib chiqiladi.',
          },
        ],
      },
      {
        id: 'changes',
        title: 'Shartlarni o‘zgartirish',
        blocks: [
          {
            type: 'p',
            text: `${brand} ushbu Shartlarni o‘zgartirishi mumkin. Har bir tahrir versiya raqami va kuchga kirish sanasi bilan e’lon qilinadi.`,
          },
          {
            type: 'ul',
            items: [
              'Muhim o‘zgarishlar haqida ilova ichida yoki email orqali oldindan xabar beriladi.',
              'Ayrim hollarda yangi tahrirga alohida rozilik so‘ralishi mumkin.',
              'Yangi tahrirga rozi bo‘lmasangiz, ilovadan foydalanishni to‘xtatishingiz va akkauntni yopish uchun murojaat qilishingiz mumkin.',
            ],
          },
        ],
      },
      {
        id: 'contact',
        title: 'Aloqa ma’lumotlari',
        blocks: [
          {
            type: 'p',
            text: 'Ushbu Shartlar bo‘yicha savollar va murojaatlar uchun:',
          },
          { type: 'ul', items: contactLinesUz(ctx) },
        ],
      },
    ],
  };
};
