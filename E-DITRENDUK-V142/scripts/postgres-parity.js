'use strict';
/** Read-only record-count parity check after SQLite -> PostgreSQL import. */
const path = require('node:path');
const fs = require('node:fs');
const {spawnSync} = require('node:child_process');
const {DatabaseSync} = require('node:sqlite');
const root = path.resolve(__dirname, '..');
const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL wajib diatur untuk postgres-parity.'); process.exit(2); }
const source = path.join(root, 'backend', 'data', 'editrenduk.sqlite');
if (!fs.existsSync(source)) { console.error('Database SQLite sumber tidak ditemukan.'); process.exit(2); }
const tables = ['accounts','monitoring','logbook','archive','users_data','disposisi','petugas','schedules','meetings','meeting_sections','meeting_notes','meeting_documentation','audit_logs','storage_files','auth_sessions','schema_migrations'];
const db = new DatabaseSync(source, {readOnly:true});
const sql = tables.map(t=>`SELECT '${t}', count(*) FROM "${t}";`).join('\n');
const pg = spawnSync('psql', ['-X','-q','-A','-t','-F','|','-v','ON_ERROR_STOP=1','-c',sql], {env:{...process.env, PGCONNECT_TIMEOUT:'8', PGDATABASE:url}, encoding:'utf8', timeout:30000});
if (pg.error || pg.status !== 0) { console.error('PostgreSQL tidak dapat diperiksa:', pg.error?.message || pg.stderr?.trim() || 'psql gagal'); db.close(); process.exit(2); }
const counts = new Map();
for (const line of pg.stdout.trim().split(/\r?\n/)) { const [name,count] = line.split('|'); if (name && /^\d+$/.test(count)) counts.set(name, Number(count)); }
let failed = false;
for (const table of tables) {
  let local;
  try { local = Number(db.prepare(`SELECT count(*) AS n FROM "${table}"`).get().n); }
  catch { console.error(`Tabel SQLite tidak ditemukan: ${table}`); failed = true; continue; }
  const remote = counts.get(table);
  const match = remote === local;
  console.log(`${match ? 'OK' : 'BEDA'} ${table}: SQLite=${local}, PostgreSQL=${remote ?? 'tidak tersedia'}`);
  if (!match) failed = true;
}
db.close();
if (failed) { console.error('Parity jumlah record GAGAL. Periksa proses import sebelum cutover.'); process.exit(1); }
console.log('Parity jumlah record LULUS. Ini BUKAN bukti parity endpoint/runtime PostgreSQL.');
