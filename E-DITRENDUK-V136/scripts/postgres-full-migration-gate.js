'use strict';
// Fail-closed, source-derived assessment. No credentials or live DB required.
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
function assess(source=fs.readFileSync(path.join(root,'server.js'),'utf8')){
 const rules=[
  ['sqlite-runtime-open',/\bopenDatabase\s*\(/g,'Remove the synchronous SQLite database initialization'],
  ['sqlite-query',/\bdb\.(?:prepare|exec|transaction)\s*\(/g,'Port direct SQL statements to async parameterized PostgreSQL'],
  ['legacy-repositories',/\bcreate(?:Payload|Session|Account|Audit|Storage|Meeting)Repository\s*\(db\)/g,'Replace SQLite repositories with PostgreSQL implementations'],
  ['hybrid-fallback',/\b(?:PG_PRIMARY_AUTH|PG_PRIMARY_PAYLOAD|PG_PRIMARY_AGENDA_TASK|PG_READ_PREVIEW|PG_WRITE_PREVIEW)\b/g,'Remove hybrid feature flags after routing all endpoints'],
  ['sqlite-production-bypass',/ALLOW_SQLITE_PUBLIC/g,'Remove SQLite production override']
 ];
 const findings=rules.map(([id,re,action])=>({id,occurrences:[...source.matchAll(re)].length,action}));
 return {ready:findings.every(f=>f.occurrences===0),findings,requiresLiveVerification:['PostgreSQL schema migration','real PostgreSQL CRUD/auth/session tests','concurrent attachment CAS','Supabase private storage','backup/restore','HTTPS staging smoke']};
}
if(require.main===module){
 const result=assess();
 console.log(JSON.stringify(result,null,2));
 if(!result.ready)process.exitCode=2;
}
module.exports={assess};
