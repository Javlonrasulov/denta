async function main() {
  const html = await fetch('http://localhost:3000/overview').then((r) => r.text());
  const htmlTag = (html.match(/<html[^>]*>/) || [])[0] || '';
  const bodyTag = (html.match(/<body[^>]*>/) || [])[0] || '';
  console.log(htmlTag);
  console.log(bodyTag);
  console.log('has --font-onest in html class attr via variable class', /__variable_|font-onest|__Onest_/i.test(htmlTag + bodyTag));
}

main();
