const D=window.EXCEL_DATA||{};
function statusBadge(s){s=(s||'').toLowerCase();return ['done','selesai','final','lengkap'].includes(s.trim())?'green':s.includes('progress')||s.includes('berjalan')?'yellow':s.includes('tidak')||s.includes('terlambat')?'red':'blue'}
function urlFrom(s){let m=String(s||'').match(/https?:\/\/[^\s<>"']+/i);if(!m)return '';try{const u=new URL(m[0].replace(/[),.;]+$/,''));return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return ''}}
function ditrendukDate(value){
 const v=String(value??'').trim();
 if(!v)return NaN;
 const match=v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:$|[T\s])/);
 const local=v.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})(?:$|\s)/);
 let year,month,day;
 if(match){year=+match[1];month=+match[2];day=+match[3];}
 else if(local){year=+local[3];month=+local[2];day=+local[1];}
 else return NaN;
 const date=Date.UTC(year,month-1,day);
 const check=new Date(date);
 return check.getUTCFullYear()===year&&check.getUTCMonth()===month-1&&check.getUTCDate()===day?date:NaN;
}
function ditrendukSortDate(value){const d=ditrendukDate(value);return Number.isFinite(d)?d:-8640000000000000;}

function pageIndex(){
 const teamEl=document.getElementById('myTeam');if(teamEl){const u=window.ED_CURRENT_USER;teamEl.textContent=u?.unit||'Tim belum ditetapkan pada akun';}
 const mon=Array.isArray(D.monitoring)?D.monitoring:[],disp=Array.isArray(D.disposisi)?D.disposisi:[],logs=Array.isArray(D.logbook)?D.logbook:[];
 const complete=mon.filter(x=>['lengkap','final'].includes(String(x.verifikasi||'').trim().toLowerCase())).length;
 const tasksSource=Array.isArray(window.ED_TASK_DEADLINES)?window.ED_TASK_DEADLINES:[];
 const uniqueTasks=new Map();
 tasksSource.forEach((x,i)=>{const key=String(x.id??x.task_id??`index-${i}`);uniqueTasks.set(key,x)});
 const unfinished=[...uniqueTasks.values()].filter(x=>!['done','selesai','completed','selesai dikerjakan'].includes(String(x.status||'').trim().toLowerCase()));
 const taskCountEl=document.getElementById('kpiTask');
 if(taskCountEl)taskCountEl.title='Jumlah tugas berstatus belum selesai pada modul Task Deadline (berdasarkan ID tugas unik); bukan jumlah RAKOM.';
 const set=(id,value)=>{const e=document.getElementById(id);if(e)e.textContent=value};
 set('kpiMeet',mon.length);set('kpiTask',Array.isArray(window.ED_TASK_DEADLINES)?unfinished.length:'—');set('kpiDocs',complete);set('kpiLog',logs.length);
 // Tidak ada angka contoh: progres hanya dihitung dari tugas yang jatuh tempo pada minggu berjalan.
 const today=new Date();const weekday=(today.getDay()+6)%7;
 const monday=new Date(today.getFullYear(),today.getMonth(),today.getDate()-weekday);
 const sunday=new Date(monday.getFullYear(),monday.getMonth(),monday.getDate()+7);
 const taskDate=value=>{
  const text=String(value||'').trim();
  const iso=text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if(iso)return new Date(+iso[1],+iso[2]-1,+iso[3]);
  const local=text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
  if(local)return new Date(+local[3],+local[2]-1,+local[1]);
  const months={januari:0,februari:1,maret:2,april:3,mei:4,juni:5,juli:6,agustus:7,september:8,oktober:9,november:10,desember:11};
  const named=text.toLowerCase().match(/(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+(\d{4})/);
  return named?new Date(+named[3],months[named[2]],+named[1]):null;
 };
 const weekly=tasksSource.filter(x=>{const d=taskDate(x.deadline||x.tanggal);return d&&!Number.isNaN(+d)&&d>=monday&&d<sunday;});
 const weeklyDone=weekly.filter(x=>['done','selesai'].includes(String(x.status||'').trim().toLowerCase())).length;
 const weeklyEl=document.getElementById('weeklyProgress');
 if(weeklyEl){weeklyEl.textContent=(weekly.length?Math.round(weeklyDone/weekly.length*100):0)+'%';weeklyEl.title=weekly.length?`${weeklyDone} dari ${weekly.length} tugas dengan tenggat minggu ini selesai`:'Belum ada tugas dengan tenggat minggu ini (0 dari 0).';const detail=document.getElementById('weeklyProgressDetail');if(detail)detail.textContent=weekly.length?`${weeklyDone} dari ${weekly.length} tugas selesai`:'Belum ada tugas dengan tenggat minggu ini';}

 const continueBtn=document.getElementById('continueBtn');if(continueBtn)continueBtn.onclick=()=>location.href='monitoring.html';
 const time=x=>{const s=String(x||'').trim(),m=s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);if(m)return Date.UTC(+m[3],+m[2]-1,+m[1]);return Date.parse(s)||0};
 const tasks=unfinished.slice().sort((a,b)=>time(a.deadline||a.tanggal)-time(b.deadline||b.tanggal));
 const work=document.getElementById('workList');if(work)work.innerHTML=!Array.isArray(window.ED_TASK_DEADLINES)?'<p class="muted">Memuat tugas dari server…</p>':tasks.slice(0,4).map(x=>`<div class="note-card"><b>${ED.esc(x.tugas||x.perihal||x.nama||'Tugas tanpa judul')}</b><p>${ED.esc(x.pic||x.tim||'Belum ada PIC')} · <span class="badge ${statusBadge(x.status)}">${ED.esc(x.status||'Not yet')}</span>${x.deadline?' · '+ED.esc(x.deadline):''}</p></div>`).join('')||'<p class="muted">Tidak ada tugas tertunda.</p>';
 const pending=mon.filter(x=>!['lengkap','final'].includes(String(x.verifikasi||'').trim().toLowerCase())).slice().sort((a,b)=>time(b.tanggal)-time(a.tanggal));
 const quick=document.getElementById('quickList');if(quick)quick.innerHTML=pending.slice(0,4).map(x=>`<div class="note-card"><b>${ED.esc(x.nama||'Kegiatan tanpa nama')}</b><p>${ED.esc(x.tim||'Belum ada tim')} · dokumen perlu dilengkapi</p></div>`).join('')||'<p class="muted">Tidak ada dokumen yang perlu dilengkapi.</p>';
}

