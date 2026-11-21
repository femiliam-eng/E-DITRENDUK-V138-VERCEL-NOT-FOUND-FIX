// Notulensi: uploads are separate from verified read-only Drive references.
(()=>{'use strict';
const $=id=>document.getElementById(id);
const form=$('submissionForm'),statusEl=$('submissionStatus');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let uploads=[],references=[];
const dateOnly=v=>{const match=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(v??''));return match?match[0]:'—'};
function render(){
 const q=$('submissionSearch').value.trim().toLocaleLowerCase('id-ID'),year=$('submissionYear').value,kind=$('submissionType').value;
 const rows=[
  ...uploads.map(x=>({...x,origin:'unggahan'})),
  ...references.map(x=>({...x,origin:'contoh'}))
 ].filter(x=>{
  const date=dateOnly(x.meeting_date),type=x.meeting_type||'';
  return(!year||date.startsWith(year+'-'))&&(!kind||type===kind)&&(!q||[x.topic,date,x.file_name,x.source_folder,x.uploader_name,type].some(v=>String(v??'').toLocaleLowerCase('id-ID').includes(q)));
 }).sort((a,b)=>$('submissionSort').dataset.order==='asc'?dateOnly(a.meeting_date).localeCompare(dateOnly(b.meeting_date)):dateOnly(b.meeting_date).localeCompare(dateOnly(a.meeting_date)));
 $('submissionCount').textContent=rows.length+' dari '+(uploads.length+references.length)+' notulensi';
 $('submissionList').innerHTML=rows.map((r,i)=>{
  const isRef=r.origin==='contoh';
  const href=isRef?r.drive_url:'/api/notulen-submissions/'+encodeURIComponent(r.id)+'/file';
  const source=isRef?'Contoh dari Drive · '+esc(r.source_folder):'Unggahan website';
  return '<tr><td>'+(i+1)+'</td><td>'+esc(dateOnly(r.meeting_date))+'</td><td><strong>'+esc(r.topic)+'</strong></td><td>'+esc(r.meeting_type||'—')+'</td><td>'+source+'</td><td>'+esc(isRef?'—':r.uploader_name||'—')+'</td><td><a class="btn btn-outline ed-note-link" href="'+esc(href)+'"'+(isRef?' target="_blank" rel="noopener noreferrer"':'')+'>'+(isRef?'Buka':'Unduh')+'</a></td></tr>';
 }).join('')||'<tr><td colspan="7">Tidak ada hasil yang sesuai filter.</td></tr>';
}
async function load(){
 try{
  const result=await API.listNotulenSubmissions();
  uploads=Array.isArray(result.data)?result.data:[];
  references=Array.isArray(result.references)?result.references:[];
  render();
 }catch(e){$('submissionList').innerHTML='<tr><td colspan="7">Gagal memuat data: '+esc(e.message)+'</td></tr>';}
}
form.addEventListener('submit',async event=>{
 event.preventDefault();
 const file=$('file').files[0];
 if(!file||file.size>6*1024*1024){statusEl.textContent='Pilih dokumen maksimal 6 MB.';return;}
 const ext=file.name.split('.').pop().toLowerCase();
 const types={pdf:'application/pdf',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
 if(!types[ext]){statusEl.textContent='Gunakan PDF, DOC, atau DOCX.';return;}
 const btn=$('uploadBtn');btn.disabled=true;statusEl.textContent='Mengunggah…';
 try{
  const fileBase64=await new Promise((resolve,reject)=>{
   const reader=new FileReader();
   reader.onload=()=>resolve(String(reader.result).split(',')[1]);
   reader.onerror=()=>reject(Error('Gagal membaca dokumen.'));
   reader.readAsDataURL(file);
  });
  await API.submitNotulen({topic:$('topic').value,meetingDate:$('meetingDate').value,meetingType:$('meetingType').value,fileName:file.name,mimeType:types[ext],fileBase64});
  form.reset();statusEl.textContent='Notulensi berhasil dikumpulkan.';await load();
 }catch(e){statusEl.textContent='Gagal mengunggah: '+e.message;}finally{btn.disabled=false;}
});
for(const id of ['submissionSearch','submissionYear','submissionType'])$(id).addEventListener(id==='submissionSearch'?'input':'change',render);
$('submissionSort').onclick=()=>{const asc=$('submissionSort').dataset.order!=='asc';$('submissionSort').dataset.order=asc?'asc':'desc';$('submissionSort').textContent=asc?'Tanggal terlama ↑':'Tanggal terbaru ↓';render()};
$('submissionReset').onclick=()=>{$('submissionSearch').value='';$('submissionYear').value='';$('submissionType').value='';$('submissionSort').dataset.order='desc';$('submissionSort').textContent='Tanggal terbaru ↓';render()};
document.addEventListener('layout:ready',load);
})();