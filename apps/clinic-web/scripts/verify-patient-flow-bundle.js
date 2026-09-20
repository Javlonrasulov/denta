async function main() {
  const page = await fetch('http://localhost:3000/_next/static/chunks/app/overview/page.js').then(
    (r) => r.text(),
  );
  console.log('PatientFlowCard', page.includes('PatientFlowCard'));
  console.log('fetchPatientFlow', page.includes('fetchPatientFlow') || page.includes('patient-flow'));
  console.log('recharts Area', page.includes('AreaChart') || page.includes('recharts'));

  // Find translation chunk
  const html = await fetch('http://localhost:3000/overview').then((r) => r.text());
  const chunks = [...html.matchAll(/\/_next\/static\/chunks\/[^"]+\.js/g)].map((m) => m[0]);
  let found = false;
  for (const c of chunks) {
    const js = await fetch(`http://localhost:3000${c}`).then((r) => r.text());
    if (js.includes('Bemorlar oqimi') || js.includes('patient_flow')) {
      console.log('found translation in', c);
      found = true;
      break;
    }
  }
  if (!found) {
    // Check shared app layout chunk via webpack
    const all = await Promise.all(
      chunks.slice(0, 12).map(async (c) => {
        const js = await fetch(`http://localhost:3000${c}`).then((r) => r.text());
        return { c, hit: js.includes('Bemorlar oqimi') };
      }),
    );
    console.log(
      'hits',
      all.filter((x) => x.hit).map((x) => x.c),
    );
  }
}

main();