function pageRepository(){let repoSearch='';let repoSort='desc';let rows=(D.monitoring||[]).map((x,i)=>({...x,status:x.verifikasi||'Belum ada'}));const body=document.getElementById('repoBody');const statusOpts=['Final','Lengkap','Diperiksa','Belum lengkap','Belum ada','Draf'];const normalizeRepoStatus=v=>String(v||'').trim().toLocaleLowerCase('id-ID');const repoClass=v=>['final','lengkap'].includes(normalizeRepoStatus(v))?'state-green':normalizeRepoStatus(v)==='diperiksa'?'state-yellow':['draf','draft'].includes(normalizeRepoStatus(v))?'state-blue':'state-red';function targetFor(x){let n=(x.nama+' '+(x.kategori||'')).toLowerCase();let u=urlFrom(x.link||x.dokumen||x.bukti||'');if(u)return u;return null}function render(f='semua'){let a=f==='semua'?rows:rows.filter(x=>{let st=String(x.status||'').toLowerCase();return f==='lengkap'?['final','lengkap'].includes(st.trim()):f==='tidak'?['belum lengkap','belum ada','tidak lengkap','tidak'].includes(st.trim()):['draf','draft'].includes(st.trim())});a=a.filter(x=>!repoSearch||[x.nama,x.tim,x.kategori,x.status].some(v=>String(v||'').toLocaleLowerCase('id-ID').includes(repoSearch)));a=a.slice().sort((x,y)=>{const dx=ditrendukDate(x.tanggal),dy=ditrendukDate(y.tanggal);if(!Number.isFinite(dx))return Number.isFinite(dy)?1:0;if(!Number.isFinite(dy))return -1;return repoSort==='asc'?dx-dy:dy-dx});const count=document.getElementById('repoCount');if(count)count.textContent=`Menampilkan ${a.length} dari ${rows.length} rapat sesuai filter`;body.innerHTML=a.map(x=>`<tr><td><strong>${ED.esc(x.nama)}</strong></td><td>${ED.esc(x.tim)}</td><td>${ED.fmt(x.tanggal)}</td><td>${ED.esc(x.kategori||'Rapat')}</td><td class="editable-cell"><select class="inline-select repo-status ${repoClass(x.status)}" data-id="${ED.esc(x.id)}">${[...new Set([x.status,...statusOpts].filter(Boolean))].map(o=>`<option ${o===x.status?'selected':''}>${ED.esc(o)}</option>`).join('')}</select></td><td><button class="link detail" data-id="${ED.esc(x.id)}">Buka detail →</button>${targetFor(x)?` <a class="link" href="${ED.esc(targetFor(x))}" target="_blank" rel="noopener noreferrer">Buka Dokumen</a>`:' <span class="muted">Dokumen belum tersedia</span>'}</td></tr>`).join('')||'<tr><td colspan="6" class="muted">Tidak ada dokumen yang sesuai pencarian dan filter.</td></tr>';body.querySelectorAll('.repo-status').forEach(el=>el.onchange=async()=>{let x=rows.find(r=>String(r.id)===String(el.dataset.id));if(!x){ED.toast('Data Repository tidak ditemukan.');return;}let old=x.status;el.disabled=true;try{await API.update('monitoring',x.id,{verifikasi:el.value});x.status=el.value;const original=(D.monitoring||[]).find(r=>String(r.id)===String(x.id));if(original)original.verifikasi=el.value;document.dispatchEvent(new Event('workspace-data-updated'));try{localStorage.setItem('ed_workspace_updated',String(Date.now()))}catch(_){}ED.toast('Status tersimpan di PostgreSQL.')}catch(e){x.status=old;ED.toast('Gagal menyimpan: '+e.message)}render(f)});body.querySelectorAll('.detail').forEach(b=>b.onclick=()=>{let x=rows.find(r=>String(r.id)===String(b.dataset.id));if(!x){ED.toast('Detail rapat tidak ditemukan.');return;}document.getElementById('detailTitle').textContent=x.nama;document.getElementById('detailText').textContent=`${x.tim} · ${ED.fmt(x.tanggal)} · ${x.kategori||'Kegiatan'}`;document.getElementById('startMeeting').onclick=()=>{let t=targetFor(x);if(!t){ED.toast('Dokumen sumber belum tersedia untuk rapat ini.');return;}if(/^https?:/.test(t))window.open(t,'_blank','noopener');else location.href=t};ED.open('detailModal')})}const repoToolbar=document.getElementById('repoSearchToolbar')||document.createElement('div');repoToolbar.id='repoSearchToolbar';repoToolbar.className='toolbar';if(!repoToolbar.isConnected){repoToolbar.innerHTML='<label for="repoSearch">Cari dokumen: </label><input class="field" type="search" id="repoSearch" placeholder="Nama, tim, kategori, status" aria-label="Cari repository">';body.closest('table').parentNode.before(repoToolbar)}if(!repoToolbar.querySelector('#repoDateSort')){const select=document.createElement('select');select.id='repoDateSort';select.className='field compact-date-sort';select.setAttribute('aria-label','Urutan tanggal Repository');select.innerHTML='<option value="desc">Tanggal terbaru</option><option value="asc">Tanggal terlama</option>';repoToolbar.appendChild(select)}if(!repoToolbar.querySelector('#refreshRepository')){
 const button=document.createElement('button');button.type='button';button.id='refreshRepository';button.className='btn btn-outline btn-sm';button.textContent='Perbarui data';repoToolbar.appendChild(button);
 let requestId=0;
 button.onclick=async()=>{const current=++requestId;button.disabled=true;try{
  const result=await API.list('monitoring');
  if(current!==requestId)return;
  if(!Array.isArray(result.data))throw new Error('Format data Monitoring tidak valid.');
  D.monitoring=result.data;
  rows=result.data.map(x=>({...x,status:x.verifikasi||'Belum ada'}));
  render(document.querySelector('.chip.active')?.dataset.filter||'semua');
  ED.toast('Data Repository diperbarui dari server.');
 }catch(error){ED.toast('Gagal memperbarui Repository: '+error.message)}finally{if(current===requestId)button.disabled=false}};
}
repoToolbar.querySelector('#repoDateSort').onchange=e=>{repoSort=e.target.value;render(document.querySelector('.chip.active')?.dataset.filter||'semua')};repoToolbar.querySelector('#repoSearch').oninput=e=>{repoSearch=e.target.value.toLocaleLowerCase('id-ID').trim();render(document.querySelector('.chip.active')?.dataset.filter||'semua')};render();document.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));c.classList.add('active');render(c.dataset.filter)});document.getElementById('addRepo').onclick=()=>ED.open('repoModal');document.getElementById('saveRepo').onclick=async()=>{const saveButton=document.getElementById('saveRepo');if(saveButton.disabled)return;const fields=[...document.querySelectorAll('#repoModal .field')];const row={nama:fields[0]?.value?.trim(),tim:fields[1]?.value?.trim(),tanggal:fields[2]?.value||'',kategori:fields[3]?.value||'Rapat',verifikasi:'Draf'};if(!row.nama)return ED.toast('Nama rapat wajib diisi.');if(!/^\d{4}-\d{2}-\d{2}$/.test(row.tanggal)||!Number.isFinite(ditrendukDate(row.tanggal)))return ED.toast('Tanggal rapat wajib diisi dengan tanggal yang valid.');saveButton.disabled=true;try{const r=await API.create('monitoring',row);if(!Array.isArray(D.monitoring))D.monitoring=[];D.monitoring.push(r.data);rows.unshift({...r.data,status:r.data.verifikasi||'Draf'});render(document.querySelector('.chip.active')?.dataset.filter||'semua');ED.close('repoModal');document.dispatchEvent(new Event('workspace-data-updated'));try{localStorage.setItem('ed_workspace_updated',String(Date.now()))}catch(_){}ED.toast('Rapat tersimpan di PostgreSQL.')}catch(e){ED.toast('Gagal menyimpan: '+e.message)}finally{saveButton.disabled=false}}}
function pageMonitoring(){
 let rows=D.monitoring||[],body=document.getElementById('monitorBody');
 const valid=['Belum diverifikasi','LENGKAP','TIDAK LENGKAP','Perlu perbaikan'];
 const finance=['','LENGKAP','TIDAK LENGKAP'];
 const docCount=12;
 const teams=['PARAMETER','PJPK','Manajemen Kinerja'];
 const categories=[...new Set(['FULLDAY','FULLBOARD','RAPAT DI KANTOR','RAPAT DI LUAR KANTOR','PERJALANAN DINAS','NARASUMBER',...rows.map(x=>x.kategori).filter(Boolean)])];
 const teamColor=v=>v==='PARAMETER'?'team-parameter':v==='PJPK'?'team-pjpk':v==='Manajemen Kinerja'?'team-kinerja':'';
 const options=(items,current)=>[...new Set([current,...items].filter(Boolean))].map(v=>`<option value="${ED.esc(v)}" ${v===current?'selected':''}>${ED.esc(v)}</option>`).join('');
 async function saveField(x,key,value,element){const previous=x[key];x[key]=value;try{await API.update('monitoring',x.id,{[key]:value});ED.toast('Perubahan tersimpan di PostgreSQL.')}catch(err){x[key]=previous;if(element){element.value=previous||'';if(key==='tim')element.className='inline-select mon-team '+teamColor(previous)}ED.toast('Gagal menyimpan: '+err.message)}}
 rows.forEach(x=>{if(!Array.isArray(x.docs))x.docs=[];while(x.docs.length<docCount)x.docs.push(false);if(x.ro===undefined)x.ro='';if(x.sub===undefined)x.sub='';if(x.keuangan===undefined)x.keuangan='';if(x.validasiDirektur===undefined)x.validasiDirektur=x.verifikasi||'Belum diverifikasi';if(x.bukti===undefined)x.bukti=''});
 function cls(v){v=(v||'').toLowerCase();return v==='lengkap'?'state-green':v==='tidak lengkap'?'state-red':v==='perlu perbaikan'?'state-orange':'state-yellow'}
 let monitorSort='new',financeFilter='all',directorFilter='all',qualityFilter='all',monitorSearch='';const sortBar=document.createElement('div');sortBar.className='toolbar';sortBar.style.marginBottom='12px';sortBar.innerHTML='<label for="monitorDateSort">Urut tanggal</label> <select id="monitorDateSort" class="inline-select"><option value="new">Terbaru dahulu</option><option value="old">Terlama dahulu</option></select> <label for="monitorFinanceFilter">Keuangan</label> <select id="monitorFinanceFilter" class="inline-select"><option value="all">Semua</option><option value="LENGKAP">Lengkap</option><option value="TIDAK LENGKAP">Tidak lengkap</option><option value="empty">Belum diverifikasi</option></select> <label for="monitorDirectorFilter">Direktur</label> <select id="monitorDirectorFilter" class="inline-select"><option value="all">Semua</option><option value="LENGKAP">Lengkap</option><option value="TIDAK LENGKAP">Tidak lengkap</option><option value="empty">Belum diverifikasi</option></select> <label for="monitorQualityFilter">Kualitas tanggal</label> <select id="monitorQualityFilter" class="inline-select"><option value="all">Semua tanggal</option><option value="review">Perlu diperiksa</option><option value="valid">Tanggal valid</option></select> <label for="monitorSearch">Cari kegiatan</label> <input id="monitorSearch" class="inline-input" placeholder="Nama, tim, kategori..." aria-label="Cari kegiatan"> <button type="button" id="monitorReset" class="btn btn-outline btn-sm">Reset filter</button> <button type="button" id="monitorExport" class="btn btn-outline btn-sm">Ekspor CSV</button> <span id="monitorCount" class="muted" aria-live="polite"></span>';body.closest('table')?.parentElement?.insertBefore(sortBar,body.closest('table'));sortBar.querySelector('#monitorDateSort').onchange=e=>{monitorSort=e.target.value;render()};sortBar.querySelector('#monitorFinanceFilter').onchange=e=>{financeFilter=e.target.value;render()};sortBar.querySelector('#monitorDirectorFilter').onchange=e=>{directorFilter=e.target.value;render()};sortBar.querySelector('#monitorQualityFilter').onchange=e=>{qualityFilter=e.target.value;render()};sortBar.querySelector('#monitorSearch').oninput=e=>{monitorSearch=e.target.value.toLocaleLowerCase('id-ID').trim();render()};sortBar.querySelector('#monitorReset').onclick=()=>{monitorSort='new';financeFilter='all';directorFilter='all';qualityFilter='all';monitorSearch='';for(const id of ['monitorDateSort','monitorFinanceFilter','monitorDirectorFilter','monitorQualityFilter'])sortBar.querySelector('#'+id).value=id==='monitorDateSort'?'new':'all';sortBar.querySelector('#monitorSearch').value='';render()};
 const monitorValidDate=x=>Number.isFinite(ditrendukDate(x.tanggal));
 function filteredMonitoring(){return rows.slice().filter(x=>{const match=(v,f)=>f==='all'||(f==='empty'?!String(v||'').trim()||String(v).toLowerCase().includes('belum'):String(v||'').toUpperCase()===f);const quality=qualityFilter==='all'||(qualityFilter==='review'?!monitorValidDate(x):monitorValidDate(x));const searchable=[x.nama,x.tim,x.kategori,x.tanggal,x.ro,x.sub].some(v=>String(v||'').toLocaleLowerCase('id-ID').includes(monitorSearch));return match(x.keuangan,financeFilter)&&match(x.validasiDirektur,directorFilter)&&quality&&searchable}).sort((a,b)=>{const da=ditrendukDate(a.tanggal),db=ditrendukDate(b.tanggal);if(!Number.isFinite(da))return Number.isFinite(db)?1:0;if(!Number.isFinite(db))return -1;return (da-db)*(monitorSort==='old'?1:-1)})}
 function monitorCsvCell(v){let t=String(v??'');if(/^[\s\u0000-\u001f]*[=+@-]/.test(t))t="'"+t;return '"'+t.replace(/"/g,'""')+'"'}
 sortBar.querySelector('#monitorExport').onclick=()=>{const header=['Tanggal','Nama kegiatan','Tim','Kategori','RO','Sub','Keuangan','Validasi direktur','Bukti','Tanggal perlu diperiksa'];const data=filteredMonitoring().map(x=>[x.tanggal,x.nama,x.tim,x.kategori,x.ro,x.sub,x.keuangan,x.validasiDirektur,x.bukti,monitorValidDate(x)?'Tidak':'Ya']);const csv='\uFEFF'+[header,...data].map(row=>row.map(monitorCsvCell).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='monitoring-filtered.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 function render(){const filtered=filteredMonitoring();sortBar.querySelector('#monitorCount').textContent=filtered.length+' dari '+rows.length+' kegiatan · '+rows.filter(x=>!monitorValidDate(x)).length+' tanggal perlu diperiksa';body.innerHTML=filtered.map((x,ri)=>`<tr id="${x.id}"><td>${ri+1}</td><td>${ED.esc(x.tanggal||'—')}</td><td class="monitor-name"><strong>${ED.esc(x.nama)}</strong></td><td><select class="inline-select mon-team ${teamColor(x.tim)}" data-id="${ED.esc(x.id)}">${options(teams,x.tim)}</select></td><td><select class="inline-select mon-category" data-id="${ED.esc(x.id)}">${options(categories,x.kategori)}</select></td><td><input class="inline-input mon-text" data-id="${ED.esc(x.id)}" data-key="ro" value="${ED.esc(x.ro)}"></td><td><input class="inline-input mon-text" data-id="${ED.esc(x.id)}" data-key="sub" value="${ED.esc(x.sub)}"></td>${x.docs.map((v,i)=>`<td class="check-cell"><input class="check mon-check" data-id="${ED.esc(x.id)}" data-doc="${i}" type="checkbox" ${v?'checked':''}></td>`).join('')}<td><select class="inline-select mon-fin ${cls(x.keuangan)}" data-id="${ED.esc(x.id)}">${finance.map(v=>`<option value="${v}" ${v===x.keuangan?'selected':''}>${v||'—'}</option>`).join('')}</select></td><td><select class="inline-select mon-valid ${cls(x.validasiDirektur)}" data-id="${ED.esc(x.id)}">${valid.map(v=>`<option ${v===x.validasiDirektur?'selected':''}>${v}</option>`).join('')}</select></td><td><input class="inline-input mon-text monitor-link" data-id="${ED.esc(x.id)}" data-key="bukti" value="${ED.esc(x.bukti)}" placeholder="https://..."></td></tr>`).join('')||'<tr><td colspan="24" class="muted">Belum ada kegiatan yang sesuai filter validasi.</td></tr>';
 body.querySelectorAll('.mon-team').forEach(c=>c.onchange=async()=>{const x=rows.find(r=>r.id===c.dataset.id);if(!x)return;await saveField(x,'tim',c.value,c);c.className='inline-select mon-team '+teamColor(x.tim)});
 body.querySelectorAll('.mon-category').forEach(c=>c.onchange=async()=>{const x=rows.find(r=>r.id===c.dataset.id);if(x)await saveField(x,'kategori',c.value,c)});
 body.querySelectorAll('.mon-check').forEach(c=>c.onchange=async()=>{let x=rows.find(r=>r.id===c.dataset.id);if(!x)return;const previous=[...x.docs];const next=[...previous];next[+c.dataset.doc]=c.checked;await saveField(x,'docs',next,c);c.checked=!!x.docs[+c.dataset.doc]});
 body.querySelectorAll('.mon-text').forEach(c=>c.onchange=async()=>{let x=rows.find(r=>r.id===c.dataset.id);if(x)await saveField(x,c.dataset.key,c.value,c)});
 body.querySelectorAll('.mon-fin').forEach(c=>c.onchange=async()=>{let x=rows.find(r=>r.id===c.dataset.id);if(x)await saveField(x,'keuangan',c.value,c);c.className='inline-select mon-fin '+cls(c.value)});
 body.querySelectorAll('.mon-valid').forEach(c=>c.onchange=async()=>{let x=rows.find(r=>r.id===c.dataset.id);if(!x)return;const old=x.validasiDirektur;try{await API.update('monitoring',x.id,{validasiDirektur:c.value,verifikasi:c.value});x.validasiDirektur=c.value;x.verifikasi=c.value;ED.toast('Validasi tersimpan di PostgreSQL.')}catch(err){c.value=old;ED.toast('Gagal menyimpan: '+err.message)}c.className='inline-select mon-valid '+cls(c.value)});}
 render();document.getElementById('syncBtn').onclick=()=>ED.open('syncModal');document.getElementById('doSync').onclick=()=>{ED.close('syncModal');ED.toast('Sinkronisasi Google Drive belum tersedia. Tidak ada data yang diubah.')}}
function pageJadwal(){const p=D.petugas||[],all=[...new Set(p.map(x=>x.nama))],groups={Asrot:p.filter(x=>x.tugas.toLowerCase().includes('asrot')),Notulis:p.filter(x=>x.tugas.toLowerCase().includes('notulis')),Supervisi:p.filter(x=>x.tugas.toLowerCase().includes('supervisi'))};['scheduleSupervisi','scheduleAsrot','scheduleNotulis'].forEach(id=>{let el=document.getElementById(id);all.forEach(n=>el.add(new Option(n,n)))});const dates=['Senin · 3 Agu','Senin · 10 Agu','Senin · 17 Agu','Senin · 24 Agu','Senin · 31 Agu'];document.getElementById('scheduleGrid').innerHTML=dates.map((d,i)=>`<div class="schedule-card ${i===2?'current':''}"><h3>${d}</h3><p>Supervisi · <b>${ED.esc(groups.Supervisi[i%Math.max(groups.Supervisi.length,1)]?.nama||'—')}</b></p><p>Asrot · <b>${ED.esc(groups.Asrot[i%Math.max(groups.Asrot.length,1)]?.nama||'—')}</b></p><p>Notulis · <b>${ED.esc(groups.Notulis[i%Math.max(groups.Notulis.length,1)]?.nama||'—')}</b></p><button class="btn btn-outline btn-sm editSchedule">Ubah jadwal</button></div>`).join('');document.querySelectorAll('.editSchedule').forEach(b=>b.onclick=()=>ED.open('scheduleModal'));document.getElementById('addSchedule').onclick=()=>ED.open('scheduleModal');document.getElementById('saveSchedule').onclick=()=>{ED.close('scheduleModal');ED.toast('Jadwal disimpan.')}}


function pageUsers(){let rows=(D.users||[]).map((x,i)=>({...x,peran:x.peran||'Pegawai',akses:x.akses||'',aktivasi:x.aktivasi||''})),body=document.getElementById('userBody');document.getElementById('userTotal').textContent=rows.length;document.getElementById('activeTotal').textContent=rows.filter(x=>x.status==='Aktif').length;document.getElementById('adminTotal').textContent=rows.filter(x=>x.peran.includes('Admin')).length;const roles=['Admin / PIC','Pegawai','Notulis / PIC'],access=['Semua modul','Logbook, Repository','Repository, Notulen','RAKOM, Monitoring'],statuses=['Aktif','Nonaktif'];function sel(arr,val,field,id){if(val&&!arr.includes(val))arr=[val,...arr];return `<select class="inline-select user-edit" data-field="${field}" data-id="${ED.esc(id)}">${arr.map(v=>`<option ${v===val?'selected':''}>${v}</option>`).join('')}</select>`}function render(){body.innerHTML=rows.map(x=>`<tr><td><strong>${ED.esc(x.nama)}</strong></td><td><input class="inline-input user-unit" data-id="${ED.esc(x.id)}" aria-label="Unit kerja ${ED.esc(x.nama)}" value="${ED.esc(x.unit||'')}"></td><td>${sel(roles,x.peran,'peran',x.id)}</td><td>${sel(access,x.akses,'akses',x.id)}</td><td>${`<select class="inline-select user-edit ${x.status==='Aktif'?'state-green':'state-yellow'}" data-field="status" data-id="${ED.esc(x.id)}">${statuses.map(v=>`<option ${v===x.status?'selected':''}>${v}</option>`).join('')}</select>`}</td><td><input class="inline-input user-activation" data-id="${ED.esc(x.id)}" value="${ED.esc(x.aktivasi)}"></td><td><button class="link manage" data-id="${ED.esc(x.id)}">Atur ulang kata sandi</button></td></tr>`).join('');body.querySelectorAll('.user-edit').forEach(e=>e.onchange=()=>{{let x=rows.find(x=>x.id===e.dataset.id);x[e.dataset.field]=e.value;ED.persist('users',x);}ED.toast('Data pengguna diperbarui.')});body.querySelectorAll('.user-activation').forEach(e=>e.onchange=()=>{{let x=rows.find(x=>x.id===e.dataset.id);x.aktivasi=e.value;ED.persist('users',x);}ED.toast('Aktivasi diperbarui.')});body.querySelectorAll('.manage').forEach(b=>b.onclick=()=>{let x=rows.find(r=>r.id===b.dataset.id);document.getElementById('manageName').textContent=x.nama;ED.open('manageModal')})}render();if(document.getElementById('resetPassword'))document.getElementById('resetPassword').onclick=()=>{ED.close('manageModal');ED.toast('Permintaan atur ulang kata sandi dibuat.')};document.getElementById('addUser').onclick=()=>ED.open('userModal');document.getElementById('saveUser').onclick=()=>{ED.close('userModal');ED.toast('Pengguna ditambahkan.')}}
function pageNotulen() {
    const params = new URLSearchParams(window.location.search);
    const topicInput = document.getElementById('topic');
    const teamInput = document.getElementById('team');
    const speakerSelect = document.getElementById('speaker');

    if (params.get('title')) {
        topicInput.value = params.get('title');
    }

    if (params.get('team')) {
        teamInput.value = params.get('team');
    }

    const indicators = [
        { label: 'PEMBUKAAN DAN ARAHAN', notes: [] },
        { label: 'PEMAPARAN MATERI', notes: [] },
        { label: 'DISKUSI', notes: [] }
    ];
    const documentationPhotos = [];
    let activeIndicator = 0;

    (D.users || []).forEach(function (user) {
        speakerSelect.add(new Option(user.nama, user.nama));
    });

    function escapeWithBreaks(value) {
        return ED.esc(value || '').replace(/\n/g, '<br>');
    }

    function cleanParticipant(value) {
        return value
            .replace(/^\s*[-•]+\s*/, '')
            .replace(/^\s*\d+[.)]\s*/, '')
            .trim();
    }

    function formatMeetingDate(value) {
        if (!value) return '—';

        const date = new Date(value + 'T00:00:00');
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const monthNames = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];

        return dayNames[date.getDay()] + '/ ' + date.getDate() + ' ' + monthNames[date.getMonth()] + ' ' + date.getFullYear();
    }

    function formatApprovalDate(value) {
        if (!value) return '—';

        const date = new Date(value + 'T00:00:00');
        const monthNames = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];

        return date.getDate() + ' ' + monthNames[date.getMonth()] + ' ' + date.getFullYear();
    }

    function formatTime(value) {
        if (!value) return '—';
        return value + ' WIB';
    }

    function renderIndicators() {
        const indicatorHtml = indicators.map(function (indicator, index) {
            const letter = String.fromCharCode(65 + index);
            const activeClass = index === activeIndicator ? ' active' : '';

            return `
                <button class="indicator${activeClass}" data-index="${index}" type="button">
                    <b>${letter}. ${ED.esc(indicator.label)}</b>
                    <br>
                    <small>${indicator.notes.length} pembahasan</small>
                </button>
            `;
        }).join('');

        document.getElementById('indicatorList').innerHTML = indicatorHtml;
        document.getElementById('indicatorSidebar').innerHTML = indicatorHtml;

        document.querySelectorAll('.indicator').forEach(function (button) {
            button.addEventListener('click', function () {
                activeIndicator = Number(button.dataset.index);
                renderIndicators();
                renderNotes();
            });
        });
    }

    function renderNotes() {
        const indicator = indicators[activeIndicator];
        const notesContainer = document.getElementById('notes');

        if (!indicator) {
            notesContainer.innerHTML = '<div class="empty">Belum ada indikator pembahasan.</div>';
            return;
        }

        if (!indicator.notes.length) {
            notesContainer.innerHTML = `
                <div class="discussion-editor-head">
                    <b>${String.fromCharCode(65 + activeIndicator)}. ${ED.esc(indicator.label)}</b>
                    <span>Belum ada pembahasan.</span>
                </div>
            `;
            return;
        }

        notesContainer.innerHTML = `
            <div class="discussion-editor-head">
                <b>${String.fromCharCode(65 + activeIndicator)}. ${ED.esc(indicator.label)}</b>
                <span>${indicator.notes.length} pembahasan tersimpan</span>
            </div>
            <div class="discussion-editor-list">
                ${indicator.notes.map(function (note, noteIndex) {
                    const speakerInfo = note.org
                        ? ED.esc(note.speaker) + ' - ' + ED.esc(note.org)
                        : ED.esc(note.speaker);

                    return `
                        <article class="discussion-editor-item">
                            <div class="discussion-editor-meta">
                                <strong>${speakerInfo}</strong>
                                <button type="button" class="note-delete" data-note-index="${noteIndex}">Hapus</button>
                            </div>
                            <p>${escapeWithBreaks(note.text)}</p>
                        </article>
                    `;
                }).join('')}
            </div>
        `;

        notesContainer.querySelectorAll('.note-delete').forEach(function (button) {
            button.addEventListener('click', function () {
                if (!window.confirm('Hapus pembahasan ini? Tindakan ini tidak dapat dibatalkan.')) return;
                indicator.notes.splice(Number(button.dataset.noteIndex), 1);
                renderNotes();
                renderIndicators();
            });
        });
    }

    function renderDocumentationEditor() {
        const container = document.getElementById('documentationPreview');

        if (!documentationPhotos.length) {
            container.innerHTML = '<div class="documentation-empty">Belum ada foto dokumentasi.</div>';
            return;
        }

        container.innerHTML = documentationPhotos.map(function (photo, index) {
            return `
                <figure class="documentation-thumb">
                    <img src="${photo.dataUrl}" alt="Dokumentasi kegiatan ${index + 1}">
                    <figcaption>
                        <span>Foto ${index + 1}</span>
                        <button type="button" class="documentation-remove" data-photo-index="${index}">Hapus</button>
                    </figcaption>
                </figure>
            `;
        }).join('');

        container.querySelectorAll('.documentation-remove').forEach(function (button) {
            button.addEventListener('click', function () {
                documentationPhotos.splice(Number(button.dataset.photoIndex), 1);
                renderDocumentationEditor();
            });
        });
    }

    function renderOfficialDocumentation() {
        const section = document.getElementById('officialDocumentation');
        const grid = document.getElementById('officialDocumentationGrid');

        if (!documentationPhotos.length) {
            section.style.display = 'none';
            grid.innerHTML = '';
            return;
        }

        section.style.display = 'block';
        grid.innerHTML = documentationPhotos.map(function (photo, index) {
            return `
                <div class="official-documentation-photo">
                    <img src="${photo.dataUrl}" alt="Dokumentasi kegiatan ${index + 1}">
                </div>
            `;
        }).join('');
    }

    function showStep(stepNumber) {
        document.getElementById('step1').style.display = stepNumber === 1 ? 'block' : 'none';
        document.getElementById('step2').style.display = stepNumber === 2 ? 'block' : 'none';
        document.getElementById('step3').style.display = stepNumber === 3 ? 'block' : 'none';

        document.querySelectorAll('.wizard-tab').forEach(function (tab, index) {
            tab.classList.toggle('active', index === stepNumber - 1);
        });
    }

    function renderOfficialPreview() {
        document.getElementById('previewTopic').textContent = topicInput.value.trim() || '—';
        document.getElementById('previewNotulis').textContent = document.getElementById('meetingNotulis').value.trim() || '—';
        document.getElementById('previewChecked').textContent = document.getElementById('meetingChecked').value.trim() || '—';
        document.getElementById('previewApproved').textContent = document.getElementById('meetingApproved').value.trim() || '—';
        document.getElementById('previewDate').textContent = formatMeetingDate(document.getElementById('meetingDate').value);
        document.getElementById('previewTime').textContent = formatTime(document.getElementById('meetingTime').value);
        document.getElementById('previewPlace').textContent = document.getElementById('meetingPlace').value.trim() || '—';
        document.getElementById('previewLeader').textContent = document.getElementById('meetingLeader').value.trim() || '—';
        document.getElementById('previewApprovalDate').textContent = formatApprovalDate(document.getElementById('meetingApprovalDate').value);

        const participants = document.getElementById('meetingParticipants').value
            .split(/\n/)
            .map(cleanParticipant)
            .filter(Boolean);

        document.getElementById('previewParticipants').innerHTML = participants.length
            ? participants.map(function (participant) {
                return '<li>' + ED.esc(participant) + '</li>';
            }).join('')
            : '<li>—</li>';

        document.getElementById('previewBody').innerHTML = indicators.map(function (indicator, index) {
            const letter = String.fromCharCode(65 + index);

            const discussionHtml = indicator.notes.length
                ? indicator.notes.map(function (note) {
                    const speakerInfo = note.org
                        ? ED.esc(note.speaker) + ' - ' + ED.esc(note.org)
                        : ED.esc(note.speaker);

                    return `
                        <div class="official-discussion-entry">
                            <strong>${speakerInfo}</strong>
                            <p>${escapeWithBreaks(note.text)}</p>
                        </div>
                    `;
                }).join('')
                : '<p class="official-empty">Belum ada pembahasan.</p>';

            return `
                <section class="official-discussion-section">
                    <div class="official-indicator-title">
                        <span>${letter}.</span>
                        <strong>${ED.esc(indicator.label)}</strong>
                    </div>
                    <div class="official-indicator-content">
                        ${discussionHtml}
                    </div>
                </section>
            `;
        }).join('');

        renderOfficialDocumentation();
    }

    document.getElementById('addIndicator').addEventListener('click', function () {
        const input = document.getElementById('indicatorInput');
        const value = input.value.trim();

        if (!value) {
            ED.toast('Isi indikator pembahasan terlebih dahulu.');
            return;
        }

        indicators.push({
            label: value,
            notes: []
        });

        activeIndicator = indicators.length - 1;
        input.value = '';
        renderIndicators();
        renderNotes();
    });

    document.getElementById('startMeeting').addEventListener('click', function () {
        if (!indicators.length) {
            ED.toast('Tambahkan minimal satu indikator pembahasan.');
            return;
        }

        showStep(2);
        renderIndicators();
        renderNotes();
    });

    document.getElementById('clearNote').addEventListener('click', function () {
        speakerSelect.value = '';
        document.getElementById('externalSpeaker').value = '';
        document.getElementById('speakerOrg').value = '';
        document.getElementById('noteText').value = '';
    });

    document.getElementById('addNote').addEventListener('click', function () {
        const indicator = indicators[activeIndicator];
        const noteText = document.getElementById('noteText');
        const externalSpeaker = document.getElementById('externalSpeaker');
        const speakerOrg = document.getElementById('speakerOrg');
        const text = noteText.value.trim();
        const speakerName = externalSpeaker.value.trim() || speakerSelect.value.trim();

        if (!indicator) {
            ED.toast('Pilih indikator pembahasan terlebih dahulu.');
            return;
        }

        if (!speakerName) {
            ED.toast('Pilih pembicara internal atau isi nama pembicara eksternal.');
            return;
        }

        if (!text) {
            ED.toast('Isi pembahasan belum diisi.');
            return;
        }

        indicator.notes.push({
            speaker: speakerName,
            org: speakerOrg.value.trim(),
            text: text
        });

        externalSpeaker.value = '';
        speakerOrg.value = '';
        noteText.value = '';

        renderNotes();
        renderIndicators();
    });

    document.getElementById('documentationInput').addEventListener('change', function (event) {
        const files = Array.from(event.target.files || []);

        files.forEach(function (file) {
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.addEventListener('load', function () {
                documentationPhotos.push({
                    name: file.name,
                    dataUrl: reader.result
                });
                renderDocumentationEditor();
            });
            reader.readAsDataURL(file);
        });

        event.target.value = '';
    });

    document.getElementById('finishMeeting').addEventListener('click', function () {
        renderOfficialPreview();
        showStep(3);
    });

    document.getElementById('backToNotes').addEventListener('click', function () {
        showStep(2);
    });

    document.getElementById('submitNote').addEventListener('click', async function () {
        renderOfficialPreview();

        const button = this;
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Menyimpan...';

        const participants = document.getElementById('meetingParticipants').value
            .split(/\n/)
            .map(cleanParticipant)
            .filter(Boolean);

        const payload = {
            topic: topicInput.value.trim(),
            team: teamInput.value.trim(),
            meetingDate: document.getElementById('meetingDate').value,
            meetingTime: document.getElementById('meetingTime').value,
            place: document.getElementById('meetingPlace').value.trim(),
            leader: document.getElementById('meetingLeader').value.trim(),
            notulis: document.getElementById('meetingNotulis').value.trim(),
            checkedBy: document.getElementById('meetingChecked').value.trim(),
            approvedBy: document.getElementById('meetingApproved').value.trim(),
            approvalDate: document.getElementById('meetingApprovalDate').value,
            participants,
            status: 'Final',
            sections: indicators.map(function (indicator) {
                return {
                    title: indicator.label,
                    notes: indicator.notes.map(function (note) {
                        return { speaker: note.speaker, organization: note.org, body: note.text };
                    })
                };
            }),
            documentation: documentationPhotos.map(function (photo) {
                return { fileName: photo.name, dataUrl: photo.dataUrl };
            })
        };

        try {
            const result = await API.saveNotulen(payload);
            ED.toast('Notulen berhasil disimpan ke database. ID: ' + result.data.id);
        } catch (error) {
            ED.toast('Gagal menyimpan notulen: ' + error.message);
        } finally {
            button.disabled = false;
            button.textContent = originalText;
        }
    });

    renderIndicators();
    renderNotes();
    renderDocumentationEditor();
}

