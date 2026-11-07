'use strict';
// Read-only external HTTP/HTTPS verification. No credentials, no private data.
const { URL } = require('node:url');
async function check(origin, fetchImpl=fetch) {
  const u = new URL(origin);
  if (!['https:', 'http:'].includes(u.protocol)) throw Error('URL harus HTTP(S)');
  if (u.username || u.password || u.search || u.hash || u.pathname !== '/') throw Error('Gunakan origin saja, tanpa kredensial/path/query');
  const local = ['localhost','127.0.0.1','[::1]'].includes(u.hostname);
  if (!local && u.protocol !== 'https:') throw Error('URL publik wajib HTTPS');
  const results = [];
  for (const route of ['/', '/api/health', '/api/ready']) {
    const ctrl = new AbortController();
    const timer = setTimeout(()=>ctrl.abort(), 8000);
    try {
      const response = await fetchImpl(new URL(route,u),{method:'GET',redirect:'manual',signal:ctrl.signal,headers:{'accept':'application/json,text/html'}});
      const type = response.headers.get('content-type')||'';
      let valid = response.status===200;
      if (route.startsWith('/api/')) {
        valid = valid && type.includes('application/json');
        if (valid) { const body=await response.json(); valid=body && body.ok===true; }
      }
      results.push({route,status:response.status,ok:valid});
    } finally { clearTimeout(timer); }
  }
  return {origin:u.origin,ok:results.every(r=>r.ok),results};
}
if(require.main===module) {
  const origin=process.argv[2];
  if(!origin) { console.error('Penggunaan: npm run public-url-smoke -- https://domain-resmi.example');process.exitCode=2; }
  else check(origin).then(result=>{ console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1; }).catch(err=>{console.error('FAIL:',err.message);process.exitCode=1;});
}
module.exports={check};
