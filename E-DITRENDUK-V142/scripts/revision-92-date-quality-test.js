const fs=require('node:fs');const assert=require('node:assert/strict');const path=require('node:path');
const root=path.join(__dirname,'..');const entry=fs.readFileSync(path.join(root,'js/pages/agenda-task.js'),'utf8');const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
const checks=[
 ['date quality filter toggle',/let dateReviewOnly=false/.test(entry)],
 ['date quality action',/Periksa tanggal bermasalah/.test(entry)],
 ['date quality accessible state',/aria-pressed/.test(entry)],
 ['date quality filter applied',/!dateReviewOnly\|\|!dateMillis/.test(entry)],
 ['date quality included in summary',/problematic=rows.filter/.test(entry)],
 ['date quality reset',/dateReviewOnly=false;review.setAttribute/.test(entry)],
 ['date quality export filtered',/const visible=selectedRows\(\)/.test(entry)],
 ['narrative date not guessed',/Tanggal naratif\/rentang tidak ditafsirkan/.test(entry)],
 ['legacy date editing guidance',/Jika tanggal sumber kosong/.test(entry)],
 ['repository sorts invalid dates last',/if\(!Number.isFinite\(dx\)\)return Number.isFinite\(dy\)\?1:0/.test(app)],
 ['repository retains ascending/descending',/repoSort==='asc'\?dx-dy:dy-dx/.test(app)],
 ['no destructive SQLite mutation in audit',!fs.existsSync(path.join(root,'scripts','revision-92-sqlite-data-review.js'))||!fs.readFileSync(path.join(root,'scripts','revision-92-sqlite-data-review.js'),'utf8').includes('UPDATE ')]
];
checks.forEach(([name,ok])=>{assert.ok(ok,name);console.log('PASS',name)});console.log(`${checks.length} pemeriksaan tanggal dan filter lulus.`)
