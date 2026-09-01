const fs = require('fs');
const path = 'mocks/data.ts';
let s = fs.readFileSync(path, 'utf8');

const moreClinics = `
  {
    id: 'clinic-9',
    name: 'Happy Smile Clinic',
    slug: 'happy-smile',
    logoUrl: 'https://i.pravatar.cc/150?u=happy-smile-logo',
    coverUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80',
    rating: 4.9,
    reviewCount: 512,
    address: "Bobur ko'chasi 10, Yakkasaroy, Toshkent",
    phone: '+998711234509',
    coordinates: { latitude: 41.3055, longitude: 69.255 },
    workingHours: monSatHours,
    isOpenNow: true,
    specializations: ['Orthodontics', 'Therapy', 'Aesthetic'],
    photos: ['https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80'],
    about: 'Happy Smile Clinic is a flagship orthodontic and aesthetic practice near Bobur street.',
    priceFrom: 180_000,
    distanceKm: 1.1,
  },
  {
    id: 'clinic-10',
    name: 'Alfa Dent',
    slug: 'alfa-dent',
    logoUrl: 'https://i.pravatar.cc/150?u=alfa-dent-logo',
    coverUrl: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&q=80',
    rating: 4.6,
    reviewCount: 220,
    address: "Beruniy ko'chasi 55, Olmazor, Toshkent",
    phone: '+998711234510',
    coordinates: { latitude: 41.34, longitude: 69.22 },
    workingHours: monSatHours,
    isOpenNow: true,
    specializations: ['Therapy', 'Surgery', 'Hygiene'],
    photos: ['https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&q=80'],
    about: 'Alfa Dent offers same-day therapy and hygiene in Olmazor.',
    priceFrom: 130_000,
    distanceKm: 3.2,
  },
  {
    id: 'clinic-11',
    name: 'Orbit Dental',
    slug: 'orbit-dental',
    logoUrl: 'https://i.pravatar.cc/150?u=orbit-dental-logo',
    coverUrl: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=800&q=80',
    rating: 4.8,
    reviewCount: 301,
    address: 'Labzak 3, Shayxontohur, Toshkent',
    phone: '+998711234511',
    coordinates: { latitude: 41.325, longitude: 69.248 },
    workingHours: [
      { day: 0, open: '00:00', close: '23:59' },
      { day: 1, open: '00:00', close: '23:59' },
      { day: 2, open: '00:00', close: '23:59' },
      { day: 3, open: '00:00', close: '23:59' },
      { day: 4, open: '00:00', close: '23:59' },
      { day: 5, open: '00:00', close: '23:59' },
      { day: 6, open: '00:00', close: '23:59' },
    ],
    isOpenNow: true,
    specializations: ['Surgery', 'Implantology', 'Therapy'],
    photos: ['https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=800&q=80'],
    about: 'Orbit Dental is open 24/7 for emergencies and implants.',
    priceFrom: 200_000,
    distanceKm: 2.0,
  },
  {
    id: 'clinic-12',
    name: 'Pearl Dent',
    slug: 'pearl-dent',
    logoUrl: 'https://i.pravatar.cc/150?u=pearl-dent-logo',
    coverUrl: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=800&q=80',
    rating: 4.7,
    reviewCount: 188,
    address: 'Qorasuv 18, Yashnobod, Toshkent',
    phone: '+998711234512',
    coordinates: { latitude: 41.295, longitude: 69.31 },
    workingHours: monSatHours,
    isOpenNow: true,
    specializations: ['Pediatric', 'Hygiene', 'Therapy'],
    photos: ['https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=800&q=80'],
    about: 'Pearl Dent focuses on pediatric and family hygiene.',
    priceFrom: 110_000,
    distanceKm: 4.5,
  },
  {
    id: 'clinic-13',
    name: 'Nova Smile',
    slug: 'nova-smile',
    logoUrl: 'https://i.pravatar.cc/150?u=nova-smile-logo',
    coverUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&q=80',
    rating: 4.5,
    reviewCount: 140,
    address: 'Massiv 4, Chilonzor, Toshkent',
    phone: '+998711234513',
    coordinates: { latitude: 41.278, longitude: 69.21 },
    workingHours: monSatHours,
    isOpenNow: false,
    specializations: ['Aesthetic', 'Whitening', 'Therapy'],
    photos: ['https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&q=80'],
    about: 'Nova Smile specializes in whitening and veneers.',
    priceFrom: 160_000,
    distanceKm: 5.1,
  },
  {
    id: 'clinic-14',
    name: 'Zenith Dental',
    slug: 'zenith-dental',
    logoUrl: 'https://i.pravatar.cc/150?u=zenith-dental-logo',
    coverUrl: 'https://images.unsplash.com/photo-1629909615184-74f495363b67?w=800&q=80',
    rating: 4.8,
    reviewCount: 276,
    address: 'Oloy bozori 2, Yunusobod, Toshkent',
    phone: '+998711234514',
    coordinates: { latitude: 41.335, longitude: 69.29 },
    workingHours: monSatHours,
    isOpenNow: true,
    specializations: ['Implantology', 'Prosthodontics', 'Surgery'],
    photos: ['https://images.unsplash.com/photo-1629909615184-74f495363b67?w=800&q=80'],
    about: 'Zenith Dental is a premium implant center in Yunusobod.',
    priceFrom: 280_000,
    distanceKm: 2.8,
  },
  {
    id: 'clinic-15',
    name: 'Care Dent Hub',
    slug: 'care-dent-hub',
    logoUrl: 'https://i.pravatar.cc/150?u=care-dent-hub-logo',
    coverUrl: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&q=80',
    rating: 4.4,
    reviewCount: 95,
    address: 'Qoyliq 7, Bektemir, Toshkent',
    phone: '+998711234515',
    coordinates: { latitude: 41.26, longitude: 69.34 },
    workingHours: monSatHours,
    isOpenNow: true,
    specializations: ['Therapy', 'Hygiene'],
    photos: ['https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&q=80'],
    about: 'Care Dent Hub serves Bektemir with affordable therapy.',
    priceFrom: 90_000,
    distanceKm: 8.2,
  },
  {
    id: 'clinic-16',
    name: 'Silk Road Dental',
    slug: 'silk-road-dental',
    logoUrl: 'https://i.pravatar.cc/150?u=silk-road-logo',
    coverUrl: 'https://images.unsplash.com/photo-1588776813677-77c2c1c0c0b3?w=800&q=80',
    rating: 4.7,
    reviewCount: 210,
    address: 'Minor 12, Yunusobod, Toshkent',
    phone: '+998711234516',
    coordinates: { latitude: 41.348, longitude: 69.285 },
    workingHours: monSatHours,
    isOpenNow: true,
    specializations: ['Orthodontics', 'Pediatric'],
    photos: ['https://images.unsplash.com/photo-1588776813677-77c2c1c0c0b3?w=800&q=80'],
    about: 'Silk Road Dental mixes orthodontics with pediatric care.',
    priceFrom: 140_000,
    distanceKm: 3.9,
  },
  {
    id: 'clinic-17',
    name: 'Bright Tooth',
    slug: 'bright-tooth',
    logoUrl: 'https://i.pravatar.cc/150?u=bright-tooth-logo',
    coverUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80',
    rating: 4.6,
    reviewCount: 167,
    address: 'Farovon 9, Uchtepa, Toshkent',
    phone: '+998711234517',
    coordinates: { latitude: 41.29, longitude: 69.19 },
    workingHours: monSatHours,
    isOpenNow: true,
    specializations: ['Hygiene', 'Aesthetic', 'Therapy'],
    photos: ['https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80'],
    about: 'Bright Tooth is known for gentle cleanings and whitening.',
    priceFrom: 125_000,
    distanceKm: 4.0,
  },
  {
    id: 'clinic-18',
    name: 'Astra Dent',
    slug: 'astra-dent',
    logoUrl: 'https://i.pravatar.cc/150?u=astra-dent-logo',
    coverUrl: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&q=80',
    rating: 4.9,
    reviewCount: 390,
    address: 'Shota Rustaveli 45, Mirobod, Toshkent',
    phone: '+998711234518',
    coordinates: { latitude: 41.308, longitude: 69.27 },
    workingHours: monSatHours,
    isOpenNow: true,
    specializations: ['Surgery', 'Implantology', 'Aesthetic'],
    photos: ['https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&q=80'],
    about: 'Astra Dent is a downtown surgical boutique clinic.',
    priceFrom: 220_000,
    distanceKm: 0.9,
  },
  {
    id: 'clinic-19',
    name: 'Green Leaf Dent',
    slug: 'green-leaf-dent',
    logoUrl: 'https://i.pravatar.cc/150?u=green-leaf-logo',
    coverUrl: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=800&q=80',
    rating: 4.3,
    reviewCount: 82,
    address: 'Qoraqamish 21, Olmazor, Toshkent',
    phone: '+998711234519',
    coordinates: { latitude: 41.355, longitude: 69.205 },
    workingHours: monSatHours,
    isOpenNow: false,
    specializations: ['Therapy', 'Hygiene'],
    photos: ['https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=800&q=80'],
    about: 'Green Leaf Dent is an eco-friendly neighborhood clinic.',
    priceFrom: 100_000,
    distanceKm: 6.4,
  },
  {
    id: 'clinic-20',
    name: 'Horizon Dental',
    slug: 'horizon-dental',
    logoUrl: 'https://i.pravatar.cc/150?u=horizon-dental-logo',
    coverUrl: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=800&q=80',
    rating: 4.8,
    reviewCount: 244,
    address: 'Tinchlik 14, Shayxontohur, Toshkent',
    phone: '+998711234520',
    coordinates: { latitude: 41.322, longitude: 69.235 },
    workingHours: monSatHours,
    isOpenNow: true,
    specializations: ['Orthodontics', 'Therapy', 'Implantology'],
    photos: ['https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=800&q=80'],
    about: 'Horizon Dental combines orthodontics and implant planning.',
    priceFrom: 170_000,
    distanceKm: 2.2,
  },
`;

