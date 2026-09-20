const checks = [
  'Search patients',
  'Clinic performance',
  'Income records',
  'Product architecture',
  'localhost:3000',
  'port 8081',
  '>UZ<',
  'Sozlamalar',
  'Umumiy',
  'Qabullar',
  'Klinika sozlamalari',
];

async function main() {
  for (const path of ['/overview', '/settings', '/finance']) {
    const t = await fetch(`http://localhost:3000${path}`).then((r) => r.text());
    console.log('==', path);
    for (const c of checks) {
      console.log(c, t.includes(c) ? 'YES' : 'no');
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
