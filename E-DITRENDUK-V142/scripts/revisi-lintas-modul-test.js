const assert=require('node:assert/strict');const fs=require('node:fs');const s=fs.readFileSync('js/app.js','utf8');
assert.match(s,/const sortedRows=rows\.slice\(\)\.sort/,'Monitoring must sort a copy');
assert.match(s,/body\.innerHTML=sortedRows\.filter/,'Monitoring must render sorted copy');
assert.match(s,/Buka Dokumen/,'Repository document link');
assert.match(s,/Dokumen belum tersedia/,'Repository missing document state');
assert.match(s,/const tasks=unfinished\.slice\(\)\.sort/,'Dashboard priority tasks');
assert.match(s,/const pending=mon\.filter/,'Dashboard pending docs');
console.log('PASS: Dashboard, Repository, Monitoring contracts');
