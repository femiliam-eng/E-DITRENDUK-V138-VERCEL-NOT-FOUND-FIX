'use strict';
// Offline inventory of legacy SQLite dependencies and PostgreSQL routes.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
const lines=server.split(/\r?\n/);
const categories=[
 ['sqlite-open',/openDatabase\s*\(/],
 ['sqlite-direct',/\bdb\.(prepare|exec|transaction)\s*\(/],
 ['legacy-repository',/\b(createPayloadRepository|createSessionRepository|createAccountRepository|createAuditRepository|createStorageRepository|createMeetingRepository)\s*\(/],
 ['postgres-primary-flags',/\bPG_PRIMARY_(AUTH|PAYLOAD|AGENDA_TASK)\b/],
 ['postgres-handler',/\b(pgAgendaTaskHandler|pgUnifiedHandler|pgNotulenHandler|pgAdminAccounts)\b/]
];
function inventory(source=server){
 const rows=source.split(/\r?\n/);
 const hits=categories.map(([id,pattern])=>({id,count:rows.filter(line=>pattern.test(line)).length,lines:rows.flatMap((line,i)=>pattern.test(line)?[i+1]:[])}));
 const blockers=[];
 if(hits.find(x=>x.id==='sqlite-open').count)blockers.push('SQLite masih dibuka di server.js');
 if(hits.find(x=>x.id==='sqlite-direct').count)blockers.push('SQL SQLite masih digunakan langsung di server.js');
 if(hits.find(x=>x.id==='legacy-repository').count)blockers.push('Repository legacy masih diinisialisasi');
 if(/postgres-full-http-runtime',\s*false/.test(fs.readFileSync(path.join(root,'scripts/production-readiness-gate.js'),'utf8')))blockers.push('Production gate PostgreSQL full HTTP masih BLOCK');
 return {application:'E-DITRENDUK',kind:'offline-static-audit',counts:hits,blockers,productionReady:false,disclaimer:'Hitungan berdasarkan pola kode, bukan bukti route sudah termigrasi atau server production aman.'};
}
if(require.main===module){
 const report=inventory();
 if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));
 else{
  console.log('AUDIT RUNTIME E-DITRENDUK (offline)');
  for(const c of report.counts)console.log(c.id+': '+c.count+' (baris '+c.lines.join(', ')+')');
  for(const b of report.blockers)console.log('BLOCK: '+b);
 }
}
module.exports={inventory};
