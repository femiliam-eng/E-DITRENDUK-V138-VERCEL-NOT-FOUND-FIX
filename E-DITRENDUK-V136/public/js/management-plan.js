/* REV21NOV: isolated CONCEPT NOTE management-plan module (never reads dispositions). */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const teams=['PARAMETER','PJPK','Manajemen Kinerja','RUMAH DATAKU'];
const fields={tanggal:'planDate',tim:'planEditTeam',arahan:'planDirection',pic:'planPic',output:'planOutput',status:'planStatus',progress:'planProgress',bukti:'planProof'};
let rows=[],activeId=null,busy=false;
const esc=s=>ED.esc(String(s??''));
const pretty=s=>String(s??'').trim()||'—';
const normalizeTeam=s=>teams.find(t=>t.toLowerCase()===String(s||'').trim().toLowerCase())||'';
const cell=(v)=>esc(pretty(v));
const notify=()=>{document.dispatchEvent(new Event('workspace-data-updated'));};
function paint(){
 const query=$('planSearch').value.trim().toLocaleLowerCase('id-ID'),team=$('planTeam').value;
 const matches=rows.filter(row=>(!team||(team==='unassigned'?!normalizeTeam(row.tim):normalizeTeam(row.tim)===team))&&(!query||[row.tanggal,row.tim,row.timAsli,row.arahan,row.pic,row.output,row.status].some(v=>String(v||'').toLocaleLowerCase('id-ID').includes(query))));
 matches.sort((a,b)=>Number(a.sourceRow||Infinity)-Number(b.sourceRow||Infinity));
 $('planCount').textContent=matches.length+' dari '+rows.length+' arahan';
 $('planBody').innerHTML=matches.map(x=>'<tr><td>'+cell(x.tanggal)+'</td><td><span class="plan-team '+(normalizeTeam(x.tim)?'is-set':'')+'">'+cell(x.tim||x.timAsli)+'</span></td><td class="plan-arahan">'+cell(x.arahan)+'</td><td>'+cell(x.pic)+'</td><td>'+cell(x.output)+'</td><td>'+cell(x.status)+'</td><td>'+cell(x.progress)+'</td><td>'+(/^https:\/\//i.test(String(x.bukti||'').trim())?'<a target="_blank" rel="noopener noreferrer" href="'+esc(x.bukti)+'">Buka bukti</a>':cell(x.bukti))+'</td><td><button class="btn btn-outline plan-edit" type="button" data-id="'+esc(x.id)+'">Edit</button></td></tr>').join('')||'<tr><td colspan="9">Belum ada arahan sesuai filter.</td></tr>';
 $('planBody').querySelectorAll('button[data-id]').forEach(button=>button.onclick=()=>edit(button.dataset.id));
}
async function load(){
 try{
  const result=await API.list('manajemen-plan');
  if(!Array.isArray(result.data))throw Error('Format Manajemen Plan tidak valid');
  rows=result.data;paint();
 }catch(error){$('planCount').textContent='Gagal memuat: '+error.message;$('planBody').innerHTML='<tr><td colspan="9">Data tidak berhasil dimuat. Coba Perbarui.</td></tr>';}
}
function openForm(){ED.open('planModal');$('planDirection').focus();}
function edit(id){
 const x=rows.find(y=>String(y.id)===String(id));if(!x)return;
 activeId=x.id;$('planModalTitle').textContent='Edit arahan Direktur';
 for(const [key,input] of Object.entries(fields))$(input).value=key==='tim'?normalizeTeam(x[key]):String(x[key]??'');
 openForm();
}
function fresh(){
 activeId=null;$('planModalTitle').textContent='Tambah arahan Direktur';
 for(const input of Object.values(fields))$(input).value='';
 openForm();
}
const close=()=>ED.close('planModal');
$('planSearch').addEventListener('input',paint);$('planTeam').addEventListener('change',paint);
$('planReset').onclick=()=>{$('planSearch').value='';$('planTeam').value='';paint()};
$('planRefresh').onclick=load;$('planAdd').onclick=fresh;$('planCancel').onclick=close;$('planClose').onclick=close;
$('planForm').onsubmit=async event=>{
 event.preventDefault();if(busy)return;
 const patch=Object.fromEntries(Object.entries(fields).map(([key,input])=>[key,$(input).value.trim()]));
 if(!patch.arahan)return ED.toast('Arahan Direktur wajib diisi.');
 busy=true;$('planSave').disabled=true;
 try{
  const old=rows.find(x=>String(x.id)===String(activeId));
  if(old){
   const changes=Object.fromEntries(Object.entries(patch).filter(([key,value])=>String(old[key]??'')!==value));
   if(Object.keys(changes).length){
    const r=await API.update('manajemen-plan',old.id,changes);
    Object.assign(old,r.data||changes);
   }
  }else{
   const r=await API.create('manajemen-plan',{...patch,sumber:'Manajemen Plan (portal)'});
   rows.push(r.data);
  }
  close();paint();notify();ED.toast('Manajemen Plan berhasil disimpan.');
 }catch(error){ED.toast('Gagal menyimpan: '+error.message)}
 finally{busy=false;$('planSave').disabled=false;}
};
document.addEventListener('layout:ready',load);
})();