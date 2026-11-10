'use strict';
const fs=require('fs'),assert=require('assert'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'../js/app.js'),'utf8');
const section=src.slice(src.indexOf('pageJadwal = function () {'),src.indexOf('// Logbook: perubahan status'));
for(const [name,pattern] of [
 ['jadwal date sort',/scheduleDateSort/],
 ['jadwal no in-place sort',/schedules\.slice\(\)\.sort/],
 ['jadwal API first',/await API\.update\('schedules', editingId/],
 ['jadwal disable double submit',/saveButton\.disabled = true/],
 ['jadwal reenable after failure',/finally \{ saveButton\.disabled = false; \}/],
 ['jadwal no fake empty data',/Belum ada jadwal tersimpan/],
 ['jadwal refresh notification',/workspace-data-updated/],
 ['users no fake 2026',/peran:x\.peran\|\|'Pegawai',akses:x\.akses\|\|'',aktivasi:x\.aktivasi\|\|''/],
 ['users sync after save',/row\[field\] = next; document\.dispatchEvent/]
]) {assert(pattern.test(name.startsWith('users')?src:section),name);console.log('PASS',name)}
