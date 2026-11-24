'use strict';
// Offline structural check; does not pretend to test a live PostgreSQL database.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const schema=fs.readFileSync(path.join(root,'postgres','schema.sql'),'utf8');
const script=fs.readFileSync(path.join(__dirname,'postgres-parity.js'),'utf8');
for(const table of ['accounts','monitoring','logbook','archive','users_data','disposisi','petugas','schedules','meetings','meeting_sections','meeting_notes','meeting_documentation','audit_logs','storage_files','auth_sessions','schema_migrations']){
 assert.match(schema,new RegExp('CREATE TABLE\\s+'+table+'\\b','i'),`Schema PostgreSQL belum memuat ${table}`);
 assert.ok(script.includes(`'${table}'`),`Parity checker belum memuat ${table}`);
}
console.log('PostgreSQL contract offline V19: LULUS (schema + parity checker; bukan runtime test).');
