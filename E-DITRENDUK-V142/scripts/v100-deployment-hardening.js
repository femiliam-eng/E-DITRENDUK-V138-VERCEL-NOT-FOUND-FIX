#!/usr/bin/env node
'use strict';
// Updated checkpoint for the PostgreSQL-only Docker production runtime.
const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
function check(){
 const dockerignore=read('.dockerignore'),gitignore=read('.gitignore'),docker=read('Dockerfile');
 const server=read('server-postgres.js'),compose=read('compose.yaml');
 const example=read('.env.staging.example'),runbook=read('docs/DEPLOYMENT-STAGING-V100.md');
 const checks=[
  ['secret-files-excluded-from-container', ['.env*','backend/data/','uploads/','postgres-export/','*.log'].every(v=>dockerignore.split(/\r?\n/).includes(v))],
  ['secret-files-excluded-from-git', gitignore.split(/\r?\n/).includes('.env*')],
  ['staging-template-postgres-only', ['DATABASE_URL=','APP_ORIGIN=','SUPABASE_URL=','SUPABASE_SERVICE_ROLE_KEY=','SUPABASE_STORAGE_BUCKET=','AGENDA_STORAGE_BUCKET='].every(v=>example.includes(v)) && /REPLACE_PASSWORD/.test(example) && !/DB_DRIVER=sqlite/.test(example)],
  ['container-nonroot-healthy', /\bUSER node\b/.test(docker)&&/HEALTHCHECK/.test(docker)&&/CMD \["node","server-postgres\.js"\]/.test(docker)],
  ['postgres-readiness-failclosed', /checkPostgresReadiness/.test(server)&&/validateProductionEnvironment/.test(server)&&/DATABASE_URL: \$\{DATABASE_URL:\?/.test(compose)],
  ['staging-operator-runbook', ['Supabase','HTTPS','rollback','backup','staging','BLOCK'].every(s=>runbook.toLowerCase().includes(s.toLowerCase()))]
 ];
 return {checks,passed:checks.filter(x=>x[1]).length,readyForProduction:false};
}
if(require.main===module){const result=check();for(const [id,ok] of result.checks)console.log(`${ok?'PASS':'FAIL'} ${id}`);console.log(`CHECKPOINT ${result.passed}/${result.checks.length}; live DB, HTTPS URL and employee UAT still required`);if(result.passed!==result.checks.length)process.exitCode=1;}
module.exports={check};
