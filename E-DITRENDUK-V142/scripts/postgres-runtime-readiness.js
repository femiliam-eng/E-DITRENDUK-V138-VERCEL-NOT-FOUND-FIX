'use strict';
// Offline inventory of SQLite-specific runtime coupling. This is NOT a PostgreSQL adapter.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
function inventory(text) {
  const lines = text.split(/\r?\n/);
  const patterns = {
    sqliteImport: /require\(['"]node:sqlite['"]\)/,
    sqliteConstructor: /new DatabaseSync\s*\(/,
    syncPrepare: /\bdb\.prepare\s*\(/,
    syncExec: /\bdb\.exec\s*\(/,
    sqlitePragma: /\bPRAGMA\b/i,
    sqlitePlaceholders: /\?(?=(?:[^'"`]*['"`][^'"`]*['"`])*[^'"`]*$)/,
  };
  return Object.fromEntries(Object.entries(patterns).map(([name, pattern]) => [name, lines.flatMap((line, i) => pattern.test(line) ? [i + 1] : [])]));
}
if (process.argv.includes('--self-test')) {
  const sample = "const { DatabaseSync } = require('node:sqlite');\nconst db = new DatabaseSync('x');\ndb.prepare('SELECT * FROM x WHERE id=?').get('a');\ndb.exec('PRAGMA foreign_keys=ON');";
  const report = inventory(sample);
  assert.deepEqual(report.sqliteImport, [1]);
  assert.deepEqual(report.sqliteConstructor, [2]);
  assert.deepEqual(report.syncPrepare, [3]);
  assert.deepEqual(report.syncExec, [4]);
  assert.deepEqual(report.sqlitePragma, [4]);
  console.log('V22 PostgreSQL runtime readiness self-test LULUS');
} else {
  const report = inventory(src);
  const result = {version: 'V22', runtimeDriver: 'sqlite', postgresRuntimeReady: false,
    reason: 'Server memakai node:sqlite DatabaseSync secara sinkron; adapter async PostgreSQL dan parity endpoint belum tersedia.',
    counts: Object.fromEntries(Object.entries(report).map(([k,v]) => [k,v.length])),
    lines: report};
  if (process.argv.includes('--json')) console.log(JSON.stringify(result, null, 2));
  else {
    console.log('V22 PostgreSQL runtime readiness: BELUM SIAP (SQLite runtime aktif)');
    for (const [key, positions] of Object.entries(report)) console.log(`${key}: ${positions.length} lokasi`);
    console.log('Jalankan npm run postgres-runtime-readiness -- --json untuk lokasi kode.');
  }
}
