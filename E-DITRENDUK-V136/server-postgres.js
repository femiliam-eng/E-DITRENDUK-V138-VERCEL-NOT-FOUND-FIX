'use strict';
// Independent PostgreSQL runtime: no SQLite import, initialization or fallback.
const http=require('node:http');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const net=require('node:net');
const {scryptSync,timingSafeEqual}=crypto;
const {resolvePublicFile}=require('./backend/static-file-policy');
const {originAllowed,csp}=require('./backend/request-security');
const {createPostgresReadGateway}=require('./backend/postgres-read-gateway');
const {createPostgresAccountRepository}=require('./backend/postgres-account-repository');
const {createPostgresSessionRepository}=require('./backend/postgres-session-repository');
const {createPostgresPayloadRepository}=require('./backend/postgres-payload-repository');
const {createPostgresPasswordResetRepository}=require('./backend/postgres-password-reset-repository');
const agenda=require('./backend/postgres-agenda-task-handler');
const unified=require('./backend/postgres-unified-handler');
const notulen=require('./backend/postgres-notulen-handler');
const admin=require('./backend/postgres-admin-accounts');
const {createSupabaseStorage}=require('./backend/supabase-storage');
const {createLocalPrivateStorage}=require('./backend/local-private-storage');
const {createSharedLimiter}=require('./backend/postgres-shared-limiter');
const {checkPostgresReadiness,validateProductionEnvironment}=require('./backend/postgres-production-readiness');
const {createHandler:createAttachmentHandler}=require('./backend/agenda-attachments');

