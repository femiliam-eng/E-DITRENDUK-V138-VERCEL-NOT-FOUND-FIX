document.addEventListener('layout:ready',async()=>{
 const kind=document.body.dataset.page,task=kind==='task-deadline',fields=task?['nomorSurat','asalSurat','tugas','kebutuhan','deadline','status','disposisi']:['tanggal','asalSurat','kegiatan','tempat','waktu','disposisi','nomorSurat','hasilKegiatan'];
 const labels={tanggal:'Tanggal',asalSurat:'Asal Surat',kegiatan:'Kegiatan',tempat:'Tempat',waktu:'Waktu',disposisi:'Disposisi',nomorSurat:'Nomor Surat',hasilKegiatan:'Hasil Kegiatan',tugas:'Tugas',kebutuhan:'Kebutuhan',deadline:'Deadline',status:'Status'};
 const suratSuggestions=["Sekretaris Kementerian/Sekretaris Utama", "Deputi Bidang Pengendalian Penduduk", "Kepala Biro Perencanaan dan Keuangan", "Sekretaris Kementerian/ Sekretaris Utama", "Direktur Pemaduan Kebijakan Pengendalian Penduduk", "Plt. Kepala Biro Sumber Daya Manusia", "Kepala Pusat Data dan Teknologi Informasi", "Direktur Bina Akses Pelayanan KB", "Deputi Bidang Kebijakan Strategi Pembangunan Keluarga, Pengendalian Penduduk dan Keluarga Berencana", "Deputi Bidang Keluarga Sejahtera dan Pemberdayaan Keluarga", "Kepala Pusat Pengembangan SDM Kependudukan, Pembangunan Keluarga, dan Keluarga Berencana", "Direktur Analisa Dampak Kependudukan", "Direktur Pengelolaan Kerja Sama Pendidikan Kependudukan", "Kepala Pusat Pengembangan Sumber Daya Manusia Kependudukan, Pembangunan Keluarga, dan Keluarga Berencana", "Bappenas", "Kepala Biro Umum dan Pengelolaan BMN", "Deputi Bidang Bina Keluarga Berencana dan Kesehatan Reproduksi", "Plt. Direktur Bina Peran Serta Masyarakat", "Plt. Direktur Pemaduan Kebijakan Pengendalian Penduduk", "Plt. Direktur Pendayagunaan Lembaga Organisasi Kemasyarakatan", "Direktur Perencanaan Pengendalian Penduduk", "Plt. Direktur Kebijakan Strategi Bidang Penyerasian Kebijakan Pengendalian Kuantitas Penduduk", "Direktur Kebijakan Strategi Bidang Penyerasian Kebijakan Pengendalian Kuantitas Penduduk", "Direktur Bina Ketahanan Keluarga Balita dan Anak", "Kepala Biro Hubungan Masyarakat dan Informasi Publik", "Inspektur Utama", "Direktur Kependudukan dan Jaminan Sosial, BAPPENAS", "BAPPENAS", "Direktur Bina Kesehatan Reproduksi", "Kepala Pusat Pengembangan Sumber Daya Manusia Kependudukan, Pembangunan Keluarga dan Keluarga Berencana", "Plh. Kepala Pusat Data dan Teknologi Informasi", "Sekretaris Kementerian / Sekretaris Utama", "Direktur Kependudukan dan Jaminan Sosial, KPPN/BAPPENAS", "Direktur Kebijakan Strategi Bidang Peningkatan Kualitas Sumber Daya dan Kemandirian Keluarga Berencana", "Kepala Biro Hukum, Organisasi dan Tata Laksana", "Direktur Bina Pelayanan KB Wilayah dan Sasaran Khusus", "Deputi Bidang Keluarga Berencana dan Kesehatan Reproduksi", "Deputi dalduk", "Deputi Dalduk", "Kepala Badan Pengembangan Sumber Daya Manusia Sekretaris KEMENDAGRI", "UNFPA", "Direktur Kependudukan dan Jaminan Sosial BAPPENAS", "Kepala Pusat Pengembangan SDM, Kependudukan, Pembangunan Keluarga dan Keluarga Berencana", "DEPDALDUK", "DITRENDUK", "Direktorat Analisa Dampak Kependudukan", "Deputi Bidang Pengendalian Pendudik", "Direktur Pendayagunaan Lembaga Organisasi Kemasyarakatan", "Direktorat Perencanaan Pengendalian Penduduk", "Deputi Bidang Kebijakan Strategi Pembangunan Keluarga, Pengendalian Penduduk, dan Keluarga Berencana", "Depdalduk", "Direktur Keluarga, Pengasuhan, Perempuaan, dan Anak BAPPENAS", "Plt. Direktur Bina Ketahanan Keluarga Lanjut Usia dan Rentan", "Plt. Kepala Biro Umum dan Pengelolaan BMN", "Direktur Jenderal Peraturan Perundang-undangan, Direktur Harmonisasi Peraturan Perundang-undangan II Kementerian Hukum Republik Indonesia", "DP3AKB Halmahera Utara", "Kepala Biro Hukum, Organisasi, dan Tata Laksana", "Direktur Analisa Dampak Pendudukan", "Biro Perencanaan Keuangan", "Kementerian Sekretariat Negara RI", "Lembaga Demografi UI", "Pusbang SDM", "Ditrenduk", "Kepala Pusat Pengembangan SDM Kependudukan, Pembangunan Keluarga dan Keluarga Berencana", "Sekretaris Ditjen Bina Pembangunan Daerah", "Dewan Perwakilan Rakyat Daerah Kabupaten Kaur", "DINAS P3AKB UMATERA UTARA", "Kepala Perwakilan BKKBN Provinsi Maluku Utara", "Kemendagri", "Direktur Kebijakan Strategi Bidang Penyerasian Pembangunan Keluarga dan Keluarga Berencana", "Kepala UPT Balai Diklat KKB Cirebon", "Kepala Perwakilan BKKBN Provinsi Kalimantan Selatan", "Aan Ari Witoko", "Direktorat Pendidikan dan Pengelolaan Kerja Sama Pendidikan Kependudukan", "Sekretaris Ditjen Bina Pembangunan Daerah, KEMENDAGRI"];
 const body=document.getElementById('entryRows'),search=document.getElementById('entrySearch');let rows=[];let loadSequence=0;let loading=false;const sort=document.createElement('select');sort.className='field compact-date-sort';sort.setAttribute('aria-label','Urutan tanggal');sort.innerHTML='<option value="desc">Terbaru ke terlama</option><option value="asc">Terlama ke terbaru</option>';search.insertAdjacentElement('afterend',sort);sort.addEventListener('change',render);
 // Revisi 9 November: satu tombol menggantikan dropdown tanggal.
 sort.classList.add('ed-sort-original');
 const sortToggle=document.createElement('button');
 sortToggle.type='button';
 sortToggle.className='btn btn-outline ed-sort-toggle';
 sortToggle.setAttribute('aria-label','Balik urutan tanggal');
 const updateSortToggle=()=>{sortToggle.textContent=sort.value==='asc'?'Tanggal terlama ↑':'Tanggal terbaru ↓';sortToggle.setAttribute('aria-pressed',String(sort.value==='asc'));};
 sort.insertAdjacentElement('afterend',sortToggle);
 sortToggle.addEventListener('click',()=>{sort.value=sort.value==='asc'?'desc':'asc';sort.dispatchEvent(new Event('change',{bubbles:true}));updateSortToggle();});
 sort.addEventListener('change',updateSortToggle);
 updateSortToggle();
 const statusFilter=task?document.createElement('div'):null;
 let activeStatus='semua';let dateReviewOnly=false;
 if(statusFilter){statusFilter.className='task-status-filters';statusFilter.setAttribute('aria-label','Filter status tugas');statusFilter.innerHTML=['Semua','Done','Not yet'].map((label,i)=>`<button type="button" class="btn btn-sm ${i===0?'btn-navy':'btn-outline'}" data-status-filter="${label.toLowerCase()}">${label}</button>`).join(' ');sort.insertAdjacentElement('afterend',statusFilter);statusFilter.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{activeStatus=btn.dataset.statusFilter;statusFilter.querySelectorAll('button').forEach(b=>{b.classList.toggle('btn-navy',b===btn);b.classList.toggle('btn-outline',b!==btn)});render()}));}

 // Ringkasan, ekspor dan reset mengikuti hasil filter yang benar-benar tampil.
 const tools=document.createElement('div');tools.className='entry-data-tools';tools.setAttribute('aria-label','Ringkasan dan ekspor data');
 tools.innerHTML='<span class="entry-data-summary" role="status" aria-live="polite">Memuat data…</span><button type="button" class="btn btn-outline btn-sm" data-reset-filter>Reset filter</button><button type="button" class="btn btn-outline btn-sm" data-export-csv>Ekspor CSV</button><button type="button" class="btn btn-outline btn-sm" data-reload>Perbarui data</button>';
 statusFilter?statusFilter.insertAdjacentElement('afterend',tools):sort.insertAdjacentElement('afterend',tools);
 const review=document.createElement('button');review.type='button';review.className='btn btn-outline btn-sm';review.textContent='Periksa tanggal bermasalah';review.setAttribute('aria-pressed','false');tools.appendChild(review);review.onclick=()=>{dateReviewOnly=!dateReviewOnly;review.setAttribute('aria-pressed',String(dateReviewOnly));review.classList.toggle('btn-navy',dateReviewOnly);review.classList.toggle('btn-outline',!dateReviewOnly);render()};
 const summary=tools.querySelector('.entry-data-summary');
 const selectedRows=()=>{const q=search.value.trim().toLocaleLowerCase('id-ID');return rows.filter(r=>fields.map(field=>String(r[field]??'')).join(' ').toLocaleLowerCase('id-ID').includes(q)&&(!dateReviewOnly||!dateMillis(task?r.deadline:r.tanggal))&&(!task||activeStatus==='semua'||(activeStatus==='done'?/^done$/i.test(String(r.status||'').trim()):!/^done$/i.test(String(r.status||'').trim())))).slice().sort((a,b)=>{const x=dateMillis(task?a.deadline:a.tanggal);const y=dateMillis(task?b.deadline:b.tanggal);if(!x&&!y)return 0;if(!x)return 1;if(!y)return -1;return sort.value==='asc'?x-y:y-x});};
 const csvCell=value=>{const raw=String(value??'');const safe=/^[\s\uFEFF]*[=+@\-]/.test(raw)?"'"+raw:raw;return '"'+safe.replace(/"/g,'""')+'"';};
 tools.querySelector('[data-export-csv]').onclick=()=>{const visible=selectedRows();if(!visible.length)return ED.toast('Tidak ada data untuk diekspor.');const csv='\uFEFF'+[fields.map(f=>csvCell(labels[f]||f)).join(','),...visible.map(row=>fields.map(f=>csvCell(row[f])).join(','))].join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=(task?'task-deadline':'agenda-kegiatan')+'-hasil-filter.csv';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 tools.querySelector('[data-reset-filter]').onclick=()=>{search.value='';sort.value='desc';activeStatus='semua';dateReviewOnly=false;review.setAttribute('aria-pressed','false');review.classList.remove('btn-navy');review.classList.add('btn-outline');if(statusFilter)statusFilter.querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('btn-navy',i===0);b.classList.toggle('btn-outline',i!==0)});render();};
 tools.querySelector('[data-reload]').onclick=()=>load();
 function dateMillis(value){
  const text=String(value||'').trim();
  const iso=text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if(iso){const d=Date.UTC(+iso[1],+iso[2]-1,+iso[3]);return new Date(d).toISOString().slice(0,10)===`${iso[1]}-${iso[2].padStart(2,'0')}-${iso[3].padStart(2,'0')}`?d:0;}
  const local=text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if(local){const d=Date.UTC(+local[3],+local[2]-1,+local[1]);return new Date(d).getUTCDate()===+local[1]&&new Date(d).getUTCMonth()+1===+local[2]?d:0;}
  return 0; // Tanggal naratif/rentang tidak ditafsirkan secara spekulatif.
 }
 async function load(){const sequence=++loadSequence;loading=true;summary.textContent='Memuat data…';try{const result=await API.list(kind);if(sequence!==loadSequence)return;if(!Array.isArray(result.data))throw new Error('Format daftar data tidak valid.');rows=result.data;loading=false;render()}catch(e){if(sequence!==loadSequence)return;loading=false;summary.textContent='Gagal memuat data — klik Perbarui data';ED.toast(e.message)}}
 function render(){const visible=selectedRows();const problematic=rows.filter(r=>!dateMillis(task?r.deadline:r.tanggal)).length;summary.textContent=task?`${visible.length} dari ${rows.length} tugas · ${visible.filter(r=>/^done$/i.test(String(r.status||'').trim())).length} Done · ${visible.filter(r=>!/^done$/i.test(String(r.status||'').trim())).length} Not yet · ${problematic} tanggal perlu diperiksa`:`${visible.length} dari ${rows.length} agenda ditampilkan · ${problematic} tanggal perlu diperiksa`;body.innerHTML=visible.map(r=>`<tr><td>${ED.esc(task?r.deadline:r.tanggal)}</td><td><button type="button" class="entry-focus-trigger" data-focus="${ED.esc(r.id)}" title="Buka tugas/kegiatan untuk diperiksa dan diedit">${ED.esc(task?r.tugas:r.kegiatan)}</button><small style="display:block">${ED.esc(r.asalSurat||'')}</small></td><td>${task?`<select class="task-status task-status-inline ${/^done$/i.test((r.status||'').trim())?'task-status-done':'task-status-pending'}" data-status-id="${ED.esc(r.id)}" aria-label="Ubah status tugas ${ED.esc(r.tugas||'')}"><option value="not yet" ${!/^done$/i.test((r.status||'').trim())?'selected':''}>Not yet</option><option value="done" ${/^done$/i.test((r.status||'').trim())?'selected':''}>Done</option></select>`:ED.esc((r.tempat||'')+' · '+(r.waktu||''))}</td><td>${ED.esc(r.disposisi)}</td>${!task?`<td>${ED.esc(r.hasilKegiatan||'—')}</td>`:''}<td><span class="entry-actions">${!task?`<button class="link" data-attachments="${ED.esc(r.id)}">📎 ${Array.isArray(r.attachments)?r.attachments.length:0} Lampiran</button>`:''}<button class="link" data-edit="${ED.esc(r.id)}">Edit</button><button class="link" data-del="${ED.esc(r.id)}">Hapus</button></span></td></tr>`).join('')||`<tr><td colspan="${task?5:6}">Tidak ada data.</td></tr>`;body.querySelectorAll('[data-attachments]').forEach(b=>b.onclick=()=>showAttachments(b.dataset.attachments));body.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>edit(b.dataset.edit));body.querySelectorAll('[data-focus]').forEach(b=>b.onclick=()=>edit(b.dataset.focus));body.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>remove(b.dataset.del));body.querySelectorAll('[data-status-id]').forEach(el=>el.addEventListener('change',()=>changeTaskStatus(el)));}
 async function showAttachments(agendaId){
  const row=rows.find(x=>x.id===agendaId);if(!row)return;
  let modal=document.getElementById('attachmentModal');if(!modal){modal=document.createElement('div');modal.id='attachmentModal';modal.className='modal-overlay';document.body.appendChild(modal)}
  modal.innerHTML=`<div class="modal"><div class="modal-head"><h3>Lampiran Surat</h3><button class="modal-close" data-close-attachment aria-label="Tutup">×</button></div><div class="modal-body"><p style="margin-top:0">${ED.esc(row.kegiatan||'')}</p><div id="agendaAttachmentList">Memuat lampiran...</div><div class="agenda-attachment-upload"><label class="form-group">Jenis Surat<select class="field" id="attachmentType"><option>Surat Undangan</option><option>Surat Tugas</option><option>Surat Dinas</option><option>Dokumen Pendukung</option></select></label><label class="form-group">Pilih dokumen<input class="field" id="attachmentFile" type="file" accept=".pdf,.docx,.jpg,.jpeg,.png" /></label><small>Maksimal 5 lampiran, masing-masing 5 MB. PDF, DOCX, JPG, PNG.</small></div></div><div class="modal-foot"><button class="btn btn-navy" id="uploadAgendaAttachment">Unggah Surat</button></div></div>`;
  modal.classList.add('open');modal.querySelector('[data-close-attachment]').onclick=()=>modal.classList.remove('open');
  const list=modal.querySelector('#agendaAttachmentList');
  async function refresh(){
   try{const result=await API.agendaAttachments(agendaId);const items=result.data||[];row.attachments=items;
    list.innerHTML=items.length?items.map(x=>`<div class="agenda-attachment-item"><span>📄 <strong>${ED.esc(x.fileName)}</strong><small>${ED.esc(x.type)} · ${(x.size/1024/1024).toFixed(2)} MB</small></span><span><a class="link" target="_blank" rel="noopener" href="${API.base}/api/agenda/${encodeURIComponent(agendaId)}/attachments/${encodeURIComponent(x.id)}/file">Lihat</a> <button class="link" data-remove-attachment="${ED.esc(x.id)}">Hapus</button></span></div>`).join(''):'<p class="muted">Belum ada lampiran surat.</p>';
    list.querySelectorAll('[data-remove-attachment]').forEach(b=>b.onclick=async()=>{if(!await ED.confirmAction('Hapus lampiran surat ini?'))return;try{await API.deleteAgendaAttachment(agendaId,b.dataset.removeAttachment);await refresh();render()}catch(e){ED.toast(e.message)}});
    modal.querySelector('#uploadAgendaAttachment').disabled=items.length>=5;
   }catch(e){list.textContent='Gagal memuat lampiran: '+e.message}
  }
  modal.querySelector('#uploadAgendaAttachment').onclick=async()=>{
   const file=modal.querySelector('#attachmentFile').files[0];if(!file)return ED.toast('Pilih dokumen terlebih dahulu.');
   if(file.size>5*1024*1024)return ED.toast('Maksimal ukuran file 5 MB.');if(!/\.(pdf|docx|jpe?g|png)$/i.test(file.name))return ED.toast('Format harus PDF, DOCX, JPG, atau PNG.');
   const btn=modal.querySelector('#uploadAgendaAttachment');if(btn.disabled)return;btn.disabled=true;
   try{const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file)});
    const mime={pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png'}[file.name.split('.').pop().toLowerCase()];
    await API.addAgendaAttachment(agendaId,{fileName:file.name,mimeType:mime,type:modal.querySelector('#attachmentType').value,fileBase64:data});
    modal.querySelector('#attachmentFile').value='';await refresh();render();ED.toast('Lampiran surat berhasil diunggah.');
   }catch(e){ED.toast(e.message)}finally{btn.disabled=false}
  };
  await refresh();
 }
 async function changeTaskStatus(el){
  const id=el.dataset.statusId,record=rows.find(r=>String(r.id)===String(id));
  if(!record)return;
  if(el.disabled)return;
  const previous=/^done$/i.test((record.status||'').trim())?'done':'not yet';
  const next=el.value;
  if(previous===next)return;
  el.disabled=true;
  try{
   // Kirim hanya field status; backend tetap memvalidasi hak akses modul.
   await API.update(kind,id,{status:next});
   record.status=next;
   document.dispatchEvent(new Event('workspace-data-updated'));try{localStorage.setItem('ed_workspace_updated',String(Date.now()))}catch(_){}
   render();
   ED.toast('Status tugas diperbarui.');
  }catch(e){
   el.value=previous;el.disabled=false;
   ED.toast('Gagal mengubah status: '+e.message);
  }
 }
 function edit(id){const old=rows.find(x=>x.id===id)||{};let modal=document.getElementById('entryModal');if(!modal){modal=document.createElement('div');modal.id='entryModal';modal.className='modal-overlay';document.body.appendChild(modal)}modal.innerHTML=`<div class="modal"><div class="modal-head"><h3>${id?'Ubah':'Tambah'} ${task?'Task Deadline':'Agenda Kegiatan'}</h3><button class="modal-close" id="closeEntry">×</button></div><div class="modal-body">${fields.map(f=>`<div class="form-group"><label>${labels[f]}</label>${['tanggal','deadline'].includes(f)?`<input class="field" type="date" title="Jika tanggal sumber kosong atau berupa teks, pilih tanggal kalender yang valid untuk memperbaikinya" data-field="${f}" value="${ED.esc(/^\d{4}-\d{2}-\d{2}$/.test(old[f]||'')?old[f]:'')}" />`:f==='status'?`<select class="field task-status-select" data-field="status"><option value="not yet" ${!/^done$/i.test((old.status||'').trim())?'selected':''}>Not yet — Belum selesai</option><option value="done" ${/^done$/i.test((old.status||'').trim())?'selected':''}>Done — Selesai</option></select>`:f==='waktu'?`<div class="time-picker-row"><label class="time-picker-label">Mulai <input type="time" class="field time-picker" data-time-start aria-label="Pilih jam mulai"></label><label class="time-picker-label">Selesai (opsional) <input type="time" class="field time-picker" data-time-end aria-label="Pilih jam selesai"></label></div><input class="field" data-field="waktu" placeholder="Contoh: 09.00 WIB s.d. selesai" value="${ED.esc(old.waktu||'')}" /><small class="time-picker-help">Pilih jam di atas untuk mengisi otomatis, atau ketik keterangan waktu jika diperlukan.</small>`:f==='asalSurat'?`<div class="surat-combobox"><input class="field surat-input" type="text" data-field="${f}" role="combobox" aria-expanded="false" aria-controls="suratListbox" aria-autocomplete="list" autocomplete="off" placeholder="Cari atau ketik asal surat..." value="${ED.esc(old[f]||'')}" /><button type="button" class="surat-toggle" aria-label="Lihat pilihan asal surat" tabindex="-1">⌄</button><div class="surat-listbox" id="suratListbox" role="listbox" hidden></div></div>`:`<textarea class="field" data-field="${f}" rows="${['tugas','kebutuhan','kegiatan'].includes(f)?3:1}">${ED.esc(old[f]||'')}</textarea>`}</div>`).join('')}</div><div class="modal-foot"><button class="btn btn-navy" id="saveEntry">💾 Simpan Perubahan</button></div></div>`;modal.classList.add('open');
 const sourceDate=String(old[task?'deadline':'tanggal']||'').trim();
 if(id&&sourceDate&&!/^\d{4}-\d{2}-\d{2}$/.test(sourceDate)){
  const dateField=modal.querySelector(`[data-field="${task?'deadline':'tanggal'}"]`);
  const hint=document.createElement('small');hint.className='time-picker-help';
  hint.textContent='Tanggal dari data sumber: '+sourceDate+'. Pilih tanggal kalender yang benar sebelum menyimpan. Data asli belum diubah.';
  dateField.insertAdjacentElement('afterend',hint);
 }
 setupSuratCombobox(modal);setupTimePicker(modal);document.getElementById('closeEntry').onclick=()=>modal.classList.remove('open');document.getElementById('saveEntry').onclick=async()=>{const data={};modal.querySelectorAll('[data-field]').forEach(e=>data[e.dataset.field]=e.value.trim());const saveButton=document.getElementById('saveEntry');if(saveButton.disabled)return;if(!String(data[task?'tugas':'kegiatan']||'').trim())return ED.toast(task?'Tugas wajib diisi.':'Nama kegiatan wajib diisi.');if(!/^\d{4}-\d{2}-\d{2}$/.test(data[task?'deadline':'tanggal']||'')||!dateMillis(data[task?'deadline':'tanggal']))return ED.toast('Tanggal wajib diisi dengan tanggal kalender yang valid.');saveButton.disabled=true;try{if(id)await API.update(kind,id,data);else await API.create(kind,data);modal.classList.remove('open');await load();document.dispatchEvent(new Event('workspace-data-updated'));try{localStorage.setItem('ed_workspace_updated',String(Date.now()))}catch(_){}ED.toast('Data tersimpan.')}catch(e){ED.toast(e.message)}finally{saveButton.disabled=false}};}
 function setupTimePicker(modal){
  const start=modal.querySelector('[data-time-start]'),end=modal.querySelector('[data-time-end]'),text=modal.querySelector('[data-field="waktu"]');
  if(!start||!text)return;
  const old=text.value.match(/^(\d{1,2})[.:](\d{2})\s*WIB\s*s\.d\.\s*(\d{1,2})[.:](\d{2})\s*WIB$/i);
  const single=text.value.match(/^(\d{1,2})[.:](\d{2})\s*WIB$/i);
  if(old){start.value=old[1].padStart(2,'0')+':'+old[2];end.value=old[3].padStart(2,'0')+':'+old[4]}
  else if(single)start.value=single[1].padStart(2,'0')+':'+single[2];
  const fmt=v=>v.replace(':','.')+' WIB';
  const update=()=>{if(!start.value)return; text.value=fmt(start.value)+(end.value?' s.d. '+fmt(end.value):'');};
  start.addEventListener('change',update);end.addEventListener('change',update);
 }
 function setupSuratCombobox(modal){
  const wrap=modal.querySelector('.surat-combobox');if(!wrap)return;
  const input=wrap.querySelector('.surat-input'),list=wrap.querySelector('.surat-listbox'),toggle=wrap.querySelector('.surat-toggle');
  let active=-1,visible=[];
  const close=()=>{list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;};
  const highlight=()=>{list.querySelectorAll('[role="option"]').forEach((el,i)=>{el.classList.toggle('is-active',i===active);el.setAttribute('aria-selected',String(i===active));});if(active>=0){input.setAttribute('aria-activedescendant','surat-option-'+active);list.children[active]?.scrollIntoView({block:'nearest'});}};
  const open=()=>{
   const q=input.value.trim().toLocaleLowerCase('id-ID');
   visible=suratSuggestions.filter(x=>x.toLocaleLowerCase('id-ID').includes(q)).slice(0,60);
   active=-1;
   list.innerHTML=visible.length?visible.map((x,i)=>`<button type="button" role="option" id="surat-option-${i}" class="surat-option" aria-selected="false">${ED.esc(x)}</button>`).join(''):'<div class="surat-empty">Tidak ada saran. Nama baru tetap bisa diketik.</div>';
   list.hidden=false;input.setAttribute('aria-expanded','true');
   list.querySelectorAll('[role="option"]').forEach((el,i)=>el.addEventListener('mousedown',e=>{e.preventDefault();input.value=visible[i];close();input.focus();}));
  };
  input.addEventListener('focus',open);
  input.addEventListener('input',open);
  toggle.addEventListener('click',()=>{if(list.hidden){input.focus();open();}else close();});
  input.addEventListener('keydown',e=>{
   if(e.key==='Escape'){close();return;}
   if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(list.hidden)open();if(visible.length){active=(active+(e.key==='ArrowDown'?1:-1)+visible.length)%visible.length;highlight();}}
   if(e.key==='Enter'&&!list.hidden&&active>=0){e.preventDefault();input.value=visible[active];close();}
  });
  input.addEventListener('blur',()=>setTimeout(()=>{if(!wrap.contains(document.activeElement))close();},120));
  modal.addEventListener('click',e=>{if(!wrap.contains(e.target))close();});
 }
 async function remove(id){if(!await ED.confirmAction('Hapus data ini?'))return;try{await API.remove(kind,id);await load();document.dispatchEvent(new Event('workspace-data-updated'));try{localStorage.setItem('ed_workspace_updated',String(Date.now()))}catch(_){}ED.toast('Data berhasil dihapus.')}catch(e){ED.toast(e.message)}}
 document.getElementById('newEntry').onclick=()=>edit(null);search.oninput=render;await load();
});