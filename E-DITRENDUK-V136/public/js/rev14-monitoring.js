/* REV14NOV(1): Inline activity focus, clear unsaved drafts, one save action in the section header.
 * Does not call the API on view/filter actions. Existing authenticated PATCH remains the only write path.
 */
(function(){
 'use strict';
 if(document.body.dataset.page!=='monitoring'||typeof window.pageMonitoring!=='function')return;
 const legacy=window.pageMonitoring;
 window.pageMonitoring=function(){
  legacy();
  const body=document.getElementById('monitorBody');
  const heading=body?.closest('.card')?.querySelector('.section-title');
  if(!body||!heading)return;
  const data=window.EXCEL_DATA?.monitoring||[];
  const drafts=new Map();
  let focusId=null,saving=false;
  const esc=value=>ED.esc(String(value??''));
  const item=id=>data.find(row=>String(row.id)===String(id));
  const changed=id=>drafts.get(String(id))||{};
  const value=(id,key)=>Object.prototype.hasOwnProperty.call(changed(id),key)?changed(id)[key]:item(id)?.[key];
  const equal=(a,b)=>JSON.stringify(a??null)===JSON.stringify(b??null);
  const headerActions=document.createElement('div');
  headerActions.className='ed-monitor-header-actions';
  headerActions.innerHTML='<button type="button" class="btn btn-navy" id="monitorSaveAll">Simpan Perubahan</button><button type="button" class="ed-monitor-cancel" id="monitorCancelDraft">Batalkan draf</button>';
  const sync=heading.querySelector('#syncBtn');
  if(sync)headerActions.prepend(sync);
  heading.appendChild(headerActions);
  const saveButton=headerActions.querySelector('#monitorSaveAll');
  const cancelButton=headerActions.querySelector('#monitorCancelDraft');
  const note=document.createElement('small');
  note.className='ed-monitor-save-note';
  note.setAttribute('role','status');
  note.setAttribute('aria-live','polite');
  (heading.firstElementChild||heading).appendChild(note);
  const names=[...body.closest('table').querySelectorAll('thead th')].slice(7,19).map(x=>x.textContent.trim());
  const totalColumns=body.closest('table').querySelectorAll('thead th').length||22;
  const select=(key,options,current)=>{
   const items=[...new Set([String(current??''),...options])];
   return '<select class="field ed-monitor-inline-field" data-inline-key="'+esc(key)+'">'+items.map(o=>'<option value="'+esc(o)+'"'+(o===String(current??'')?' selected':'')+'>'+esc(o||'—')+'</option>').join('')+'</select>';
  };
  const field=(id,key,label,content)=>'<div class="ed-monitor-inline-field-wrap"><label for="monitorInline-'+esc(key)+'">'+esc(label)+'</label>'+content.replace('class="field','id="monitorInline-'+esc(key)+'" class="field')+'</div>';
  const input=(id,key,label)=>field(id,key,label,'<input class="field ed-monitor-inline-field" data-inline-key="'+esc(key)+'" value="'+esc(value(id,key))+'">');
  function pending(){
   const count=[...drafts.values()].reduce((sum,obj)=>sum+Object.keys(obj).length,0);
   note.textContent=count?drafts.size+' kegiatan dengan '+count+' perubahan belum disimpan.':'Semua perubahan sudah tersimpan.';
   note.classList.toggle('has-changes',count>0);
   saveButton.disabled=saving||!count;
   cancelButton.disabled=saving||!count;
  }
  function syncVisible(){
   for(const control of body.querySelectorAll('tr[data-ed-monitor-id] [data-id]')){
    const id=control.dataset.id;
    const row=changed(id);
    if(!Object.keys(row).length)continue;
    const key=control.matches('.mon-team')?'tim':control.matches('.mon-category')?'kategori':
     control.matches('.mon-fin')?'keuangan':control.matches('.mon-valid')?'validasiDirektur':
     control.matches('.mon-text')?control.dataset.key:control.matches('.mon-check')?'docs':null;
    if(!key||!Object.prototype.hasOwnProperty.call(row,key))continue;
    if(key==='docs')control.checked=!!row.docs[Number(control.dataset.doc)];
    else if(control!==document.activeElement)control.value=String(row[key]??'');
    if(key==='tim'){
     control.classList.remove('team-pjpk','team-parameter','team-kinerja');
     const color=row.tim==='PJPK'?'team-pjpk':row.tim==='PARAMETER'?'team-parameter':row.tim==='Manajemen Kinerja'?'team-kinerja':'';
     if(color)control.classList.add(color);
    }
   }
   for(const tr of body.querySelectorAll('tr[data-ed-monitor-id]')){
    tr.classList.toggle('ed-monitor-active',tr.dataset.edMonitorId===focusId);
    tr.classList.toggle('ed-monitor-dirty',drafts.has(tr.dataset.edMonitorId));
    const btn=tr.querySelector('.ed-monitor-focus');
    if(btn)btn.setAttribute('aria-expanded',String(tr.dataset.edMonitorId===focusId));
   }
  }
  function stage(id,key,next){
   id=String(id);
   const original=item(id);
   if(!original)return;
   const d={...changed(id)};
   if(equal(next,original[key]))delete d[key];
   else d[key]=next;
   if(key==='validasiDirektur'){
    if(equal(next,original.verifikasi))delete d.verifikasi;
    else d.verifikasi=next;
   }
   if(Object.keys(d).length)drafts.set(id,d);
   else drafts.delete(id);
   pending();syncVisible();
  }
  function closeInline(){
   focusId=null;
   body.querySelector('.ed-monitor-detail-row')?.remove();
   syncVisible();
  }
  function detail(id){
   const x=item(id),tr=[...body.querySelectorAll('tr[data-ed-monitor-id]')].find(t=>t.dataset.edMonitorId===String(id));
   if(!x||!tr)return;
   body.querySelector('.ed-monitor-detail-row')?.remove();
   const row=document.createElement('tr');
   row.className='ed-monitor-detail-row';
   row.dataset.inlineId=String(id);
   const td=document.createElement('td');
   td.colSpan=totalColumns;
   const fieldValue=key=>value(id,key)??'';
   const docs=Array.isArray(fieldValue('docs'))?fieldValue('docs'):[];
   const optionsTeam=['PARAMETER','PJPK','RUMAH DATAKU','Manajemen Kinerja'];
   const categories=['FULLDAY','FULLBOARD','RAPAT DI KANTOR','RAPAT DI LUAR KANTOR','PERJALANAN DINAS','NARASUMBER'];
   const grid=[
    field(id,'tim','Tim Kerja',select('tim',optionsTeam,fieldValue('tim'))),
    field(id,'kategori','Kategori Kegiatan',select('kategori',categories,fieldValue('kategori'))),
    input(id,'ro','RO Komponen'),
    input(id,'sub','Sub Komponen'),
    field(id,'keuangan','Verifikasi Tim Keuangan',select('keuangan',['','LENGKAP','TIDAK LENGKAP'],fieldValue('keuangan'))),
    field(id,'validasiDirektur','Validasi Direktur',select('validasiDirektur',['Belum diverifikasi','LENGKAP','TIDAK LENGKAP','Perlu perbaikan'],fieldValue('validasiDirektur'))),
    input(id,'bukti','Bukti Dukung')
   ].join('');
   td.innerHTML='<div class="ed-monitor-inline" aria-label="Detail kegiatan terpilih">'+
    '<div class="ed-monitor-inline-head"><div><h4>Fokus kegiatan · '+esc(x.nama||'Kegiatan')+'</h4><p>Tanggal '+esc(x.tanggal||'belum diisi')+' · Edit di sini, lalu simpan melalui tombol di atas tabel.</p></div><button type="button" class="btn btn-outline ed-monitor-inline-close" data-ed-close-inline>Tutup detail</button></div>'+
    '<div class="ed-monitor-inline-grid">'+grid+'</div><h5>Checklist kelengkapan dokumen</h5><div class="ed-monitor-inline-docs">'+
    Array.from({length:12},(_,i)=>'<label><input type="checkbox" data-inline-doc="'+i+'"'+(docs[i]?' checked':'')+'> '+esc(names[i]||'Dokumen '+(i+1))+'</label>').join('')+
    '</div><p class="ed-monitor-inline-hint">Perubahan belum masuk database sampai tombol Simpan Perubahan ditekan. Baris yang aktif ditandai biru; edit yang belum tersimpan ditandai di daftar.</p></div>';
   row.appendChild(td);
   tr.insertAdjacentElement('afterend',row);
   syncVisible();
  }
  function toggleFocus(id){
   const normalized=String(id);
   if(focusId===normalized){closeInline();return;}
   focusId=normalized;
   detail(normalized);
  }
  function enhanceRows(){
   for(const tr of [...body.querySelectorAll('tr')]){
    const id=tr.querySelector('select.mon-team')?.dataset.id;
    const title=tr.querySelector('.monitor-name');
    if(!id||!title)continue;
    tr.dataset.edMonitorId=String(id);
    tr.tabIndex=0;
    if(!title.querySelector('.ed-monitor-focus')){
     const btn=document.createElement('button');
     btn.type='button';btn.className='ed-monitor-focus';
     btn.textContent=title.textContent.trim();
     btn.setAttribute('aria-label','Buka detail kegiatan: '+btn.textContent);
     title.replaceChildren(btn);
    }
   }
   if(focusId){
    const shown=body.querySelector('tr[data-ed-monitor-id="'+CSS.escape(focusId)+'"]');
    if(shown&&!body.querySelector('.ed-monitor-detail-row[data-inline-id="'+CSS.escape(focusId)+'"]'))detail(focusId);
   }
   syncVisible();
  }
  // Capture before legacy per-input autosave; edits stay in memory until Save.
  body.addEventListener('change',event=>{
   const target=event.target;
   if(!(target instanceof HTMLElement))return;
   if(target.matches('.mon-team,.mon-category,.mon-text,.mon-check,.mon-fin,.mon-valid')){
    event.stopImmediatePropagation();
    const id=target.dataset.id;
    if(target.classList.contains('mon-check')){
     const docs=[...(value(id,'docs')||[])];
     docs[Number(target.dataset.doc)]=target.checked;
     stage(id,'docs',docs);
    }else{
     const key=target.matches('.mon-team')?'tim':target.matches('.mon-category')?'kategori':
      target.matches('.mon-fin')?'keuangan':target.matches('.mon-valid')?'validasiDirektur':target.dataset.key;
     if(key)stage(id,key,target.value);
    }
    return;
   }
   if(target.matches('[data-inline-doc]')&&focusId){
    const docs=[...(value(focusId,'docs')||[])];
    docs[Number(target.dataset.inlineDoc)]=target.checked;
    stage(focusId,'docs',docs);
   }
   if(target.matches('select[data-inline-key]')&&focusId)stage(focusId,target.dataset.inlineKey,target.value);
  },true);
  body.addEventListener('input',event=>{
   const target=event.target;
   if(target instanceof HTMLInputElement&&target.matches('input[data-inline-key]')&&focusId)
    stage(focusId,target.dataset.inlineKey,target.value);
  },true);
  body.addEventListener('click',event=>{
   if(event.target.closest('[data-ed-close-inline]')){closeInline();return;}
   const tr=event.target.closest('tr[data-ed-monitor-id]');
   if(!tr)return;
   if(event.target.closest('input,select,textarea,a,button:not(.ed-monitor-focus),label'))return;
   toggleFocus(tr.dataset.edMonitorId);
  });
  body.addEventListener('keydown',event=>{
   const tr=event.target.closest('tr[data-ed-monitor-id]');
   if(!tr||event.target!==tr||!['Enter',' '].includes(event.key))return;
   event.preventDefault();toggleFocus(tr.dataset.edMonitorId);
  });
  const observer=new MutationObserver(()=>enhanceRows());
  observer.observe(body,{childList:true,subtree:false});
  let failed=0;
  async function saveDrafts(){
   if(saving||!drafts.size)return;
   saving=true;saveButton.textContent='Menyimpan…';pending();
   let saved=0;
   for(const [id,patch] of [...drafts]){
    try{
     await API.update('monitoring',id,patch);
     const original=item(id);if(original)Object.assign(original,patch);
     drafts.delete(id);saved++;
    }catch(error){failed++;console.warn('Monitoring PATCH gagal:',String(error?.message||error))}
   }
   saving=false;saveButton.textContent='Simpan Perubahan';
   pending();syncVisible();
   if(saved){
    document.dispatchEvent(new Event('workspace-data-updated'));
    try{localStorage.setItem('ed_workspace_updated',String(Date.now()))}catch(_){}
   }
   ED.toast(failed?String(saved)+' kegiatan berhasil disimpan. '+String(failed)+' gagal; draf tetap ada.':String(saved)+' kegiatan tersimpan di PostgreSQL.');
   if(failed){note.textContent='Gagal menyimpan '+failed+' kegiatan. Draf tetap aman di halaman ini; coba simpan lagi.';failed=0;}
  }
  saveButton.onclick=saveDrafts;
  cancelButton.onclick=()=>{
   if(!drafts.size||!window.confirm('Batalkan semua draf yang belum disimpan? Data yang sudah tersimpan di PostgreSQL tidak berubah.'))return;
   drafts.clear();pending();
   for(const ctl of body.querySelectorAll('tr[data-ed-monitor-id] [data-id]')){
    const x=item(ctl.dataset.id);if(!x)continue;
    const key=ctl.matches('.mon-team')?'tim':ctl.matches('.mon-category')?'kategori':ctl.matches('.mon-fin')?'keuangan':ctl.matches('.mon-valid')?'validasiDirektur':ctl.matches('.mon-check')?'docs':ctl.dataset.key;
    if(key==='docs')ctl.checked=!!(x.docs||[])[Number(ctl.dataset.doc)];
    else if(key)ctl.value=String(x[key]??'');
   }
   if(focusId)detail(focusId);else syncVisible();
  };
  window.addEventListener('beforeunload',event=>{if(drafts.size){event.preventDefault();event.returnValue='';}});
  enhanceRows();pending();
 };
})();