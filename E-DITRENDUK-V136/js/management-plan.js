/* Manajemen Plan — independent CONCEPT NOTE records, explicit draft saves. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const teams=['PARAMETER','PJPK','Manajemen Kinerja','RUMAH DATAKU'];
const statuses=['Selesai','Belum','On Proses'];
const fields={tanggal:'planDate',tim:'planEditTeam',arahan:'planDirection',pic:'planPic',output:'planOutput',status:'planStatus',bukti:'planProof'};
let rows=[],activeId=null,busy=false;
const drafts=new Map();
const esc=v=>ED.esc(String(v??''));
const pretty=v=>String(v??'').trim()||'—';
const cell=v=>esc(pretty(v));
const team=v=>teams.find(t=>t.toLowerCase()===String(v||'').trim().toLowerCase())||'';
const displayStatus=v=>{const t=String(v??'').trim().toLocaleLowerCase('id-ID');return t==='selesai'?'Selesai':t==='on proses'||t==='on process'||t==='in progress'?'On Proses':'Belum'};
const statusTone=v=>displayStatus(v)==='Selesai'?'status-done':displayStatus(v)==='On Proses'?'status-progress':'status-pending';
const saved=id=>rows.find(x=>String(x.id)===String(id));
const effective=(row,key)=>Object.prototype.hasOwnProperty.call(drafts.get(String(row.id))||{},key)?drafts.get(String(row.id))[key]:row[key];
const notify=()=>document.dispatchEvent(new Event('workspace-data-updated'));
const stOpts=current=>statuses.map(v=>'<option value="'+v+'"'+(v===displayStatus(current)?' selected':'')+'>'+v+'</option>').join('');
function statusControl(row){const v=effective(row,'status');return '<select class="plan-status-select '+statusTone(v)+'" aria-label="Status arahan" data-status-id="'+esc(row.id)+'">'+stOpts(v)+'</select>'}
function proofControl(row){const value=String(effective(row,'bukti')??'');return '<div class="plan-proof-edit"><input class="plan-proof-input" type="url" maxlength="1500" aria-label="Tautan bukti dukung" data-proof-id="'+esc(row.id)+'" placeholder="https://…" value="'+esc(value)+'">'+(/^https:\/\//i.test(value.trim())?'<a class="plan-proof-link" target="_blank" rel="noopener noreferrer" href="'+esc(value.trim())+'">Buka bukti</a>':'')+'</div>';}
function draft(id,key,value){
 const row=saved(id);if(!row)return;
 const d={...(drafts.get(String(id))||{})};
 const equal=key==='status'?displayStatus(row.status)===value:String(row[key]??'')===String(value);
 if(equal)delete d[key];else d[key]=value;
 if(Object.keys(d).length)drafts.set(String(id),d);else drafts.delete(String(id));
 updateDraftIndicator();
}
function updateDraftIndicator(){
 let total=0;for(const d of drafts.values())total+=Object.keys(d).length;
 $('planSaveDrafts').disabled=busy||!total;
 $('planCancelDrafts').disabled=busy||!total;
 $('planDraftCount').textContent=total?total+' perubahan belum disimpan':'';
}
const months=['januari','februari','maret','april','mei','juni','juli','agustus','september','oktober','november','desember'];
const monthIndex=new Map(months.flatMap((m,i)=>[[m,i+1],[m.slice(0,3),i+1]]).concat([['agt',8],['agu',8],['okt',10],['des',12]]));
function sourceOrder(row){const n=Number(row.sourceRow);return Number.isFinite(n)?n:0}
function dateInfo(value,row){
 const s=String(value??'').trim();if(!s)return null;let y=null,m=null,d=null,q;
 if((q=/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/.exec(s))){y=+q[1];m=+q[2];d=+q[3]}
 else if((q=/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/.exec(s))){d=+q[1];m=+q[2];y=+q[3]}
 else if((q=/^(\d{1,2})\s+([a-zA-Z]+)\s*(\d{4})?$/i.exec(s))){d=+q[1];m=monthIndex.get(q[2].toLowerCase())||null;y=q[3]?+q[3]:null}
 else if(/^\d{5}(?:\.0)?$/.test(s)){const date=new Date(Date.UTC(1899,11,30)+Math.round(Number(s))*86400000);y=date.getUTCFullYear();m=date.getUTCMonth()+1;d=date.getUTCDate()}
 if(!m||!d){const parsed=Date.parse(s);if(Number.isFinite(parsed)){const date=new Date(parsed);y=date.getFullYear();m=date.getMonth()+1;d=date.getDate()}}
 if(!m||!d||m<1||m>12||d>31)return null;
 if(y===null){const match=String(row?.tahun??row?.year??row?.tahunKegiatan??'').match(/20\d{2}/);y=match?+match[0]:null}
 return {key:y?String(y)+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0'):'unknown-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0'),value:Date.UTC(y||2026,m-1,d)};
}
function groupByDate(items){
 const groups=new Map();
 for(const row of items){
  const parsed=dateInfo(row.tanggal,row),key=parsed?parsed.key:'text-'+String(row.tanggal??'').trim().toLocaleLowerCase('id-ID');
  if(!groups.has(key))groups.set(key,{items:[],date:parsed,latestSource:sourceOrder(row)});
  const group=groups.get(key);group.items.push(row);group.latestSource=Math.max(group.latestSource,sourceOrder(row));
 }
 for(const group of groups.values()){group.items.sort((x,y)=>sourceOrder(y)-sourceOrder(x));group.label=String(group.items[0]?.tanggal??'').trim()||'—'}
 return [...groups.values()];
}
function pointStack(items,renderItem){return '<div class="plan-stack">'+items.map((row,index)=>'<div class="plan-point" data-point="'+(index+1)+'">'+renderItem(row,index)+'</div>').join('')+'</div>'}
function paint(){
 const q=$('planSearch').value.trim().toLocaleLowerCase('id-ID'),selectedTeam=$('planTeam').value,selectedYear=$('planYear').value,ascending=$('planSort').dataset.order==='asc';
 const sourceYear=row=>{const match=String(row.tanggal??'').match(/\b20(?:26|27)\b/)||String(row.tahun??row.year??'').match(/\b20(?:26|27)\b/);return match?match[0]:''};
 const matches=rows.filter(x=>(!selectedYear||(selectedYear==='unknown'?!sourceYear(x):sourceYear(x)===selectedYear))&&(!selectedTeam||(selectedTeam==='unassigned'?!team(effective(x,'tim')):team(effective(x,'tim'))===selectedTeam))&&(!q||[x.tanggal,x.tim,x.timAsli,x.arahan,effective(x,'pic'),x.output,effective(x,'status'),effective(x,'bukti')].some(v=>String(v??'').toLocaleLowerCase('id-ID').includes(q))));
 const groups=groupByDate(matches);
 groups.sort((x,y)=>{const a=x.date?.value??Number.NEGATIVE_INFINITY,b=y.date?.value??Number.NEGATIVE_INFINITY;if(a!==b){if(a===Number.NEGATIVE_INFINITY)return 1;if(b===Number.NEGATIVE_INFINITY)return -1;return ascending?a-b:b-a}return y.latestSource-x.latestSource});
 const points=groups.reduce((n,g)=>n+g.items.length,0);
 $('planCount').textContent=groups.length+' tanggal · '+points+' arahan dari '+rows.length+' arahan';
 $('planBody').innerHTML=groups.map((group,index)=>{
  const items=group.items;
  return '<tr class="plan-date-group"><td class="plan-group-number">'+(index+1)+'</td><td class="plan-group-date">'+cell(group.label)+'</td>'+
   '<td>'+pointStack(items,x=>'<span class="plan-team '+(team(x.tim)?'is-set':'')+'">'+cell(x.tim||x.timAsli)+'</span>')+'</td>'+
   '<td class="plan-arahan">'+pointStack(items,x=>'<div class="plan-direction-item">'+cell(x.arahan)+'</div>')+'</td>'+
   '<td>'+pointStack(items,x=>'<input class="plan-pic-input" type="text" maxlength="250" aria-label="PIC kegiatan" data-pic-id="'+esc(x.id)+'" value="'+esc(effective(x,'pic'))+'" placeholder="Nama PIC">')+'</td>'+
   '<td class="plan-output">'+pointStack(items,x=>cell(x.output))+'</td>'+
   '<td>'+pointStack(items,x=>statusControl(x))+'</td>'+
   '<td class="plan-proof-cell">'+pointStack(items,x=>proofControl(x))+'</td>'+
   '<td class="plan-action">'+pointStack(items,x=>'<button class="btn btn-outline plan-edit" type="button" data-id="'+esc(x.id)+'">Edit</button>')+'</td></tr>';
 }).join('')||'<tr><td colspan="9">Belum ada arahan sesuai filter.</td></tr>';
 $('planBody').querySelectorAll('[data-id]').forEach(button=>button.onclick=()=>edit(button.dataset.id));
 $('planBody').querySelectorAll('[data-pic-id]').forEach(input=>input.addEventListener('input',()=>draft(input.dataset.picId,'pic',input.value)));
 $('planBody').querySelectorAll('[data-proof-id]').forEach(input=>input.addEventListener('input',()=>{draft(input.dataset.proofId,'bukti',input.value);const link=input.parentElement.querySelector('.plan-proof-link');if(link)link.remove()}));
 $('planBody').querySelectorAll('[data-status-id]').forEach(select=>select.onchange=()=>{draft(select.dataset.statusId,'status',select.value);select.className='plan-status-select '+statusTone(select.value)});
 updateDraftIndicator();
}
async function load(){
 if(drafts.size&&!confirm('Ada perubahan yang belum disimpan. Muat ulang data dan batalkan perubahan tersebut?'))return;
 try{
  const response=await API.list('manajemen-plan');if(!Array.isArray(response.data))throw Error('Format daftar tidak valid');
  rows=response.data;drafts.clear();paint();
 }catch(error){$('planCount').textContent='Gagal memuat: '+error.message;$('planBody').innerHTML='<tr><td colspan="9">Gagal memuat data. Pilih Perbarui untuk mencoba lagi.</td></tr>';}
}
const open=()=>{ED.open('planModal');$('planDirection').focus()};
const close=()=>ED.close('planModal');
function edit(id){
 const x=saved(id);if(!x)return;
 activeId=x.id;$('planModalTitle').textContent='Edit arahan Direktur';
 for(const [key,input] of Object.entries(fields)){
  const v=effective(x,key);
  $(input).value=key==='tim'?team(v):key==='status'?displayStatus(v):String(v??'');
 }
 $('planStatus').className='field plan-status-select '+statusTone($('planStatus').value);open();
}
function fresh(){
 activeId=null;$('planModalTitle').textContent='Tambah arahan Direktur';
 for(const input of Object.values(fields))$(input).value='';
 $('planStatus').value='Belum';
 $('planStatus').className='field plan-status-select status-pending';open();
}
async function saveDrafts(){
 if(busy||!drafts.size)return;
 busy=true;updateDraftIndicator();let savedCount=0,failedCount=0;
 for(const [id,changes] of [...drafts]){
  try{
   const result=await API.update('manajemen-plan',id,changes);
   const row=saved(id);if(row)Object.assign(row,result.data||changes);
   drafts.delete(id);savedCount++;
  }catch(e){failedCount++;console.warn('Gagal menyimpan arahan:',e.message)}
 }
 busy=false;paint();if(savedCount)notify();
 ED.toast(failedCount?savedCount+' tersimpan, '+failedCount+' gagal. Draf yang gagal tetap ada.':savedCount+' arahan tersimpan.');
}
$('planSearch').addEventListener('input',paint);$('planTeam').addEventListener('change',paint);$('planYear').addEventListener('change',paint);$('planSort').addEventListener('click',()=>{const asc=$('planSort').dataset.order!=='asc';$('planSort').dataset.order=asc?'asc':'desc';$('planSort').textContent=asc?'Tanggal terlama ↑':'Tanggal terbaru ↓';$('planSort').setAttribute('aria-label',asc?'Urutkan tanggal dari terlama ke terbaru':'Urutkan tanggal dari terbaru ke terlama');paint()});
$('planReset').onclick=()=>{$('planSearch').value='';$('planTeam').value='';$('planYear').value='';$('planSort').dataset.order='desc';$('planSort').textContent='Tanggal terbaru ↓';$('planSort').setAttribute('aria-label','Urutkan tanggal dari terbaru ke terlama');paint()};
$('planRefresh').onclick=load;$('planAdd').onclick=fresh;
$('planCancel').onclick=close;$('planClose').onclick=close;
$('planSaveDrafts').onclick=saveDrafts;
$('planCancelDrafts').onclick=()=>{if(!drafts.size||!confirm('Batalkan perubahan PIC, status, dan bukti dukung yang belum tersimpan?'))return;drafts.clear();paint()};
$('planStatus').onchange=()=>{$('planStatus').className='field plan-status-select '+statusTone($('planStatus').value)};
$('planForm').onsubmit=async event=>{
 event.preventDefault();if(busy)return;
 const patch=Object.fromEntries(Object.entries(fields).map(([key,input])=>[key,$(input).value.trim()]));
 if(!patch.arahan)return ED.toast('Arahan Direktur wajib diisi.');
 busy=true;$('planSave').disabled=true;
 try{
  const current=saved(activeId);
  if(current){
   const changes=Object.fromEntries(Object.entries(patch).filter(([key,v])=>key==='status'?displayStatus(effective(current,key))!==v:String(current[key]??'')!==v));
   if(Object.keys(changes).length){
    const response=await API.update('manajemen-plan',current.id,changes);
    Object.assign(current,response.data||changes);
   }
   drafts.delete(String(current.id));
  }else{
   const response=await API.create('manajemen-plan',{...patch,sumber:'Manajemen Plan (portal)'});
   rows.push(response.data);
  }
  close();paint();notify();ED.toast('Manajemen Plan berhasil disimpan.');
 }catch(error){ED.toast('Gagal menyimpan: '+error.message)}
 finally{busy=false;$('planSave').disabled=false;}
};
window.addEventListener('beforeunload',event=>{if(drafts.size){event.preventDefault();event.returnValue=''}});
document.addEventListener('layout:ready',load);
})();