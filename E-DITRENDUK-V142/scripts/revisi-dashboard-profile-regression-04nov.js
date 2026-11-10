'use strict';
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');const read=x=>fs.readFileSync(path.join(root,x),'utf8');
const dashboard=read('js/v6.js'),app=read('js/app.js'),layout=read('js/layout.js'),index=read('js/pages/index.js'),rakom=read('js/revisi27.js');
const checks=[
 ['Dashboard tidak menimpa progres mingguan',!dashboard.includes("score.textContent=x.completion+'%'")],
 ['Dashboard memperbarui statistik dari API',dashboard.includes('Object.entries(ids)')],
 ['Dashboard memvalidasi data API',dashboard.includes('Statistik dashboard tidak lengkap')],
 ['Dashboard merespons perubahan lokal',dashboard.includes("addEventListener('workspace-data-updated',dashboard)")],
 ['Dashboard merespons tab lain',dashboard.includes("ed_workspace_updated")],
 ['Task Deadline tidak memakai fallback RAKOM',app.includes('window.ED_TASK_DEADLINES:[]')],
 ['KPI tugas menampilkan belum dimuat',app.includes("unfinished.length:'—'")],
 ['Daftar tugas memberi pesan memuat',app.includes('Memuat tugas dari server')],
 ['Status selesai hanya cocok dengan nilai tepat',app.includes("['done','selesai','final','lengkap'].includes(s.trim())")],
 ['Repository menginisialisasi data bila kosong',app.includes('if(!Array.isArray(D.monitoring))D.monitoring=[]')],
 ['Foto profil memvalidasi MIME',layout.includes("'image/png','image/jpeg','image/webp'")],
 ['Foto profil menolak file kosong',layout.includes('file.size===0')],
 ['Foto profil mencegah unggah ganda',layout.includes('if(savePhoto.disabled)return')],
 ['Foto profil mengembalikan tombol',layout.includes('savePhoto.disabled=false;deletePhoto.disabled=false')],
 ['Hapus foto mengembalikan tombol',layout.includes('deletePhoto.disabled=false;savePhoto.disabled=false')],
 ['RAKOM menyediakan filter To Do',rakom.includes("'Belum mulai','To Do','Terlambat'")],
 ['Beranda memuat tugas dari API',index.includes("API.list('task-deadline')")],
];
for(const [name,ok] of checks){assert.ok(ok,name);console.log('PASS',name)}console.log(`${checks.length} pemeriksaan regresi lulus.`);
