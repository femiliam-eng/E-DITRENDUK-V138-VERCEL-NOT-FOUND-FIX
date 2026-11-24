'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
const agenda=fs.readFileSync(path.join(root,'js/pages/agenda-task.js'),'utf8');
const checks=[
 ['RAKOM tidak memalsukan progres minimum 1%',!app.includes('Math.max(1,Math.min(99,Number(x.progress)||0))')],
 ['RAKOM memberi hasil kosong yang jelas',app.includes('Tidak ada arahan yang sesuai pencarian dan filter.')],
 ['RAKOM menyegarkan notifikasi saat simpan',app.includes("document.dispatchEvent(new Event('workspace-data-updated'));try{localStorage.setItem('ed_workspace_updated'")],
 ['RAKOM mencegah penyimpanan ganda',app.includes("if(saveBtn.disabled)return;saveBtn.disabled=true;")],
 ['RAKOM bootstrap array kosong ditangani',app.includes('if(!Array.isArray(D.disposisi))D.disposisi=[]')],
 ['Task tidak mengubah urutan array data',agenda.includes('))).slice().sort((a,b)=>')],
 ['Pencarian Agenda/Task memakai locale Indonesia',agenda.includes("search.value.trim().toLocaleLowerCase('id-ID')")],
 ['Task status tepat Done/Not yet',agenda.includes("['Semua','Done','Not yet']")]
];
for(const [name,ok] of checks){assert.ok(ok,name);console.log('PASS',name)}
console.log('PASS',checks.length,'pemeriksaan integritas RAKOM/Task');
