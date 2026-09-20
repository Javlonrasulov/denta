const API = 'http://127.0.0.1:4000/api/v1';
const suffix = Date.now();
const email = `e2e-clinic-${suffix}@example.com`;
const pass = 'Demo1234X';

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

const results = [];
function ok(name, cond, detail = '') {
  results.push({ name, pass: !!cond, detail });
  console.log(cond ? 'PASS' : 'FAIL', name, detail);
}

const reg = await j('/auth/clinic/register', {
  method: 'POST',
  body: JSON.stringify({
    clinicName: 'E2E Clinic ' + suffix,
    adminFirstName: 'E2E',
    adminLastName: 'Owner',
    email,
    phone: '+99890' + String(suffix).slice(-7),
    password: pass,
    acceptTerms: true,
  }),
});
ok('clinic.register', reg.status === 201 || reg.status === 200, String(reg.status));

const otp = await j('/auth/dev/last-otp?email=' + encodeURIComponent(email));
ok('dev.otp', !!otp.body?.code, otp.body?.code || JSON.stringify(otp.body));

const verify = await j('/auth/email/verify', {
  method: 'POST',
  body: JSON.stringify({ email, code: otp.body.code }),
});
ok('email.verify', verify.status === 200 || verify.status === 201, String(verify.status));
const clinicToken =
  verify.body?.accessToken || verify.body?.session?.accessToken;
ok(
  'trial.session',
  !!clinicToken,
  clinicToken ? 'token' : JSON.stringify(verify.body).slice(0, 120),
);

const h = { Authorization: 'Bearer ' + clinicToken };

const me = await j('/auth/me', { headers: h });
ok(
  'auth.me.clinic',
  me.body?.role === 'clinic' || me.body?.user?.role === 'clinic',
  me.body?.role || me.body?.user?.role,
);

const onb = await j('/auth/onboarding', {
  method: 'PATCH',
  headers: h,
  body: JSON.stringify({ step: 3, completed: true }),
});
ok('onboarding', onb.status === 200 || onb.status === 201, String(onb.status));

const clinicMe = await j('/clinics/me', { headers: h });
const clinicId = clinicMe.body?.id;
ok('clinic.me', !!clinicId, clinicId);

const catalog = await j('/services/catalog');
ok(
  'services.catalog',
  catalog.status === 200 && Array.isArray(catalog.body) && catalog.body.length >= 5,
  'count=' + (Array.isArray(catalog.body) ? catalog.body.length : 0),
);
const setup = await j('/services/setup', {
  method: 'POST',
  headers: h,
  body: JSON.stringify({
    services: (catalog.body || []).slice(0, 4).map((s) => ({
      serviceId: s.id,
      priceUzs: s.defaultPriceUzs,
      durationMinutes: s.defaultDurationMinutes,
    })),
  }),
});
ok(
  'services.setup',
  setup.status === 200 || setup.status === 201,
  'count=' + (Array.isArray(setup.body) ? setup.body.length : setup.body?.code),
);
const serviceId = setup.body?.[0]?.id || catalog.body?.[0]?.id;
ok('services.selected', !!serviceId, serviceId);

await j('/clinics/me', {
  method: 'PATCH',
  headers: h,
  body: JSON.stringify({
    about: 'E2E dental clinic for integration tests with full profile',
    phone: '+998901112233',
    specializations: ['Therapy', 'Surgery'],
  }),
});
await j('/clinics/me/branches', {
  method: 'POST',
  headers: h,
  body: JSON.stringify({
    name: 'Main',
    address: 'Tashkent, Amir Temur 1',
    city: 'Tashkent',
    isPrimary: true,
    latitude: 41.3111,
    longitude: 69.2797,
  }),
});

const doc = await j('/clinics/me/doctors', {
  method: 'POST',
  headers: h,
  body: JSON.stringify({
    firstName: 'E2E',
    lastName: 'Doc',
    email: `e2e-doc-${suffix}@example.com`,
    phone: '+99891' + String(suffix).slice(-7),
    specialty: 'Therapist',
    password: pass,
    experienceYears: 5,
    serviceIds: [serviceId],
  }),
});
ok(
  'doctor.create',
  doc.status === 200 || doc.status === 201,
  doc.body?.id || JSON.stringify(doc.body).slice(0, 100),
);
const doctorId = doc.body?.id;

