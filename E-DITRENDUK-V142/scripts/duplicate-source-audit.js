'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const ignored=new Set(['node_modules','.git','backend/data','uploads']);
const files=[];
function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const abs=path.join(dir,ent.name);const rel=path.relative(root,abs).split(path.sep).join('/');if(ent.isDirectory()){if(!ignored.has(rel))walk(abs);}else if(ent.isFile()&& !rel.endsWith('.log') && !rel.endsWith('.sqlite'))files.push({rel,abs});}}
walk(root);
const groups=new Map();
for(const file of files){const buf=fs.readFileSync(file.abs);if(!buf.length)continue;const hash=crypto.createHash('sha256').update(buf).digest('hex');if(!groups.has(hash))groups.set(hash,[]);groups.get(hash).push(file.rel);}
const duplicates=[...groups.values()].filter(x=>x.length>1);
console.log(JSON.stringify({scanned:files.length,duplicateGroups:duplicates.length,duplicates},null,2));
if(duplicates.length)process.exitCode=1;
