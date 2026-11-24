#!/usr/bin/env node
'use strict';
// Fail closed: an operator must resolve all blockers before treating this as operational.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function check(env = process.env, exists = fs.existsSync) {
  const checks = [];
  const add = (id, pass, message) => checks.push({ id, status: pass ? 'PASS' : 'BLOCK', message });
  const production = env.NODE_ENV === 'production';
  add('production-mode', production, 'NODE_ENV harus production');
  add('session-secret', Boolean(env.SESSION_SECRET && Buffer.byteLength(env.SESSION_SECRET, 'utf8') >= 32 && env.SESSION_SECRET !== 'ganti-secret-ini-sebelum-production'), 'SESSION_SECRET acak minimal 32 byte');
  let originValid = false;
  try { const u = new URL(env.APP_ORIGIN || ''); originValid = u.protocol === 'https:' && Boolean(u.hostname) && !['localhost','127.0.0.1'].includes(u.hostname); } catch {}
  add('https-origin', originValid, 'APP_ORIGIN harus URL HTTPS publik yang nyata');
  let uploadValid = false;
  if (env.NOTULEN_UPLOAD_DIR && path.isAbsolute(env.NOTULEN_UPLOAD_DIR)) {
    const upload = path.resolve(env.NOTULEN_UPLOAD_DIR);
    uploadValid = !upload.startsWith(root + path.sep) && upload !== root && exists(upload);
  }
  add('persistent-upload', uploadValid && env.CONFIRM_PERSISTENT_UPLOAD_STORAGE === 'YES', 'Volume unggahan harus ada, di luar source, persisten dan diverifikasi operator');
  add('postgres-url', /^postgres(?:ql)?:\/\//.test(env.DATABASE_URL || ''), 'DATABASE_URL PostgreSQL wajib tersedia');
  // This is deliberately blocked until the actual HTTP routes use PostgreSQL end-to-end.
  add('postgres-full-http-runtime', false, 'BLOKER KODE: HTTP auth, notulensi, audit, dan modul lain belum seluruhnya PostgreSQL; mode hybrid tidak layak production');
  add('approved-hosting', env.INSTITUTION_HOSTING_APPROVED === 'YES', 'Server/hosting dan publikasi data harus disetujui instansi');
  add('backup-recovery', env.BACKUP_RESTORE_VERIFIED === 'YES', 'Backup serta uji pemulihan database dan dokumen harus dibuktikan');
  return { ok: checks.every(x => x.status === 'PASS'), checks };
}
if (require.main === module) {
  const report = check();
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) { console.error('BLOCK: E-DITRENDUK belum boleh dinyatakan siap operasional publik.'); process.exitCode = 1; }
}
module.exports = { check };
