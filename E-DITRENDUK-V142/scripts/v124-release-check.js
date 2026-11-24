#!/usr/bin/env node
'use strict';
// Read-only V124 release gate. Never imports, migrates, deletes, or touches live business data.
// Runtime and public URL are verified separately in the hosting environment.
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const tests=[
 'check',
 'frontend-test',
 'revisi-27-29-test',
 'v124-production-config-test',
 'v125-live-dependencies-test',
 'v126-employee-go-live-gate-test',
 'v127-employee-login-smoke-test',
 'v128-bootstrap-superadmin-test',
 'v129-first-login-enforcement-test',
 'v130-go-live-progress-test',
 'v130-reminder-calendar-test',
 'v123-safe-migration-test',
 'v122-schema-readiness-test',
 'v121-go-live-http-test',
 'v120-runtime-entry-test',
 'v119-trusted-proxy-http-test',
 'v118-login-abuse-http-test',
 'v117-production-readiness-test',
 'v116-shared-limiter-test',
 'pg-authorization-regression-test',
 'static-file-policy-test',
 'hosting-preflight-test'
];
function run(){
 for(const name of tests){
  const command=process.platform==='win32'?'npm.cmd':'npm';
  const result=spawnSync(command,['run',name],{cwd:root,stdio:'inherit',env:{...process.env,NODE_ENV:'test'},timeout:90000});
  if(result.error||result.status!==0){console.error(`FAIL release-check pada ${name}`);return false;}
 }
 console.log(`PASS release-check: ${tests.length} kelompok tes source tanpa migrasi atau penulisan data`);
 console.log('BELUM GO-LIVE: validasi URL online, PostgreSQL/Storage, backup dan akun karyawan harus diuji terpisah.');
 return true;
}
if(require.main===module){if(!run())process.exitCode=1;}
module.exports={tests,run};
