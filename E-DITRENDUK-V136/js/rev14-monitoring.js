/* REV14: Monitoring focus editor with explicit batch save.
 * Existing API PATCH operations are reused; browsing/filtering never writes data.
 */
(function(){
 'use strict';
 if(document.body.dataset.page!=='monitoring')return;
 const old=window.pageMonitoring;
 if(typeof old!=='function')return;
 window.pageMonitoring=function(){
  old();
  const body=document.getElementById('monitorBody');
  if(!body)return;
  const data=window.EXCEL_DATA?.monitoring||[];
  const drafts=new Map();
  const record=id=>data.find(x=>String(x.id)===String(id));
  const esc=x=>ED.esc(String(x??''));
  const get=(id,key)=>Object.prototype.hasOwnProperty.call(drafts.get(String(id))||{},key)?drafts.get(String(id))[key]:record(id)?.[key];
  const equals=(a,b)=>JSON.stringify(a??null)===JSON.stringify(b??null);
  const rowChanges=(id)=>drafts.get(String(id))||{};
  function stage(id,key,value){
   id=String(id);
   const row=record(id);if(!row)return;
   const draft={...rowChanges(id)};
   if(equals(value,row[key]))delete draft[key];else draft[key]=value;
   if(key==='validasiDirektur'){
    if(equals(value,row.verifikasi))delete draft.verifikasi;else draft.verifikasi=value;
   }
   if(Object.keys(draft).length)drafts.set(id,draft);else drafts.delete(id);
   refreshPending();syncVisible();
  }
  const panel=document.createElement('div');panel.className='ed-monitor-actions';panel.setAttribute('aria-label','Simpan perubahan Monitoring');
  panel.innerHTML='<button class="btn btn-navy" id="monitorSaveAll" type="button">💾 Simpan Perubahan</button><button type="button" class="btn btn-outline" id="monitorCancelDraft">Batalkan Perubahan</button><span class="ed-monitor-pending" id="monitorUnsavedNote" role="status" aria-live="polite">Belum ada perubahan.</span>';
  const wrap=body.closest('.table-wrap');
  if(wrap)wrap.insertAdjacentElement('beforebegin',panel);
  const saveButton=panel.querySelector('#monitorSaveAll'),cancelButton=panel.querySelector('#monitorCancelDraft'),note=panel.querySelector('#monitorUnsavedNote');
  function refreshPending(){
   const count=[...drafts.values()].reduce((sum,changes)=>sum+Object.keys(changes).length,0);
   note.textContent=count?String(drafts.size)+' kegiatan · '+String(count)+' perubahan belum disimpan. Klik Simpan Perubahan.':'Semua perubahan sudah tersimpan.';
   note.classList.toggle('has-changes',count>0);
   saveButton.disabled=!count;
   cancelButton.disabled=!count;
  }
  function syncVisible(){
   for(const target of body.querySelectorAll('[data-id]')){
    const id=String(target.dataset.id||'');
    const changes=rowChanges(id);
    if(!Object.keys(changes).length)continue;
    const key=target.classList.contains('mon-team')?'tim':
      target.classList.contains('mon-category')?'kategori':
      target.classList.contains('mon-fin')?'keuangan':
      target.classList.contains('mon-valid')?'validasiDirektur':
      target.classList.contains('mon-text')?target.dataset.key:
      target.classList.contains('mon-check')?'docs':null;
    if(!key||!Object.prototype.hasOwnProperty.call(changes,key))continue;
    if(key==='docs')target.checked=!!changes.docs[Number(target.dataset.doc)];
    else if(target.value!==String(changes[key]??''))target.value=String(changes[key]??'');
   }
   body.querySelectorAll('tr[data-monitor-draft]').forEach(tr=>{tr.classList.toggle('ed-monitor-focused',drafts.has(tr.dataset.monitorDraft))});
  }
  function enhanceRows(){
   for(const tr of body.querySelectorAll('tr')){
    const id=tr.querySelector('select.mon-team')?.dataset.id;
    const cell=tr.querySelector('.monitor-name');
    if(!id||!cell)continue;
    tr.dataset.monitorDraft=String(id);
    if(!cell.querySelector('.ed-monitor-focus')){
     const title=cell.textContent.trim();
     const button=document.createElement('button');button.type='button';button.className='ed-monitor-focus';
     button.textContent=title;button.title='Klik untuk fokus pada kegiatan ini';
     button.setAttribute('aria-label','Fokus kegiatan: '+title);
     button.addEventListener('click',()=>openFocus(id));
     cell.replaceChildren(button);
    }
   }
   syncVisible();
  }
  // Capture changes before legacy autosave handlers, keeping them as drafts.
  function capture(event){
   const t=event.target;
   if(!(t instanceof HTMLElement)||!t.matches('.mon-team,.mon-category,.mon-text,.mon-check,.mon-fin,.mon-valid'))return;
   event.stopImmediatePropagation();
   const id=t.dataset.id;
   if(t.matches('.mon-check')){
    const next=[...(get(id,'docs')||[])];
    next[Number(t.dataset.doc)]=!!t.checked;
    stage(id,'docs',next);
   }else{
    const key=t.matches('.mon-team')?'tim':t.matches('.mon-category')?'kategori':t.matches('.mon-fin')?'keuangan':t.matches('.mon-valid')?'validasiDirektur':t.dataset.key;
    if(key)stage(id,key,t.value);
   }
  }
  body.addEventListener('change',capture,true);
  const observer=new MutationObserver(enhanceRows);
  observer.observe(body,{childList:true,subtree:false});
  const focus=document.createElement('div');focus.className='modal-overlay';focus.id='monitorFocusModal';document.body.appendChild(focus);
  const docNames=[...document.querySelectorAll('body[data-page="monitoring"] .table th')].slice(7,19).map(x=>x.textContent.trim());
  const select=(field,values,current)=>'<select class="field" data-focus-field="'+field+'">'+[...new Set([String(current??''),...values].filter((v,i)=>i===0||String(v).length))].map(x=>'<option value="'+esc(x)+'"'+(x===String(current??'')?' selected':'')+'>'+esc(x||'—')+'</option>').join('')+'</select>';
  let focusedId=null;
  function openFocus(id){
   const x=record(id);if(!x)return;
   focusedId=String(id);
   const value=k=>get(id,k)??'';
   const docs=Array.isArray(get(id,'docs'))?get(id,'docs'):[];
   focus.innerHTML='<div class="modal ed-monitor-focus-dialog" role="dialog" aria-modal="true" aria-labelledby="monitorFocusTitle">'+
    '<div class="modal-head"><div><h3 id="monitorFocusTitle">Fokus kegiatan</h3><p>'+esc(x.nama||'Kegiatan')+'</p></div><button type="button" class="modal-close" id="monitorCloseFocus" aria-label="Tutup">×</button></div>'+
    '<div class="modal-body"><p class="muted">Tanggal: '+esc(x.tanggal||'Belum dicatat')+' · Perubahan belum masuk database sampai tombol Simpan Perubahan ditekan.</p><div class="ed-monitor-focus-grid">'+
    '<div class="form-group"><label>Tim Kerja</label>'+select('tim',['PARAMETER','PJPK','RUMAH DATAKU','Manajemen Kinerja'],value('tim'))+'</div>'+
    '<div class="form-group"><label>Kategori Kegiatan</label>'+select('kategori',['FULLDAY','FULLBOARD','RAPAT DI KANTOR','RAPAT DI LUAR KANTOR','PERJALANAN DINAS','NARASUMBER'],value('kategori'))+'</div>'+
    '<div class="form-group"><label>RO Komponen</label><input class="field" data-focus-field="ro" value="'+esc(value('ro'))+'"></div>'+
    '<div class="form-group"><label>Sub Komponen</label><input class="field" data-focus-field="sub" value="'+esc(value('sub'))+'"></div>'+
    '<div class="form-group"><label>Verifikasi Tim Keuangan</label>'+select('keuangan',['','LENGKAP','TIDAK LENGKAP'],value('keuangan'))+'</div>'+
    '<div class="form-group"><label>Validasi Direktur</label>'+select('validasiDirektur',['Belum diverifikasi','LENGKAP','TIDAK LENGKAP','Perlu perbaikan'],value('validasiDirektur'))+'</div>'+
    '<div class="form-group" style="grid-column:1/-1"><label>Bukti Dukung / Link</label><input class="field" data-focus-field="bukti" value="'+esc(value('bukti'))+'" placeholder="https://..."></div>'+
    '</div><h4>Checklist kelengkapan dokumen</h4><div class="ed-monitor-docs">'+
    Array.from({length:12},(_,i)=>'<label><input type="checkbox" data-focus-doc="'+i+'"'+(docs[i]?' checked':'')+'> '+esc(docNames[i]||'Dokumen '+(i+1))+'</label>').join('')+
    '</div><p class="ed-monitor-warning" id="monitorFocusStatus">Perubahan tersimpan sebagai draf sampai kamu menekan Simpan Perubahan.</p></div>'+
    '<div class="modal-foot"><button type="button" class="btn btn-outline" id="monitorFocusBack">Kembali ke daftar</button><button type="button" class="btn btn-navy" id="monitorFocusSave">💾 Simpan Perubahan</button></div></div>';
   focus.classList.add('open');
   const close=()=>{focusedId=null;focus.classList.remove('open')};
   focus.querySelector('#monitorCloseFocus').onclick=close;
   focus.querySelector('#monitorFocusBack').onclick=close;
   focus.querySelector('#monitorFocusSave').onclick=async()=>{await saveDrafts();if(!drafts.has(String(id)))close()};
   for(const control of focus.querySelectorAll('[data-focus-field]')){
    control.addEventListener('input',()=>{if(focusedId)stage(focusedId,control.dataset.focusField,control.value)});
   }
   for(const control of focus.querySelectorAll('[data-focus-doc]')){
    control.addEventListener('change',()=>{if(!focusedId)return;const next=[...(get(focusedId,'docs')||[])];next[Number(control.dataset.focusDoc)]=control.checked;stage(focusedId,'docs',next)});
   }
  }
  async function saveDrafts(){
   if(!drafts.size)return;
   if(saveButton.disabled)return;
   saveButton.disabled=true;saveButton.textContent='Menyimpan…';
   let saved=0;const failures=[];
   for(const [id,changes] of [...drafts.entries()]){
    try{
     await API.update('monitoring',id,changes);
     const source=record(id);if(source)Object.assign(source,changes);
     drafts.delete(id);saved++;
    }catch(e){failures.push(String(id)+' ('+String(e.message||'gagal')+')')}
   }
   refreshPending();syncVisible();
   saveButton.textContent='💾 Simpan Perubahan';
   if(saved){
    document.dispatchEvent(new Event('workspace-data-updated'));
    try{localStorage.setItem('ed_workspace_updated',String(Date.now()))}catch(_){}
   }
   ED.toast(failures.length?'Berhasil menyimpan '+saved+' kegiatan. Masih ada perubahan yang gagal.':'Perubahan '+saved+' kegiatan tersimpan di PostgreSQL.');
   if(failures.length)note.textContent='Belum tersimpan: '+failures.join('; ');
  }
  saveButton.onclick=saveDrafts;
  cancelButton.onclick=()=>{
   if(!drafts.size)return;
   if(!window.confirm('Batalkan semua perubahan yang belum disimpan? Data yang sudah tersimpan di server tidak akan diubah.'))return;
   drafts.clear();refreshPending();
   for(const target of body.querySelectorAll('[data-id]')){
    const x=record(target.dataset.id);if(!x)continue;
    const key=target.classList.contains('mon-team')?'tim':target.classList.contains('mon-category')?'kategori':target.classList.contains('mon-fin')?'keuangan':target.classList.contains('mon-valid')?'validasiDirektur':target.classList.contains('mon-text')?target.dataset.key:target.classList.contains('mon-check')?'docs':null;
    if(key==='docs')target.checked=!!x.docs[Number(target.dataset.doc)];
    else if(key)target.value=String(x[key]??'');
   }
   syncVisible();
  };
  window.addEventListener('beforeunload',e=>{if(drafts.size){e.preventDefault();e.returnValue='';}});
  refreshPending();enhanceRows();
 };
})();