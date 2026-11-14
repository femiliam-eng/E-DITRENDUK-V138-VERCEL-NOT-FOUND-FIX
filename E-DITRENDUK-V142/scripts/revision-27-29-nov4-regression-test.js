'use strict';
const fs=require('node:fs');const assert=require('node:assert/strict');const path=require('node:path');
const app=fs.readFileSync(path.resolve(__dirname,'../js/app.js'),'utf8');
const task=fs.readFileSync(path.resolve(__dirname,'../js/pages/agenda-task.js'),'utf8');
const fasilitasi=fs.readFileSync(path.resolve(__dirname,'../fasilitasi.html'),'utf8');
const checks=[
 ['Final hijau',/s\.includes\('final'\)/.test(app)],
 ['Repository urut tanggal',app.includes('repoDateSort')&&app.includes('ditrendukDate(x.tanggal)')],
 ['Repository tidak kirim ganda',app.includes('saveButton.disabled=true;try{const r=await API.create')],
 ['Logbook urut periode',app.includes('logDateSort')&&app.includes('periodDate(x)')],
 ['Logbook filter seluruh periode',app.includes('Semua bulan')],
 ['Task status 3 pilihan',task.includes("['Semua','Done','Not yet']")],
 ['Agenda hasil kegiatan',task.includes('hasilKegiatan')],
 ['Jenis Fasilitasi halaman tersedia',fasilitasi.includes('Fasilitasi Data')&&fasilitasi.includes('Narasumber')],
];
for(const [name,pass] of checks){assert.ok(pass,'GAGAL: '+name);console.log('PASS:',name)}
