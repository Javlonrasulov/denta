async function main() {
  const html = await fetch('http://localhost:3000/overview').then((r) => r.text());

  // Extract from build manifest / flight
  const overviewRefs = [...html.matchAll(/overview[^"'\s]*/gi)].slice(0, 20);
  console.log('overview refs', overviewRefs.map((m) => m[0]));

  const scripts = [...html.matchAll(/src="([^"]+_next\/static\/chunks\/[^"]+)"/g)].map(
    (m) => m[1],
  );
  console.log('script srcs', scripts);

  for (const src of scripts) {
    const js = await fetch(`http://localhost:3000${src}`).then((r) => r.text());
    const markers = ['PatientFlow', 'fetchPatientFlow', 'AreaChart', 'recharts', 'Bemorlar oqimi'];
    const hits = markers.filter((m) => js.includes(m));
    if (hits.length) console.log(src, hits);
  }

  // Also scan all chunk URLs embedded in HTML text
  const allChunks = [...new Set([...html.matchAll(/\/_next\/static\/chunks\/[^"'\s]+/g)].map((m) => m[0]))];
  console.log('embedded chunks', allChunks.length);
  for (const c of allChunks) {
    try {
      const js = await fetch(`http://localhost:3000${c}`).then((r) => r.text());
      if (js.includes('PatientFlow') || js.includes('AreaChart')) {
        console.log('HIT', c, js.includes('PatientFlow'), js.includes('AreaChart'));
      }
    } catch {}
  }
}

main();
