'use strict';
// V71: unified PostgreSQL API for seven existing modules, dashboard, and audit.
const crypto=require('node:crypto');
const ROUTES=Object.freeze({monitoring:['monitoring','monitoring'],logbook:['logbook','logbook'],archive:['archive','arsip'],users:['users_data','pengguna'],disposisi:['disposisi','rakom'],petugas:['petugas','agenda'],schedules:['schedules','agenda'],fasilitasi:['fasilitasi','agenda']});
const BOOTSTRAP=Object.freeze({monitoring:'monitoring',logbook:'logbook',archive:'archive',users:'users_data',disposisi:'disposisi',petugas:'petugas',schedules:'schedules',fasilitasi:'fasilitasi'});
function allowed(user,module){
 if(!user||user.status!=='Aktif')return false;
 if(user.role==='Superadmin')return true;
 // Account directory contains personal data: only Superadmin may access it.
 if(module==='pengguna')return false;
 if(module!=='agenda'&&String(user.role).includes('Admin'))return true;
 let permissions=user.permissions||[];
 try{if(typeof permissions==='string')permissions=JSON.parse(permissions)}catch{return false}
 return Array.isArray(permissions)&&permissions.includes(module);
}
function unpack(record){return record?(typeof record.payload==='string'?JSON.parse(record.payload):record.payload):null}
// V130: strict calendar-day parser; never rely on Date.parse for ambiguous legacy data.
function parseReminderDay(value){
 if(value==null)return null;
 const text=String(value).trim();
 let year,month,day;
 const iso=/^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
 const indo=/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/.exec(text);
 if(iso){year=+iso[1];month=+iso[2];day=+iso[3];}
 else if(indo){day=+indo[1];month=+indo[2];year=+indo[3];}
 else return null;
 if(year<1900||year>2100||month<1||month>12||day<1||day>31)return null;
 const utc=Date.UTC(year,month-1,day);
 const d=new Date(utc);
 if(d.getUTCFullYear()!==year||d.getUTCMonth()!==month-1||d.getUTCDate()!==day)return null;
 return {utc,iso:d.toISOString().slice(0,10)};
}
function upcomingReminderDay(value,now=Date.now()){
 const parsed=parseReminderDay(value);
 if(!parsed)return null;
 // E-DITRENDUK operates on Indonesian (WIB) calendar days, independent of server UTC.
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(now));
 const get=k=>+parts.find(part=>part.type===k).value;
 const today=Date.UTC(get('year'),get('month')-1,get('day'));
 if(parsed.utc<today||parsed.utc>today+7*86400000)return null;
 return parsed.iso;
}
// Never expose raw attachment bytes in listing, bootstrap or CRUD JSON responses.
function publicRow(row,resource){if(!row||resource!=='fasilitasi')return row;const {attachments,...rest}=row;return {...rest,attachments:Array.isArray(attachments)?attachments.map(({fileBase64,...metadata})=>metadata):[]}}
async function handle({req,res,url,user,repo,pool,readJson,json}){
 if(!user)return json(res,401,{ok:false,message:'Sesi tidak valid.'});
 const audit=async(action,resource,id,detail={})=>{
  await pool.query('INSERT INTO audit_logs(id,account_id,action,resource,resource_id,detail) VALUES($1,$2,$3,$4,$5,$6::jsonb)',[
   `audit_${crypto.randomUUID()}`,user.id,action,resource,id||null,JSON.stringify(detail)]);
 };
 const attachmentMatch=url.pathname.match(/^\/api\/fasilitasi\/([a-zA-Z0-9_-]{1,100})\/attachments(?:\/([a-zA-Z0-9_-]{1,100})(?:\/file)?)?$/);
 if(attachmentMatch){
  if(!allowed(user,'agenda'))return json(res,403,{ok:false,message:'Tidak memiliki izin fasilitasi.'});
  const [,id,fileId]=attachmentMatch;
  const current=unpack(await repo.get('fasilitasi',id));
  if(!current)return json(res,404,{ok:false,message:'Kegiatan tidak ditemukan.'});
  const files=Array.isArray(current.attachments)?current.attachments:[];
  if(req.method==='POST'&&!fileId){
   const body=await readJson(req);
   const encoded=String(body?.fileBase64||'');
   if(!encoded||encoded.length>1500000||!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded))return json(res,400,{ok:false,message:'Lampiran tidak valid atau terlalu besar.'});
   const binary=Buffer.from(encoded,'base64');
   if(binary.length>1024*1024)return json(res,413,{ok:false,message:'Ukuran lampiran maksimal 1 MB.'});
   const pdf=binary.subarray(0,5).toString('ascii')==='%PDF-';
   const png=binary.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'));
   const jpg=binary.subarray(0,3).equals(Buffer.from('ffd8ff','hex'));
   if(!pdf&&!png&&!jpg)return json(res,400,{ok:false,message:'Hanya PDF, PNG, atau JPG yang diperbolehkan.'});
   const mimeType=pdf?'application/pdf':png?'image/png':'image/jpeg';
   const fileName=String(body?.fileName||'lampiran').replace(/[\\/\x00-\x1f]/g,'_').slice(0,120);
   const item={id:'file_'+crypto.randomUUID(),fileName,mimeType,size:binary.length,fileBase64:binary.toString('base64')};
   const saved=await repo.patch('fasilitasi',id,{attachments:[...files,item]});
   if(!saved)return json(res,409,{ok:false,message:'Gagal menyimpan lampiran.'});
   await audit('ATTACH', 'fasilitasi',id,{fileId:item.id,fileName});
   return json(res,201,{ok:true,data:{id:item.id,fileName,mimeType,size:item.size}});
  }
  const file=files.find(x=>x.id===fileId);
  if(!file)return json(res,404,{ok:false,message:'Lampiran tidak ditemukan.'});
  if(req.method==='GET'&&url.pathname.endsWith('/file')){
   const binary=Buffer.from(String(file.fileBase64||''),'base64');
   res.writeHead(200,{'Content-Type':file.mimeType,'Content-Length':binary.length,'Content-Disposition':'inline; filename="'+String(file.fileName).replace(/["\r\n]/g,'_')+'"','X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store'});
   res.end(binary);return;
  }
  if(req.method==='DELETE'){
   const saved=await repo.patch('fasilitasi',id,{attachments:files.filter(x=>x.id!==fileId)});
   if(!saved)return json(res,409,{ok:false,message:'Gagal menghapus lampiran.'});
   await audit('DETACH','fasilitasi',id,{fileId});return json(res,200,{ok:true});
  }
  return json(res,405,{ok:false,message:'Metode tidak didukung.'});
 }
 const match=url.pathname.match(/^\/api\/(monitoring|logbook|archive|users|disposisi|petugas|schedules|fasilitasi)(?:\/([a-zA-Z0-9_-]{1,100}))?$/);
 if(match){
  const [,resource,id]=match,[table,module]=ROUTES[resource];
  if(!allowed(user,module))return json(res,403,{ok:false,message:'Anda tidak memiliki akses ke modul ini.'});
  // The users_data table is legacy profile data, not the account registry.
  // Never allow clients to mutate identity, roles, or access permissions via generic payload APIs.
  if(resource==='users' && req.method!=='GET')return json(res,403,{ok:false,message:'Data pengguna hanya dapat dibaca melalui modul ini.'});
  if(req.method==='GET'&&!id){
   const rows=(await repo.list(table)).map(unpack).map(row=>publicRow(row,resource));
   const wantsPage=['page','limit','q'].some(k=>url.searchParams.has(k));
   if(!wantsPage)return json(res,200,{ok:true,data:rows});
   const q=String(url.searchParams.get('q')||'').trim().slice(0,120).toLowerCase();
   const page=Math.max(1,Number(url.searchParams.get('page')||1)||1);
   const limit=Math.min(200,Math.max(1,Number(url.searchParams.get('limit')||25)||25));
   const filtered=q?rows.filter(row=>JSON.stringify(row).toLowerCase().includes(q)):rows;
   return json(res,200,{ok:true,data:filtered.slice((page-1)*limit,page*limit),pagination:{page,limit,total:filtered.length,pages:Math.max(1,Math.ceil(filtered.length/limit))}});
  }
  if(req.method==='POST'&&!id){
   const body=await readJson(req);
   if(!body||Array.isArray(body)||typeof body!=='object')return json(res,400,{ok:false,message:'Data harus berupa objek.'});
   const newId=String(body.id||`${resource.slice(0,1)}_${crypto.randomUUID()}`);
   if(!/^[a-zA-Z0-9_-]{1,100}$/.test(newId))return json(res,400,{ok:false,message:'ID tidak valid.'});
   if(await repo.get(table,newId))return json(res,409,{ok:false,message:'ID sudah digunakan.'});
   if(resource==='fasilitasi' && 'attachments' in body)return json(res,400,{ok:false,message:'Lampiran harus diunggah melalui endpoint lampiran.'});
   const row={...body,id:newId};await repo.create(table,newId,row);await audit('CREATE',resource,newId);
   return json(res,201,{ok:true,data:publicRow(row,resource)});
  }
  if(['PUT','PATCH'].includes(req.method)&&id){
   const old=unpack(await repo.get(table,id));if(!old)return json(res,404,{ok:false,message:'Data tidak ditemukan.'});
   const body=await readJson(req);if(!body||Array.isArray(body)||typeof body!=='object')return json(res,400,{ok:false,message:'Data harus berupa objek.'});
   // PATCH merges atomically in PostgreSQL; PUT retains replacement semantics.
   if(resource==='fasilitasi' && 'attachments' in body)return json(res,400,{ok:false,message:'Lampiran hanya dapat diubah melalui endpoint lampiran.'});
   const changes={...body,id};
   const saved=req.method==='PATCH'?await repo.patch(table,id,changes):await repo.update(table,id,changes);
   if(!saved)return json(res,404,{ok:false,message:'Data tidak ditemukan.'});
   const row=unpack(saved);
   await audit('UPDATE',resource,id,{fields:Object.keys(body)});return json(res,200,{ok:true,data:publicRow(row,resource)});
  }
  if(req.method==='DELETE'&&id){
   if(!await repo.remove(table,id))return json(res,404,{ok:false,message:'Data tidak ditemukan.'});
   await audit('DELETE',resource,id);return json(res,200,{ok:true});
  }
  return json(res,405,{ok:false,message:'Metode tidak didukung.'});
 }
 if(url.pathname==='/api/bootstrap'&&req.method==='GET'){
  const data={};for(const [key,table] of Object.entries(BOOTSTRAP))data[key]=allowed(user,ROUTES[key][1])?(await repo.list(table)).map(unpack).map(row=>publicRow(row,key)):[];
  return json(res,200,{ok:true,data});
 }
 if(url.pathname==='/api/reminders'&&req.method==='GET'){
  if(!allowed(user,'agenda')&&!allowed(user,'task-deadline'))return json(res,403,{ok:false,message:'Akses agenda atau task deadline diperlukan.'});
  const now=Date.now(),items=[];
  for(const [table,kind] of [['agenda_kegiatan','Agenda Kegiatan'],['task_deadline','Task Deadline']]){
   if(!allowed(user,table==='agenda_kegiatan'?'agenda':'task-deadline'))continue;
   for(const entry of await repo.list(table)){
    const x=unpack(entry)||{};
    const raw=x.deadline||x.tanggal_deadline||x.dueDate||x.tanggal||x.date||x.tanggalKegiatan;
    if(!raw)continue;
    const day=upcomingReminderDay(raw,now);if(!day)continue;
    if(['selesai','done','final','lengkap'].includes(String(x.status||'').toLowerCase()))continue;
    items.push({id:x.id,jenis:kind,judul:x.judul||x.namaKegiatan||x.kegiatan||x.nama||'Tanpa judul',tanggal:day+'T00:00:00.000Z'});
   }
  }
  items.sort((a,b)=>a.tanggal.localeCompare(b.tanggal));
  return json(res,200,{ok:true,data:items,generatedAt:new Date().toISOString()});
 }
 if(url.pathname==='/api/dashboard'&&req.method==='GET'){
  // REV14: All-workspace totals are only sent to Superadmin.
  // Regular employees see records explicitly assigned to their account.
  const superadmin=String(user.role||'').toLowerCase()==='superadmin';
  const canMonitor=allowed(user,'monitoring');
  const canTask=allowed(user,'task-deadline');
  const canLog=allowed(user,'logbook');
  const [monitoring,tasks,logbook]=await Promise.all([
    canMonitor?repo.list('monitoring').then(rows=>rows.map(unpack)):Promise.resolve([]),
    canTask?repo.list('task_deadline').then(rows=>rows.map(unpack)):Promise.resolve([]),
    canLog?repo.list('logbook').then(rows=>rows.map(unpack)):Promise.resolve([])
  ]);
  const identities=[user.id,user.username,user.name]
    .map(x=>String(x||'').trim().toLocaleLowerCase('id-ID')).filter(Boolean);
  const assigned=(row,keys)=>{
    return keys.some(key=>{
      const value=row && row[key];
      if(value==null)return false;
      const names=Array.isArray(value)?value:String(value).split(/[;,|\n]+/);
      return names.some(name=>identities.includes(String(name||'').trim().toLocaleLowerCase('id-ID')));
    });
  };
  const ownedTasks=superadmin?tasks:tasks.filter(x=>assigned(x,['assignedTo','assignee','pic','penanggungJawab','accountId']));
  const ownedMonitoring=superadmin?monitoring:monitoring.filter(x=>assigned(x,['assignedTo','assignee','pic','penanggungJawab','accountId']));
  const ownedLogs=superadmin?logbook:logbook.filter(x=>assigned(x,['pegawai','assignedTo','accountId']));
  const finished=x=>['done','selesai','completed','selesai dikerjakan'].includes(String(x.status||'').trim().toLowerCase());
  const verified=x=>['lengkap','final'].includes(String(x.verifikasi||'').trim().toLowerCase());
  const pendingTasks=ownedTasks.filter(x=>!finished(x));
  const pendingMonitoring=ownedMonitoring.filter(x=>!verified(x));
  const activities=await pool.query(
    superadmin
      ? 'SELECT id,action,resource,resource_id,created_at FROM audit_logs ORDER BY created_at DESC,id DESC LIMIT 6'
      : 'SELECT id,action,resource,resource_id,created_at FROM audit_logs WHERE account_id=$1 ORDER BY created_at DESC,id DESC LIMIT 6',
    superadmin?[]:[user.id]
  );
  return json(res,200,{ok:true,data:{
    scope:superadmin?'all':'personal',
    monitoring:superadmin?monitoring.length:pendingMonitoring.length,
    pending:pendingTasks.length,
    complete:superadmin?monitoring.filter(verified).length:pendingMonitoring.length,
    logbook:ownedLogs.length,
    taskTotal:ownedTasks.length,
    taskDone:ownedTasks.filter(finished).length,
    taskAssignable:canTask,
    taskAssignmentMissing:!superadmin && tasks.length>0 && !tasks.some(x=>assigned(x,['assignedTo','assignee','pic','penanggungJawab','accountId'])),
    recent:activities.rows,
    ownTasks:pendingTasks.slice(0,4).map(x=>({id:x.id,tugas:x.tugas,deadline:x.deadline,status:x.status})),
    ownMonitoring:pendingMonitoring.slice(0,4).map(x=>({id:x.id,nama:x.nama,tanggal:x.tanggal,tim:x.tim}))
  }});
 }
 if(url.pathname==='/api/audit'&&req.method==='GET'){
  if(user.role!=='Superadmin')return json(res,403,{ok:false,message:'Hanya Superadmin.'});
  const limit=Math.min(200,Math.max(1,Number(url.searchParams.get('limit')||50)||50));
  const rows=await pool.query('SELECT id,account_id,action,resource,resource_id,detail,created_at FROM audit_logs ORDER BY created_at DESC LIMIT $1',[limit]);
  return json(res,200,{ok:true,data:rows.rows});
 }
 return json(res,404,{ok:false,message:'Endpoint tidak ditemukan.'});
}
module.exports={handle,allowed,ROUTES,unpack,parseReminderDay,upcomingReminderDay};
