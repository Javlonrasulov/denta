async function main() {
  const html = await fetch('http://localhost:3000/overview').then((r) => r.text());
  const href = [...html.matchAll(/href="(\/_next\/static\/css\/[^"]+)"/g)].map((m) => m[1])[0];
  const css = await fetch(`http://localhost:3000${href}`).then((r) => r.text());

  console.log('css len', css.length);
  console.log('font-face count', (css.match(/@font-face/g) || []).length);
  console.log('onest mentions', (css.match(/Onest|onest/g) || []).length);

  const faces = [...css.matchAll(/@font-face\s*\{[\s\S]*?\}/g)].map((m) => m[0]);
  console.log('parsed faces', faces.length);

  const withRange = faces.filter((f) => /unicode-range/i.test(f));
  console.log('with unicode-range', withRange.length);

  const allRanges = withRange
    .map((f) => (f.match(/unicode-range\s*:\s*([^;}]+)/i) || [])[1])
    .filter(Boolean)
    .join(',');

  console.log('first range blob:', allRanges.slice(0, 300));

  // Show one full face for debugging
  if (faces[0]) console.log('face0:', faces[0].slice(0, 350).replace(/\s+/g, ' '));

  const codes = [
    ['Қ', 0x049a],
    ['қ', 0x049b],
    ['Ғ', 0x0492],
    ['ғ', 0x0493],
    ['Ҳ', 0x04b2],
    ['ҳ', 0x04b3],
    ['Ў', 0x040e],
    ['ў', 0x045e],
  ];

  for (const [name, code] of codes) {
    console.log(name, 'U+' + code.toString(16).toUpperCase(), rangeCovers(allRanges, code) ? 'COVERED' : 'MISSING');
  }

  // Also check cyrillic-ext presence
  console.log('has cyrillic-ext hint', /cyrillic-ext|U\+046|U\+050|U\+2DE|U\+A64/i.test(css));
}

function rangeCovers(ranges, code) {
  const parts = ranges.split(',').map((p) => p.trim());
  for (const part of parts) {
    const m = part.match(/U\+([0-9A-F]+)(?:-([0-9A-F]+))?/i);
    if (!m) continue;
    const start = parseInt(m[1], 16);
    const end = m[2] ? parseInt(m[2], 16) : start;
    if (code >= start && code <= end) return true;
  }
  return false;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
