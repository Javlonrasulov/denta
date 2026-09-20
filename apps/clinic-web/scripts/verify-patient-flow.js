async function main() {
  const r = await fetch('http://localhost:3000/overview');
  const html = await r.text();
  console.log('status', r.status, 'len', html.length);
  for (const s of [
    'PatientFlowCard',
    'Bemorlar',
    'patient_flow',
    'recharts',
    'AreaChart',
    'error',
    'Module not found',
  ]) {
    console.log(s, html.includes(s));
  }

  // Try to find chunk mentioning PatientFlow
  const scripts = [...html.matchAll(/\/_next\/static\/chunks\/[^"]+\.js/g)].map((m) => m[0]);
  console.log('scripts', scripts.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