// Revisi 2.1 — overrides terstruktur. Dipisahkan di akhir agar kode sumber/data awal tetap utuh dan mudah dipindahkan ke backend.
function pageRakom(){
 // Data bersumber dari bootstrap PostgreSQL, bukan status/progres contoh.
 let rows=(D.disposisi||[]).filter(x=>x.arahan||x.tugas||x.perihal).map(x=>({...x,tim:x.tim||x.pic||x.asal||'Belum ditetapkan',arahan:x.arahan||x.tugas||x.perihal||'',pic:x.pic||'',deadline:x.deadline||'',status:x.status||'Belum mulai',bukti:x.bukti||'',catatan:x.catatan||''}));
 const body=document.getElementById('rakomBody'),statuses=[...new Set(['Done','In Progress','Terlambat','Belum mulai','To Do',...rows.map(x=>x.status).filter(Boolean)])];let proofId=null;
 const progress=x=>x.status==='Done'?100:['Belum mulai','To Do'].includes(x.status)?0:Math.min(99,Math.max(0,Number.isFinite(Number(x.progress))?Number(x.progress):0));
 const cls=v=>v==='Done'?'state-green':v==='In Progress'?'state-yellow':v==='Terlambat'?'state-orange':'state-red';
 async function persist(x,changes){try{const r=await API.update('disposisi',x.id,changes);Object.assign(x,r.data||changes);const original=(D.disposisi||[]).find(item=>String(item.id)===String(x.id));if(original)Object.assign(original,r.data||changes);document.dispatchEvent(new Event('workspace-data-updated'));try{localStorage.setItem('ed_workspace_updated',String(Date.now()))}catch(_){}ED.toast('Perubahan tersimpan di database.');return true}catch(e){ED.toast('Gagal menyimpan: '+e.message);return false}}
 let filter='Semua',sortOrder='newest',searchTerm='',visibleRows=[],requestSerial=0;const existingControls=document.getElementById('rakomControls');if(existingControls)existingControls.remove();const controls=document.createElement('div');controls.id='rakomControls';controls.className='toolbar';controls.style.marginBottom='12px';controls.innerHTML='<label for="rakomSearch">Cari arahan: </label><input id="rakomSearch" class="field" type="search" placeholder="Cari tim, arahan, atau PIC" style="max-width:250px"><label for="rakomFilter">Filter status: </label><select id="rakomFilter" class="field" style="max-width:200px"><option>Semua</option>'+statuses.map(v=>`<option>${v}</option>`).join('')+'</select><label for="rakomSort" style="margin-left:12px">Urut tanggal: </label><select id="rakomSort" class="field" style="max-width:175px"><option value="newest">Terbaru dahulu</option><option value="oldest">Terlama dahulu</option></select><button id="rakomReset" class="btn btn-outline" type="button">Reset filter</button><button id="rakomRefresh" class="btn btn-outline" type="button">Perbarui data</button><button id="rakomExport" class="btn btn-outline" type="button">Ekspor CSV</button><span id="rakomCount" class="muted" aria-live="polite"></span>';body.closest('table').parentNode.before(controls);controls.querySelector('#rakomSearch').oninput=e=>{searchTerm=e.target.value.toLocaleLowerCase('id-ID').trim();render()};controls.querySelector('#rakomFilter').onchange=e=>{filter=e.target.value;render()};controls.querySelector('#rakomSort').onchange=e=>{sortOrder=e.target.value;render()};
 function render(){const visible=(filter==='Semua'?rows:rows.filter(x=>x.status===filter)).filter(x=>!searchTerm||[x.tim,x.arahan,x.pic,x.deadline].some(v=>String(v||'').toLocaleLowerCase('id-ID').includes(searchTerm))).slice().sort((a,b)=>{const parse=x=>{const v=String(x.deadline||x.tanggal||'').trim();const m=v.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);if(m)return Date.UTC(+m[3],+m[2]-1,+m[1]);const t=ditrendukDate(v);return Number.isFinite(t)?t:NaN};const av=parse(a),bv=parse(b),aok=Number.isFinite(av),bok=Number.isFinite(bv);if(aok!==bok)return aok?-1:1;if(!aok)return 0;return sortOrder==='newest'?bv-av:av-bv});visibleRows=visible;controls.querySelector('#rakomCount').textContent=visible.length+' dari '+rows.length+' arahan · '+rows.filter(x=>!Number.isFinite(ditrendukDate(x.deadline||x.tanggal))).length+' tanggal perlu diperiksa';body.innerHTML=visible.map(x=>`<tr><td><strong>${ED.esc(x.tim)}</strong></td><td><button class="link rk-edit" data-id="${ED.esc(x.id)}" title="Edit arahan direktur">${ED.esc(x.arahan)} ✎</button></td><td>${ED.esc(x.pic)}</td><td>${ED.esc(x.deadline)}</td><td><select class="inline-select rk-status ${cls(x.status)}" data-id="${ED.esc(x.id)}">${statuses.map(v=>`<option ${v===x.status?'selected':''}>${v}</option>`).join('')}</select></td><td><div class="progress"><span style="width:${progress(x)}%"></span></div><small>${progress(x)}%</small></td><td><button class="link rk-proof" data-id="${ED.esc(x.id)}">Kelola bukti →</button></td></tr>`).join('')||'<tr><td colspan="7" class="muted">Tidak ada arahan yang sesuai pencarian dan filter.</td></tr>';
 body.querySelectorAll('.rk-status').forEach(e=>e.onchange=async()=>{let x=rows.find(r=>String(r.id)===String(e.dataset.id));if(!x)return ED.toast('Arahan tidak ditemukan.');const old=x.status;const next=e.value;e.disabled=true;const nextProgress=next==='Done'?100:['Belum mulai','To Do'].includes(next)?0:Math.min(99,Math.max(0,Number(x.progress)||0));if(!await persist(x,{status:next,progress:nextProgress}))x.status=old;render()});
 body.querySelectorAll('.rk-edit').forEach(e=>e.onclick=async()=>{const x=rows.find(r=>String(r.id)===String(e.dataset.id));if(!x)return ED.toast('Arahan tidak ditemukan.');const next=await window.ED_TEXT_MODAL('Edit Arahan Direktur',x.arahan);if(next===null||!next.trim()||next===x.arahan)return;if(await persist(x,{arahan:next.trim()}))render()});
 body.querySelectorAll('.rk-proof').forEach(b=>b.onclick=()=>{proofId=b.dataset.id;let x=rows.find(r=>String(r.id)===String(proofId)),f=document.querySelectorAll('#proofModal .field');if(!x)return ED.toast('Bukti dukung tidak ditemukan.');document.getElementById('proofTitle').textContent=x.tim;f[0].value=x.bukti;f[1].value=x.catatan;ED.open('proofModal')})}
 controls.querySelector('#rakomReset').onclick=()=>{filter='Semua';sortOrder='newest';searchTerm='';controls.querySelector('#rakomSearch').value='';controls.querySelector('#rakomFilter').value='Semua';controls.querySelector('#rakomSort').value='newest';render()};
 controls.querySelector('#rakomExport').onclick=()=>{const safe=value=>{let s=String(value??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};const columns=['Tim','Arahan Direktur','PIC','Deadline','Status','Progres','Bukti','Catatan'];const lines=[columns,...visibleRows.map(x=>[x.tim,x.arahan,x.pic,x.deadline,x.status,progress(x),x.bukti,x.catatan])];const csv='\uFEFF'+lines.map(line=>line.map(safe).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='rakom-filtered.csv';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 controls.querySelector('#rakomRefresh').onclick=async()=>{const btn=controls.querySelector('#rakomRefresh');if(btn.disabled)return;btn.disabled=true;const serial=++requestSerial;try{const result=await API.list('disposisi');if(serial!==requestSerial)return;const payload=Array.isArray(result)?result:Array.isArray(result?.data)?result.data:null;if(!payload)throw new Error('Format daftar arahan tidak valid');rows=payload.filter(x=>x.arahan||x.tugas||x.perihal).map(x=>({...x,tim:x.tim||x.pic||x.asal||'Belum ditetapkan',arahan:x.arahan||x.tugas||x.perihal||'',pic:x.pic||'',deadline:x.deadline||'',status:x.status||'Belum mulai',bukti:x.bukti||'',catatan:x.catatan||''}));D.disposisi=payload;for(const row of rows){if(row.status&&!statuses.includes(row.status))statuses.push(row.status)}const statusSelect=controls.querySelector('#rakomFilter');const previous=statusSelect.value;statusSelect.innerHTML='<option>Semua</option>'+statuses.map(v=>'<option>'+ED.esc(v)+'</option>').join('');statusSelect.value=statuses.includes(previous)?previous:'Semua';filter=statusSelect.value;render();ED.toast('Data RAKOM diperbarui.')}catch(error){ED.toast('Gagal memuat RAKOM: '+error.message)}finally{btn.disabled=false}};
 render();document.getElementById('addDirection').onclick=()=>ED.open('directionModal');document.getElementById('saveDirection').onclick=async()=>{let f=[...document.querySelectorAll('#directionModal .field')];if(!f[0].value.trim()||!f[1].value.trim())return ED.toast('Tim/output dan arahan wajib diisi.');const saveBtn=document.getElementById('saveDirection');if(saveBtn.disabled)return;saveBtn.disabled=true;const row={tim:f[0].value.trim(),arahan:f[1].value.trim(),pic:f[2].value||'',deadline:f[3].value||'',status:'Belum mulai',progress:0,bukti:'',catatan:''};try{const r=await API.create('disposisi',row);rows.unshift(r.data);if(!Array.isArray(D.disposisi))D.disposisi=[];D.disposisi.unshift(r.data);render();document.dispatchEvent(new Event('workspace-data-updated'));try{localStorage.setItem('ed_workspace_updated',String(Date.now()))}catch(_){}ED.close('directionModal');ED.toast('Arahan tersimpan di PostgreSQL.')}catch(e){ED.toast('Gagal menyimpan: '+e.message)}finally{saveBtn.disabled=false}};
 document.getElementById('saveProof').onclick=async()=>{let x=rows.find(r=>String(r.id)===String(proofId)),f=document.querySelectorAll('#proofModal .field');if(!x)return ED.toast('Arahan tidak ditemukan.');const link=f[0].value.trim();if(link&&!/^https:\/\/[^\s]+$/i.test(link))return ED.toast('Bukti dukung harus berupa tautan HTTPS.');const btn=document.getElementById('saveProof');btn.disabled=true;try{if(await persist(x,{bukti:link,catatan:f[1].value.trim()}))ED.close('proofModal')}finally{btn.disabled=false}};
}

function pageJadwal(){const all=[...new Set((D.petugas||[]).map(x=>x.nama).filter(Boolean))];let schedules=['2026-08-03','2026-08-10','2026-08-17','2026-08-24','2026-08-31'].map((date,i)=>({id:'s'+i,date,supervisi:all[(i*3+2)%all.length]||'—',asrot:all[(i*3)%all.length]||'—',notulis:all[(i*3+1)%all.length]||'—'})),editing=null;['scheduleSupervisi','scheduleAsrot','scheduleNotulis'].forEach(id=>{let el=document.getElementById(id);all.forEach(n=>el.add(new Option(n,n)))});const grid=document.getElementById('scheduleGrid'),label=d=>new Date(d+'T00:00:00').toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'short'});function render(){grid.innerHTML=schedules.map((x,i)=>`<div class="schedule-card ${i===2?'current':''}"><h3>${ED.esc(label(x.date))}</h3><p>Supervisi · <b>${ED.esc(x.supervisi)}</b></p><p>Asrot · <b>${ED.esc(x.asrot)}</b></p><p>Notulis · <b>${ED.esc(x.notulis)}</b></p><button class="btn btn-outline btn-sm editSchedule" data-id="${ED.esc(x.id)}">Ubah jadwal</button></div>`).join('');grid.querySelectorAll('.editSchedule').forEach(b=>b.onclick=()=>{editing=b.dataset.id;let x=schedules.find(r=>r.id===editing);document.getElementById('scheduleDate').value=x.date;document.getElementById('scheduleSupervisi').value=x.supervisi;document.getElementById('scheduleAsrot').value=x.asrot;document.getElementById('scheduleNotulis').value=x.notulis;ED.open('scheduleModal')})}render();document.getElementById('addSchedule').onclick=()=>{editing=null;document.getElementById('scheduleDate').value='';['scheduleSupervisi','scheduleAsrot','scheduleNotulis'].forEach(id=>document.getElementById(id).value='');ED.open('scheduleModal')};document.getElementById('saveSchedule').onclick=()=>{let obj={date:document.getElementById('scheduleDate').value,supervisi:document.getElementById('scheduleSupervisi').value,asrot:document.getElementById('scheduleAsrot').value,notulis:document.getElementById('scheduleNotulis').value};if(!obj.date)return ED.toast('Tanggal wajib diisi.');if(editing)Object.assign(schedules.find(x=>x.id===editing),obj);else schedules.push({id:'s'+Date.now(),...obj});render();ED.close('scheduleModal');ED.toast(editing?'Jadwal berhasil diubah.':'Jadwal ditambahkan.')}}