function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
async function readJson(req){let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>1024*1024){const e=Error('Payload terlalu besar');e.statusCode=413;throw e;}chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}')}catch{const e=Error('JSON tidak valid');e.statusCode=400;throw e;}}
function cookies(req){const result={};for(const item of String(req.headers.cookie||'').split(';')){const n=item.indexOf('=');if(n>0){try{result[item.slice(0,n).trim()]=decodeURIComponent(item.slice(n+1).trim())}catch{}}}return result;}
// Only trust an operator-approved reverse proxy that overwrites X-Real-IP.
// Never accept arbitrary X-Forwarded-For from internet clients.
function clientIp(req, env=process.env){
 const remote=String(req.socket?.remoteAddress||'unknown');
 const trusted=String(env.TRUSTED_PROXY_IPS||'').split(',').map(s=>s.trim()).filter(Boolean);
 if(!trusted.includes(remote))return remote;
 const value=req.headers['x-real-ip'];
 if(typeof value!=='string'||!net.isIP(value.trim())||value.includes(','))return remote;
 return value.trim();
}
function hashToken(t){return crypto.createHash('sha256').update(t).digest('hex');}
function verifyPassword(password,stored){const parts=String(stored||'').split(':');if(parts.length!==2)return false;try{const actual=scryptSync(String(password),parts[0],64),expected=Buffer.from(parts[1],'hex');return actual.length===expected.length&&timingSafeEqual(actual,expected);}catch{return false;}}
function hashPassword(password){const salt=crypto.randomBytes(16).toString('hex');return `${salt}:${scryptSync(password,salt,64).toString('hex')}`;}
function validPassword(p){return typeof p==='string'&&p.length>=10&&/[A-Z]/.test(p)&&/[a-z]/.test(p)&&/[0-9]/.test(p);}
function publicUser(u){return {id:u.id,username:u.username,name:u.name,email:u.email,role:u.role,status:u.status,unit:u.unit,permissions:u.permissions,must_change_password:u.must_change_password,mustChangePassword:!!u.must_change_password};}
// In-memory limiter for single-process deployments; use shared Redis for multi-instance limits.
function createWindowLimiter({limit,windowMs,now=Date.now}){
 const hits=new Map();
 return {allow(key){
  const time=now();
  for(const [id,entry] of hits)if(time-entry.since>=windowMs)hits.delete(id);
  const id=String(key);
  const entry=hits.get(id);
  if(!entry){hits.set(id,{since:time,count:1});return true;}
  if(entry.count>=limit)return false;
  entry.count++;return true;
 }};
}
function createApp({pool,storage,attachmentStorage}={}){
 if(!pool||typeof pool.query!=='function')throw Error('PostgreSQL pool wajib');
 const accounts=createPostgresAccountRepository(pool),sessions=createPostgresSessionRepository(pool),payload=createPostgresPayloadRepository(pool),resets=createPostgresPasswordResetRepository(pool);
 const attachment=attachmentStorage?createAttachmentHandler({repo:payload,storage:attachmentStorage}):null;
 const fasilitasiAttachment=attachmentStorage?createAttachmentHandler({repo:payload,storage:attachmentStorage,resource:"fasilitasi",table:"fasilitasi",permission:"agenda"}):null;
 const uploadLimiter=createSharedLimiter(pool,{prefix:'notulen-upload',limit:12,windowMs:15*60*1000});
 const loginIpLimiter=createSharedLimiter(pool,{prefix:'login-ip',limit:30,windowMs:15*60*1000});
 const loginIdentityLimiter=createSharedLimiter(pool,{prefix:'login-identity',limit:8,windowMs:15*60*1000});
 const photoUploadLimiter=createSharedLimiter(pool,{prefix:'photo-upload',limit:12,windowMs:15*60*1000});
 const resetLimiter=createSharedLimiter(pool,{prefix:'password-reset',limit:1,windowMs:60*1000});
 const uploadHandler=storage?notulen.createHandler({pool,storage,readJson,json,uid:(prefix)=>`${prefix}_${crypto.randomUUID()}`,rateLimit:(accountId)=>uploadLimiter.allow(accountId)}):null;
 async function api(req,res,url){
  if(url.pathname==='/api/health')return json(res,200,{ok:true,driver:'postgresql'});
  if(url.pathname==='/api/ready'){try{const readiness=await checkPostgresReadiness(pool);return json(res,readiness.ok?200:503,{ok:readiness.ok,driver:'postgresql',...(!readiness.ok?{missingTables:readiness.missing}: {})});}catch{return json(res,503,{ok:false});}}
  if(url.pathname==='/api/auth/login'&&req.method==='POST'){
   const b=await readJson(req),identity=String(b.username||'').trim().slice(0,120);
   // Independent limits prevent rotating usernames to bypass an IP's login budget.
   // Check both counters on every attempt, so blocked attempts are also counted.
   const ipAllowed=await loginIpLimiter.allow(clientIp(req));
   const identityAllowed=await loginIdentityLimiter.allow(identity.toLowerCase()||'<empty>');
   if(!ipAllowed||!identityAllowed)return json(res,429,{ok:false,message:'Terlalu banyak percobaan login.'});
   const user=await accounts.byUsername(identity);
   if(!user||user.status!=='Aktif'||!verifyPassword(b.password,user.password_hash)){
    return json(res,401,{ok:false,message:'Username atau kata sandi salah.'});
   }
   const token=crypto.randomBytes(32).toString('base64url');
   await sessions.create({id:`sess_${crypto.randomUUID()}`,accountId:user.id,tokenHash:hashToken(token),expiresAt:new Date(Date.now()+28800000).toISOString(),userAgent:String(req.headers['user-agent']||'').slice(0,300),ipAddress:clientIp(req).slice(0,80)});
   res.setHeader('Set-Cookie',`ed_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800${process.env.NODE_ENV==='production'?'; Secure':''}`);
   return json(res,200,{ok:true,user:publicUser(user)});
  }
  if(url.pathname==='/api/auth/forgot-password'&&req.method==='POST'){
   const b=await readJson(req),identity=String(b.identity||'').trim().slice(0,120);
   if(!identity)return json(res,400,{ok:false,message:'Username atau email wajib diisi.'});
   const key=`reset:${clientIp(req)}`;
   if(!await resetLimiter.allow(key))return json(res,429,{ok:false,message:'Tunggu sebelum meminta reset lagi.'});
   const target=await resets.activeIdentity(identity);
   if(target)await resets.request(`reset_${crypto.randomUUID()}`,target.id,identity);
   return json(res,200,{ok:true,message:'Jika akun ditemukan dan aktif, permintaan reset telah dikirim ke Admin/PIC.'});
  }
  const token=cookies(req).ed_session;
  if(url.pathname==='/api/auth/logout'&&req.method==='POST'){
   if(token)await sessions.revokeByTokenHash(hashToken(token));res.setHeader('Set-Cookie','ed_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');return json(res,200,{ok:true});
  }
  const session=token?await sessions.findActiveByTokenHash(hashToken(token),new Date().toISOString()):null;
  const user=session?await accounts.byId(session.account_id):null;
  if(!user||user.status!=='Aktif')return json(res,401,{ok:false,message:'Sesi tidak valid.'});
  // V129: Temporary/bootstrapped passwords may ONLY access their own
  // identity and password-change endpoint until the password is replaced.
  // Enforce this server-side; the frontend modal is not a security boundary.
  if(user.must_change_password && !(['/api/auth/me','/api/auth/change-password','/api/auth/logout'].includes(url.pathname)))
   return json(res,403,{ok:false,code:'PASSWORD_CHANGE_REQUIRED',message:'Ubah kata sandi sementara sebelum mengakses layanan.'});
  // Profile image is private and scoped to the authenticated account.
  if(url.pathname==='/api/profile/photo'&&req.method==='GET'){
   const result=await pool.query('SELECT mime,content FROM ed_profile_photos WHERE account_id=$1',[user.id]);
   if(!result.rows.length)return json(res,404,{ok:false,message:'Foto profil belum ada.'});
   const photo=result.rows[0];res.writeHead(200,{'Content-Type':photo.mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});return res.end(photo.content);
  }
  if(url.pathname==='/api/profile/photo'&&req.method==='POST'){
   if(!await photoUploadLimiter.allow(user.id))return json(res,429,{ok:false,message:'Terlalu banyak unggahan foto. Coba lagi nanti.'});
   const body=await readJson(req);const mime=String(body.mime||'');
   if(!['image/png','image/jpeg','image/webp'].includes(mime))return json(res,400,{ok:false,message:'Gunakan PNG, JPG, atau WEBP.'});
   if(typeof body.data!=='string'||body.data.length>400000||!/^[A-Za-z0-9+/]*={0,2}$/.test(body.data))return json(res,413,{ok:false,message:'Foto maksimal 250 KB.'});
   const content=Buffer.from(body.data,'base64');
   if(!content.length||content.length>250000)return json(res,413,{ok:false,message:'Foto maksimal 250 KB.'});
   const png=content.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'));
   const jpg=content[0]===255&&content[1]===216&&content[2]===255;
   const webp=content.toString('ascii',0,4)==='RIFF'&&content.toString('ascii',8,12)==='WEBP';
   if(!(mime==='image/png'&&png||mime==='image/jpeg'&&jpg||mime==='image/webp'&&webp))return json(res,400,{ok:false,message:'Format isi foto tidak valid.'});
   await pool.query('INSERT INTO ed_profile_photos(account_id,mime,content,updated_at) VALUES($1,$2,$3,NOW()) ON CONFLICT(account_id) DO UPDATE SET mime=EXCLUDED.mime,content=EXCLUDED.content,updated_at=NOW()',[user.id,mime,content]);
   return json(res,200,{ok:true});
  }
  if(url.pathname==='/api/profile/photo'&&req.method==='DELETE'){
   await pool.query('DELETE FROM ed_profile_photos WHERE account_id=$1',[user.id]);return json(res,200,{ok:true});
  }
  // V132: only the authenticated account can see its own activity and change its display name.
  if(url.pathname==='/api/profile/activity'&&req.method==='GET'){
   const {rows}=await pool.query('SELECT id,action,resource,resource_id,created_at FROM audit_logs WHERE account_id=$1 ORDER BY created_at DESC,id DESC LIMIT 30',[user.id]);
   return json(res,200,{ok:true,data:rows});
  }
  if(url.pathname==='/api/profile'&&req.method==='PATCH'){
   const b=await readJson(req);const name=typeof b.name==='string'?b.name.trim():'';
   if(name.length<2||name.length>120||/[<>\x00-\x1f]/.test(name))return json(res,400,{ok:false,message:'Nama harus 2–120 karakter tanpa karakter kontrol.'});
   const result=await pool.query('UPDATE accounts SET name=$1,updated_at=NOW() WHERE id=$2 RETURNING id,username,name,email,role,status,unit,permissions,must_change_password',[name,user.id]);
   await pool.query('INSERT INTO audit_logs(id,account_id,action,resource,resource_id,detail) VALUES($1,$2,$3,$4,$5,$6::jsonb)',[`audit_${crypto.randomUUID()}`,user.id,'UPDATE_PROFILE','account',user.id,JSON.stringify({fields:['name']})]);
   return json(res,200,{ok:true,user:publicUser(result.rows[0])});
  }
  if(url.pathname==='/api/auth/me'&&req.method==='GET'){await sessions.touch(session.id);return json(res,200,{ok:true,user:publicUser(user)});}
  if(url.pathname==='/api/auth/change-password'&&req.method==='POST'){
   const b=await readJson(req);if(!verifyPassword(b.currentPassword,user.password_hash))return json(res,400,{ok:false,message:'Kata sandi saat ini salah.'});
   if(!validPassword(b.newPassword)||b.newPassword===b.currentPassword)return json(res,400,{ok:false,message:'Kata sandi baru tidak memenuhi syarat.'});
   await accounts.setPasswordHash(user.id,hashPassword(b.newPassword));await sessions.revokeForAccount(user.id,session.id);return json(res,200,{ok:true});
  }
  if(url.pathname==='/api/auth/sessions'&&req.method==='GET')return json(res,200,{ok:true,data:await sessions.listActiveForAccount(user.id,new Date().toISOString())});
  if(/^\/api\/auth\/sessions\/[^/]+$/.test(url.pathname)&&req.method==='DELETE'){
   const id=url.pathname.split('/').pop();if(!await sessions.ownedSession(id,user.id))return json(res,404,{ok:false});await sessions.revokeById(id);return json(res,200,{ok:true});
  }
  if(url.pathname==='/api/admin/reset-notifications'&&req.method==='GET'){
   if(user.role!=='Superadmin')return json(res,403,{ok:false,message:'Hanya Superadmin.'});
   const pending=(await resets.list()).filter(r=>r.status==='Menunggu');
   return json(res,200,{ok:true,count:pending.length,data:pending.map(r=>({id:r.id,name:r.name,username:r.username,requestedAt:r.requested_at}))});
  }
  if(url.pathname==='/api/password-reset-requests'&&req.method==='GET'){
   if(user.role!=='Superadmin')return json(res,403,{ok:false,message:'Hanya Superadmin.'});
   return json(res,200,{ok:true,data:await resets.list()});
  }
  const resolveMatch=url.pathname.match(/^\/api\/password-reset-requests\/([^/]+)\/resolve$/);
  if(resolveMatch&&req.method==='POST'){
   if(user.role!=='Superadmin')return json(res,403,{ok:false,message:'Hanya Superadmin.'});
   const b=await readJson(req);
   if(!validPassword(b.password))return json(res,400,{ok:false,message:'Kata sandi sementara tidak memenuhi syarat.'});
   const resolved=await resets.resolve(resolveMatch[1],hashPassword(b.password),user.id);
   if(!resolved)return json(res,404,{ok:false,message:'Permintaan reset tidak ditemukan atau sudah selesai.'});
   return json(res,200,{ok:true,message:'Kata sandi sementara berhasil dibuat.'});
  }
  if(/^\/api\/accounts(?:\/|$)/.test(url.pathname))return admin.handle({req,res,url,user,pool,readJson,json,uid:(p)=>`${p}_${crypto.randomUUID()}`,hashPassword,validPassword});
  if(/^\/api\/fasilitasi\/[a-zA-Z0-9_-]{1,100}\/attachments(?:\/|$)/.test(url.pathname))return fasilitasiAttachment?fasilitasiAttachment({req,res,url,user,readJson,json}):json(res,503,{ok:false,message:'Storage bukti fasilitasi belum tersedia.'});
  if(/^\/api\/agenda\/[a-zA-Z0-9_-]{1,100}\/attachments(?:\/|$)/.test(url.pathname))return attachment?attachment({req,res,url,user,readJson,json}):json(res,503,{ok:false,message:'Storage lampiran belum tersedia.'});
  if(/^\/api\/(agenda|task-deadline)(?:\/|$)/.test(url.pathname))return agenda.handle({req,res,url,user,repo:payload,readJson,json,audit:async(accountId,action,resource,resourceId)=>pool.query('INSERT INTO audit_logs(id,account_id,action,resource,resource_id,detail) VALUES($1,$2,$3,$4,$5,$6::jsonb)',[`audit_${crypto.randomUUID()}`,accountId,action,resource,resourceId,'{}'])});
  if(/^\/api\/(monitoring|logbook|archive|users|disposisi|petugas|schedules|fasilitasi)(?:\/|$)/.test(url.pathname)||['/api/bootstrap','/api/dashboard','/api/audit','/api/reminders'].includes(url.pathname))return unified.handle({req,res,url,user,repo:payload,pool,readJson,json});
  if(/^\/api\/notulen-submissions(?:\/|$)/.test(url.pathname))return uploadHandler?uploadHandler({req,res,url,user}):json(res,503,{ok:false,message:'Storage notulen belum tersedia.'});
  return json(res,404,{ok:false,message:'Endpoint tidak tersedia pada runtime PostgreSQL.'});
 }
 return http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','SAMEORIGIN');res.setHeader('Content-Security-Policy',csp(process.env.NODE_ENV==='production'));
  let url;try{url=new URL(req.url,'http://localhost');}catch{return json(res,400,{ok:false});}
  if(!originAllowed({method:req.method,origin:req.headers.origin,fetchSite:req.headers['sec-fetch-site'],appOrigin:process.env.APP_ORIGIN,isProd:process.env.NODE_ENV==='production',host:req.headers.host,devOrigins:['http://localhost:3000','http://127.0.0.1:3000']}))return json(res,403,{ok:false,message:'Origin tidak diizinkan.'});
  try{if(url.pathname.startsWith('/api/'))return await api(req,res,url);
   if(!['GET','HEAD'].includes(req.method))return json(res,405,{ok:false});
   const target=resolvePublicFile(__dirname,url.pathname==='/'?'/login.html':url.pathname);
   if(!target){res.writeHead(404);return res.end('Not found');}
   res.writeHead(200,{'Content-Type':target.mime,'X-Content-Type-Options':'nosniff'});
   if(req.method==='HEAD')return res.end();fs.createReadStream(target.file).pipe(res);
  }catch(e){console.error('PostgreSQL runtime error:',e.message);return json(res,e.statusCode||500,{ok:false,message:e.statusCode?e.message:'Kesalahan server.'});}
 });
}
async function start(){
 if(!process.env.DATABASE_URL)throw Error('DATABASE_URL wajib. Tidak ada fallback SQLite.');
 const configErrors=validateProductionEnvironment(process.env);
 if(configErrors.length)throw Error('Konfigurasi produksi tidak siap: '+configErrors.join(' '));

 const gateway=createPostgresReadGateway({connectionString:process.env.DATABASE_URL});
 try{const readiness=await checkPostgresReadiness(gateway.pool);if(!readiness.ok)throw Error('Tabel wajib belum tersedia: '+readiness.missing.join(', '));}catch(e){await gateway.close();throw Error('Migrasi PostgreSQL belum lengkap: '+e.message);}
 // Private local storage for Windows/local testing. Production must use configured Supabase Storage.
 const localStorage=process.env.NODE_ENV!=='production' ? createLocalPrivateStorage({directory:path.resolve(process.env.PRIVATE_STORAGE_DIR||path.join(__dirname,'backend','data','private-uploads'))}) : null;
 const storage=process.env.NOTULEN_STORAGE_PROVIDER==='supabase'?createSupabaseStorage({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY,bucket:process.env.SUPABASE_STORAGE_BUCKET||'notulen-private'}):localStorage;
 const attachmentStorage=process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY?createSupabaseStorage({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY,bucket:process.env.AGENDA_STORAGE_BUCKET||'agenda-private'}):localStorage;
 const server=createApp({pool:gateway.pool,storage,attachmentStorage});
 const port=Number(process.env.PORT||3000);
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,()=>{server.off('error',reject);resolve();});});
 console.log(`E-DITRENDUK PostgreSQL-only berjalan: http://localhost:${port}/login.html`);
 for(const sig of ['SIGTERM','SIGINT'])process.on(sig,()=>server.close(()=>gateway.close().then(()=>process.exit(0))));
 return server;
}
if(require.main===module)start().catch(e=>{console.error('PostgreSQL startup gagal:',e.message);process.exitCode=1;});
module.exports={createApp,start,createWindowLimiter,clientIp};
