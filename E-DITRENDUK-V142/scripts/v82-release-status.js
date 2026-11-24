'use strict';
// Offline honest status report: this does not claim live Supabase or public deployment.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const {check}=require('./production-readiness-gate');
const pkg=require('../package.json');
const readiness=check();
const report={application:'E-DITRENDUK',version:pkg.version,generatedAt:new Date().toISOString(),productionReady:readiness.ok,checks:readiness.checks,verification:{liveSupabase:'NOT_TESTED',livePostgres:'NOT_TESTED',publicHttps:'NOT_DEPLOYED'},nextActions:['Uji PostgreSQL dan Supabase Storage di staging terisolasi','Tuntaskan pengalihan seluruh endpoint SQLite ke PostgreSQL','Jalankan backup dan restore drill nyata dengan data uji','Minta persetujuan nama domain dan pilihan hosting']};
if(process.argv.includes('--write')){const dest=path.join(root,'docs','STATUS-KESIAPAN-PRODUKSI.json');fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');console.log(dest)}
else console.log(JSON.stringify(report,null,2));
