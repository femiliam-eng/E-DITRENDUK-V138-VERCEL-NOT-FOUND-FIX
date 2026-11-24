#!/usr/bin/env node
'use strict';
// Read-only external smoke test. Never sends credentials or modifies application data.
const { URL } = require('node:url');
async function run(base, fetchImpl = fetch) {
  const results=[];
  let url;
  try { url=new URL(base); } catch { throw new Error('PUBLIC_URL harus URL HTTPS yang valid'); }
  if(url.protocol!=='https:' || !url.hostname || url.username || url.password || url.search || url.hash) throw new Error('PUBLIC_URL harus HTTPS tanpa kredensial/query/fragment');
  const root=url.origin;
  for(const endpoint of ['/', '/api/health', '/api/ready']) {
    try {
      const res=await fetchImpl(root+endpoint,{method:'GET',redirect:'manual',signal:AbortSignal.timeout(10000),headers:{'Accept':'text/html,application/json'}});
      const ok=res.status>=200&&res.status<300;
      results.push({endpoint,status:res.status,result:ok?'PASS':'FAIL'});
    } catch(e) { results.push({endpoint,result:'FAIL',reason:e.message}); }
  }
  return {url:root,ok:results.every(x=>x.result==='PASS'),results,note:'Pemeriksaan URL bukan bukti kesiapan produksi; jalankan gate, integrasi PostgreSQL/Supabase dan restore drill.'};
}
if(require.main===module) run(process.env.PUBLIC_URL||process.argv[2]).then(x=>{console.log(JSON.stringify(x,null,2));if(!x.ok)process.exitCode=1}).catch(e=>{console.error(e.message);process.exitCode=1});
module.exports={run};
