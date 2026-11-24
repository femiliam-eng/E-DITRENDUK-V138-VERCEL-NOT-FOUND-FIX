 'use strict';
// Offline SQL portability audit. No PostgreSQL connection and no runtime adapter.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
function analyze(source) {
  const findings = [];
  const rules = [
    ['sqlite-upsert', /\bINSERT\s+OR\s+(?:REPLACE|IGNORE)\b/i, 'Ganti dengan INSERT ... ON CONFLICT'],
    ['sqlite-function', /\b(?:json_extract|json_set|strftime|datetime|last_insert_rowid)\s*\(/i, 'Sesuaikan fungsi SQL untuk PostgreSQL'],
    ['sqlite-pragma', /\bPRAGMA\b/i, 'PRAGMA hanya tersedia di SQLite'],
    ['sqlite-placeholder', /\?/, 'Placeholder ? perlu diganti menjadi $1, $2, ...'],
    ['sqlite-boolean', /\b(?:IS\s+TRUE|IS\s+FALSE)\b/i, 'Periksa representasi boolean saat migrasi'],
  ];
  // Scan literal SQL passed directly to db.prepare; dynamic SQL is explicitly reported.
  const re = /\bdb\.prepare\s*\(\s*(['"`])([\s\S]*?)\1\s*\)/g;
  let match;
  while ((match = re.exec(source))) {
    const line = source.slice(0, match.index).split('\n').length;
    const sql = match[2];
    const flags = rules.filter(([,pattern]) => pattern.test(sql)).map(([id,,remedy]) => ({id,remedy}));
    if (match[1] === '`' && sql.includes('${')) flags.push({id:'dynamic-sql',remedy:'Audit interpolasi identifier dan whitelist tabel'});
    findings.push({line,sql:sql.replace(/\s+/g,' ').slice(0,180),flags});
  }
  const prepareCalls = (source.match(/\bdb\.prepare\s*\(/g)||[]).length;
  return {prepareCalls, literalStatements:findings.length, unclassifiedCalls:prepareCalls-findings.length,
    flaggedStatements:findings.filter(x=>x.flags.length).length,
    findings:findings.filter(x=>x.flags.length)};
}
if (process.argv.includes('--self-test')) {
  const sample = "db.prepare('SELECT * FROM a WHERE id=?').get(1);\n"+
    "db.prepare('INSERT OR REPLACE INTO a(id) VALUES(?)').run(1);\n"+
    'db.prepare(`SELECT * FROM ${table}`).all();\n'+
    "db.prepare('SELECT strftime(\"%Y\", created_at) FROM a').all();";
  const result = analyze(sample);
  assert.equal(result.prepareCalls,4);
  assert.equal(result.literalStatements,4);
  assert.equal(result.flaggedStatements,4);
  assert(result.findings.some(x=>x.flags.some(f=>f.id==='dynamic-sql')));
  assert(result.findings.some(x=>x.flags.some(f=>f.id==='sqlite-upsert')));
  console.log('V23 SQL portability audit self-test LULUS');
} else {
  const result = analyze(fs.readFileSync(path.join(root,'server.js'),'utf8'));
  const report = {version:'V23',postgresRuntimeReady:false,notes:'Audit statis SQL literal; query dinamis dan operasi db.exec memerlukan review manual. Bukan adapter PostgreSQL.',...result};
  if (process.argv.includes('--json')) console.log(JSON.stringify(report,null,2));
  else {
    console.log('V23 SQL portability audit (offline, runtime masih SQLite)');
    console.log(`db.prepare: ${result.prepareCalls}; literal terdeteksi: ${result.literalStatements}; belum terklasifikasi: ${result.unclassifiedCalls}; literal berisiko: ${result.flaggedStatements}`);
    for(const item of result.findings) console.log(`baris ${item.line}: ${item.flags.map(x=>x.id).join(', ')} — ${item.sql}`);
    console.log('Lihat JSON: npm run postgres-sql-audit -- --json');
  }
}