if (!s.includes("id: 'clinic-20'")) {
  const marker = '    distanceKm: 0.5,\r\n  },\r\n];';
  let idx = s.indexOf(marker);
  if (idx < 0) {
    const markerLf = '    distanceKm: 0.5,\n  },\n];';
    idx = s.indexOf(markerLf);
    if (idx < 0) throw new Error('clinic end not found');
    s =
      s.slice(0, idx + '    distanceKm: 0.5,\n  },'.length) +
      ',' +
      moreClinics +
      '\n];' +
      s.slice(idx + markerLf.length);
  } else {
    s =
      s.slice(0, idx + '    distanceKm: 0.5,\r\n  },'.length) +
      ',' +
      moreClinics +
      '\r\n];' +
      s.slice(idx + marker.length);
  }
  fs.writeFileSync(path, s);
  console.log('clinics expanded to 20');
} else {
  console.log('clinics already expanded');
}

s = fs.readFileSync(path, 'utf8');
if (!s.includes("id: 'doctor-30'")) {
  const specs = [
    'Therapist',
    'Orthodontist',
    'Surgeon',
    'Pediatric',
    'Implantologist',
    'Hygienist',
  ];
  const moreDoctors = [];
  for (let i = 13; i <= 30; i++) {
    const clinicId = `clinic-${((i - 1) % 20) + 1}`;
    const gender = i % 2 === 0 ? 'female' : 'male';
    moreDoctors.push(`
  {
    id: 'doctor-${i}',
    clinicId: '${clinicId}',
    fullName: 'Dr. Specialist ${i}',
    photoUrl: 'https://i.pravatar.cc/150?u=doctor${i}',
    specialization: '${specs[i % specs.length]}',
    experienceYears: ${5 + (i % 15)},
    rating: ${Number((4.3 + (i % 7) * 0.1).toFixed(1))},
    reviewCount: ${40 + i * 3},
    gender: '${gender}',
    languages: ['uz', 'ru', 'en'],
    bio: 'Experienced dental specialist serving patients across Tashkent.',
    priceFrom: ${100_000 + (i % 8) * 25_000},
    workingHours: defaultWorking,
    breakTime: defaultBreak,
    appointmentDurationMinutes: 30,
    services: therapistServices,
  }`);
  }
  const before = s.lastIndexOf('\r\n];\r\n\r\nexport const MOCK_PATIENTS');
  const beforeLf = s.lastIndexOf('\n];\n\nexport const MOCK_PATIENTS');
  const cut = before >= 0 ? before : beforeLf;
  if (cut < 0) throw new Error('doctors end not found');
  const rev = s.indexOf('export const MOCK_PATIENTS');
  const nl = before >= 0 ? '\r\n' : '\n';
  s =
    s.slice(0, cut) +
    ',' +
    moreDoctors.join(',') +
    `${nl}];${nl}${nl}export const MOCK_PATIENTS` +
    s.slice(rev + 'export const MOCK_PATIENTS'.length);
  fs.writeFileSync(path, s);
  console.log('doctors expanded');
}

