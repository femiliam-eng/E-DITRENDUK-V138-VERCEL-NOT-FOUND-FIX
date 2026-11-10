'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const schema=fs.readFileSync(path.join(root,'postgres/schema.sql'),'utf8');
const migration=fs.readFileSync(path.join(root,'postgres/migrations/v46-notulen-submissions.sql'),'utf8');
const importer=fs.readFileSync(path.join(root,'scripts/postgres-import.js'),'utf8');
for(const sql of [schema,migration]){
 assert.match(sql,/CREATE TABLE IF NOT EXISTS notulen_submissions/);
 for(const col of ['uploaded_by','meeting_date','stored_path','file_name','size_bytes'])assert.match(sql,new RegExp(col));
 assert.match(sql,/REFERENCES accounts\(id\)/);
}
assert.match(importer,/'notulen_submissions'/);
assert.match(importer,/'auth_sessions'/);
console.log('V46 migration contract PASS');
