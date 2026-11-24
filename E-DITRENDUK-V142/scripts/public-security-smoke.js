'use strict';
// Read-only, unauthenticated security checks against staging/public deployment.
const {URL}=require('node:url');
const ROUTES=[
 ['/api/accounts',401,403],['/api/audit',401,403],
 ['/api/notulen-submissions',401,403],
 ['/server.js',403,404],['/backend/database.js',403,404],
 ['/.env',403,404],['/package.json',403,404],
 ['/backend/data/editrenduk.sqlite',403,404],
 ['/scripts/pg-backup-secure.js',403,404],
 ['/api/ready',200,503],
];
async function check(origin,fetchImpl=fetch){
 const base=new URL(origin);
 if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash||base.pathname!=='/')
  throw Error('Gunakan origin HTTPS resmi tanpa path/query/kredensial');
 const results=[];
 for(const [route,...expected] of ROUTES){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{
   const response=await fetchImpl(new URL(route,base),{redirect:'manual',signal:controller.signal,headers:{Accept:'application/json'}});
   const ok=expected.includes(response.status);
   results.push({route,status:response.status,ok});
  }finally{clearTimeout(timer)}
 }
 return {ok:results.every(x=>x.ok),results};
}
if(require.main===module)check(process.argv[2]||'').then(r=>{console.log(JSON.stringify(r,null,2));if(!r.ok)process.exitCode=1}).catch(e=>{console.error('FAIL:',e.message);process.exitCode=1});
module.exports={check,ROUTES};
