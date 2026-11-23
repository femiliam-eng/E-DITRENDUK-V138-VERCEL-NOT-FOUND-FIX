'use strict';
// PostgreSQL-only Superadmin account management. All mutations are transactional.
const crypto=require('node:crypto');
const MODULES=new Set(['beranda','repository','notulen','rakom','monitoring','jadwal','logbook','arsip','pengguna','agenda','task-deadline']);
const fields='id,username,email,name,role,status,unit,permissions,must_change_password,created_at,updated_at';
const clean=x=>String(x??'').trim();
const publicRow=r=>({...r,permissions:Array.isArray(r.permissions)?r.permissions:JSON.parse(r.permissions||'[]'),mustChangePassword:!!r.must_change_password});
const permissions=(p,old)=>p===undefined?old:[...new Set(p.filter(x=>MODULES.has(x)))];
async function handle({req,res,url,user,pool,readJson,json,uid,hashPassword,validPassword}){
 const send=(status,body)=>json(res,status,body);
 if(!user||user.status!=='Aktif')return send(401,{ok:false,message:'Sesi tidak valid.'});
 if(user.role!=='Superadmin')return send(403,{ok:false,message:'Hanya Superadmin.'});
 // Preview and execution are restricted to active employees whose temporary password has not been changed.
 // No current password is recovered, no Superadmin/inactive account is changed, and all writes are atomic.
 if(url.pathname==='/api/accounts/bulk-reset-preview'&&req.method==='GET'){
  const result=await pool.query("SELECT count(*)::int AS n FROM accounts WHERE role='Pegawai' AND status='Aktif' AND must_change_password=true");
  return send(200,{ok:true,count:Number(result.rows[0].n),scope:'pending-first-login'});
 }
 if(url.pathname==='/api/accounts/bulk-reset-passwords'){
  if(req.method!=='POST')return send(405,{ok:false,message:'Metode tidak didukung.'});
  const origin=req.headers?.origin;
  try{if(!origin||new URL(origin).host!==req.headers.host||new URL(origin).protocol!=='https:'&&new URL(origin).hostname!=='localhost')
   return send(403,{ok:false,message:'Permintaan harus berasal dari halaman aplikasi.'});}
  catch{return send(403,{ok:false,message:'Origin permintaan tidak valid.'});}
  const b=await readJson(req);
  if(b?.scope!=='pending-first-login'||b?.confirmation!=='RESET PEGAWAI'||!Number.isSafeInteger(b?.expectedCount)||b.expectedCount<1)
   return send(400,{ok:false,message:'Konfirmasi reset massal tidak valid.'});
  const client=await pool.connect();
  try{
   await client.query('BEGIN');
   const {rows:targets}=await client.query("SELECT id,username,name FROM accounts WHERE role='Pegawai' AND status='Aktif' AND must_change_password=true ORDER BY username FOR UPDATE");
   if(targets.length!==b.expectedCount||targets.length>100){
    await client.query('ROLLBACK');
    return send(409,{ok:false,message:'Jumlah akun berubah. Muat ulang daftar dan konfirmasi kembali.'});
   }
   const result=[];
   for(const account of targets){
    const password='Q7m!'+crypto.randomBytes(18).toString('base64url');
    await client.query('UPDATE accounts SET password_hash=$2,must_change_password=true,updated_at=now() WHERE id=$1',[account.id,hashPassword(password)]);
    await client.query('UPDATE auth_sessions SET revoked_at=now() WHERE account_id=$1 AND revoked_at IS NULL',[account.id]);
    result.push({username:account.username,name:account.name,password});
   }
   await client.query('INSERT INTO audit_logs(id,account_id,action,resource,resource_id,detail) VALUES($1,$2,$3,$4,$5,$6::jsonb)',
    [uid('audit'),user.id,'BULK_RESET_PASSWORD','account','pending-first-login',JSON.stringify({count:targets.length,scope:'pending-first-login'})]);
   await client.query('COMMIT');
   // Only return plaintext credentials once to this authenticated Superadmin; never log/store plaintext passwords.
   return send(200,{ok:true,count:result.length,credentials:result,oneTime:true});
  }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
 }
 const match=url.pathname.match(/^\/api\/accounts(?:\/([a-zA-Z0-9_-]{1,100})(?:\/(reset-password))?)?$/);
 if(!match)return send(404,{ok:false});
 const [,id,action]=match;
 if(req.method==='GET'&&!id){const {rows}=await pool.query(`SELECT ${fields} FROM accounts ORDER BY name,id`);return send(200,{ok:true,data:rows.map(publicRow)})}
 if(!['POST','PATCH','PUT'].includes(req.method))return send(405,{ok:false,message:'Metode tidak didukung.'});
 const b=await readJson(req);
 if(!b||typeof b!=='object'||Array.isArray(b))return send(400,{ok:false,message:'Data tidak valid.'});
 if(!id&&req.method!=='POST'||id&&req.method==='POST'&&!action||action&&action!=='reset-password')return send(405,{ok:false});
 if(action){
  if(req.method!=='POST')return send(405,{ok:false});
  if(!validPassword(b.password))return send(400,{ok:false,message:'Password minimal 10 karakter, huruf besar, kecil, dan angka.'});
  const client=await pool.connect();try{
   await client.query('BEGIN');const r=await client.query('SELECT id FROM accounts WHERE id=$1 FOR UPDATE',[id]);
   if(!r.rows.length){await client.query('ROLLBACK');return send(404,{ok:false,message:'Akun tidak ditemukan.'})}
   await client.query('UPDATE accounts SET password_hash=$2,must_change_password=true,updated_at=now() WHERE id=$1',[id,hashPassword(b.password)]);
   await client.query('UPDATE auth_sessions SET revoked_at=now() WHERE account_id=$1 AND revoked_at IS NULL',[id]);
   await client.query('INSERT INTO audit_logs(id,account_id,action,resource,resource_id,detail) VALUES($1,$2,$3,$4,$5,$6::jsonb)',[uid('audit'),user.id,'RESET_PASSWORD','account',id,'{}']);
   await client.query('COMMIT');return send(200,{ok:true});
  }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
 }
 const client=await pool.connect();try{
  await client.query('BEGIN');
  const previous=id?(await client.query(`SELECT ${fields} FROM accounts WHERE id=$1 FOR UPDATE`,[id])).rows[0]:null;
  if(id&&!previous){await client.query('ROLLBACK');return send(404,{ok:false,message:'Akun tidak ditemukan.'})}
  const name=clean(b.name??previous?.name),username=clean(b.username??previous?.username),email=clean(b.email??previous?.email)||null;
  const role=b.role===undefined?(previous?.role||'Pegawai'):b.role,status=b.status===undefined?(previous?.status||'Aktif'):b.status;
  const unit=clean(b.unit??previous?.unit)||'DITRENDUK';
  if(!name||name.length>150||!(/^[a-zA-Z0-9._-]{3,40}$/.test(username))||!['Pegawai','Superadmin'].includes(role)||!['Aktif','Nonaktif'].includes(status)||unit.length>150||email&&email.length>254||b.permissions!==undefined&&!Array.isArray(b.permissions)){
   await client.query('ROLLBACK');return send(400,{ok:false,message:'Nama, username, role, status, unit, email, atau izin tidak valid.'});
  }
  if(id&&username!==previous.username){await client.query('ROLLBACK');return send(400,{ok:false,message:'Username tidak dapat diubah.'})}
  const perms=permissions(b.permissions,previous?publicRow(previous).permissions:role==='Superadmin'?[...MODULES]:['beranda','repository','notulen','rakom','monitoring','logbook','arsip']);
  if(id&&previous.role==='Superadmin'&&(role!=='Superadmin'||status!=='Aktif')){
   const count=await client.query("SELECT count(*)::int AS n FROM accounts WHERE role='Superadmin' AND status='Aktif'");
   if(Number(count.rows[0].n)<=1){await client.query('ROLLBACK');return send(409,{ok:false,message:'Superadmin aktif terakhir tidak boleh dinonaktifkan atau diturunkan.'})}
  }
  let result,newId=id;
  if(!id){
   if(!validPassword(b.password)){await client.query('ROLLBACK');return send(400,{ok:false,message:'Password minimal 10 karakter, huruf besar, kecil, dan angka.'})}
   newId=uid('acc');result=await client.query(`INSERT INTO accounts(id,username,email,password_hash,name,role,status,unit,permissions,must_change_password)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,true) RETURNING ${fields}`,[newId,username,email,hashPassword(b.password),name,role,status,unit,JSON.stringify(perms)]);
  }else{
   result=await client.query(`UPDATE accounts SET name=$2,email=$3,role=$4,status=$5,unit=$6,permissions=$7::jsonb,updated_at=now() WHERE id=$1 RETURNING ${fields}`,[id,name,email,role,status,unit,JSON.stringify(perms)]);
   if(role!==previous.role||status!==previous.status||JSON.stringify(perms)!==JSON.stringify(publicRow(previous).permissions))
    await client.query('UPDATE auth_sessions SET revoked_at=now() WHERE account_id=$1 AND revoked_at IS NULL',[id]);
  }
  await client.query('INSERT INTO audit_logs(id,account_id,action,resource,resource_id,detail) VALUES($1,$2,$3,$4,$5,$6::jsonb)',[uid('audit'),user.id,id?'UPDATE':'CREATE','account',newId,JSON.stringify({fields:Object.keys(b).filter(k=>k!=='password')})]);
  await client.query('COMMIT');return send(id?200:201,{ok:true,data:publicRow(result.rows[0])});
 }catch(e){await client.query('ROLLBACK');if(e.code==='23505')return send(409,{ok:false,message:'Username atau email sudah digunakan.'});throw e}finally{client.release()}
}
module.exports={handle};
