'use strict';
const crypto=require('node:crypto');
const {createSupabaseStorage}=require('./supabase-storage');
const MIME={'application/pdf':'pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document':'docx','image/jpeg':'jpg','image/png':'png'};
const TYPES=['Surat Undangan','Surat Tugas','Surat Dinas','Dokumen Pendukung','Bukti Fasilitasi'];
function parseUpload(body){
 if(!body||typeof body!=='object'||Array.isArray(body))throw Error('Data lampiran tidak valid.');
 const name=String(body.fileName||'').trim(),mime=String(body.mimeType||''),type=String(body.type||'');
 if(!TYPES.includes(type)||!MIME[mime]||!name||name.length>150||/[\\/\x00-\x1f]/.test(name)||!name.toLowerCase().endsWith('.'+MIME[mime]))throw Error('Nama, jenis surat, atau format file tidak valid.');
 const encoded=String(body.fileBase64||'');
 if(!encoded||encoded.length>7_100_000||encoded.length%4!==0||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded))throw Error('File terlalu besar atau tidak valid.');
 const bytes=Buffer.from(encoded,'base64');
 if(bytes.toString('base64')!==encoded)throw Error('Encoding file tidak valid.');
 if(!bytes.length||bytes.length>5*1024*1024)throw Error('Maksimal ukuran lampiran 5 MB.');
 const magic={'pdf':bytes.subarray(0,5).toString()==='%PDF-','docx':bytes.subarray(0,4).equals(Buffer.from([80,75,3,4])),'jpg':bytes.subarray(0,3).equals(Buffer.from([255,216,255])),'png':bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))};
 if(!magic[MIME[mime]])throw Error('Isi file tidak sesuai format.');
 return {name,mime,type,bytes,extension:MIME[mime]};
}
function unpack(row){return row?(typeof row.payload==='string'?JSON.parse(row.payload):row.payload):null}
function createKeyedQueue(){
 const pending=new Map();
 return async function serial(key,work){
  const prior=pending.get(key)||Promise.resolve();
  let release;
  const next=new Promise(resolve=>{release=resolve});
  const tail=prior.then(()=>next);
  pending.set(key,tail);
  await prior;
  try{return await work()}finally{release();if(pending.get(key)===tail)pending.delete(key)}
 }
}
function createHandler({repo,storage,resource="agenda",table="agenda_kegiatan",permission="agenda"}){
 const serial=createKeyedQueue();
 if(!repo||!storage)throw Error('Repository dan storage lampiran wajib.');
 return async function({req,res,url,user,readJson,json}){
  const match=url.pathname.match(new RegExp(`^/api/${resource}/([a-zA-Z0-9_-]{1,100})/attachments(?:/([a-zA-Z0-9_-]{1,100})(?:/file)?)?$`));
  if(!match)return false;
  if(!['GET','POST','DELETE'].includes(req.method))return json(res,405,{ok:false,message:'Metode tidak didukung.'});
  if(!user||user.status!=='Aktif')return json(res,401,{ok:false,message:'Silakan login kembali.'});
  let permissions=user.permissions||[];try{if(typeof permissions==='string')permissions=JSON.parse(permissions)}catch{permissions=[]}
  if(user.role!=='Superadmin'&&(!Array.isArray(permissions)||!permissions.includes(permission)))return json(res,403,{ok:false,message:'Tidak memiliki akses modul.'});
  return serial(match[1],async()=>{
  const row=unpack(await repo.get(table,match[1]));
  if(!row)return json(res,404,{ok:false,message:'Agenda tidak ditemukan.'});
  const items=Array.isArray(row.attachments)?row.attachments:[];
  const id=match[2],item=items.find(x=>x.id===id);
  if(req.method==='GET'&&!id){res.setHeader?.('Cache-Control','no-store');return json(res,200,{ok:true,data:items.map(({key,...publicItem})=>publicItem)});}
  if(req.method==='GET'&&id&&!url.pathname.endsWith('/file'))return json(res,404,{ok:false,message:'Lampiran tidak ditemukan.'});
  if(req.method==='GET'&&id&&url.pathname.endsWith('/file')){
   if(!item)return json(res,404,{ok:false,message:'Lampiran tidak ditemukan.'});
   const bytes=await storage.get(item.key);
   res.writeHead(200,{'Content-Type':item.mimeType,'Content-Length':bytes.length,'Content-Disposition':(item.extension==='docx'?'attachment':'inline')+'; filename="'+item.id+'.'+item.extension+'"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   return res.end(bytes);
  }
  if(req.method==='POST'&&!id){
   if(items.length>=5)return json(res,400,{ok:false,message:'Maksimal 5 lampiran per agenda.'});
   let file;try{file=parseUpload(await readJson(req))}catch(e){return json(res,400,{ok:false,message:e.message})}
   const attachmentId='att_'+crypto.randomUUID(),key=attachmentId+'.'+file.extension;
   await storage.put(key,file.bytes,file.mime);
   const entry={id:attachmentId,key,fileName:file.name,mimeType:file.mime,extension:file.extension,type:file.type,size:file.bytes.length,uploadedAt:new Date().toISOString()};
   try{
    const next={...row,attachments:[...items,entry]};
    const saved=repo.updateIfUnchanged?await repo.updateIfUnchanged(table,row.id,row,next):await repo.update(table,row.id,next);
    if(repo.updateIfUnchanged&&!saved){await storage.remove(key).catch(e=>console.error('[agenda-attachments] upload rollback failed',String(e.message||e)));return json(res,409,{ok:false,message:'Agenda baru saja diperbarui. Muat ulang dan coba lagi.'});}
   }catch(e){await storage.remove(key).catch(err=>console.error('[agenda-attachments] upload rollback failed',String(err.message||err)));throw e}
   const {key:privateKey,...publicEntry}=entry;return json(res,201,{ok:true,data:publicEntry});
  }
  if(req.method==='DELETE'&&id&&!url.pathname.endsWith('/file')){
   if(!item)return json(res,404,{ok:false,message:'Lampiran tidak ditemukan.'});
   const next={...row,attachments:items.filter(x=>x.id!==id)};
   const saved=repo.updateIfUnchanged?await repo.updateIfUnchanged(table,row.id,row,next):await repo.update(table,row.id,next);
   if(repo.updateIfUnchanged&&!saved)return json(res,409,{ok:false,message:'Agenda baru saja diperbarui. Muat ulang dan coba lagi.'});
   try{await storage.remove(item.key)}catch(e){console.error('[agenda-attachments] cleanup failed',item.id,String(e.message||e));}
   return json(res,200,{ok:true});
  }
  return json(res,405,{ok:false,message:'Metode tidak didukung.'});
  });
 }
}
module.exports={createHandler,parseUpload,TYPES};
