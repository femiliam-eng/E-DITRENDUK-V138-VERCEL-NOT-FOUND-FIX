 'use strict';
const crypto=require('node:crypto');
const TYPES={'application/pdf':'pdf','application/msword':'doc','application/vnd.openxmlformats-officedocument.wordprocessingml.document':'docx'};
function validate(b){
 const topic=String(b?.topic||'').trim().slice(0,160),date=String(b?.meetingDate||''),fileName=String(b?.fileName||''),mime=String(b?.mimeType||'');
 const dt=new Date(date+'T00:00:00Z');
 if(!topic||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(dt.getTime())||dt.toISOString().slice(0,10)!==date||!fileName||fileName.length>150||/[\\/\x00-\x1f\x7f]/.test(fileName)||!TYPES[mime]||!fileName.toLowerCase().endsWith('.'+TYPES[mime]))throw Object.assign(Error('Metadata dokumen tidak valid.'),{statusCode:400});
 const encoded=String(b?.fileBase64||'');
 if(!encoded||encoded.length>9_000_000||!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded))throw Object.assign(Error('File tidak valid atau terlalu besar.'),{statusCode:400});
 const bytes=Buffer.from(encoded,'base64');
 const pdf=bytes.subarray(0,5).toString('ascii')==='%PDF-',docx=bytes.subarray(0,4).equals(Buffer.from([0x50,0x4b,0x03,0x04])),doc=bytes.subarray(0,8).equals(Buffer.from([0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1]));
 if(!bytes.length||bytes.length>6*1024*1024||(mime==='application/pdf'&&!pdf)||(mime==='application/msword'&&!doc)||(mime==='application/vnd.openxmlformats-officedocument.wordprocessingml.document'&&!docx))throw Object.assign(Error('Format dokumen tidak sesuai.'),{statusCode:400});
 return {topic,date,fileName,mime,bytes,ext:TYPES[mime]};
}
function authorized(user){return user&&user.status==='Aktif'}
function createHandler({pool,storage,readJson,json,uid,rateLimit}={}){
 if(!pool||!storage||!readJson||!json||!uid)throw Error('Konfigurasi PostgreSQL Notulensi tidak lengkap');
 return async function handle({req,res,url,user}){
  if(!authorized(user))return json(res,401,{ok:false,message:'Login diperlukan.'});
  if(url.pathname==='/api/notulen-submissions'&&req.method==='GET'){
   const {rows}=await pool.query('SELECT n.id,n.topic,n.team,n.meeting_date,n.file_name,n.stored_path,n.mime_type,n.size_bytes,n.uploaded_by,n.uploaded_at,a.name AS uploader_name FROM notulen_submissions n JOIN accounts a ON a.id=n.uploaded_by ORDER BY n.uploaded_at DESC LIMIT 200');
   return json(res,200,{ok:true,data:rows});
  }
  if(url.pathname==='/api/notulen-submissions'&&req.method==='POST'){
   if(rateLimit&&!await rateLimit(user.id))return json(res,429,{ok:false,message:'Terlalu banyak unggahan.'});
   let parsed;try{parsed=validate(await readJson(req))}catch(e){if(e.statusCode===400)return json(res,400,{ok:false,message:e.message});throw e}
   const id=uid('hasilnotulen'),key=id+'.'+parsed.ext;
   await storage.put(key,parsed.bytes,parsed.mime);
   try{
    await pool.query('INSERT INTO notulen_submissions(id,topic,team,meeting_date,file_name,stored_path,mime_type,size_bytes,uploaded_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[id,parsed.topic,'',parsed.date,parsed.fileName,'/api/notulen-submissions/'+id+'/file',parsed.mime,parsed.bytes.length,user.id]);
   }catch(e){await storage.remove(key).catch(()=>{});throw e}
   await pool.query('INSERT INTO audit_logs(id,account_id,action,resource,resource_id,detail) VALUES($1,$2,$3,$4,$5,$6::jsonb)',[uid('audit'),user.id,'CREATE','notulen-submissions',id,'{}']);
   return json(res,201,{ok:true,data:{id}});
  }
  const match=url.pathname.match(/^\/api\/notulen-submissions\/([a-zA-Z0-9_-]{1,100})\/file$/);
  if(match&&req.method==='GET'){
   const {rows}=await pool.query('SELECT id,mime_type,size_bytes FROM notulen_submissions WHERE id=$1',[match[1]]);
   if(!rows.length)return json(res,404,{ok:false,message:'Lampiran tidak ditemukan.'});
   const item=rows[0],ext=TYPES[item.mime_type];
   if(!ext)return json(res,422,{ok:false,message:'Jenis lampiran tidak dikenal.'});
   let bytes;try{bytes=await storage.get(item.id+'.'+ext)}catch{return json(res,502,{ok:false,message:'Dokumen tidak dapat diambil.'})}
   res.writeHead(200,{'Content-Type':item.mime_type,'Content-Disposition':'attachment; filename="'+item.id+'.'+ext+'"','Content-Length':bytes.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   return res.end(bytes);
  }
  return json(res,405,{ok:false,message:'Metode tidak didukung.'});
 }
}
module.exports={createHandler,validate};
