'use strict';
// Read-only inventory: fails when SQLite remains on the HTTP runtime path.
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'server.js'),'utf8');
const checks={
  sqliteDatabaseOpen:/\bopenDatabase\s*\(/g,
  sqliteDirectQuery:/\bdb\.(?:prepare|exec|transaction)\s*\(/g,
  sqliteRepositoryConstruction:/\bcreate(?:Payload|Session|Account|Audit|Storage|Meeting)Repository\s*\(db\)/g,
  hybridFeatureFlag:/\b(?:PG_PRIMARY_AUTH|PG_PRIMARY_PAYLOAD|PG_PRIMARY_AGENDA_TASK|PG_READ_PREVIEW)\b/g,
  legacyPublicOverride:/\bALLOW_SQLITE_PUBLIC\b/g,
};
const findings=Object.fromEntries(Object.entries(checks).map(([key,re])=>[key,[...source.matchAll(re)].length]));
const ready=Object.values(findings).every(v=>v===0);
const report={ready,findings,liveVerificationRequired:['PostgreSQL schema and migrations','authentication and sessions','agenda and attachment concurrency','notulen and private storage','backup/restore','HTTPS staging']};
if(require.main===module){console.log(JSON.stringify(report,null,2));process.exitCode=ready?0:2;}
module.exports={checks,findings,ready};
