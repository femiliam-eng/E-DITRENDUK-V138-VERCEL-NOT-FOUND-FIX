'use strict';
// PostgreSQL-only Agenda/Task API for authenticated PostgreSQL sessions.
// No SQLite reads/writes, and every operation checks module permissions.
const crypto=require('node:crypto');
const FIELDS=Object.freeze({agenda:['tanggal','asalSurat','kegiatan','tempat','waktu','disposisi','nomorSurat','hasilKegiatan'],'task-deadline':['nomorSurat','asalSurat','tugas','kebutuhan','deadline','status','disposisi','assignedTo']});
function permitted(user,kind){
 if(!user||user.status!=='Aktif')return false;
 if(user.role==='Superadmin')return true;
 let permissions=user.permissions||[];
 try{if(typeof permissions==='string')permissions=JSON.parse(permissions)}catch{return false}
 return Array.isArray(permissions)&&permissions.includes(kind);
}
function normalize(kind,body,old,id){
 if(!body||typeof body!=='object'||Array.isArray(body))throw Object.assign(new Error('Data tidak valid.'),{status:400});
 const row={id};
 for(const field of FIELDS[kind])row[field]=String(body[field]===undefined?(old[field]??''):(body[field]??'')).slice(0,5000);
 if(!(kind==='agenda'?row.kegiatan:row.tugas).trim())throw Object.assign(new Error('Kegiatan/tugas wajib diisi.'),{status:400});
 if(kind==='task-deadline'){
  row.status=(row.status||'not yet').trim().toLowerCase();
  if(!['done','not yet'].includes(row.status))throw Object.assign(new Error('Status harus Done atau Not yet.'),{status:400});
 }
 const date=kind==='agenda'?row.tanggal:row.deadline;
 if(date){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)
   throw Object.assign(new Error('Tanggal tidak valid.'),{status:400});
 }
 return row;
}
function unpack(x){return x?(typeof x.payload==='string'?JSON.parse(x.payload):x.payload):null}
async function handle({req,res,url,user,repo,readJson,json,audit}){
 const match=url.pathname.match(/^\/api\/(agenda|task-deadline)(?:\/([a-zA-Z0-9_-]{1,100}))?$/);
 if(!match)return false;
 const kind=match[1],id=match[2],table=kind==='agenda'?'agenda_kegiatan':'task_deadline';
 if(!user)return json(res,401,{ok:false,message:'Sesi tidak valid.'});
 if(!permitted(user,kind))return json(res,403,{ok:false,message:'Akses modul ini harus diberikan oleh Superadmin.'});
 if(req.method==='GET'&&!id){const rows=await repo.list(table);return json(res,200,{ok:true,data:rows.map(unpack)});}
 if(!['POST','PUT','PATCH','DELETE'].includes(req.method)||(req.method==='POST'&&id)||(req.method!=='POST'&&!id))return json(res,405,{ok:false,message:'Metode tidak didukung.'});
 if(req.method==='DELETE'){
  if(!await repo.remove(table,id))return json(res,404,{ok:false,message:'Tidak ditemukan.'});
  if(audit)await audit(user.id,'DELETE',kind,id);
  return json(res,200,{ok:true});
 }
 const body=await readJson(req);
 const existing=id?await repo.get(table,id):null;
 if(id&&!existing)return json(res,404,{ok:false,message:'Tidak ditemukan.'});
 // Only Superadmin may assign or reassign an individual responsible account.
 if(kind==='task-deadline'&&user.role!=='Superadmin'&&Object.prototype.hasOwnProperty.call(body,'assignedTo') && String(body.assignedTo??'').trim()!==String(unpack(existing)?.assignedTo??'').trim())return json(res,403,{ok:false,message:'Penanggung jawab hanya dapat ditetapkan oleh Superadmin.'});
 const newId=id||`${kind==='agenda'?'agd':'tsk'}_${crypto.randomUUID()}`;
 let row;
 try{row=normalize(kind,body,unpack(existing)||{},newId)}catch(e){if(e.status===400)return json(res,400,{ok:false,message:e.message});throw e}
 if(existing && kind==='agenda'){const old=unpack(existing)||{};row.attachments=Array.isArray(old.attachments)?old.attachments:[];}
 if(existing)await repo.update(table,newId,row);else await repo.create(table,newId,row);
 if(audit)await audit(user.id,existing?'UPDATE':'CREATE',kind,newId);
 return json(res,existing?200:201,{ok:true,data:row});
}
module.exports={handle,normalize,permitted};
