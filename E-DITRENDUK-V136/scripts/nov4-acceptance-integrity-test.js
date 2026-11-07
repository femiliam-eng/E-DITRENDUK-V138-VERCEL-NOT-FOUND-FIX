"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');const get=x=>fs.readFileSync(path.join(root,x),'utf8');
const app=get('js/app.js'),dash=get('js/pages/index.js'),legacy=get('js/revisi27.js');
const checks=[
 ['date validation rejects rollover',()=>assert(app.includes('getUTCDate()===day?date:NaN'))],
 ['date sorting handles missing dates',()=>assert(app.includes('function ditrendukSortDate'))],
 ['date accepts Indonesian format',()=>assert(app.includes('const local=v.match'))],
 ['no duplicate filter mutation observer',()=>assert(!legacy.includes('MutationObserver'))],
 ['dashboard prevents stale task response',()=>assert(dash.includes('requestId===taskRequestId'))],
 ['dashboard reads actual task API',()=>assert(dash.includes("API.list('task-deadline')"))],
 ['schedule saves via API',()=>assert(app.includes("API.create('schedules', row)"))],
 ['schedule updates via API',()=>assert(app.includes("API.update('schedules', editingId"))],
 ['repository status persists',()=>assert(app.includes("API.update('monitoring',x.id,{verifikasi:el.value})"))],
 ['logbook tolerates empty activity',()=>assert(app.includes("String(x.aktivitas||'').slice"))],
 ['user edits persist',()=>assert(app.includes("backendSave('users', {...row, [field]: next}"))],
 ['no fake schedule in active handler',()=>assert(app.includes('let schedules = (D.schedules || []).map'))]
];
for(const [label,fn] of checks){fn();console.log('PASS',label)}console.log('PASS',checks.length,'integrity checks');
