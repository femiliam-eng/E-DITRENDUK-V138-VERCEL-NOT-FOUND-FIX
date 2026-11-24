'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const root=path.join(__dirname,'..'),read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
assert.match(read('fasilitasi.html'),/data-page="fasilitasi"/);
assert.match(read('fasilitasi.html'),/appHeader/);assert.match(read('fasilitasi.html'),/appSidebar/);
assert.match(read('js/layout.js'),/Riwayat aktivitas saya/);
assert.match(read('js/layout.js'),/API\.profileActivity\(\)/);
assert.match(read('server-postgres.js'),/WHERE account_id=\$1 ORDER BY created_at/);
assert.match(read('server-postgres.js'),/WHERE id=\$2 RETURNING/);
const m=JSON.parse(read('data-import/excel-v132-manifest.json'));
assert.equal(m.totalSourceRows,7089);
assert.equal(m.totalMappedRows,475);
const source=fs.readFileSync(path.join(root,'data-import/excel-v132-source.jsonl.gz'));
const records=zlib.gunzipSync(source).toString('utf8').trim().split('\n');assert.equal(records.length,m.totalSourceRows);
const modules=zlib.gunzipSync(fs.readFileSync(path.join(root,'data-import/excel-v132-modules.jsonl.gz'))).toString('utf8').trim().split('\n').map(x=>JSON.parse(x));
assert.equal(modules.length,475);
for(const r of modules){assert.match(r.payload.id,/^(agd|tsk)_[a-f0-9]+$/);assert.ok(['agenda_kegiatan','task_deadline'].includes(r.table));}
assert.match(read('scripts/v132-import-supabase.js'),/ON CONFLICT DO NOTHING/);
console.log('V132 PASS: fasilitasi, profil, endpoint per akun, staging 7089 baris, pemetaan 475 baris, keamanan impor.');
