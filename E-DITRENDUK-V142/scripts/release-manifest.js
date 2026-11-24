'use strict';
// Generate or verify a SHA-256 manifest for deployable source files.
// Never includes runtime data, secrets, dependencies or the manifest itself.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'release-manifest.json');
const skipDirs = new Set(['node_modules','.git','uploads','backups','tmp','.cache']);
const skipFiles = new Set(['release-manifest.json','.env','.env.local','.env.production']);
function walk(dir, prefix = '') {
  const results = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw Error(`Symlink tidak diizinkan dalam manifest: ${rel}`);
    if (entry.isDirectory()) { if (!skipDirs.has(entry.name) && rel !== 'backend/data') results.push(...walk(path.join(dir,entry.name),rel)); }
    else if (entry.isFile() && !skipFiles.has(entry.name) && !entry.name.startsWith('.env.')) results.push(rel);
  }
  return results;
}
function inventory() {
  return Object.fromEntries(walk(root).map(rel => [rel, {
    sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(root,rel))).digest('hex'),
    bytes: fs.statSync(path.join(root,rel)).size
  }]));
}
const mode = process.argv[2];
if (mode === 'create') {
  const files = inventory();
  fs.writeFileSync(out, JSON.stringify({format:1,version:require('../package.json').version,files},null,2)+'\n');
  console.log(`Manifest V30 dibuat: ${Object.keys(files).length} file.`);
} else if (mode === 'verify') {
  if (!fs.existsSync(out)) throw Error('release-manifest.json tidak ditemukan');
  const expected = JSON.parse(fs.readFileSync(out,'utf8'));
  if (expected.format !== 1) throw Error('Format manifest tidak didukung');
  const actual = inventory();
  const keys = new Set([...Object.keys(expected.files),...Object.keys(actual)]);
  const differences = [...keys].filter(k=>JSON.stringify(expected.files[k])!==JSON.stringify(actual[k]));
  if (differences.length) { console.error('Manifest GAGAL:',differences.join(', ')); process.exit(1); }
  console.log(`Manifest V30 LULUS: ${keys.size} file cocok (SHA-256 + ukuran).`);
} else { console.error('Gunakan: npm run release-manifest atau npm run verify-release'); process.exit(2); }
