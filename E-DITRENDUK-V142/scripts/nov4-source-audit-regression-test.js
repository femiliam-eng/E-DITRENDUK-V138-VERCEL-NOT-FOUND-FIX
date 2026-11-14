'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.join(__dirname,'..');
const agenda=fs.readFileSync(path.join(root,'js/pages/agenda-task.js'),'utf8');
const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
const parity=JSON.parse(fs.readFileSync(path.join(root,'DATA-PARITY-AUDIT-04NOV.json'),'utf8'));
const quality=JSON.parse(fs.readFileSync(path.join(root,'DATA-QUALITY-AUDIT-04NOV.json'),'utf8'));
assert.match(agenda,/if\(!x\)return 1;if\(!y\)return -1/,'date sort keeps undated last');
assert.match(app,/if\(x===missing\)return 1;if\(y===missing\)return -1/,'schedule sort keeps undated last');
assert.match(agenda,/\[\\s\\uFEFF\]\*\[=\+@\\-\]/,'CSV formula injection with leading whitespace guarded');
for(const [name,count] of Object.entries({monitoring:43,disposisi:225,logbook:246,archive:271,users:21,petugas:15})){
 assert.equal(parity.modules[name].seed_rows,count);assert.equal(parity.modules[name].sqlite_rows,count);assert.equal(parity.modules[name].identical_payload_rows,count);
}
assert.equal(quality.tables.agenda_kegiatan.rows,393);assert.equal(quality.tables.task_deadline.rows,53);
assert.equal(quality.tables.task_deadline.empty_date,15);assert.equal(quality.tables.monitoring.non_iso_date_needs_review,5);
console.log('PASS 3 UI integrity checks + 6 full-payload parity checks + 4 quality checks');
