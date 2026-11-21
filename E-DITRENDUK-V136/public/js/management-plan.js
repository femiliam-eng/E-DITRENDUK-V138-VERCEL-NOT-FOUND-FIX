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
function paint(){
 const q=$('planSearch').value.trim().toLocaleLowerCase('id-ID'),selectedTeam=$('planTeam').value,selectedYear=$('planYear').value;
 const sourceYear=v=>{const match=String(v??'').match(/\b(?:20(?:26|27))\b/);return match?match[0]:''};
 const matches=rows.filter(x=>(!selectedYear||(selectedYear==='unknown'?!sourceYear(x.tanggal):sourceYear(x.tanggal)===selectedYear))&&(!selectedTeam||(selectedTeam==='unassigned'?!team(effective(x,'tim')):team(effective(x,'tim'))===selectedTeam))&&(!q||[x.tanggal,x.tim,x.timAsli,x.arahan,effective(x,'pic'),x.output,effective(x,'status')].some(v=>String(v||'').toLocaleLowerCase('id-ID').includes(q))));
 matches.sort((a,b)=>Number(a.sourceRow??Number.MAX_SAFE_INTEGER)-Number(b.sourceRow??Number.MAX_SAFE_INTEGER));
 $('planCount').textContent=matches.length+' dari '+rows.length+' arahan';
 $('planBody').innerHTML=matches.map(x=>'<tr><td>'+cell(x.tanggal)+'</td><td><span class="plan-team '+(team(x.tim)?'is-set':'')+'">'+cell(x.tim||x.timAsli)+'</span></td><td class="plan-arahan">'+cell(x.arahan)+'</td><td><input class="plan-pic-input" type="text" maxlength="250" aria-label="PIC kegiatan" data-pic-id="'+esc(x.id)+'" value="'+esc(effective(x,'pic'))+'" placeholder="Nama PIC"></td><td class="plan-output">'+cell(x.output)+'</td><td>'+statusControl(x)+'</td><td>'+(/^https:\/\//i.test(String(x.bukti||'').trim())?'<a target="_blank" rel="noopener noreferrer" href="'+esc(x.bukti)+'">Buka bukti</a>':cell(x.bukti))+'</td><td class="plan-action"><button class="btn btn-outline plan-edit" type="button" data-id="'+esc(x.id)+'">Edit</button></td></tr>').join('')||'<tr><td colspan="8">Belum ada arahan sesuai filter.</td></tr>';
 $('planBody').querySelectorAll('[data-id]').forEach(button=>button.onclick=()=>edit(button.dataset.id));
 $('planBody').querySelectorAll('[data-pic-id]').forEach(input=>input.addEventListener('input',()=>draft(input.dataset.picId,'pic',input.value)));
 $('planBody').querySelectorAll('[data-status-id]').forEach(select=>select.onchange=()=>{draft(select.dataset.statusId,'status',select.value);select.className='plan-status-select '+statusTone(select.value)});
 updateDraftIndicator();
}
async function load(){
 if(drafts.size&&!confirm('Ada perubahan yang belum disimpan. Muat ulang data dan batalkan perubahan tersebut?'))return;
 try{
  const response=await API.list('manajemen-plan');if(!Array.isArray(response.data))throw Error('Format daftar tidak valid');
  rows=response.data;drafts.clear();paint();
 }catch(error){$('planCount').textContent='Gagal memuat: '+error.message;$('planBody').innerHTML='<tr><td colspan="8">Gagal memuat data. Pilih Perbarui untuk mencoba lagi.</td></tr>';}
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
$('planSearch').addEventListener('input',paint);$('planTeam').addEventListener('change',paint);$('planYear').addEventListener('change',paint);
$('planReset').onclick=()=>{$('planSearch').value='';$('planTeam').value='';$('planYear').value='';paint()};
$('planRefresh').onclick=load;$('planAdd').onclick=fresh;
$('planCancel').onclick=close;$('planClose').onclick=close;
$('planSaveDrafts').onclick=saveDrafts;
$('planCancelDrafts').onclick=()=>{if(!drafts.size||!confirm('Batalkan perubahan PIC dan status yang belum tersimpan?'))return;drafts.clear();paint()};
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