'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {resolvePublicFile}=require('../backend/static-file-policy');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'editrenduk-static-'));
try{
 fs.mkdirSync(path.join(root,'js'));fs.writeFileSync(path.join(root,'login.html'),'ok');fs.writeFileSync(path.join(root,'js','api.js'),'ok');fs.writeFileSync(path.join(root,'js','api.js.tmp'),'secret');fs.writeFileSync(path.join(root,'.env'),'secret');fs.writeFileSync(path.join(root,'server.js'),'secret');
 assert(resolvePublicFile(root,'/login.html'));assert(resolvePublicFile(root,'/js/api.js'));
 for(const p of ['/server.js','/.env','/js/api.js.tmp','/js/api.js.bak','/package.json','/backend/data/editrenduk.sqlite','/js/%2e%2e/server.js','/js/%252e%252e/server.js','/js/../login.html','/js/hidden.txt','/js/%00test.js','/missing.html'])assert.equal(resolvePublicFile(root,p),null,p);
 const outside=path.join(root,'..','external-secret-'+process.pid+'.js');fs.writeFileSync(outside,'secret');
 try{fs.symlinkSync(outside,path.join(root,'js','external.js'));assert.equal(resolvePublicFile(root,'/js/external.js'),null)}finally{fs.unlinkSync(outside)}
 console.log('PASS static allowlist, dotfiles, temporary files, traversal, symlink and missing files');
}finally{fs.rmSync(root,{recursive:true,force:true})}
