import type { LegalDocumentBuilder } from '../types';
import { contactLinesUz, operatorLabelUz } from './shared.uz';

export const buildTermsUz: LegalDocumentBuilder = (ctx) => {
  const { brand, billing } = ctx;
  const operator = operatorLabelUz(ctx);

  return {
    kind: 'terms',
    title: 'Foydalanish shartlari',
    summary: `Ushbu hujjat ${brand} stomatologiya klinikalari uchun CRM va marketplace platformasidan foydalanish tartibini, klinika, uning xodimlari va ${brand} o‘rtasidagi huquq va majburiyatlarni belgilaydi.`,
    sections: [
      {
        id: 'general',
        title: 'Umumiy qoidalar',
        blocks: [
          {
            type: 'p',
            text: `Ushbu Foydalanish shartlari (keyingi o‘rinlarda — “Shartlar”) ${operator} (keyingi o‘rinlarda — “${brand}”, “biz”) va Platformadan foydalanuvchi shaxslar o‘rtasidagi munosabatlarni tartibga soladi.`,
          },
          {
            type: 'p',
            text: 'Ro‘yxatdan o‘tish formasida rozilik belgisini qo‘yish va ro‘yxatdan o‘tishni yakunlash orqali siz ushbu Shartlar hamda Maxfiylik siyosatini o‘qib chiqqaningizni, tushunganingizni va ularga to‘liq rozi ekaningizni tasdiqlaysiz.',
          },
          {
            type: 'p',
            text: 'Agar siz Platformadan yuridik shaxs yoki yakka tartibdagi tadbirkor (klinika) nomidan foydalansangiz, siz ushbu Shartlarni shu shaxs nomidan qabul qilish vakolatiga ega ekaningizni tasdiqlaysiz.',
          },
          {
            type: 'p',
            text: 'Agar siz Shartlarning biror qoidasiga rozi bo‘lmasangiz, Platformadan foydalanmang.',
          },
          {
            type: 'p',
            text: 'Klinika bilan alohida yozma shartnoma yoki tijorat taklifi tuzilgan bo‘lsa va uning qoidalari ushbu Shartlardan farq qilsa, o‘sha shartnoma yoki tijorat taklifi qoidalari ustun hisoblanadi.',
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
              'Klinika — Platformada ro‘yxatdan o‘tgan stomatologiya klinikasi (yuridik shaxs yoki yakka tartibdagi tadbirkor).',
              'Owner (klinika egasi) — klinikani Platformada ro‘yxatdan o‘tkazgan yoki klinika nomidan asosiy boshqaruv huquqiga ega bo‘lgan foydalanuvchi.',
              'Xodim — klinika tomonidan Platformaga taklif qilingan va klinikada rol berilgan foydalanuvchi (Admin, Receptionist, Doctor, Accountant va boshqalar).',
              'Foydalanuvchi akkaunti — email va/yoki telefon raqami bilan bog‘langan, Platformadagi yagona (global) shaxsiy akkaunt.',
              'A’zolik (membership) — foydalanuvchi akkauntining muayyan klinikaga bog‘lanishi, unda belgilangan rol va ruxsatlar.',
              'Ish maydoni (workspace) — foydalanuvchi ayni paytda ishlayotgan klinika konteksti.',
              'Bemor (mijoz) — klinika xizmatlaridan foydalanuvchi yoki Client App orqali qabulga yoziladigan jismoniy shaxs.',
              'Tibbiy ma’lumotlar — bemorning stomatologik holati, tish kartasi (odontogramma), davolash rejalari, shifokor izohlari, qabullar tarixi va shunga o‘xshash sog‘liq bilan bog‘liq ma’lumotlar.',
              'Marketplace — Client App’dagi klinikalar va shifokorlar katalogi hamda onlayn qabulga yozilish funksiyasi.',
              'Sinov davri — email tasdiqlangandan keyin boshlanadigan bepul foydalanish muddati.',
              'Obuna — Platformaning pullik funksiyalaridan belgilangan muddat davomida foydalanish huquqi.',
            ],
          },
        ],
      },
      {
        id: 'platform',
        title: `${brand} platformasi haqida`,
        blocks: [
          {
            type: 'p',
            text: `${brand} — stomatologiya klinikalari uchun dasturiy ta’minot (SaaS) platformasi. Platforma klinikaga bemorlar bazasini yuritish, qabullarni rejalashtirish, shifokorlar jadvalini boshqarish, stomatologik yozuvlar va davolash rejalarini saqlash, moliya va ombor hisobini yuritish hamda marketplace orqali onlayn qabul qabul qilish imkonini beradi.`,
          },
          {
            type: 'note',
            text: `${brand} tibbiy muassasa emas va tibbiy xizmat ko‘rsatmaydi. Platforma faqat klinika va shifokorlarning ish jarayonini tashkil etish uchun texnik vosita hisoblanadi.`,
          },
          {
            type: 'p',
            text: 'Platforma funksiyalari vaqt o‘tishi bilan yangilanishi, kengaytirilishi yoki o‘zgartirilishi mumkin. Muayyan funksiyaning mavjudligi obuna turiga va klinika sozlamalariga bog‘liq bo‘lishi mumkin.',
          },
        ],
      },
      {
        id: 'account',
        title: 'Akkaunt va ro‘yxatdan o‘tish',
        blocks: [
          {
            type: 'p',
            text: 'Klinikani ro‘yxatdan o‘tkazish uchun klinika nomi, Owner’ning ismi va familiyasi, telefon raqami, email manzili va parol kiritiladi. Ro‘yxatdan o‘tish email manzilini tasdiqlash kodi orqali yakunlanadi.',
          },
          {
            type: 'ul',
            items: [
              'Siz kiritgan ma’lumotlar to‘g‘ri, dolzarb va to‘liq bo‘lishi shart.',
              'Parolingiz va kirish ma’lumotlaringiz maxfiyligi uchun siz javobgarsiz; ularni boshqa shaxslarga bermang.',
              'Akkauntingizdan ruxsatsiz foydalanilganiga shubha qilsangiz, darhol parolni o‘zgartiring va bizga xabar bering.',
              'Bitta shaxs uchun bitta foydalanuvchi akkaunti yuritiladi; bir nechta klinikada ishlash a’zoliklar orqali amalga oshiriladi.',
              'Akkaunt orqali amalga oshirilgan harakatlar, agar boshqacha isbotlanmasa, akkaunt egasi tomonidan bajarilgan deb hisoblanadi.',
            ],
          },
        ],
      },
      {
        id: 'owner-staff',
        title: 'Klinika Owner’i va xodimlar',
        blocks: [
          {
            type: 'p',
            text: 'Owner klinika akkauntini boshqaradi, xodimlarni taklif qiladi, ularga rol va ruxsatlar beradi hamda klinika nomidan Platformadan foydalanish uchun javobgar hisoblanadi.',
          },
          {
            type: 'ul',
            items: [
              'Owner va klinika xodimlarga faqat ularning ish vazifalari uchun zarur bo‘lgan ruxsatlarni berishi kerak.',
              'Klinika o‘z xodimlarining Platformadagi harakatlari uchun javobgardir.',
              'Xodim klinikadan ketganda yoki uning vazifalari o‘zgarganda, Owner (yoki vakolatli Admin) uning a’zoligini darhol faolsizlantirishi yoki ruxsatlarini qayta ko‘rib chiqishi shart.',
              'Xodimlarni taklif qilishda ularning email/telefon ma’lumotlari to‘g‘ri kiritilishi va xodimning bunga roziligi olinishi klinika zimmasida.',
              'Klinika o‘z xodimlariga shaxsga doir va tibbiy ma’lumotlarning maxfiyligi bo‘yicha zarur ko‘rsatmalar berishi kerak.',
            ],
          },
        ],
      },
      {
        id: 'roles',
        title: 'Rollar va ruxsatlar',
        blocks: [
          {
            type: 'p',
            text: 'Platformada har bir xodimga klinika doirasida rol beriladi. Rol xodim ko‘ra oladigan va bajara oladigan amallarni belgilaydi:',
          },
          {
            type: 'ul',
            items: [
              'Owner — klinikaning to‘liq boshqaruvi, jumladan xodimlar, sozlamalar va obuna.',
              'Admin — Owner tomonidan berilgan vakolat doirasida klinikani boshqarish.',
              'Receptionist — qabullar, bemorlarni ro‘yxatga olish va jadval bilan ishlash.',
              'Doctor — o‘ziga biriktirilgan qabullar, bemorlar va stomatologik yozuvlar bilan ishlash.',
              'Accountant — to‘lovlar, xarajatlar va moliyaviy hisobotlar bilan ishlash.',
            ],
          },
          {
            type: 'p',
            text: 'Owner yoki vakolatli Admin standart rol ruxsatlariga qo‘shimcha ruxsat berishi yoki ayrim ruxsatlarni cheklashi mumkin. Cheklov (taqiq) har doim ruxsatdan ustun turadi.',
          },
          {
            type: 'p',
            text: 'Bir foydalanuvchi bir nechta klinikada turli rollarda ishlashi mumkin. Masalan, shifokor bir klinikada Doctor, boshqasida Admin bo‘lishi mumkin. Har bir klinikadagi rol va ruxsatlar bir-biridan mustaqil.',
          },
        ],
      },
      {
        id: 'workspace-isolation',
        title: 'Klinikalar ma’lumotlarining ajratilishi',
        blocks: [
          {
            type: 'p',
            text: 'Har bir klinika ma’lumotlari boshqa klinikalar ma’lumotlaridan mantiqan ajratilgan. Har bir so‘rovda Platforma quyidagilarni tekshiradi:',
          },
          {
            type: 'ul',
            items: [
              'foydalanuvchi tizimga to‘g‘ri kirganligini (autentifikatsiya);',
              'foydalanuvchi qaysi klinika ish maydonida ishlayotganini;',
              'shu klinikada foydalanuvchining faol a’zoligi borligini;',
              'foydalanuvchining roli va ruxsatlari so‘ralgan amalga imkon berishini.',
            ],
          },
          {
            type: 'p',
            text: 'Bir nechta klinikada ishlaydigan shifokor faqat faol ish maydonidagi klinika ma’lumotlarini ko‘radi. Bir klinikaning bemorlari, yozuvlari va moliyaviy ma’lumotlari boshqa klinikaga ko‘rsatilmaydi.',
          },
          {
            type: 'p',
            text: 'Xodimning a’zoligi faolsizlantirilgach, u shu klinika ma’lumotlariga kira olmaydi. Uning boshqa klinikalardagi a’zoliklari va foydalanuvchi akkaunti o‘z holicha saqlanadi.',
          },
        ],
      },
      {
        id: 'doctor-app',
        title: 'Doctor App’dan foydalanish',
        blocks: [
          {
            type: 'p',
            text: 'Doctor App shifokorlarga o‘z jadvali, qabullari, bemorlari va stomatologik yozuvlari bilan mobil qurilmada ishlash imkonini beradi. Doctor App’ga kirish faqat klinika tomonidan berilgan faol a’zolik orqali mumkin.',
          },
          {
            type: 'ul',
            items: [
              'Shifokor bir nechta klinikada ishlasa, ilovada ish maydonini tanlaydi va faqat tanlangan klinika ma’lumotlari bilan ishlaydi.',
              'Shifokor mobil qurilmasini ekran qulfi bilan himoyalashi va begona shaxslarga bermasligi kerak.',
              'Klinika shifokorning a’zoligini faolsizlantirsa, Doctor App’dagi shu klinika ma’lumotlariga kirish to‘xtatiladi.',
            ],
          },
        ],
      },
      {
        id: 'patients',
        title: 'Mijoz va bemorlar tomonidan foydalanish',
        blocks: [
          {
            type: 'p',
            text: 'Client App orqali bemorlar klinikalar va shifokorlarni topishi, qabulga yozilishi, qabullar tarixini ko‘rishi va bildirishnomalar olishi mumkin.',
          },
          {
            type: 'ul',
            items: [
              'Qabulga yozilish klinika tomonidan tasdiqlanishi, o‘zgartirilishi yoki bekor qilinishi mumkin; yakuniy qabul vaqti klinika tomonidan belgilanadi.',
              'Xizmat narxlari, davomiyligi va shartlari klinika tomonidan belgilanadi va o‘zgarishi mumkin.',
              'Tibbiy xizmat sifati, tashxis va davolash uchun bemor oldida klinika va shifokor javobgar.',
              'Bemor o‘zi haqidagi ma’lumotlarni to‘g‘ri kiritishi kerak.',
            ],
          },
        ],
      },
      {
        id: 'trial',
        title: `${billing.trialDays} kunlik bepul sinov davri`,
        blocks: [
          {
            type: 'p',
            text: `Sinov davri klinika Owner’ining email manzili tasdiqlangan paytdan boshlanadi va ${billing.trialDays} kalendar kun davom etadi. Sinov davri ${brand} administratori tasdig‘isiz, avtomatik tarzda faollashadi.`,
          },
          {
            type: 'ul',
            items: [
              'Sinov davrida CRM’ning asosiy funksiyalari va marketplace orqali onlayn qabul qabul qilish imkoniyati taqdim etiladi.',
              'Sinov davri uchun to‘lov olinmaydi va bank kartasi ma’lumotlari so‘ralmaydi.',
              'Bitta klinika uchun sinov davri bir marta beriladi.',
              `Sinov davri tugagach, klinika ma’lumotlari avtomatik ravishda o‘chirilmaydi. Platformadan foydalanishni davom ettirish uchun obuna rasmiylashtirilishi kerak; obuna faollashtirilgunga qadar pullik funksiyalar va marketplace orqali qabul qilish cheklanishi mumkin.`,
            ],
          },
        ],
      },
      {
        id: 'subscription',
        title: 'Obuna va to‘lovlar',
        blocks: [
          {
            type: 'p',
            text: `Obuna narxlari, to‘lov davriyligi, to‘lov usullari va tarkibidagi funksiyalar ${brand} tomonidan e’lon qilingan narxlar sahifasida, klinikaga yuborilgan tijorat taklifida yoki tomonlar o‘rtasida tuzilgan shartnomada belgilanadi.`,
          },
          {
            type: 'ul',
            items: [
              `Obuna to‘lov amalga oshirilgani tasdiqlangach, ${brand} administratori tomonidan faollashtiriladi.`,
              'Obuna muddati faollashtirilgan kundan boshlab hisoblanadi, agar tijorat taklifi yoki shartnomada boshqacha belgilanmagan bo‘lsa.',
              'To‘lov uchun hisob-varaq yoki to‘lov rekvizitlari klinikaga alohida taqdim etiladi.',
              'Platforma ichida onlayn to‘lov tizimlari kelajakda qo‘shilishi mumkin; ular qo‘shilganda, tegishli shartlar alohida e’lon qilinadi.',
              'Narxlar o‘zgarganda, klinika oldindan xabardor qilinadi; allaqachon to‘langan davr uchun narx o‘zgarmaydi.',
              'Obuna to‘lovi qonunchilik yoki shartnomada nazarda tutilgan hollardan tashqari qaytarilmaydi.',
            ],
          },
        ],
      },
      {
        id: 'late-payment',
        title: 'To‘lovni kechiktirish va qarzdorlik',
        blocks: [
          {
            type: 'p',
            text: 'Obuna to‘lovi hisob-varaq, tijorat taklifi yoki shartnomada ko‘rsatilgan to‘lov muddatida amalga oshirilishi kerak. To‘lov muddati o‘tgan kundan boshlab to‘lanmagan summa muddati o‘tgan qarzdorlik hisoblanadi.',
          },
          {
            type: 'ul',
            items: [
              `To‘lov muddatidan keyin ${billing.graceDays} kun (yoki shartnomada belgilangan boshqa imtiyozli muddat) o‘tgach, Platformaning ayrim pullik funksiyalari cheklanishi mumkin.`,
              `Qarzdorlik ${billing.suspensionDays} kalendar kundan ortiq to‘lanmasa, ${brand} xizmat ko‘rsatishni to‘xtatib turishi, klinikaga yozma talabnoma yuborishi va qarzdorlikni qonunchilikda belgilangan tartibda undirish choralarini ko‘rishi mumkin.`,
              'Cheklash yoki to‘xtatishdan oldin klinika email yoki Platforma bildirishnomalari orqali ogohlantiriladi.',
            ],
          },
          {
            type: 'note',
            text: 'Shartnomada yoki alohida tijorat taklifida belgilangan bo‘lsa, kechiktirilgan to‘lov uchun penya yoki boshqa qonuniy to‘lovlar qo‘llanishi mumkin.',
          },
        ],
      },
      {
        id: 'debt-collection',
        title: 'Qarzdorlikni undirish',
        blocks: [
          {
            type: 'p',
            text: `Qarzdorlik ixtiyoriy ravishda to‘lanmagan taqdirda, ${brand} uni O‘zbekiston Respublikasi qonunchiligida belgilangan tartibda, jumladan sudga murojaat qilish yo‘li bilan undirishga haqli.`,
          },
          {
            type: 'ul',
            items: [
              'Undirishdan oldin klinikaga qarzdorlik summasi, uning asosi va to‘lash muddati ko‘rsatilgan yozma talabnoma yuboriladi.',
              'Qonunchilik yoki shartnomada nazarda tutilgan hollarda, qarzdorlikni undirish bilan bog‘liq asosli xarajatlar qarzdor tomonidan qoplanishi mumkin.',
              'Tomonlar nizoni avvalo muzokaralar yo‘li bilan hal qilishga harakat qiladi.',
            ],
          },
          {
            type: 'note',
            text: 'Xizmatning to‘xtatilishi avval yuzaga kelgan qarzdorlikni to‘lash majburiyatini bekor qilmaydi.',
          },
        ],
      },
      {
        id: 'suspension',
        title: 'Xizmatni cheklash va to‘xtatish',
        blocks: [
          {
            type: 'p',
            text: `${brand} quyidagi hollarda klinika yoki foydalanuvchining Platformaga kirishini to‘liq yoki qisman cheklashi yoki to‘xtatib turishi mumkin:`,
          },
          {
            type: 'ul',
            items: [
              'obuna to‘lovi muddati o‘tgan va imtiyozli muddat tugagan bo‘lsa;',
              'ushbu Shartlar yoki qonunchilik talablari buzilgan bo‘lsa;',
              'akkauntdan ruxsatsiz foydalanish yoki xavfsizlikka tahdid aniqlangan bo‘lsa;',
              'vakolatli davlat organlarining qonuniy talabi bo‘lsa.',
            ],
          },
          {
            type: 'p',
            text: 'Xizmat to‘xtatilgan davrda klinika ma’lumotlari darhol o‘chirilmaydi va Maxfiylik siyosatida belgilangan tartibda saqlanadi.',
          },
          {
            type: 'p',
            text: 'Qarzdorlik to‘liq to‘langanidan keyin xizmat qayta faollashtiriladi. Qayta faollashtirish odatda to‘lov tasdiqlangandan keyin ish vaqti davomida amalga oshiriladi.',
          },
        ],
      },
      {
        id: 'medical-data',
        title: 'Klinikadagi tibbiy ma’lumotlar uchun javobgarlik',
        blocks: [
          {
            type: 'p',
            text: `Klinika Platformaga kiritiladigan bemorlar va tibbiy ma’lumotlarga nisbatan ma’lumotlar egasi (operatori) hisoblanadi. ${brand} bu ma’lumotlarni faqat klinika topshirig‘iga ko‘ra, Platforma xizmatlarini ko‘rsatish maqsadida qayta ishlaydi.`,
          },
          {
            type: 'ul',
            items: [
              'Bemorlardan shaxsga doir va tibbiy ma’lumotlarni qayta ishlash uchun qonunchilikda talab qilinadigan roziliklarni olish klinika zimmasida.',
              'Kiritilgan tibbiy yozuvlar, tashxislar, davolash rejalari va izohlarning to‘g‘riligi va to‘liqligi uchun klinika va tegishli shifokor javobgar.',
              'Klinika tibbiy hujjatlarni yuritish va saqlash bo‘yicha qonunchilik talablariga rioya etishi shart.',
              'Tibbiy ma’lumotlarga faqat ish vazifasi bo‘yicha zarur bo‘lgan xodimlarga kirish ruxsati berilishi kerak.',
            ],
          },
        ],
      },
      {
        id: 'medical-disclaimer',
        title: 'Tibbiy disclaimer',
        blocks: [
          {
            type: 'note',
            text: `${brand} klinika emas, tibbiy xizmat ko‘rsatmaydi, tashxis qo‘ymaydi va davolash bo‘yicha qaror qabul qilmaydi. Platforma shifokor maslahati yoki tibbiy ko‘rikning o‘rnini bosmaydi.`,
          },
          {
            type: 'ul',
            items: [
              'Tashxis, davolash usuli va tibbiy qarorlar uchun faqat klinika va shifokor javobgar.',
              'Platformadagi odontogramma, shablonlar, xizmatlar katalogi va boshqa vositalar faqat yordamchi xususiyatga ega.',
              'Klinika yoki shifokorning marketplace’da ko‘rsatilishi, reytingi yoki sharhlari davolash natijasi yoki xizmat sifati kafolati hisoblanmaydi.',
              'Shoshilinch tibbiy holatlarda Platformaga emas, tez tibbiy yordam xizmatiga murojaat qiling.',
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
            text: 'Platformadan foydalanishda quyidagilar taqiqlanadi:',
          },
          {
            type: 'ul',
            items: [
              'boshqa shaxs akkauntidan uning ruxsatisiz foydalanish yoki kirish ma’lumotlarini boshqalarga berish;',
              'boshqa klinika ma’lumotlariga ruxsatsiz kirishga urinish, xavfsizlik choralarini chetlab o‘tish;',
              'Platformani teskari muhandislik qilish, nusxalash, dekompilyatsiya qilish (qonunchilikda ruxsat etilgan hollardan tashqari);',
              'zararli dastur, spam yoki avtomatlashtirilgan ommaviy so‘rovlar yuborish;',
              'yolg‘on, chalg‘ituvchi yoki uchinchi shaxslar huquqlarini buzuvchi ma’lumotlar joylash;',
              'bemor ma’lumotlarini qonunga zid maqsadlarda, jumladan ruxsatsiz reklama uchun ishlatish;',
              'soxta sharhlar yoki reytinglar yaratish;',
              'Platformadan qonunchilikka zid har qanday maqsadda foydalanish.',
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
            text: `Platforma, uning dasturiy kodi, dizayni, interfeysi, logotiplari, “${brand}” nomi va boshqa materiallari ${brand}ga yoki uning litsenziarlariga tegishli va qonun bilan himoyalangan.`,
          },
          {
            type: 'ul',
            items: [
              'Obuna yoki sinov davri klinikaga Platformadan ushbu Shartlarga muvofiq foydalanish uchun cheklangan, mutlaq bo‘lmagan, boshqa shaxsga berilmaydigan huquq beradi.',
              'Klinika Platformaga kiritgan ma’lumotlari (bemorlar, yozuvlar, rasmlar va boshqalar) klinikaga tegishli bo‘lib qoladi.',
              `Klinika marketplace’da ko‘rsatilishi uchun o‘z nomi, logotipi va rasmlaridan ${brand} Platformasida foydalanishga ruxsat beradi.`,
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
            text: 'Platforma ishlashi uchun uchinchi tomon xizmatlaridan foydalanadi yoki foydalanishi mumkin, jumladan: email yuborish (SMTP) xizmatlari, push-bildirishnomalar xizmati (Firebase), xarita xizmatlari (Google Maps), fayllarni saqlash xizmatlari (S3-mos saqlash), hosting va monitoring xizmatlari.',
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
        id: 'availability',
        title: 'Xizmatdagi uzilishlar va texnik ishlar',
        blocks: [
          {
            type: 'p',
            text: `${brand} Platformaning barqaror ishlashi uchun oqilona choralar ko‘radi, biroq uzluksiz yoki xatosiz ishlashni kafolatlamaydi.`,
          },
          {
            type: 'ul',
            items: [
              'Rejali texnik ishlar imkon qadar kam yuklama bo‘lgan vaqtda o‘tkaziladi va iloji bo‘lsa, oldindan e’lon qilinadi.',
              'Kutilmagan nosozliklar, tarmoq muammolari yoki uchinchi tomon xizmatlaridagi uzilishlar tufayli Platforma vaqtincha ishlamasligi mumkin.',
              'Klinika muhim ma’lumotlarning (masalan, kunlik qabullar ro‘yxati) zaxira nusxasini o‘z ehtiyojlari uchun yuritishi tavsiya etiladi.',
              'Engib bo‘lmaydigan kuch (fors-major) holatlarida tomonlar majburiyatlarni bajarmaganlik uchun javobgar emas.',
            ],
          },
        ],
      },
      {
        id: 'termination',
        title: 'Akkauntni bloklash va bekor qilish',
        blocks: [
          {
            type: 'p',
            text: 'Klinika istalgan vaqtda Platformadan foydalanishni to‘xtatish va akkauntni yopish haqida bizga murojaat qilishi mumkin. Akkaunt yopilishi to‘langan obuna davri uchun to‘lovni qaytarishga asos bo‘lmaydi, agar shartnomada boshqacha belgilanmagan bo‘lsa.',
          },
          {
            type: 'ul',
            items: [
              `${brand} Shartlar jiddiy yoki takroran buzilganda akkauntni ogohlantirish bilan yoki, xavfsizlik tahdidi bo‘lsa, darhol bloklashi mumkin.`,
              'Akkaunt yopilganda yoki bloklanganda ham, yuzaga kelgan qarzdorlikni to‘lash majburiyati saqlanib qoladi.',
              'Akkaunt yopilgach, ma’lumotlar Maxfiylik siyosatidagi saqlash qoidalariga muvofiq saqlanadi, o‘chiriladi yoki anonimlashtiriladi.',
              'Klinika akkaunt yopilishidan oldin o‘z ma’lumotlarini eksport qilish uchun murojaat qilishi mumkin (texnik imkoniyat doirasida).',
            ],
          },
        ],
      },
      {
        id: 'data-storage',
        title: 'Ma’lumotlarning saqlanishi',
        blocks: [
          {
            type: 'p',
            text: 'Platformadagi shaxsga doir ma’lumotlarni qayta ishlash, saqlash va himoya qilish tartibi Maxfiylik siyosatida batafsil bayon etilgan. Maxfiylik siyosati ushbu Shartlarning ajralmas qismi hisoblanadi.',
          },
          {
            type: 'ul',
            items: [
              'Obuna tugashi yoki sinov davri yakunlanishi ma’lumotlarning avtomatik o‘chirilishini anglatmaydi.',
              'Tibbiy, buxgalteriya va boshqa ma’lumotlar qonunchilikda belgilangan muddatlar davomida saqlanishi mumkin.',
              'Zaxira nusxalar belgilangan tartibda aylanma (rotatsiya) asosida yangilanadi.',
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
              'Platforma “mavjud holicha” taqdim etiladi; Platforma klinikaning barcha biznes ehtiyojlariga mos kelishi kafolatlanmaydi.',
              `${brand} klinika yoki shifokorning tibbiy qarorlari, xatolari, xizmat sifati yoki bemorga yetkazilgan zarar uchun javobgar emas.`,
              `${brand} foydalanuvchi tomonidan noto‘g‘ri kiritilgan ma’lumotlar, kirish ma’lumotlarining oshkor bo‘lishi yoki klinika xodimlarining harakatlari oqibatlari uchun javobgar emas.`,
              `${brand}ning bevosita aybi bilan yetkazilgan zarar uchun javobgarligi, qonun yoki shartnomada boshqacha belgilanmagan bo‘lsa, zarar yetkazilgan oyda klinika tomonidan to‘langan obuna summasi bilan cheklanadi.`,
              'Boy berilgan foyda va bilvosita zararlar, qonunchilikda majburiy nazarda tutilgan hollardan tashqari, qoplanmaydi.',
            ],
          },
          {
            type: 'p',
            text: 'Ushbu bo‘lim qoidalari qonunchilikka ko‘ra cheklanishi mumkin bo‘lmagan javobgarlikni cheklamaydi.',
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
            type: 'ul',
            items: [
              'Nizolar avvalo muzokaralar yo‘li bilan hal qilinadi. Da’vogar tomon boshqa tomonga yozma talabnoma yuboradi.',
              'Talabnoma qonunchilik yoki shartnomada belgilangan muddatda ko‘rib chiqiladi. Kelishuvga erishilmasa, nizo O‘zbekiston Respublikasi qonunchiligiga muvofiq vakolatli sudda ko‘rib chiqiladi.',
              'Tomonlar o‘rtasida tuzilgan shartnomada nizolarni hal qilishning boshqa tartibi belgilangan bo‘lsa, o‘sha tartib qo‘llaniladi.',
            ],
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
              'Muhim o‘zgarishlar haqida klinika Owner’i email yoki Platforma bildirishnomasi orqali oldindan xabardor qilinadi.',
              'O‘zgarishlar kuchga kirgandan keyin Platformadan foydalanishni davom ettirish yangi tahrirga rozilik bildirilganini anglatadi. Ayrim hollarda yangi tahrirga alohida rozilik so‘ralishi mumkin.',
              'Yangi tahrirga rozi bo‘lmasangiz, Platformadan foydalanishni to‘xtatishingiz va akkauntni yopish uchun murojaat qilishingiz mumkin.',
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
            text: 'Ushbu Shartlar bo‘yicha savollar, talabnomalar va murojaatlar uchun:',
          },
          { type: 'ul', items: contactLinesUz(ctx) },
        ],
      },
    ],
  };
};
