'use strict';
// Verifikasi manifest, checksum semua file, dan konsistensi SQLite.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const root = path.resolve(__dirname, '..');
const arg = process.argv[2];
if (!arg) { console.error('Contoh: npm run verify-backup -- backups/backup-...'); process.exit(1); }
const dir = path.resolve(root, arg);
if (!dir.startsWith(root + path.sep)) { console.error('Folder backup harus berada dalam proyek.'); process.exit(1); }
try {
  const manifestPath = path.join(dir, 'manifest.json');
  const dbFile = path.join(dir, 'editrenduk.sqlite');
  if (!fs.existsSync(manifestPath) || !fs.existsSync(dbFile)) throw Error('Backup tidak lengkap.');
  const meta = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (meta.app !== 'E-DITRENDUK') throw Error('Manifest bukan E-DITRENDUK.');
  if (meta.format_version !== 2 || !Array.isArray(meta.files)) throw Error('Manifest lama tanpa checksum: buat backup baru V17.');
  const expected = new Set();
  for (const entry of meta.files) {
    if (typeof entry.path !== 'string' || !/^[a-f0-9]{64}$/.test(entry.sha256) || !Number.isSafeInteger(entry.size)) throw Error('Entry manifest tidak valid.');
    const file = path.resolve(dir, entry.path);
    if (!file.startsWith(dir + path.sep) || entry.path.includes('\\')) throw Error('Path file tidak aman.');
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) throw Error('File backup hilang: ' + entry.path);
    const content = fs.readFileSync(file);
    if (content.length !== entry.size || crypto.createHash('sha256').update(content).digest('hex') !== entry.sha256) throw Error('Checksum gagal: ' + entry.path);
    if (expected.has(entry.path)) throw Error('File duplikat di manifest.');
    expected.add(entry.path);
  }
  if (!expected.has('editrenduk.sqlite')) throw Error('Database tidak terdaftar di manifest.');
  function checkExtra(folder) {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const full = path.join(folder, entry.name);
      if (entry.isSymbolicLink()) throw Error('Symlink tidak diperbolehkan dalam backup.');
      if (entry.isDirectory()) checkExtra(full);
      else if (entry.isFile()) {
        const rel = path.relative(dir, full).split(path.sep).join('/');
        if (rel !== 'manifest.json' && !expected.has(rel)) throw Error('File tambahan tidak terdaftar: ' + rel);
      }
    }
  }
  checkExtra(dir);
  const db = new DatabaseSync(dbFile, { readOnly: true });
  try { if (db.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok') throw Error('SQLite integrity_check gagal.'); }
  finally { db.close(); }
  console.log(`Verifikasi backup V17 LULUS: ${expected.size} file, checksum SHA-256 dan SQLite integrity OK.`);
} catch (error) { console.error('Verifikasi backup GAGAL:', error.message); process.exitCode = 1; }
