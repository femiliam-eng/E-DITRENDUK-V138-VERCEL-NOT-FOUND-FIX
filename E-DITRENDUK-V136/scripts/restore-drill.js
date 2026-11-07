'use strict';
// Uji pemulihan backup secara terisolasi; tidak menyentuh database aktif.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');
const root = path.resolve(__dirname, '..');
const input = process.argv[2];
if (!input) { console.error('Gunakan: npm run restore-drill -- backups/backup-...'); process.exit(1); }
const backup = path.resolve(root, input);
if (!backup.startsWith(path.join(root, 'backups') + path.sep)) { console.error('Backup harus berada di folder backups/.'); process.exit(1); }
const verify = spawnSync(process.execPath, [path.join(root, 'scripts', 'verify-backup.js'), path.relative(root, backup)], { stdio: 'inherit' });
if (verify.status !== 0) process.exit(1);
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'editrenduk-restore-drill-'));
try {
  fs.cpSync(backup, path.join(scratch, 'restored'), { recursive: true, errorOnExist: true });
  const restored = path.join(scratch, 'restored');
  const db = new DatabaseSync(path.join(restored, 'editrenduk.sqlite'), { readOnly: true });
  try {
    if (db.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok') throw Error('Database hasil restore rusak');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    if (!tables.length) throw Error('Database hasil restore tidak memiliki tabel');
    console.log(`Restore drill V18 LULUS: ${tables.length} tabel, database terisolasi, file backup terverifikasi.`);
  } finally { db.close(); }
} catch (err) { console.error('Restore drill GAGAL:', err.message); process.exitCode = 1; }
finally { fs.rmSync(scratch, { recursive: true, force: true }); }
