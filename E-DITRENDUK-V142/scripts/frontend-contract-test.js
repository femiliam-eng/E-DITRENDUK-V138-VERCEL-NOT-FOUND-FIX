const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const pages = fs.readdirSync(root).filter(f => f.endsWith('.html'));
const failures = [];
for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  if (/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/i.test(html)) failures.push(`${page}: inline script melanggar CSP`);
  if (page !== 'landing.html' && !html.includes('js/ux.js')) failures.push(`${page}: ux.js belum dimuat`);
  for (const m of html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)) {
    if (/^https?:/.test(m[1])) continue;
    if (!fs.existsSync(path.join(root, m[1]))) failures.push(`${page}: script hilang ${m[1]}`);
  }
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`Frontend contract V14: LULUS (${pages.length} halaman, CSP + asset wiring + UX layer).`);
