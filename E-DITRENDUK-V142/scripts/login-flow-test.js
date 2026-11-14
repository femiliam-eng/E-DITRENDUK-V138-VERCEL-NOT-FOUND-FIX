'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
function assert(cond,msg){ if(!cond) throw new Error(msg); }
const loginHtml=fs.readFileSync(path.join(ROOT,'login.html'),'utf8');
const loginJs=fs.readFileSync(path.join(ROOT,'js/pages/login.js'),'utf8');
const apiJs=fs.readFileSync(path.join(ROOT,'js/api.js'),'utf8');
const htmlFiles=fs.readdirSync(ROOT).filter(x=>x.endsWith('.html'));
assert(!/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/i.test(loginHtml),'login.html masih memiliki inline script yang diblokir CSP');
assert(loginHtml.includes('js/api.js') && loginHtml.includes('js/pages/login.js'),'script login eksternal belum dimuat');
assert(loginJs.includes("loginForm.addEventListener('submit'") || loginJs.includes("loginForm.addEventListener(\'submit\'"),'handler submit login tidak ditemukan');
assert(loginJs.includes('API.login(username, password)'),'halaman login tidak memanggil API.login');
assert(loginJs.includes('API.me()'),'login belum memverifikasi session');
assert(apiJs.includes("'/api/auth/login'") && apiJs.includes("method: 'POST'"),'API.login bukan POST /api/auth/login');
for(const file of htmlFiles){
  const html=fs.readFileSync(path.join(ROOT,file),'utf8');
  assert(!/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/i.test(html),`${file} masih memiliki inline script yang akan diblokir CSP`);
}
console.log(`Login flow test V14: LULUS (${htmlFiles.length} halaman bebas inline script; submit -> POST login -> verifikasi session).`);