const patchVis = await j('/clinics/me/publish', {
  method: 'POST',
  headers: h,
  body: JSON.stringify({ isMarketplaceVisible: true, bookingEnabled: true }),
});
ok(
  'marketplace.visible',
  patchVis.status === 200 || patchVis.status === 201,
  String(patchVis.status) + ' ' + (patchVis.body?.code || ''),
);

const services = await j('/services', { headers: h });
ok(
  'services.list',
  services.status === 200 && Array.isArray(services.body) && services.body.length > 0,
  'count=' + (Array.isArray(services.body) ? services.body.length : '?'),
);

const docLogin = await j('/auth/login', {
  method: 'POST',
  body: JSON.stringify({
    identifier: `e2e-doc-${suffix}@example.com`,
    password: pass,
  }),
});
const docToken = docLogin.body?.session?.accessToken;
ok('doctor.login', !!docToken, String(docLogin.status));

const pEmail = `e2e-pat-${suffix}@example.com`;
const pReg = await j('/auth/patient/register', {
  method: 'POST',
  body: JSON.stringify({
    firstName: 'E2E',
    lastName: 'Patient',
    email: pEmail,
    phone: '+99893' + String(suffix).slice(-7),
    password: pass,
  }),
});
ok('patient.register', pReg.status === 200 || pReg.status === 201, String(pReg.status));
const pLogin = await j('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ identifier: pEmail, password: pass }),
});
const pToken = pLogin.body?.session?.accessToken;
ok('patient.login', !!pToken, String(pLogin.status));

let free = null;
let dateStr = null;
for (let i = 1; i <= 10; i++) {
  const d = new Date();
  d.setDate(d.getDate() + i);
  if (d.getDay() === 0) continue;
  dateStr = d.toISOString().slice(0, 10);
  const slots = await j(
    `/doctors/${doctorId}/slots?date=${dateStr}&clinicId=${clinicId}&serviceId=${serviceId}`,
  );
  const list = Array.isArray(slots.body) ? slots.body : [];
  free = list.find((s) => s.available);
  if (free) break;
}
ok('slots.available', !!free, dateStr + ' ' + free?.time);

if (!free) {
  console.log('ABORT no slots', results.filter((r) => !r.pass));
  process.exit(1);
}

const book = await j('/appointments', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + pToken },
  body: JSON.stringify({
    doctorId,
    clinicId,
    serviceId,
    date: dateStr,
    time: free.time,
    source: 'CLIENT_APP',
  }),
});
ok(
  'booking.create',
  book.status === 201 || book.status === 200,
  book.body?.id || book.body?.code,
);

const p2Email = `e2e-pat2-${suffix}@example.com`;
await j('/auth/patient/register', {
  method: 'POST',
  body: JSON.stringify({
    firstName: 'E2E',
    lastName: 'Patient2',
    email: p2Email,
    phone: '+99894' + String(suffix).slice(-7),
    password: pass,
  }),
});
const p2Login = await j('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ identifier: p2Email, password: pass }),
});
const p2Token = p2Login.body?.session?.accessToken;
const conflict = await j('/appointments', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + p2Token },
  body: JSON.stringify({
    doctorId,
    clinicId,
    serviceId,
    date: dateStr,
    time: free.time,
    source: 'CLIENT_APP',
  }),
});
ok(
  'SLOT_TAKEN',
  conflict.status === 409 && conflict.body?.code === 'SLOT_TAKEN',
  conflict.body?.code + ' ' + conflict.status,
);

const dAppts = await j('/appointments', {
  headers: { Authorization: 'Bearer ' + docToken },
});
const found = (dAppts.body || []).some((a) => a.id === book.body?.id);
ok(
  'doctor.sees.booking',
  found,
  'count=' + (Array.isArray(dAppts.body) ? dAppts.body.length : 0),
);

