async function main() {
  const html = await fetch('http://localhost:3000/overview').then((r) => r.text());
  const idx = html.toLowerCase().indexOf('error');
  console.log('error context:', html.slice(Math.max(0, idx - 80), idx + 160).replace(/\s+/g, ' '));

  // Look for next flight data / RSC
  const hasFlight = html.includes('self.__next_f');
  console.log('hasFlight', hasFlight);

  // Check compiled page module exists
  try {
    const mod = await fetch(
      'http://localhost:3000/_next/static/chunks/app/overview/page.js',
    );
    console.log('page.js', mod.status, (await mod.text()).includes('PatientFlow'));
  } catch (e) {
    console.log('page.js fail', e.message);
  }
}

main();
