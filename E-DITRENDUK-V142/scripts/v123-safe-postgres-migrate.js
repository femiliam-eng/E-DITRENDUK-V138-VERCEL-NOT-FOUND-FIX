#!/usr/bin/env node
'use strict';
// Transactional, non-destructive database setup for PostgreSQL-only E-DITRENDUK.
// Explicit --apply and target confirmation required; never run automatically on startup.
const fs=require('node:fs');
const path=require('node:path');
const {checkPostgresReadiness}=require('../backend/postgres-production-readiness');
const root=path.resolve(__dirname,'..');
const migrations=Object.freeze([
 'postgres/migrations/v46-notulen-submissions.sql',
 'postgres/migrations/v65-agenda-task.sql',
 'postgres/migrations/v67-password-reset.sql',
 'postgres/migrations/v116-shared-rate-limit.sql',
 'postgres/migrations/v117-profile-photos.sql',
 'postgres/migrations/v123-fasilitasi.sql'
]);
const baseline='postgres/schema.sql';
function scriptFor(file){
 const sql=fs.readFileSync(path.join(root,file),'utf8');
 // Legacy V46 migration wraps itself in BEGIN/COMMIT. Remove full-line wrappers
 // so only this runner controls the single atomic transaction.
 return sql.replace(/^\s*(?:BEGIN|COMMIT)\s*;\s*$/gmi,'');
}
function plan(){return {baseline,upgrades:[...migrations],policy:'No DROP, TRUNCATE, DELETE, import, or reset. Transaction and advisory lock; requires explicit --apply.'};}
function checkSQL(file,sql){
 // Protect against accidents in packaged migration files; not a SQL parser.
 const source=sql.replace(/--[^\n]*/g,'').replace(/\/\*[\s\S]*?\*\//g,'');
 if(/\b(?:BEGIN|COMMIT|ROLLBACK)\s*;/i.test(source))throw Error(`Nested transaction in ${file}`);
 if(/\b(?:DROP\s+(?:TABLE|SCHEMA|DATABASE)|TRUNCATE|DELETE\s+FROM|ALTER\s+TABLE\s+\S+\s+DROP|COPY\s+\S+\s+FROM)\b/i.test(source))throw Error(`Unsafe database operation in ${file}`);
}
async function apply(client){
 if(!client||typeof client.query!=='function')throw TypeError('PostgreSQL client required');
 let started=false;
 try{
  await client.query('BEGIN');started=true;
  await client.query("SET LOCAL lock_timeout = '10s'");
  await client.query("SET LOCAL statement_timeout = '120s'");
  await client.query('SELECT pg_advisory_xact_lock(214748364,123)');
  const {rows}=await client.query(`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname=current_schema() AND tablename IN ('accounts','monitoring','auth_sessions','schema_migrations')`);
  const found=new Set(rows.map(r=>r.tablename));
  let mode;
  if(!found.size){
   mode='fresh';const sql=scriptFor(baseline);checkSQL(baseline,sql);await client.query(sql);
  }else if(found.has('accounts')&&found.has('monitoring')&&found.has('auth_sessions'))mode='upgrade';
  else throw Error('Database berisi skema parsial/tidak dikenal. Jangan timpa: periksa dan backup secara manual.');
  for(const file of migrations){const sql=scriptFor(file);checkSQL(file,sql);await client.query(sql);}
  const result=await checkPostgresReadiness(client);
  if(!result.ok)throw Error('Migrasi belum lengkap: '+result.missing.join(', '));
  await client.query('COMMIT');started=false;
  return {ok:true,mode,upgrades:migrations.length,readiness:'PASS'};
 }catch(e){if(started){try{await client.query('ROLLBACK')}catch{}}throw e;}
}
async function main(argv=process.argv.slice(2),env=process.env){
 if(argv.length===0||argv.includes('--plan')){console.log(JSON.stringify(plan(),null,2));return;}
 if(argv.length!==1||argv[0]!=='--apply')throw Error('Usage: node scripts/v123-safe-postgres-migrate.js [--plan|--apply]');
 if(!env.DATABASE_URL)throw Error('DATABASE_URL wajib diatur pada secret environment.');
 const parsed=new URL(env.DATABASE_URL);
 if(!['postgres:','postgresql:'].includes(parsed.protocol)||!parsed.hostname||!parsed.pathname||parsed.pathname==='/')throw Error('DATABASE_URL PostgreSQL tidak valid.');
 if(env.CONFIRM_DATABASE_MIGRATION!==parsed.pathname.slice(1))throw Error('Set CONFIRM_DATABASE_MIGRATION sesuai nama database target setelah backup diverifikasi.');
 const {Client}=require('pg');
 const client=new Client({connectionString:env.DATABASE_URL,connectionTimeoutMillis:10000});
 try{await client.connect();console.log(JSON.stringify(await apply(client),null,2));}
 finally{await client.end();}
}
if(require.main===module)main().catch(e=>{console.error('GAGAL migrasi aman:',e.message);process.exitCode=1;});
module.exports={apply,plan,main,checkSQL};
