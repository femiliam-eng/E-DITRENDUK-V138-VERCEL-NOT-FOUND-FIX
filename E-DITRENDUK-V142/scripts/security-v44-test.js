'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../server.js'),'utf8');
for(const token of ['NOTULEN_UPLOAD_DIR','CONFIRM_PERSISTENT_UPLOAD_STORAGE','fs.lstatSync(UPLOAD_DIR).isSymbolicLink()','mode:0o600','fs.lstatSync(file).isFile()']) assert.ok(src.includes(token),token);
console.log('V44 persistent upload storage guards PASS');
