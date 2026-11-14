'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../js/app.js'),'utf8');
function run(tasks){
 const el={};const get=id=>el[id]||(el[id]={textContent:'',title:'',innerHTML:'',onclick:null});
 const context={window:{EXCEL_DATA:{monitoring:[],disposisi:[],logbook:[]},ED_TASK_DEADLINES:tasks,ED_CURRENT_USER:{unit:'DITRENDUK'}},document:{getElementById:get},ED:{esc:v=>String(v??'')},console,Date};
 vm.createContext(context);vm.runInContext(code,context);vm.runInContext('pageIndex()',context);
 return {num:get('kpiTask').textContent,detail:get('kpiTaskDetail').textContent,weekly:get('weeklyProgress').textContent};
}
const tasks=[...Array.from({length:40},(_,i)=>({id:'a'+i,status:'not yet'})),...Array.from({length:13},(_,i)=>({id:'b'+i,status:'done'}))];
let r=run(tasks);assert.equal(r.num,40);assert.match(r.detail,/40 belum selesai · 13 selesai · 53 total/);
r=run([...tasks,tasks[0],tasks[44]]);assert.equal(r.num,40);assert.match(r.detail,/53 total/);
r=run(null);assert.equal(r.num,'—');assert.match(r.detail,/Memuat/);
assert.equal(run([]).weekly,'—');
console.log('V142 dashboard regression: LULUS (53 tugas, 40 belum selesai, deduplikasi, data belum tersedia).');