const cAppts = await j('/appointments', { headers: h });
ok(
  'clinic.sees.booking',
  (cAppts.body || []).some((a) => a.id === book.body?.id),
  String(cAppts.status),
);

const notifs = await j('/notifications', { headers: h });
ok(
  'notifications.list',
  notifs.status === 200,
  'count=' + (Array.isArray(notifs.body) ? notifs.body.length : 0),
);

const refreshFromVerify =
  verify.body?.refreshToken || verify.body?.session?.refreshToken || '';
const sess = await j('/auth/sessions', {
  headers: { ...h, 'X-Refresh-Token': refreshFromVerify },
});
ok('sessions.list', sess.status === 200 && Array.isArray(sess.body), String(sess.status));

const rev = await j('/analytics/revenue-series?period=7d', { headers: h });
ok(
  'revenue.series',
  rev.status === 200 && Array.isArray(rev.body?.points),
  String(rev.status),
);

const pf = await j('/analytics/patient-flow?period=7d', { headers: h });
ok(
  'patient.flow',
  pf.status === 200 && Array.isArray(pf.body?.points),
  String(pf.status),
);

const search = await j('/search?q=E2E&limit=10', { headers: h });
ok('search', search.status === 200, String(search.status));

const refreshTok = pLogin.body?.session?.refreshToken;
const ref = await j('/auth/refresh', {
  method: 'POST',
  body: JSON.stringify({ refreshToken: refreshTok }),
});
ok('auth.refresh', !!ref.body?.accessToken, String(ref.status));

// complete flow
const start = await j('/appointments/' + book.body.id + '/status', {
  method: 'PATCH',
  headers: { Authorization: 'Bearer ' + docToken },
  body: JSON.stringify({ status: 'IN_PROGRESS' }),
});
ok('status.in_progress', start.status === 200 || start.status === 201, String(start.status));
const done = await j('/appointments/' + book.body.id + '/status', {
  method: 'PATCH',
  headers: { Authorization: 'Bearer ' + docToken },
  body: JSON.stringify({ status: 'COMPLETED' }),
});
ok(
  'status.completed',
  (done.status === 200 || done.status === 201) && done.body?.status === 'completed',
  done.body?.status || String(done.status),
);

ok(
  'charge.created',
  done.body?.charge?.status === 'unpaid' && done.body?.charge?.remainingAmount > 0,
  JSON.stringify(done.body?.charge || done.body?.paymentStatus),
);

const done2 = await j('/appointments/' + book.body.id + '/status', {
  method: 'PATCH',
  headers: { Authorization: 'Bearer ' + docToken },
  body: JSON.stringify({ status: 'COMPLETED' }),
});
ok(
  'charge.idempotent',
  done2.body?.charge?.id === done.body?.charge?.id,
  done2.body?.charge?.id,
);

const pay = await j('/finance/charges/' + done.body.charge.id + '/payments', {
  method: 'POST',
  headers: h,
  body: JSON.stringify({ amount: done.body.charge.remainingAmount, method: 'cash' }),
});
ok(
  'charge.paid',
  (pay.status === 200 || pay.status === 201) && pay.body?.charge?.status === 'paid',
  pay.body?.charge?.status || String(pay.status),
);

const summary = await j('/finance/summary?period=month', { headers: h });
ok(
  'finance.revenue_received_only',
  summary.status === 200 && summary.body?.revenue > 0 && summary.body?.outstanding === 0,
  JSON.stringify(summary.body),
);

// tenant isolation: patient2 cannot read patient1 appointment
const steal = await j('/appointments/' + book.body?.id, {
  headers: { Authorization: 'Bearer ' + p2Token },
});
ok(
  'tenant.patient_isolation',
  steal.status === 403 || steal.status === 404,
  String(steal.status),
);

const failed = results.filter((r) => !r.pass);
console.log('---');
console.log(
  'TOTAL',
  results.length,
  'PASS',
  results.length - failed.length,
  'FAIL',
  failed.length,
);
if (failed.length) console.log(failed);
process.exit(failed.length ? 1 : 0);
