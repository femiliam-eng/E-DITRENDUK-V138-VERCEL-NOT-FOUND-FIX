'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'../js/app.js'),'utf8');
const tests=[
 ['Jadwal dibaca ulang dari API',/await API\.list\('schedules'\)/],
 ['Jadwal memastikan respons array',/Format data jadwal tidak valid/],
 ['Jadwal punya tombol perbarui',/refreshSchedules/],
 ['Jadwal dapat dihapus melalui API',/await API\.remove\('schedules', id\)/],
 ['Jadwal punya konfirmasi hapus',/Hapus jadwal petugas ini\?/],
 ['Jadwal mengirim sinyal perubahan',/Jadwal berhasil dihapus[\s\S]{0,150}|ed_workspace_updated/],
 ['Repository dapat dimuat ulang',/await API\.list\('monitoring'\)/],
 ['Repository punya tombol perbarui',/refreshRepository/],
 ['Repository menjaga filter setelah muat ulang',/rows=result\.data\.map[\s\S]{0,200}document\.querySelector\('\.chip\.active'\)/],
 ['Repository menjaga filter setelah tambah',/rows\.unshift\([\s\S]{0,160}render\(document\.querySelector\('\.chip\.active'\)/],
 ['Repository menolak respons API tidak valid',/Format data Monitoring tidak valid/],
 ['Jadwal tidak lagi mengandalkan data palsu di wrapper',/let schedules = \(D\.schedules \|\| \[\]\)/]
];
for(const [name,re] of tests){assert.match(app,re,name);console.log('PASS:',name)}
console.log(`${tests.length} pemeriksaan regresi jadwal/repository lulus.`);
