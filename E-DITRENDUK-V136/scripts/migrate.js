'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const root=path.resolve(__dirname,'..');
const dataDir=path.join(root,'backend','data');
fs.mkdirSync(dataDir,{recursive:true});
const db=new DatabaseSync(path.join(dataDir,'editrenduk.sqlite'));
db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY,name TEXT NOT NULL,applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);`);
const dir=path.join(root,'migrations');
const files=fs.readdirSync(dir).filter(x=>/^\d+.*\.sql$/.test(x)).sort();
for(const file of files){
  const version=Number(file.match(/^(\d+)/)[1]);
  if(db.prepare('SELECT 1 FROM schema_migrations WHERE version=?').get(version)){console.log(`skip ${file}`);continue;}
  const sql=fs.readFileSync(path.join(dir,file),'utf8');
  db.exec('BEGIN');
  try{db.exec(sql);db.prepare('INSERT INTO schema_migrations(version,name) VALUES(?,?)').run(version,file);db.exec('COMMIT');console.log(`applied ${file}`);}catch(e){db.exec('ROLLBACK');throw e;}
}
console.log('Database migration selesai.');