function pageLogbook(){let logSort='desc';let rows=(D.logbook||[]).map(x=>({...x,status:x.status||'Tercatat',catatan:x.catatan||''})),body=document.getElementById('logBody'),search=document.getElementById('logSearch'),person=document.getElementById('personFilter'),period=document.getElementById('periodFilter'),editing=null;[...new Set(rows.map(x=>x.pegawai))].forEach(x=>person.add(new Option(x,x)));const monthNames=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];const monthName=p=>{const match=String(p||'').match(/(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)/i);return match?monthNames.find(n=>n.toLowerCase()===match[1].toLowerCase()):'Tidak diketahui'};monthNames.forEach(x=>period.add(new Option(x,x)));period.options[0].text='Semua bulan';const logSortControl=document.createElement('select');logSortControl.id='logDateSort';logSortControl.className='field compact-date-sort';logSortControl.setAttribute('aria-label','Urutan periode logbook');logSortControl.innerHTML='<option value="desc">Periode terbaru</option><option value="asc">Periode terlama</option>';period.insertAdjacentElement('afterend',logSortControl);
 const logToolbar=period.parentElement;
 const logQuality=document.createElement('select');logQuality.id='logQualityFilter';logQuality.className='field compact-date-sort';logQuality.setAttribute('aria-label','Filter kualitas periode logbook');logQuality.innerHTML='<option value="all">Semua periode</option><option value="invalid">Periode perlu diperiksa</option><option value="valid">Periode valid</option>';logSortControl.insertAdjacentElement('afterend',logQuality);
 const logCount=document.createElement('span');logCount.id='logResultCount';logCount.className='muted';logCount.setAttribute('aria-live','polite');logQuality.insertAdjacentElement('afterend',logCount);
 const logReset=document.createElement('button');logReset.id='logResetFilter';logReset.type='button';logReset.className='btn btn-outline';logReset.textContent='Reset filter';logCount.insertAdjacentElement('afterend',logReset);
 const logExport=document.createElement('button');logExport.id='logExportCsv';logExport.type='button';logExport.className='btn btn-outline';logExport.textContent='Ekspor CSV';logReset.insertAdjacentElement('afterend',logExport);
 let visibleLogRows=[];
 const safeCsvCell=value=>{let str=String(value??'');if(/^[\s]*[=+@-]/.test(str))str="'"+str;return '"'+str.replace(/"/g,'""')+'"'};
 const exportLogCsv=()=>{const columns=['Periode','Pegawai','Aktivitas','Status','Bukti','Catatan'];const values=visibleLogRows.map(row=>[monthName(row.periode),row.pegawai,row.aktivitas,row.status,row.bukti,row.catatan]);const csv='\uFEFF'+[columns,...values].map(r=>r.map(safeCsvCell).join(',')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const link=document.createElement('a');const url=URL.createObjectURL(blob);link.href=url;link.download='logbook-filtered.csv';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 logExport.onclick=exportLogCsv;
 logReset.onclick=()=>{search.value='';person.value='';period.value='';logQuality.value='all';logSortControl.value='desc';logSort='desc';render()};
 logQuality.onchange=()=>render();const monthIndex=['januari','februari','maret','april','mei','juni','juli','agustus','september','oktober','november','desember'];const periodDate=x=>{const i=monthIndex.indexOf(monthName(x.periode).toLowerCase());return i>=0?i:NaN};logSortControl.onchange=e=>{logSort=e.target.value;render()};const statuses=['Tercatat','Draf','Perlu perbaikan','Selesai'],cls=v=>v==='Selesai'?'state-green':v==='Tercatat'?'state-yellow':v==='Perlu perbaikan'?'state-red':'state-blue';function render(){let q=search.value.toLowerCase(),a=rows.filter(x=>(!q||(x.pegawai+' '+x.aktivitas).toLowerCase().includes(q))&&(!person.value||x.pegawai===person.value)&&(!period.value||monthName(x.periode)===period.value)&& (logQuality.value==='all'||(logQuality.value==='valid'?Number.isFinite(periodDate(x)):!Number.isFinite(periodDate(x)))));a=a.slice().sort((x,y)=>{const dx=periodDate(x),dy=periodDate(y),vx=Number.isFinite(dx),vy=Number.isFinite(dy);if(vx!==vy)return vx?-1:1;if(!vx)return 0;return logSort==='asc'?dx-dy:dy-dx});visibleLogRows=a;logCount.textContent=`${a.length} catatan · ${rows.filter(r=>!Number.isFinite(periodDate(r))).length} periode perlu diperiksa`;body.innerHTML=a.map(x=>`<tr><td>${ED.esc(monthName(x.periode))}</td><td><strong>${ED.esc(x.pegawai)}</strong></td><td>${ED.esc(String(x.aktivitas||'').slice(0,180))}${String(x.aktivitas||'').length>180?'…':''}</td><td><select class="inline-select log-status ${cls(x.status)}" data-id="${ED.esc(x.id)}">${statuses.map(v=>`<option ${v===x.status?'selected':''}>${v}</option>`).join('')}</select></td><td>${urlFrom(x.bukti)?`<button class="link proofLink" data-url="${ED.esc(urlFrom(x.bukti))}">Buka bukti →</button>`:'<span>Belum ada</span>'}</td><td><button class="link logDetail" data-id="${ED.esc(x.id)}">Edit detail →</button></td></tr>`).join('')||'<tr><td colspan="6" class="muted">Tidak ada catatan logbook sesuai pencarian.</td></tr>';/* Status logbook ditangani oleh delegasi penyimpanan API pada wrapper pageLogbook. */body.querySelectorAll('.proofLink').forEach(b=>b.onclick=()=>{if(/^https:\/\//i.test(b.dataset.url))window.open(b.dataset.url,'_blank','noopener,noreferrer');else ED.toast('Tautan bukti harus HTTPS.')});body.querySelectorAll('.logDetail').forEach(b=>b.onclick=()=>{let x=rows.find(r=>r.id===b.dataset.id);editing=x.id;window.__logbookEditingId=String(x.id);document.getElementById('logDetailTitle').textContent=x.pegawai;document.getElementById('logEditPeriod').value=monthName(x.periode);document.getElementById('logEditPerson').value=x.pegawai;document.getElementById('logEditText').value=x.aktivitas;document.getElementById('logEditStatus').value=x.status;document.getElementById('logEditProof').value=urlFrom(x.bukti);document.getElementById('logEditNote').value=x.catatan;ED.open('logDetailModal')})}search.oninput=person.onchange=period.onchange=render;render();document.getElementById('saveLogDetail').onclick=()=>{let x=rows.find(r=>r.id===editing);if(x){x.aktivitas=document.getElementById('logEditText').value.trim();x.status=document.getElementById('logEditStatus').value;x.bukti=document.getElementById('logEditProof').value.trim();x.catatan=document.getElementById('logEditNote').value.trim()}render();ED.close('logDetailModal');ED.toast('Detail logbook diperbarui.')};document.getElementById('addLog').onclick=()=>ED.open('logModal');document.getElementById('saveLog').onclick=()=>{ED.close('logModal');ED.toast('Aktivitas ditambahkan.')}}

function pageArsip(){
 const rows=D.archive||[],body=document.getElementById('archiveBody'),q=document.getElementById('archiveSearch');
 const nas=['Musnah','Dinilai kembali','Permanen'];
 const toolbar=q.closest('.toolbar')||q.parentElement;
 const ensure=(id,tag,html,label)=>{let el=toolbar.querySelector('#'+id);if(!el){el=document.createElement(tag);el.id=id;el.className=tag==='select'?'field compact-date-sort':'btn btn-outline';el.innerHTML=html;el.setAttribute('aria-label',label);toolbar.appendChild(el)}return el};
 const sort=ensure('archiveDateSort','select','<option value="desc">Tanggal terbaru</option><option value="asc">Tanggal terlama</option>','Urutan tanggal arsip');
 const quality=ensure('archiveQualityFilter','select','<option value="all">Semua tanggal</option><option value="invalid">Perlu diperiksa (tanggal/keterangan)</option>','Filter kualitas tanggal atau keterangan arsip');
 const summary=ensure('archiveResultCount','span','','Jumlah arsip');summary.className='muted';summary.setAttribute('aria-live','polite');
 const reset=ensure('archiveResetFilter','button','Reset filter','Reset filter arsip');reset.type='button';
 const exportBtn=ensure('archiveExportCsv','button','Ekspor CSV','Ekspor arsip yang ditampilkan');exportBtn.type='button';
 const dateValue=x=>ditrendukDate(x.tanggal);
 const ncls=v=>{const n=String(v||'').trim().toLocaleLowerCase('id-ID');return n==='musnah'?'state-red':n==='dinilai kembali'?'state-yellow':n==='permanen'?'state-blue':'state-neutral';};
 const kcls=v=>{const x=String(v||'').trim().toLowerCase();return x.includes('belum')?'state-red':x==='lengkap'?'state-green':'state-neutral'};
 const dateLabel=v=>String(v??'').trim()||'—';
 let visible=[];
 function render(){
  const s=q.value.trim().toLocaleLowerCase('id-ID');
  visible=rows.filter(x=>(!s||[x.uraian,x.kode,x.item,x.nomor,x.media].some(v=>String(v??'').toLocaleLowerCase('id-ID').includes(s)))&&(quality.value!=='invalid'||!Number.isFinite(dateValue(x))||String(x.ket||'').trim().toLowerCase()!=='lengkap'));
  visible=visible.slice().sort((a,b)=>{const av=dateValue(a),bv=dateValue(b),aok=Number.isFinite(av),bok=Number.isFinite(bv);if(aok!==bok)return aok?-1:1;if(!aok)return 0;return sort.value==='asc'?av-bv:bv-av});
  summary.textContent=visible.length+' dari '+rows.length+' arsip · '+rows.filter(x=>!Number.isFinite(dateValue(x))||String(x.ket||'').trim().toLowerCase()!=='lengkap').length+' tanggal/keterangan perlu diperiksa';
  body.innerHTML=visible.map(x=>`<tr><td>${ED.esc(x.nomor??'—')}</td><td>${ED.esc(x.kode??'—')}</td><td>${ED.esc(x.item??'—')}</td><td><strong>${ED.esc(x.uraian??'—')}</strong></td><td>${ED.esc(dateLabel(x.tanggal))}</td><td>${ED.esc(x.jumlah??'—')}</td><td><select class="inline-select ar-ket ${kcls(x.ket)}" data-id="${ED.esc(x.id)}">${[...new Set([x.ket,'Lengkap','Belum lengkap'].filter(Boolean))].map(v=>`<option ${v===x.ket?'selected':''}>${ED.esc(v)}</option>`).join('')}</select></td><td>${ED.esc(String(x.keamanan||'').trim()||'—')}</td><td>${ED.esc(x.akses??'—')}</td><td>${ED.esc(x.aktif??'—')} + ${ED.esc(x.inaktif??'—')}</td><td>${ED.esc(x.media??'—')}</td><td><select class="inline-select ar-nasib ${ncls(x.nasib)}" data-id="${ED.esc(x.id)}">${[...new Set([x.nasib,...nas].filter(Boolean))].map(v=>`<option ${v===x.nasib?'selected':''}>${ED.esc(v)}</option>`).join('')}</select></td></tr>`).join('')||'<tr><td colspan="12" class="muted">Tidak ada arsip sesuai pencarian atau filter.</td></tr>';
 }
 q.oninput=render;sort.onchange=render;quality.onchange=render;
 reset.onclick=()=>{q.value='';sort.value='desc';quality.value='all';render()};
 exportBtn.onclick=()=>{
  const cols=['Nomor','Kode','Item','Uraian','Tanggal','Jumlah','Keterangan','Keamanan','Akses','Aktif','Inaktif','Media','Nasib'];
  const safe=v=>{let s=String(v??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
  const lines=[cols,...visible.map(x=>[x.nomor,x.kode,x.item,x.uraian,x.tanggal,x.jumlah,x.ket,x.keamanan,x.akses,x.aktif,x.inaktif,x.media,x.nasib])];
  const blob=new Blob(['\ufeff'+lines.map(line=>line.map(safe).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='arsip-ditrenduk-filter.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 render();document.getElementById('addArchive').onclick=()=>ED.open('archiveModal');document.getElementById('saveArchive').onclick=()=>{ED.close('archiveModal');ED.toast('Arsip ditambahkan.')};
}

/* Backend integration v2 ----------------------------------------------------
   UI tetap sama. Bagian ini memastikan perubahan yang dilakukan pengguna
   disimpan ke API/database, bukan hanya berubah sementara di browser. */

function backendSave(resource, row, successMessage) {
    if (!window.API || !row?.id) return Promise.reject(new Error('API atau ID data tidak tersedia; perubahan tidak disimpan.'));
    return API.update(resource, row.id, row)
        .then(result => {
            if (successMessage) ED.toast(successMessage);
            return result.data;
        })
        .catch(error => {
            ED.toast('Gagal menyimpan ke database: ' + error.message);
            throw error;
        });
}

// Repository dan RAKOM memakai handler asinkron asli di atas.
// Jangan membungkus handler lagi: pembungkus lama mengirim dua PATCH,
// mengubah status sebelum server mengonfirmasi, dan merusak rollback.

// Jadwal disimpan sebagai resource sendiri agar perubahan tidak hilang saat refresh.
pageJadwal = function () {
    const people = [...new Set((D.petugas || []).map(item => item.nama).filter(Boolean))];
    let schedules = (D.schedules || []).map(item => ({ ...item }));
    let refreshRequest = 0;
    let sortDirection = 'desc';
    let editingId = null;

    ['scheduleSupervisi', 'scheduleAsrot', 'scheduleNotulis'].forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        select.innerHTML = '<option value="">Pilih petugas</option>';
        people.forEach(name => select.add(new Option(name, name)));
    });

    const grid = document.getElementById('scheduleGrid');
    const dateLabel = date => { const value = new Date(String(date || '') + 'T00:00:00'); return Number.isNaN(value.getTime()) ? 'Tanggal tidak valid' : value.toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'}); };

    const sortControl = document.createElement('select');
    sortControl.className = 'field compact-date-sort';
    sortControl.id = 'scheduleDateSort';
    sortControl.setAttribute('aria-label','Urutan tanggal jadwal');
    sortControl.innerHTML = '<option value="desc">Tanggal terbaru</option><option value="asc">Tanggal terlama</option>';
    grid.before(sortControl);
    const refreshButton = document.createElement('button');
    refreshButton.type = 'button';
    refreshButton.className = 'btn btn-outline btn-sm';
    refreshButton.id = 'refreshSchedules';
    refreshButton.textContent = 'Perbarui jadwal';
    sortControl.insertAdjacentElement('afterend', refreshButton);
    async function refreshSchedules() {
        const request = ++refreshRequest;
        refreshButton.disabled = true;
        try {
            const response = await API.list('schedules');
            if (request !== refreshRequest) return;
            if (!Array.isArray(response.data)) throw new Error('Format data jadwal tidak valid.');
            schedules = response.data.map(item => ({ ...item }));
            D.schedules = schedules;
            render();
        } catch (error) {
            if (request === refreshRequest) ED.toast('Gagal memuat jadwal: ' + error.message);
        } finally {
            if (request === refreshRequest) refreshButton.disabled = false;
        }
    }
    refreshButton.onclick = refreshSchedules;
    refreshSchedules();
    sortControl.onchange = () => { sortDirection = sortControl.value; render(); };
    function render() {
        const ordered = schedules.slice().sort((a,b) => {const x=ditrendukSortDate(a.date),y=ditrendukSortDate(b.date),missing=-8640000000000000;if(x===missing&&y===missing)return 0;if(x===missing)return 1;if(y===missing)return -1;return (sortDirection === 'asc' ? 1 : -1) * (x-y);});
        grid.innerHTML = ordered.map(item => `
            <div class="schedule-card">
                <h3>${ED.esc(dateLabel(item.date))}</h3>
                <p>Supervisi · <b>${ED.esc(item.supervisi || '—')}</b></p>
                <p>Asrot · <b>${ED.esc(item.asrot || '—')}</b></p>
                <p>Notulis · <b>${ED.esc(item.notulis || '—')}</b></p>
                <button class="btn btn-outline btn-sm editSchedule" data-id="${ED.esc(item.id)}">Ubah jadwal</button> <button class="btn btn-outline btn-sm deleteSchedule" data-id="${ED.esc(item.id)}">Hapus</button>
            </div>
        `).join('') || '<p class="muted">Belum ada jadwal tersimpan.</p>';

        grid.querySelectorAll('.deleteSchedule').forEach(button => {
            button.onclick = async () => {
                const id = button.dataset.id;
                if (!await ED.confirmAction('Hapus jadwal petugas ini?')) return;
                button.disabled = true;
                try {
                    await API.remove('schedules', id);
                    schedules = schedules.filter(item => String(item.id) !== String(id));
                    D.schedules = schedules;
                    render();
                    document.dispatchEvent(new Event('workspace-data-updated'));
                    try { localStorage.setItem('ed_workspace_updated', String(Date.now())); } catch (_) {}
                    ED.toast('Jadwal berhasil dihapus.');
                } catch (error) {
                    button.disabled = false;
                    ED.toast('Gagal menghapus jadwal: ' + error.message);
                }
            };
        });
        grid.querySelectorAll('.editSchedule').forEach(button => {
            button.onclick = () => {
                editingId = button.dataset.id;
                const item = schedules.find(row => row.id === editingId);
                document.getElementById('scheduleDate').value = item.date || '';
                document.getElementById('scheduleSupervisi').value = item.supervisi || '';
                document.getElementById('scheduleAsrot').value = item.asrot || '';
                document.getElementById('scheduleNotulis').value = item.notulis || '';
                ED.open('scheduleModal');
            };
        });
    }

    render();

    document.getElementById('addSchedule').onclick = () => {
        editingId = null;
        document.getElementById('scheduleDate').value = '';
        document.getElementById('scheduleSupervisi').value = '';
        document.getElementById('scheduleAsrot').value = '';
        document.getElementById('scheduleNotulis').value = '';
        ED.open('scheduleModal');
    };

    document.getElementById('saveSchedule').onclick = async () => {
        const row = {
            date: document.getElementById('scheduleDate').value,
            supervisi: document.getElementById('scheduleSupervisi').value,
            asrot: document.getElementById('scheduleAsrot').value,
            notulis: document.getElementById('scheduleNotulis').value
        };
        if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date) || !Number.isFinite(ditrendukDate(row.date))) return ED.toast('Tanggal jadwal wajib diisi dengan benar.');
        if (![row.supervisi,row.asrot,row.notulis].some(Boolean)) return ED.toast('Pilih setidaknya satu petugas untuk jadwal.');

        const saveButton = document.getElementById('saveSchedule');
        if(saveButton.disabled)return;
        saveButton.disabled = true;
        try {
            if (editingId) {
                const current = schedules.find(item => String(item.id) === String(editingId));
                if(!current)throw new Error('Jadwal yang diedit tidak ditemukan.');
                const saved = await API.update('schedules', editingId, {...current, ...row});
                Object.assign(current, saved.data || row);
                D.schedules = schedules;
            } else {
                const result = await API.create('schedules', row);
                schedules.push(result.data);
                D.schedules = schedules;
            }
            await refreshSchedules();
            document.dispatchEvent(new Event('workspace-data-updated'));
            try {localStorage.setItem('ed_workspace_updated',String(Date.now()))}catch(_){}
            ED.close('scheduleModal');
            ED.toast(editingId ? 'Jadwal berhasil diubah dan disimpan.' : 'Jadwal berhasil ditambahkan.');
        } catch (error) {
            ED.toast('Gagal menyimpan jadwal: ' + error.message);
        } finally { saveButton.disabled = false; }
    };
};

// Logbook: perubahan status/detail dan penambahan aktivitas masuk database.
const pageLogbookUi = pageLogbook;
pageLogbook = function () {
    pageLogbookUi();
    const body = document.getElementById('logBody');

    if(body)body.onchange=async event=>{
        const select=event.target.closest('select.log-status');
        if(!select||!body.contains(select)||select.disabled)return;
        const row=(D.logbook||[]).find(item=>String(item.id)===String(select.dataset.id));
        if(!row)return ED.toast('Data logbook tidak ditemukan.');
        const oldStatus=row.status||'Tercatat';
        if(oldStatus===select.value)return;
        select.disabled=true;
        try{await backendSave('logbook',{...row,status:select.value},'Status logbook tersimpan di database.');row.status=select.value;}
        catch(e){select.value=oldStatus;}
        finally{select.disabled=false;}
    };

    document.getElementById('saveLogDetail').onclick = async () => {
        const row = (D.logbook || []).find(item => String(item.id) === String(window.__logbookEditingId));
        if (!row) return ED.toast('Data logbook tidak ditemukan.');
        const updated = {...row, aktivitas:document.getElementById('logEditText').value.trim(),status:document.getElementById('logEditStatus').value,bukti:document.getElementById('logEditProof').value.trim(),catatan:document.getElementById('logEditNote').value.trim()};
        if (!updated.aktivitas) return ED.toast('Aktivitas wajib diisi.');
        if (updated.bukti && !/^https:\/\//i.test(updated.bukti)) return ED.toast('Tautan bukti harus HTTPS.');
        const saveButton=document.getElementById('saveLogDetail');saveButton.disabled=true;
        try { await backendSave('logbook',updated,'Detail logbook tersimpan di database.');Object.assign(row,updated);ED.close('logDetailModal'); }
        catch(e) { return; } finally {saveButton.disabled=false;}
        pageLogbook();
    };

    document.getElementById('saveLog').onclick = async () => {
        const fields = [...document.querySelectorAll('#logModal .field')];
        const row = {
            periode: fields[0]?.value || '',
            pegawai: fields[1]?.value.trim() || '',
            aktivitas: fields[2]?.value.trim() || '',
            bukti: fields[3]?.value.trim() || '',
            status: 'Tercatat',
            catatan: ''
        };
        if (!row.pegawai || !row.aktivitas || !row.periode) return ED.toast('Periode, pegawai dan aktivitas wajib diisi.');
        if (row.bukti && !/^https:\/\//i.test(row.bukti)) return ED.toast('Tautan bukti wajib HTTPS.');
        const saveButton=document.getElementById('saveLog');saveButton.disabled=true;
        try {
            const result = await API.create('logbook', row);
            D.logbook.unshift(result.data);
            ED.close('logModal');
            ED.toast('Aktivitas tersimpan di database.');
            pageLogbook();
        } catch (error) { ED.toast('Gagal menyimpan aktivitas: ' + error.message); } finally {saveButton.disabled=false;}
    };
};

// Arsip: dropdown yang diedit langsung disimpan ke database.
const pageArsipUi = pageArsip;
pageArsip = function () {
    pageArsipUi();
    const body = document.getElementById('archiveBody');
    // Event delegation: table rows are rebuilt when search/date sort changes.
    // Bind once to tbody, so every newly rendered dropdown still persists.
    if (body) body.onchange = async event => {
        const select = event.target.closest('select.ar-ket, select.ar-nasib');
        if (!select || !body.contains(select) || select.disabled) return;
        const row = (D.archive || []).find(item => String(item.id) === String(select.dataset.id));
        if (!row) return ED.toast('Data arsip tidak ditemukan.');
        const field = select.classList.contains('ar-ket') ? 'ket' : 'nasib';
        const old = row[field];
        const next = select.value;
        if (old === next) return;
        const recolor = (value) => {
            const v = String(value || '').trim().toLocaleLowerCase('id-ID');
            select.classList.remove('state-red','state-yellow','state-blue','state-green','state-neutral');
            if (field === 'ket') select.classList.add(v.includes('belum') || !v ? 'state-red' : v === 'lengkap' ? 'state-green' : 'state-neutral');
            else select.classList.add(v === 'musnah' ? 'state-red' : v === 'dinilai kembali' ? 'state-yellow' : v === 'permanen' ? 'state-blue' : 'state-neutral');
        };
        recolor(next);
        select.disabled = true;
        try {
            await backendSave('archive', {...row, [field]: next}, 'Perubahan arsip tersimpan di database.');
            row[field] = next;
            recolor(next);
        } catch (error) {
            select.value = old || '';
            recolor(old);
        } finally {
            select.disabled = false;
        }
    };
};

// Pengguna: peran, akses, status, dan aktivasi disimpan ke users_data.
const pageUsersUi = pageUsers;
pageUsers = function () {
    pageUsersUi();
    // Muat ulang daftar akun dari server tanpa kehilangan konteks halaman.
    const addButton = document.getElementById('addUser');
    if (addButton && !document.getElementById('refreshUsers')) {
        const refreshButton = document.createElement('button');
        refreshButton.id = 'refreshUsers';
        refreshButton.type = 'button';
        refreshButton.className = 'btn btn-outline btn-sm';
        refreshButton.textContent = 'Perbarui pengguna';
        addButton.insertAdjacentElement('beforebegin', refreshButton);
        refreshButton.onclick = async () => {
            if (refreshButton.disabled) return;
            refreshButton.disabled = true;
            try {
                const response = await API.list('users');
                if (!Array.isArray(response.data)) throw new Error('Format daftar pengguna tidak valid.');
                D.users = response.data;
                pageUsers();
                ED.toast('Daftar pengguna diperbarui dari server.');
            } catch (error) { ED.toast('Gagal memperbarui pengguna: ' + error.message); }
            finally { refreshButton.disabled = false; }
        };
    }

    const body = document.getElementById('userBody');
    body?.querySelectorAll('.user-edit').forEach(select => {
        select.onchange = async () => {
            const row = (D.users || []).find(item => String(item.id) === String(select.dataset.id));
            if (!row) return;
            const field = select.dataset.field; if (!['unit','peran','akses','status','aktivasi'].includes(field)) return;
            const old = row[field]; const next = select.value; select.disabled = true;
            try { await backendSave('users', {...row, [field]: next}, 'Data pengguna tersimpan di database.'); row[field] = next; if (field === 'status' || field === 'peran') { document.getElementById('activeTotal').textContent = (D.users || []).filter(item => item.status === 'Aktif').length; document.getElementById('adminTotal').textContent = (D.users || []).filter(item => /admin/i.test(item.peran || '')).length; } document.dispatchEvent(new Event('workspace-data-updated')); try{localStorage.setItem('ed_workspace_updated',String(Date.now()))}catch(_){} }
            catch (error) { row[field] = old; select.value = old; } finally { select.disabled = false; }
        };
    });
    // Unit kerja bisa diedit langsung oleh superadmin; perubahan baru tampil setelah API sukses.
    body?.querySelectorAll('.user-unit').forEach(input => {
        input.onchange = async () => {
            const row = (D.users || []).find(item => String(item.id) === String(input.dataset.id));
            if (!row) return;
            const previous = row.unit || '';
            const next = input.value.trim();
            if (next === previous) return;
            if (!next) { input.value = previous; ED.toast('Unit kerja tidak boleh kosong.'); return; }
            input.disabled = true;
            try {
                await backendSave('users', {...row, unit: next}, 'Unit kerja pengguna berhasil disimpan.');
                row.unit = next;
                document.dispatchEvent(new Event('workspace-data-updated'));
                try { localStorage.setItem('ed_workspace_updated', String(Date.now())); } catch (_) {}
            } catch (_) { input.value = previous; }
            finally { input.disabled = false; }
        };
    });
    body?.querySelectorAll('.user-activation').forEach(input => {
        input.onchange = async () => {
            const row = (D.users || []).find(item => String(item.id) === String(input.dataset.id));
            if (!row) return;
            const old = row.aktivasi; const next = input.value; input.disabled = true;
            try { await backendSave('users', {...row, aktivasi: next}, 'Aktivasi pengguna tersimpan di database.'); row.aktivasi = next; document.dispatchEvent(new Event('workspace-data-updated')); try{localStorage.setItem('ed_workspace_updated',String(Date.now()))}catch(_){} }
            catch (error) { row.aktivasi = old; input.value = old; } finally { input.disabled = false; }
        };
    });

    document.getElementById('saveUser').onclick = async () => {
        const fields = [...document.querySelectorAll('#userModal .field')];
        const row = {
            nama: fields[0]?.value.trim() || '',
            unit: fields[1]?.value.trim() || 'DITRENDUK',
            peran: fields[2]?.value || 'Pegawai',
            akses: fields[3]?.value.trim() || 'Repository, Logbook',
            status: 'Aktif',
            aktivasi: new Date().getFullYear().toString()
        };
        if (!row.nama || !row.unit) return ED.toast('Nama dan unit pengguna wajib diisi.');
        const saveUserButton=document.getElementById('saveUser');
        if(saveUserButton.disabled)return;
        saveUserButton.disabled=true;
        try {
            const result = await API.create('users', row);
            D.users.push(result.data);
            ED.close('userModal');
            ED.toast('Pengguna tersimpan di database.');
            pageUsers();
        } catch (error) { ED.toast('Gagal menyimpan pengguna: ' + error.message); }
        finally {saveUserButton.disabled=false;}
    };
};

// Modal edit teks, menggantikan prompt() browser pada Arahan Direktur.
window.ED_TEXT_MODAL=function(title,initial){return new Promise(resolve=>{
 const overlay=document.createElement('div');overlay.style.cssText='position:fixed;inset:0;background:rgba(9,24,50,.55);z-index:100000;display:grid;place-items:center;padding:20px';
 const dialog=document.createElement('div');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.style.cssText='background:white;color:#15233d;border-radius:14px;padding:24px;width:min(540px,100%);box-shadow:0 20px 60px #0003';
 const heading=document.createElement('h3');heading.textContent=title;heading.style.marginTop='0';
 const input=document.createElement('textarea');input.value=initial||'';input.rows=7;input.style.cssText='width:100%;box-sizing:border-box;padding:12px;border:1px solid #cbd5e1;border-radius:8px;font:inherit';
 const actions=document.createElement('div');actions.style.cssText='display:flex;justify-content:flex-end;gap:10px;margin-top:16px';
 const cancel=document.createElement('button');cancel.className='btn btn-outline';cancel.textContent='Batal';
 const save=document.createElement('button');save.className='btn btn-primary';save.textContent='Simpan';
 const done=value=>{overlay.remove();resolve(value)};cancel.onclick=()=>done(null);save.onclick=()=>done(input.value);
 overlay.addEventListener('click',e=>{if(e.target===overlay)done(null)});
 overlay.addEventListener('keydown',e=>{if(e.key==='Escape')done(null)});
 actions.append(cancel,save);dialog.append(heading,input,actions);overlay.append(dialog);document.body.append(overlay);input.focus();
})};
