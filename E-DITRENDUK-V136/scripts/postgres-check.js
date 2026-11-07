'use strict';
// V131: no psql executable required. Read-only, no credentials printed.
async function check(connectionString=process.env.DATABASE_URL,ClientType){
 ClientType=ClientType||require('pg').Client;
 if(!connectionString)throw Error('DATABASE_URL belum diatur pada terminal ini.');
 const client=new ClientType({connectionString,connectionTimeoutMillis:8000,query_timeout:8000});
 try{
  await client.connect();
  const result=await client.query(`SELECT current_database() AS database, current_user AS db_user, 
    (SELECT COUNT(*)::int FROM information_schema.tables WHERE table_schema='public' AND table_name='accounts') AS accounts_table`);
  const info=result.rows[0];
  if(info.accounts_table!==1)return {ok:false,database:info.database,detail:'Tabel accounts belum ada. Periksa migrasi database.'};
  const counts=await client.query("SELECT COUNT(*)::int AS n,COUNT(*) FILTER (WHERE role='Superadmin' AND status='Aktif')::int AS admins FROM accounts");
  return {ok:true,database:info.database,accounts:counts.rows[0].n,activeSuperadmins:counts.rows[0].admins};
 }finally{await client.end().catch(()=>{});}
}
if(require.main===module)check().then(x=>{console.log(JSON.stringify(x,null,2));if(!x.ok)process.exitCode=1;}).catch(e=>{console.error('Koneksi PostgreSQL gagal:',e.code||e.message);process.exitCode=1;});
module.exports={check};