s = fs.readFileSync(path, 'utf8');
if (!s.includes("id: 'appt-50'")) {
  const moreAppts = [];
  for (let i = 21; i <= 50; i++) {
    const status = i % 5 === 0 ? 'cancelled' : i % 3 === 0 ? 'completed' : 'upcoming';
    const doc = ((i - 1) % 30) + 1;
    const clinic = ((i - 1) % 20) + 1;
    const day = String((i % 28) + 1).padStart(2, '0');
    const hour = String(9 + (i % 8)).padStart(2, '0');
    moreAppts.push(`
  {
    id: 'appt-${i}',
    doctorId: 'doctor-${doc}',
    clinicId: 'clinic-${clinic}',
    patientId: 'patient-1',
    patientName: 'Javlonbek',
    doctorName: 'Dr. Specialist ${doc}',
    clinicName: 'Clinic ${clinic}',
    clinicAddress: 'Toshkent',
    serviceName: 'Consultation',
    date: '2026-09-${day}',
    time: '${hour}:00',
    status: '${status}',
    price: ${150_000 + (i % 5) * 50_000},
  }`);
  }
  const before = s.lastIndexOf('\r\n];\r\n\r\nexport const MOCK_REVIEWS');
  const beforeLf = s.lastIndexOf('\n];\n\nexport const MOCK_REVIEWS');
  const cut = before >= 0 ? before : beforeLf;
  if (cut < 0) throw new Error('appointments end not found');
  const rev = s.indexOf('export const MOCK_REVIEWS');
  const nl = before >= 0 ? '\r\n' : '\n';
  s =
    s.slice(0, cut) +
    ',' +
    moreAppts.join(',') +
    `${nl}];${nl}${nl}export const MOCK_REVIEWS` +
    s.slice(rev + 'export const MOCK_REVIEWS'.length);
  fs.writeFileSync(path, s);
  console.log('appointments expanded');
}

console.log('done');
