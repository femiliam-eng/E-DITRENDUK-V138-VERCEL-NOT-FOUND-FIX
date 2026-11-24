/* REV14NOV: Role-scoped dashboard. Do not display global totals as employee KPIs. */
(function(){
 'use strict';
 if(document.body.dataset.page!=='beranda')return;
 const original=window.pageIndex;
 let last=null,loading=false;
 const el=id=>document.getElementById(id);
 const safe=value=>ED.esc(String(value??''));
 const set=(id,value)=>{const target=el(id);if(target)target.textContent=String(value)};
 const isAdmin=()=>String(window.ED_CURRENT_USER?.role||'').toLowerCase()==='superadmin';
 const when=value=>{const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}):''};
 function render(){
  if(!last)return;
  const s=last,personal=s.scope==='personal';
  const labels=personal?['Kegiatan perlu saya tindaklanjuti','Tugas belum selesai saya','Dokumen perlu saya lengkapi','Catatan logbook saya']:['Kegiatan termonitor','Tugas belum selesai (Task Deadline)','Dokumen lengkap','Catatan logbook'];
  ['kpiMeet','kpiTask','kpiDocs','kpiLog'].forEach((id,i)=>{
   const span=el(id)?.closest('.kpi')?.querySelector('span');if(!span)return;
   const detail=span.querySelector('#kpiTaskDetail');
   span.replaceChildren(document.createTextNode(labels[i]));if(detail)span.appendChild(detail);
  });
  set('kpiMeet',s.monitoring??'—');set('kpiTask',s.pending??'—');set('kpiDocs',s.complete??'—');set('kpiLog',s.logbook??'—');
  if(el('kpiTaskDetail'))el('kpiTaskDetail').textContent=personal&&s.taskAssignmentMissing?'Belum ada tugas yang ditetapkan secara individu':String(s.pending||0)+' belum selesai · '+String(s.taskDone||0)+' selesai · '+String(s.taskTotal||0)+(personal?' milik saya':' total');
  const recent=el('recentActivityList');
  if(recent)recent.innerHTML=(s.recent||[]).length?(s.recent||[]).map(item=>'<div class="ed-recent-item"><span class="ed-recent-dot" aria-hidden="true"></span><div><strong>'+safe(item.action||'Aktivitas')+'</strong><p>'+safe(item.resource||'Workspace')+(item.resource_id?' · '+safe(item.resource_id):'')+'</p></div><time>'+safe(when(item.created_at))+'</time></div>').join(''):'<p class="muted">Belum ada aktivitas yang tercatat.</p>';
  if(personal){
   set('weeklyProgress','—');set('weeklyProgressDetail','Ringkasan hanya untuk penugasan pribadi');
   const work=el('workList');
   if(work)work.innerHTML=(s.ownTasks||[]).length?s.ownTasks.map(x=>'<div class="note-card"><b>'+safe(x.tugas||'Tugas')+'</b><p>'+safe(x.deadline||'Belum ada tenggat')+' · '+safe(x.status||'Not yet')+'</p></div>').join(''):'<p class="muted">'+(s.taskAssignmentMissing?'Belum ada penanggung jawab individu pada Task Deadline.':'Tidak ada tugas pribadi yang menunggu.')+'</p>';
   const quick=el('quickList');
   if(quick)quick.innerHTML=(s.ownMonitoring||[]).length?s.ownMonitoring.map(x=>'<div class="note-card"><b>'+safe(x.nama||'Kegiatan')+'</b><p>'+safe(x.tanggal||'Tanggal belum ada')+' · dokumen perlu ditindaklanjuti</p></div>').join(''):'<p class="muted">Tidak ada dokumen yang ditetapkan kepada akun ini.</p>';
  }
 }
 if(typeof original==='function'){
  window.pageIndex=function(...args){
   const result=original.apply(this,args);
   if(!isAdmin()){
    for(const id of ['kpiMeet','kpiTask','kpiDocs','kpiLog'])set(id,'—');
    set('kpiTaskDetail','Memuat tugas pribadi…');
    if(el('workList'))el('workList').innerHTML='<p class="muted">Memuat penugasan pribadi…</p>';
    if(el('quickList'))el('quickList').innerHTML='<p class="muted">Memuat prioritas pribadi…</p>';
   }
   render();return result;
  };
 }
 async function refresh(){
  if(loading)return;loading=true;
  try{
   const response=await fetch('/api/dashboard',{credentials:'include',cache:'no-store'});
   const result=await response.json().catch(()=>({}));
   if(!response.ok||!result.ok||!result.data)throw new Error(result.message||'Ringkasan belum tersedia');
   last=result.data;render();
  }catch(error){
   if(el('recentActivityList'))el('recentActivityList').textContent='Aktivitas belum dapat dimuat dari server.';
   console.warn('Ringkasan pengguna belum tersedia:',error.message);
  }finally{loading=false;}
 }
 document.addEventListener('layout:ready',refresh);
 document.addEventListener('workspace-data-updated',refresh);
 document.addEventListener('account:updated',refresh);
 window.addEventListener('focus',()=>{if(!document.hidden)refresh()});
})();