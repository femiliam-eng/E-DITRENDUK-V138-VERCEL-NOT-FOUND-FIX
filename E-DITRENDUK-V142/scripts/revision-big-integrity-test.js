const fs=require('fs'),assert=require('assert'),path=require('path');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
const legacy=fs.readFileSync(path.join(root,'js/revisi27.js'),'utf8');
const tests=[
 ['no competing observer',()=>assert(!legacy.includes('MutationObserver'))],
 ['native monitoring sort',()=>assert(app.includes('monitorDateSort'))],
 ['native monitoring finance filter',()=>assert(app.includes('monitorFinanceFilter'))],
 ['native monitoring director filter',()=>assert(app.includes('monitorDirectorFilter'))],
 ['native RAKOM status filter',()=>assert(app.includes('rakomFilter'))],
 ['native RAKOM date sort',()=>assert(app.includes('rakomSort'))],
 ['schedule backend CRUD',()=>assert(app.includes("API.create('schedules'")&&app.includes("API.update('schedules'"))],
 ['schedule date validation',()=>assert(app.includes('Tanggal jadwal wajib diisi dengan benar'))],
 ['schedule assignee validation',()=>assert(app.includes('Pilih setidaknya satu petugas'))],
 ['user existing role kept',()=>assert(app.includes('if(val&&!arr.includes(val))'))],
 ['user save disabled during request',()=>assert(app.includes('saveUserButton.disabled=true'))],
 ['user save restored on failure',()=>assert(app.includes('saveUserButton.disabled=false'))]
];
for(const [name,run] of tests){run();console.log('PASS',name)}
console.log(tests.length+' integrity checks passed');
