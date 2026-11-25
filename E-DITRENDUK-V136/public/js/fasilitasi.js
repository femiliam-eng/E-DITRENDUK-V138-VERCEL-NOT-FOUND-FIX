(()=>{'use strict';
const $=id=>document.getElementById(id);
const methods=['Offline','Online','Hybrid'];
const applicantOptions=['Komponen Internal','Kementerian/Lembaga','Pemerintah Provinsi','BKKBN Perwakilan','Pemerintah Kabupaten/Kota'];
const applicantTones=['fac-applicant-internal','fac-applicant-ministry','fac-applicant-province','fac-applicant-bkkbn','fac-applicant-regency'];
const applicantClass=value=>{const i=applicantOptions.indexOf(String(value??''));return i<0?'fac-applicant-unknown':applicantTones[i]};
function updateApplicantTone(el){el.className=(el.id==='pemohon'?'field ':'')+'fac-applicant '+applicantClass(el.value)}

const fields=['judul','tanggal','metode','jenis','narasumber','pemohon','bukti','catatan'];
const months=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
let rows=[],drafts=new Map(),busy=false;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const text=(tag,value)=>{const e=document.createElement(tag);e.textContent=value??'';return e};
const notify=()=>{document.dispatchEvent(new Event('workspace-data-updated'));try{localStorage.setItem('ed_workspace_updated',String(Date.now()))}catch(_){}};
async function api(path,opts={}){const r=await fetch('/api/'+path,{credentials:'same-origin',headers:{'Content-Type':'application/json'},...opts});const b=await r.json().catch(()=>({message:'Respons server tidak valid.'}));if(!r.ok)throw Error(b.message||'HTTP '+r.status);return b}
function dateParts(v){
 const s=String(v??'').trim();let y,m,d,q;if(!s)return null;
 if((q=/^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/.exec(s))){y=+q[1];m=+q[2];d=+q[3]}
 else if((q=/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/.exec(s))){d=+q[1];m=+q[2];y=+q[3]}
 else if((q=/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/i.exec(s))){d=+q[1];m=months.findIndex(x=>x.toLowerCase()===q[2].toLowerCase())+1;y=+q[3]}
 else if(/^\d{5}(?:\.0)?$/.test(s)){const date=new Date(Date.UTC(1899,11,30)+Math.round(Number(s))*86400000);y=date.getUTCFullYear();m=date.getUTCMonth()+1;d=date.getUTCDate()}
 else return null;
 if(y<1900||y>2100||m<1||m>12||d<1||d>31)return null;
 const date=new Date(Date.UTC(y,m-1,d));return date.getUTCFullYear()===y&&date.getUTCMonth()+1===m&&date.getUTCDate()===d?{y,m,d}:null;
}
function dateValue(v){const x=dateParts(v);return x?Date.UTC(x.y,x.m-1,x.d):Number.NEGATIVE_INFINITY}
function dateDisplay(v){const x=dateParts(v);return x?x.y+'-'+String(x.m).padStart(2,'0')+'-'+String(x.d).padStart(2,'0'):String(v||'').trim()||'—'}
function dateInput(v){const x=dateParts(v);return x?x.y+'-'+String(x.m).padStart(2,'0')+'-'+String(x.d).padStart(2,'0'):''}
function methodClass(v){return v==='Offline'?'fac-offline':v==='Online'?'fac-online':v==='Hybrid'?'fac-hybrid':'fac-unknown'}
function rowById(id){return rows.find(x=>String(x.id)===String(id))}
function draftValue(row,key){const change=drafts.get(String(row.id));return change&&Object.prototype.hasOwnProperty.call(change,key)?change[key]:String(row[key]??'')}
function methodValue(row){return draftValue(row,'metode')}
function setDraft(id,key,value){const row=rowById(id);if(!row)return;const changes={...(drafts.get(String(id))||{})};if(value===String(row[key]??''))delete changes[key];else changes[key]=value;if(Object.keys(changes).length)drafts.set(String(id),changes);else drafts.delete(String(id));updateDraftUI()}
function updateDraftUI(){
 const n=[...drafts.values()].reduce((sum,patch)=>sum+Object.keys(patch).length,0);$('facSaveDraft').disabled=busy||!n;$('facCancelDraft').disabled=busy||!n;
 $('facDraftCount').textContent=n?n+' perubahan belum disimpan':'';
}
function methodSelect(x){
 const val=methodValue(x);const variants=val&&!methods.includes(val)?[val,...methods]:['',...methods];
 return '<select class="fac-method '+methodClass(val)+'" data-method-id="'+esc(x.id)+'" aria-label="Metode kegiatan"'+(busy?' disabled':'')+'>'+
 variants.map(v=>'<option value="'+esc(v)+'"'+(v===val?' selected':'')+'>'+esc(v||'— Pilih —')+'</option>').join('')+'</select>';
}
function applicantSelect(row){
 const selected=draftValue(row,'pemohon');
 const choices=selected&&!applicantOptions.includes(selected)?[selected,...applicantOptions]:['',...applicantOptions];
 return '<select class="fac-applicant '+applicantClass(selected)+'" data-applicant-id="'+esc(row.id)+'" aria-label="Kategori Pemohon"'+(busy?' disabled':'')+'>'+
 choices.map(v=>'<option value="'+esc(v)+'"'+(v===selected?' selected':'')+'>'+esc(v||'— Pilih pemohon —')+'</option>').join('')+'</select>';
}
function evidence(x){
 const proof=draftValue(x,'bukti').trim(),files=Array.isArray(x.attachments)?x.attachments:[];
 const links=[];
 if(/^https:\/\//i.test(proof))links.push('<a href="'+esc(proof)+'" target="_blank" rel="noopener noreferrer">Buka bukti</a>');
 else if(proof)links.push('<span>'+esc(proof)+'</span>');
 for(const file of files)links.push('<a href="/api/fasilitasi/'+encodeURIComponent(x.id)+'/attachments/'+encodeURIComponent(file.id)+'/file" target="_blank" rel="noopener noreferrer">'+esc(file.fileName||'Lampiran')+'</a>');
 return '<div class="fac-proof-edit"><input type="url" class="fac-proof-input" data-proof-id="'+esc(x.id)+'" aria-label="Tautan bukti dukung" placeholder="https://…" value="'+esc(proof)+'" maxlength="1500">'+(links.length?'<div class="fac-proof-links">'+links.join(' ')+'</div>':'')+'</div>';
}
function render(){
 const query=$('search').value.trim().toLocaleLowerCase('id-ID'),kind=$('jenisFilter').value,met=$('metodeFilter').value,year=$('tahunFilter').value,asc=$('sort').dataset.order==='asc';
 const data=rows.filter(x=>{
  const m=methodValue(x);
  const parsed=dateParts(x.tanggal);return(!year||(parsed&&String(parsed.y)===year))&&(!kind||x.jenis===kind)&&(!met||(met==='unassigned'?!methods.includes(m):m===met))&&(!query||[x.judul,x.tanggal,x.metode,x.jenis,x.narasumber,draftValue(x,'pemohon'),x.catatan,draftValue(x,'bukti')].some(v=>String(v??'').toLocaleLowerCase('id-ID').includes(query)));
 }).slice().sort((a,b)=>(asc?1:-1)*(dateValue(a.tanggal)-dateValue(b.tanggal)));
 $('summary').textContent=data.length+' dari '+rows.length+' kegiatan';
 $('rows').innerHTML=data.map((x,i)=>'<tr><td class="fac-number-cell">'+(i+1)+'</td><td>'+esc(dateDisplay(x.tanggal))+'</td><td class="fac-title-cell" title="'+esc(x.judul)+'">'+esc(x.judul||'—')+'</td><td>'+esc(x.jenis||'—')+'</td><td>'+methodSelect(x)+'</td><td class="fac-person-cell">'+esc(x.narasumber||'—')+'</td><td class="fac-applicant-cell">'+applicantSelect(x)+'</td><td class="fac-proof-cell">'+evidence(x)+'</td><td class="fac-actions-cell"><button type="button" class="btn btn-outline fac-edit" data-edit-id="'+esc(x.id)+'">Edit</button></td></tr>').join('')||'<tr><td colspan="9" class="fac-empty-row">Tidak ada kegiatan yang sesuai filter.</td></tr>';
 $('rows').querySelectorAll('[data-method-id]').forEach(select=>select.onchange=()=>{
  const x=rowById(select.dataset.methodId);if(!x)return;
  const val=select.value;
  setDraft(x.id,'metode',val);
  select.className='fac-method '+methodClass(val);updateDraftUI();
 });
 $('rows').querySelectorAll('[data-applicant-id]').forEach(select=>select.onchange=()=>{
  const row=rowById(select.dataset.applicantId);if(!row)return;
  setDraft(row.id,'pemohon',select.value);updateApplicantTone(select);
 });
 $('rows').querySelectorAll('[data-proof-id]').forEach(input=>input.addEventListener('input',()=>setDraft(input.dataset.proofId,'bukti',input.value)));
 $('rows').querySelectorAll('[data-edit-id]').forEach(btn=>btn.onclick=()=>edit(btn.dataset.editId));
 updateDraftUI();
}
async function load(){
 if(drafts.size&&!confirm('Ada perubahan metode, pemohon, atau bukti dukung yang belum disimpan. Batalkan draf dan perbarui daftar?'))return;
 try{const r=await api('fasilitasi');if(!Array.isArray(r.data))throw Error('Format data tidak valid');rows=r.data;drafts.clear();render();$('msg').textContent=''}
 catch(e){$('msg').textContent='Gagal memuat data: '+e.message}
}
function close(){ED.close('facFormModal')}
function fresh(){
 $('form').reset();[...$('pemohon').options].filter(o=>o.dataset.legacy==='true').forEach(o=>o.remove());$('itemId').value='';$('formTitle').textContent='Tambah fasilitasi';$('metode').value='Offline';updateApplicantTone($('pemohon'));ED.open('facFormModal');
}
function edit(id){
 const x=rowById(id);if(!x)return;
 const applicant=$('pemohon');
 [...applicant.options].filter(option=>option.dataset.legacy==='true').forEach(option=>option.remove());
 for(const field of fields){
  const select=$(field),val=field==='tanggal'?dateInput(x[field]):draftValue(x,field);
  if(select.tagName==='SELECT'&&val&&![...select.options].some(o=>o.value===val)){
   const legacy=new Option(val,val);if(field==='pemohon')legacy.dataset.legacy='true';select.add(legacy,field==='pemohon'?1:0);
  }
  select.value=val;
 }
 $('itemId').value=x.id;$('formTitle').textContent='Edit fasilitasi';updateApplicantTone($('pemohon'));ED.open('facFormModal');
}
async function saveDrafts(){
 if(busy||!drafts.size)return;
 busy=true;updateDraftUI();let saved=0,errors=[];
 for(const [id,changes] of [...drafts.entries()]){
  try{const r=await api('fasilitasi/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify(changes)});
   const x=rowById(id);if(x)Object.assign(x,r.data||changes);drafts.delete(id);saved++;
  }catch(e){errors.push(e.message)}
 }
 busy=false;render();if(saved)notify();
 $('msg').textContent=errors.length?saved+' tersimpan, '+errors.length+' gagal. Draf yang gagal tetap ada.':saved+' kegiatan berhasil disimpan.';
}
$('facSaveDraft').onclick=saveDrafts;
$('facCancelDraft').onclick=()=>{if(!drafts.size||!confirm('Batalkan perubahan metode, pemohon, dan bukti yang belum disimpan?'))return;drafts.clear();render()};
$('pemohon').onchange=()=>updateApplicantTone($('pemohon'));updateApplicantTone($('pemohon'));$('search').oninput=render;$('jenisFilter').onchange=render;$('metodeFilter').onchange=render;$('tahunFilter').onchange=render;
$('facReset').onclick=()=>{$('search').value='';$('jenisFilter').value='';$('metodeFilter').value='';$('tahunFilter').value='';$('sort').dataset.order='desc';$('sort').textContent='Tanggal terbaru ↓';render()};
$('sort').onclick=()=>{const asc=$('sort').dataset.order!=='asc';$('sort').dataset.order=asc?'asc':'desc';$('sort').textContent=asc?'Tanggal terlama ↑':'Tanggal terbaru ↓';$('sort').setAttribute('aria-label',asc?'Urutkan tanggal dari terlama ke terbaru':'Urutkan tanggal dari terbaru ke terlama');render()};
$('addFac').onclick=fresh;$('facClose').onclick=close;$('cancel').onclick=close;
$('form').onsubmit=async e=>{
 e.preventDefault();if(busy)return;
 const id=$('itemId').value;
 const patch=Object.fromEntries(fields.map(k=>[k,$(k).value]));
 if(!patch.judul.trim()||!patch.tanggal||!patch.metode||!patch.jenis){$('msg').textContent='Nama, tanggal, metode, dan jenis wajib diisi.';return}
 busy=true;const btn=$('form').querySelector('[type=submit]');btn.disabled=true;
 try{
  const result=await api(id?'fasilitasi/'+encodeURIComponent(id):'fasilitasi',{method:id?'PATCH':'POST',body:JSON.stringify(patch)});
  drafts.delete(String(id));close();await load();notify();$('msg').textContent='Fasilitasi berhasil disimpan.';
 }catch(err){$('msg').textContent='Gagal menyimpan: '+err.message}
 finally{busy=false;btn.disabled=false}
};
window.addEventListener('beforeunload',event=>{if(drafts.size){event.preventDefault();event.returnValue=''}});
load();
})();