"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const app=read('js/app.js'),html=read('index.html'),pg=read('backend/postgres-agenda-task-handler.js'),unified=read('backend/postgres-unified-handler.js'),dashboard=read('js/pages/index.js'),layout=read('js/layout.js');
const tests=[
 ['no hardcoded 78%',()=>{assert(!/<b>\s*78%\s*<\/b>/.test(html));assert(html.includes('id="weeklyProgress"'))}],
 ['weekly progress from data',()=>assert(app.includes('weeklyDone/weekly.length*100'))],
 ['weekly empty has no fabricated percentage',()=>assert(app.includes("weekly.length?Math.round")&&app.includes(":'—'"))],
 ['dashboard fetches actual task-deadline',()=>assert(dashboard.includes("API.list('task-deadline')"))],
 ['task KPI source is task-deadline',()=>assert(app.includes('window.ED_TASK_DEADLINES'))],
 ['RAKOM To Do preserved',()=>assert(app.includes("'Belum mulai','To Do'"))],
 ['no fabricated 50% progress',()=>assert(!app.includes('Number(x.progress)||50'))],
 ['agenda result saved backend',()=>assert(pg.includes("'hasilKegiatan'"))],
 ['historical date allowed backend',()=>assert(!pg.includes('Number(date.slice(0,4))<2026'))],
 ['reminders available for task-only',()=>assert(unified.includes("!allowed(user,'task-deadline')"))],
 ['reminders permission scoped per table',()=>assert(unified.includes("table==='agenda_kegiatan'?'agenda':'task-deadline'"))],
 ['notifications refresh 15s',()=>assert(layout.includes('refreshNotifications()},15000'))],
 ['header search corrected',()=>assert(read('partials/header.html').includes('placeholder="Cari layanan"'))],
 ['workspace facilitation page',()=>assert(read('backend/static-file-policy.js').includes('fasilitasi.html'))],
];
for(const [name,test] of tests){test();console.log('PASS '+name)}console.log('PASS '+tests.length+' revisi regression checks');
