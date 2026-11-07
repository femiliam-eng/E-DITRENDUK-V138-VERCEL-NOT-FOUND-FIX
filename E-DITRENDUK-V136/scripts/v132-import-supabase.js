'use strict';
// V132: idempotent Excel staging + optional Agenda/Task publication into PostgreSQL/Supabase.
// Never deletes or overwrites existing records. --apply is forbidden without explicit confirmation.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),readline=require('node:readline');
const root=path.join(__dirname,'..','data-import');
async function *records(file){
 const stream=fs.createReadStream(path.join(root,file)).pipe(zlib.createGunzip());
 for await(const line of readline.createInterface({input:stream,crlfDelay:Infinity})) if(line.trim())yield JSON.parse(line);
}
const staging=`CREATE TABLE IF NOT EXISTS ed_source_excel_rows (
 source_hash text NOT NULL, workbook text NOT NULL, sheet text NOT NULL, row_number integer NOT NULL,
 cells jsonb NOT NULL, imported_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (source_hash,sheet,row_number)
)`;
async function main(){
 const apply=process.argv.includes('--apply'),publish=process.argv.includes('--publish-modules');
 if(publish&&!apply)throw Error('Gunakan --apply untuk mempublikasikan data modul.');
 if(apply&&process.env.CONFIRM_EXCEL_IMPORT!=='YES')throw Error('Sebelum menulis, backup PostgreSQL lalu set CONFIRM_EXCEL_IMPORT=YES.');
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'excel-v132-manifest.json'),'utf8'));
 const uri=process.env.DATABASE_URL;
 if(!uri||!/^(postgres|postgresql):\/\//.test(uri)){console.log('DRY RUN OFFLINE: DATABASE_URL belum tersedia; data disiapkan tetapi BELUM diunggah.',JSON.stringify({sourceRows:manifest.totalSourceRows,moduleRows:manifest.mappedModuleRows}));if(apply)process.exitCode=1;return;}
 const {Pool}=require('pg'),pool=new Pool({connectionString:uri,connectionTimeoutMillis:10000});let client;
 try{
  client=await pool.connect();
  const count=await client.query('SELECT current_database() AS name');
  console.log('Database target:',count.rows[0].name);
  console.log('Source staged:',manifest.totalSourceRows,'baris pada',manifest.sources.length,'sheet.');
  console.log('Target modul:',manifest.mappedModuleRows);
  for(const table of ['agenda_kegiatan','task_deadline']){
   const r=await client.query('SELECT to_regclass($1) AS exists',[table]);if(!r.rows[0].exists)throw Error('Tabel '+table+' belum tersedia; jalankan migrasi PostgreSQL dulu.');
  }
  if(!apply){console.log('DRY RUN: tidak ada tabel/data diubah. Tambah --apply dengan konfirmasi untuk impor sumber; --publish-modules untuk menampilkan Agenda/Task di aplikasi.');return;}
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock($1)',[1322026]);
  await client.query(staging);
  let staged=0,source=0;
  const sourceBatch=[];
  async function flushSource(){
    if(!sourceBatch.length)return;
    const params=[], tuples=[];
    for(const r of sourceBatch){
      const p=params.length;
      params.push(r.sha256,r.source,r.sheet,r.row,JSON.stringify(r.cells));
      tuples.push(`($${p+1},$${p+2},$${p+3},$${p+4},$${p+5}::jsonb)`);
    }
    const result=await client.query('INSERT INTO ed_source_excel_rows(source_hash,workbook,sheet,row_number,cells) VALUES '+tuples.join(',')+' ON CONFLICT DO NOTHING',params);
    staged+=result.rowCount;sourceBatch.length=0;
  }
  for await(const row of records('excel-v132-source.jsonl.gz')){
    source++; sourceBatch.push(row);if(sourceBatch.length>=100)await flushSource();
  }
  await flushSource();
  let created=0,sourceMapped=0;
  const moduleBatches={agenda_kegiatan:[],task_deadline:[]};
  async function flushModule(table){
    const batch=moduleBatches[table];if(!batch.length)return;
    const params=[],tuples=[];
    for(const body of batch){
      const p=params.length;
      params.push(body.id,JSON.stringify(body));
      tuples.push(`($${p+1},$${p+2}::jsonb)`);
    }
    const result=await client.query(`INSERT INTO ${table}(id,payload) VALUES `+tuples.join(',')+' ON CONFLICT (id) DO NOTHING',params);
    created+=result.rowCount;batch.length=0;
  }
  if(publish)for await(const row of records('excel-v132-modules.jsonl.gz')){
    if(!Object.hasOwn(moduleBatches,row.table))throw Error('Nama tabel tidak sah.');
    moduleBatches[row.table].push(row.payload);sourceMapped++;
    if(moduleBatches[row.table].length>=100)await flushModule(row.table);
  }
  if(publish){await flushModule('agenda_kegiatan');await flushModule('task_deadline');}
  if(source!==manifest.totalSourceRows)throw Error('Jumlah baris sumber berubah dari manifest.');
  if(publish&&sourceMapped!==manifest.totalMappedRows)throw Error('Jumlah baris modul berubah dari manifest.');
  await client.query('COMMIT');
  console.log(JSON.stringify({ok:true,sourceRows:source,newlyStaged:staged,published:publish,newModuleRecords:created,skippedExisting:true}));
 }catch(e){if(client)try{await client.query('ROLLBACK')}catch{};throw e;}finally{if(client)client.release();await pool.end();}
}
if(require.main===module)main().catch(e=>{console.error('IMPOR GAGAL:',e.message);process.exitCode=1;});
module.exports={records,staging};
