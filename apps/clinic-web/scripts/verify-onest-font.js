async function main() {
  const html = await fetch('http://localhost:3000/overview').then((r) => r.text());

  const hasOnestVar = html.includes('--font-onest') || html.includes('font-onest');
  const hasJakarta = html.includes('Plus_Jakarta') || html.includes('plus-jakarta');
  const hasManrope = html.includes('Manrope') || html.includes('manrope');
  const hasOnestClass = /class="[^"]*__Onest_|class="[^"]*font-sans/.test(html) || html.includes('Onest');

  console.log({ hasOnestVar, hasJakarta, hasManrope, hasOnestClass: !!hasOnestClass });

  // Find linked CSS chunks
  const cssHrefs = [...html.matchAll(/href="(\/_next\/static\/css\/[^"]+)"/g)].map((m) => m[1]);
  console.log('css files', cssHrefs.length);

  let onestFaces = 0;
  let cyrillicRanges = 0;
  let uzbekHints = 0;

  for (const href of cssHrefs.slice(0, 8)) {
    const css = await fetch(`http://localhost:3000${href}`).then((r) => r.text());
    const faces = css.match(/@font-face/g)?.length ?? 0;
    onestFaces += faces;
    if (/unicode-range:[^;]*U\+04/i.test(css)) cyrillicRanges += 1;
    // Қ U+049A, Ғ U+0492, Ҳ U+04B2, Ў U+040E
    if (/U\+049[0-9A-F]|U\+04B[0-9A-F]|U\+040E/i.test(css)) uzbekHints += 1;
    if (css.includes('Onest') || css.includes('onest')) {
      console.log('css mentions Onest:', href, 'faces~', faces);
    }
  }

  // Also check inline styles in HTML for next/font
  const inlineFaces = html.match(/@font-face/g)?.length ?? 0;
  const styleBlocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
  let styleCyr = 0;
  let styleOnest = 0;
  for (const s of styleBlocks) {
    if (s.includes('Onest') || s.includes('--font-onest')) styleOnest += 1;
    if (/unicode-range:[^;]*U\+04/i.test(s)) styleCyr += 1;
    if (/U\+049A|U\+0492|U\+04B2|U\+040E/i.test(s)) {
      console.log('Uzbek-specific unicode-range present in inline style');
    }
  }

  console.log({
    inlineFaces,
    styleOnest,
    styleCyr,
    onestFaces,
    cyrillicRanges,
    uzbekHints,
  });

  // Sample a style block snippet
  const onestStyle = styleBlocks.find((s) => s.includes('Onest') || s.includes('font-onest'));
  if (onestStyle) {
    console.log('style snippet:', onestStyle.slice(0, 500).replace(/\s+/g, ' '));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
