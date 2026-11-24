'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {validateProductionEnvironment}=require('../backend/postgres-production-readiness');
const {assess}=require('./hosting-preflight');
const good={NODE_ENV:'production', APP_ORIGIN:'https://portal.instansi.go.id', DATABASE_URL:'postgresql://appuser:strong-real-secret@db.instansi.go.id:5432/editrenduk', NOTULEN_STORAGE_PROVIDER:'supabase',SUPABASE_URL:'https://realproject.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'eyJhbGciOiJIUzI1NiJ9.aB2cD3eF4gH5',SUPABASE_STORAGE_BUCKET:'notulen-private',AGENDA_STORAGE_BUCKET:'agenda-private'};
assert.deepEqual(validateProductionEnvironment(good),[]);
assert.equal(assess(good).ready,true);
const cases=[
 ['APP_ORIGIN','https://portal.example.go.id'],
 ['APP_ORIGIN','http://portal.instansi.go.id'],
 ['APP_ORIGIN','https://portal.instansi.go.id/admin'],
 ['APP_ORIGIN','https://localhost/'],
 ['DATABASE_URL','postgresql://app:secret@db.example.invalid/db'],
 ['DATABASE_URL','postgresql://app:REPLACE_PASSWORD@db.instansi.go.id/db'],
 ['DATABASE_URL','postgresql://app@db.instansi.go.id/db'],
 ['DATABASE_URL','sqlite:///local.db'],
 ['SUPABASE_URL','https://example.supabase.co'],
 ['SUPABASE_URL','http://realproject.supabase.co'],
 ['SUPABASE_SERVICE_ROLE_KEY','REPLACE_SECRET_SERVER_ONLY'],
 ['SUPABASE_SERVICE_ROLE_KEY','private-example'],
 ['SUPABASE_SERVICE_ROLE_KEY',''],
 ['SUPABASE_STORAGE_BUCKET','notulen-example'],
 ['AGENDA_STORAGE_BUCKET',''],
 ['NOTULEN_STORAGE_PROVIDER','local']
];
for(const [key,value] of cases){
 const env={...good,[key]:value};
 const failures=validateProductionEnvironment(env);
 assert(failures.length>0,`must reject invalid ${key}`);
 assert.equal(assess(env).ready,false,`preflight must reject invalid ${key}`);
 assert(!JSON.stringify(failures).includes('strong-real-secret'),'no credentials in diagnostics');
}
const sample=fs.readFileSync(path.join(__dirname,'../.env.production.example'),'utf8');
const sampleEnv={};for(const line of sample.split(/\r?\n/)){if(!line||line.startsWith('#'))continue;const at=line.indexOf('=');if(at>0)sampleEnv[line.slice(0,at)]=line.slice(at+1);}
assert(validateProductionEnvironment(sampleEnv).length>=2,'packaged example must NEVER pass production validation');
assert.equal(assess(sampleEnv).ready,false,'packaged example must NEVER pass preflight');
assert.deepEqual(validateProductionEnvironment({NODE_ENV:'development'}),[],'dev remains available');
console.log('PASS V124: 16 rejected unsafe configurations, sample production .env rejected, safe configuration accepted, no secret leaks');
