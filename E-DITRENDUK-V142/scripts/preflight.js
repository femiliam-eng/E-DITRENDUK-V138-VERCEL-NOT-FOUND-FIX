'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');let fail=false;
function ok(name,value){console.log(`${value?'✓':'✗'} ${name}`);if(!value)fail=true}
ok('Node >= 22.5',Number(process.versions.node.split('.')[0])>=22);
ok('server.js tersedia',fs.existsSync(path.join(root,'server.js')));
ok('folder migrations tersedia',fs.existsSync(path.join(root,'migrations')));
if(process.env.NODE_ENV==='production'){
 ok('SESSION_SECRET production diatur',!!process.env.SESSION_SECRET&&process.env.SESSION_SECRET!=='ganti-secret-ini-sebelum-production');
 ok('APP_ORIGIN production diatur',!!process.env.APP_ORIGIN);
}else console.log('i Mode development: SESSION_SECRET/APP_ORIGIN production belum diwajibkan.');
if(fail)process.exit(1);console.log('Preflight E-DITRENDUK selesai.');
