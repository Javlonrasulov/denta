/**
 * Visual / API smoke walkthrough for CRM + client + doctor contracts.
 * Run with API on :4000.
 */
const API = 'http://127.0.0.1:4000/api/v1';

async function j(path, opts = {}) {
  const r = await fetch(API + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const text = await r.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: r.status, body };
}

function ok(name, cond, detail = '') {
  console.log(cond ? 'PASS' : 'FAIL', name, detail);
  return !!cond;
}

let failed = 0;
function check(name, cond, detail) {
  if (!ok(name, cond, detail)) failed += 1;
}

const pass = 'Demo1234';

const clinicLogin = await j('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ identifier: 'clinic@denta.local', password: pass }),
});
const clinicToken = clinicLogin.body?.session?.accessToken;
check('crm.login', !!clinicToken, String(clinicLogin.status));

const ch = { Authorization: 'Bearer ' + clinicToken };
const crmRoutes = [
  ['/analytics/dashboard', 'overview'],
  ['/appointments', 'appointments'],
  ['/patients', 'patients'],
  ['/doctors?clinicId=', 'doctors'],
  ['/rooms', 'rooms'],
  ['/services', 'services'],
  ['/finance?period=month', 'finance'],
  ['/finance/summary?period=month', 'finance.summary'],
  ['/finance/charges', 'finance.charges'],
  ['/inventory', 'inventory'],
  ['/analytics/patient-flow?period=7d', 'reports'],
  ['/clinics/me', 'settings/me'],
];

const me = await j('/clinics/me', { headers: ch });
const clinicId = me.body?.id;
check('crm.clinicId', !!clinicId, clinicId);

for (const [path, label] of crmRoutes) {
  const p = path.includes('clinicId=') ? `/doctors?clinicId=${clinicId}` : path;
  const res = await j(p, { headers: ch });
  check(
    `crm.${label}`,
    res.status === 200,
    String(res.status) + (Array.isArray(res.body) ? ` n=${res.body.length}` : ''),
  );
}

check(
  'crm.services.nonempty',
  Array.isArray((await j('/services', { headers: ch })).body) &&
    (await j('/services', { headers: ch })).body.length > 0,
);

const catalog = await j('/services/catalog');
check('catalog.public', catalog.status === 200 && catalog.body.length >= 7, String(catalog.body?.length));

const docLogin = await j('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ identifier: 'doctor@denta.local', password: pass }),
});
const docToken = docLogin.body?.session?.accessToken;
check('doctor.login', !!docToken, String(docLogin.status));
const dh = { Authorization: 'Bearer ' + docToken };

for (const [path, label] of [
  ['/appointments', 'dashboard/calendar'],
  ['/patients', 'patients'],
  ['/finance?period=month', 'finance'],
  ['/doctors/me', 'profile'],
]) {
  const res = await j(path, { headers: dh });
  check(`doctor.${label}`, res.status === 200, String(res.status));
}

const patLogin = await j('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ identifier: 'patient@denta.local', password: pass }),
});
const patToken = patLogin.body?.session?.accessToken;
check('client.login', !!patToken, String(patLogin.status));
const ph = { Authorization: 'Bearer ' + patToken };

const nearby = await j('/clinics/nearby?latitude=41.31&longitude=69.28&radiusKm=20');
check('client.map/nearby', nearby.status === 200, String(nearby.status));
const search = await j('/clinics?query=Smile');
check('client.search', search.status === 200, String(search.status));
const clinic = await j(`/clinics/${clinicId}`);
check('client.clinic', clinic.status === 200, String(clinic.status));
const doctors = await j(`/doctors?clinicId=${clinicId}`);
check(
  'client.doctors',
  doctors.status === 200 && Array.isArray(doctors.body) && doctors.body.length > 0,
  String(doctors.body?.[0]?.services?.length ?? 0) + ' services',
);
check(
  'client.doctor.has_services',
  (doctors.body?.[0]?.services?.length ?? 0) > 0,
);
const doctorId = doctors.body?.[0]?.id;
const svcId = doctors.body?.[0]?.services?.[0]?.id;
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const date = tomorrow.toISOString().slice(0, 10);
const slots = await j(
  `/doctors/${doctorId}/slots?date=${date}&clinicId=${clinicId}&serviceId=${svcId}`,
);
check('client.slots', slots.status === 200, String(Array.isArray(slots.body) ? slots.body.length : slots.status));
const appts = await j('/appointments', { headers: ph });
check('client.appointments', appts.status === 200, String(appts.status));
const favs = await j('/favorites', { headers: ph });
check('client.favorites', favs.status === 200, String(favs.status));
const profile = await j('/auth/me', { headers: ph });
check('client.profile', profile.status === 200, String(profile.status));

console.log('---');
console.log(failed === 0 ? 'WALKTHROUGH PASS' : `WALKTHROUGH FAIL ${failed}`);
process.exit(failed === 0 ? 0 : 1);
