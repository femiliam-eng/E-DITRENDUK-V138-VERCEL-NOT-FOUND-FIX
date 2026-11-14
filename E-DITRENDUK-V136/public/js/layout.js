const ED={esc:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),toast:m=>{let t=document.querySelector('.toast');if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t)}t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)},open:id=>document.getElementById(id)?.classList.add('open'),close:id=>document.getElementById(id)?.classList.remove('open'),fmt:d=>{if(!d)return'—';let x=new Date(d+'T00:00:00');return isNaN(x)?d:x.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'})},persist:async(resource,row)=>{if(!window.API)throw Error('Koneksi API tidak tersedia. Perubahan belum disimpan.');if(!row?.id)throw Error('ID data tidak ditemukan. Perubahan belum disimpan.');return API.update(resource,row.id,row)}};
async function partial(url){const r=await fetch(url);if(!r.ok)throw Error(url);return r.text()}
async function initLayout(){if(!document.querySelector('link[href="css/v142-review.css"]')){const reviewCss=document.createElement('link');reviewCss.rel='stylesheet';reviewCss.href='css/v142-review.css';document.head.appendChild(reviewCss);}if(!document.querySelector('link[href="css/revisi-07nov.css"]')){const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='css/revisi-07nov.css';document.head.appendChild(stylesheet);}if(!document.querySelector('link[href="css/profile-v132.css"]')){const css=document.createElement('link');css.rel='stylesheet';css.href='css/profile-v132.css';document.head.appendChild(css);}if(!document.querySelector('link[href="css/revisi-07nov-v136.css"]')){const x=document.createElement('link');x.rel='stylesheet';x.href='css/revisi-07nov-v136.css';document.head.appendChild(x);}if(!document.querySelector('link[href="css/rev14.css"]')){const css14=document.createElement('link');css14.rel='stylesheet';css14.href='css/rev14.css';document.head.appendChild(css14);}if(!document.getElementById('appHeader'))return;let currentUser=null;if(!window.API){console.error('API autentikasi tidak tersedia.');location.replace('login.html');return;}try{const response=await API.me();currentUser=response?.user;if(!currentUser||!currentUser.id||!currentUser.name||!currentUser.role)throw Error('Identitas sesi tidak lengkap');window.ED_CURRENT_USER=currentUser}catch(e){console.error('Sesi tidak dapat diverifikasi:',e.message);location.replace('login.html');return}try{const[h,s]=await Promise.all([partial('partials/header.html'),partial('partials/sidebar.html')]);document.getElementById('appHeader').innerHTML=h;document.getElementById('appSidebar').innerHTML=s}catch(e){console.error('Jalankan melalui Live Server',e);return}if(currentUser){
 const allowed=String(currentUser.role).toLowerCase()==='superadmin'?['beranda','repository','notulen','rakom','monitoring','agenda','fasilitasi','task-deadline','logbook','arsip','pengguna','audit','diagnostics']:(currentUser.permissions||[]);
 document.querySelectorAll('#appSidebar .side-nav a[data-page]').forEach(a=>{if(['audit','diagnostics'].includes(a.dataset.page)){if(String(currentUser.role).toLowerCase()!=='superadmin')a.style.display='none'}else if(!allowed.includes(a.dataset.page)&&!(a.dataset.page==='fasilitasi'&&allowed.includes('agenda')))a.style.display='none'});
 const chip=document.querySelector('#userBtn .user-chip, #userBtn');
 const nameEl=document.querySelector('#userBtn b'), roleEl=document.querySelector('#userBtn small'), avatar=document.querySelector('#userBtn .avatar');
 initProfilePhoto(currentUser);
 const isSuperadmin=String(currentUser.role).toLowerCase()==='superadmin';
 const headerProfile=document.getElementById('profileAccessBtn');
 const workspaceProfile=document.getElementById('workspaceProfileBtn');
 if(headerProfile)headerProfile.hidden=!isSuperadmin;
 if(workspaceProfile){workspaceProfile.hidden=isSuperadmin;workspaceProfile.setAttribute('aria-label',isSuperadmin?'Profil & Akses':'Profil');}

 if(nameEl)nameEl.textContent=currentUser.name;if(roleEl)roleEl.textContent=String(currentUser.role).toLowerCase()==='superadmin'?'Superadmin':currentUser.role;if(avatar&&!avatar.classList.contains('has-profile-photo'))avatar.textContent=currentUser.name.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
 if(['audit','diagnostics'].includes(document.body.dataset.page)){if(String(currentUser.role).toLowerCase()!=='superadmin'){location.href='index.html';return;}}else if(!allowed.includes(document.body.dataset.page)&&!(document.body.dataset.page==='fasilitasi'&&allowed.includes('agenda'))){location.href='index.html';return;}
}document.querySelector(`#appSidebar .side-nav a[data-page="${document.body.dataset.page}"]`)?.classList.add('active');document.getElementById('menuToggle')?.addEventListener('click',()=>document.getElementById('appSidebar').classList.toggle('open'));document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>ED.open(b.dataset.open));document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>ED.close(b.closest('.modal-overlay').id));document.querySelectorAll('.modal-overlay').forEach(m=>m.onclick=e=>{if(e.target===m)ED.close(m.id)});if(currentUser?.mustChangePassword){openPasswordModal(true);return;}try{const boot=await API.bootstrap();if(!boot||!boot.data)throw Error('Data bootstrap tidak lengkap');Object.assign(window.EXCEL_DATA||{},boot.data)}catch(e){console.error('Data workspace gagal dimuat:',e.message);document.getElementById('appHeader').insertAdjacentHTML('afterend','<div role="alert" style="padding:14px;background:#fff3cd;color:#78350f">Data workspace tidak dapat dimuat. Periksa koneksi server lalu muat ulang halaman.</div>');return}initHeader();if(currentUser?.mustChangePassword)setTimeout(()=>openPasswordModal(true),150);if(document.getElementById('workspaceWelcomeName')&&currentUser)document.getElementById('workspaceWelcomeName').textContent=currentUser.name;const greetingEl=document.getElementById('workspaceGreeting');if(greetingEl){const hour=new Date().getHours();greetingEl.textContent=hour<11?'Pagi':hour<15?'Siang':hour<18?'Sore':'Malam';}document.dispatchEvent(new Event('layout:ready'));startIdentityRefresh()}

// Poll the authenticated PostgreSQL account rather than caching the unit indefinitely.
// A change made by an administrator becomes visible without another login.
function startIdentityRefresh(){
 let busy=false;
 async function refresh(){
  if(busy||document.hidden)return;
  busy=true;
  try{
   const response=await API.me();
   const updated=response?.user;
   if(!updated?.id||updated.id!==window.ED_CURRENT_USER?.id)return;
   const old=window.ED_CURRENT_USER;
   window.ED_CURRENT_USER=updated;
   const team=document.getElementById('myTeam');
   if(team)team.textContent=updated.unit||'Tim belum ditetapkan pada akun';
   const name=document.querySelector('#userBtn b');
   if(name)name.textContent=updated.name||'';
   const role=document.querySelector('#userBtn small');
   if(role)role.textContent=updated.role||'';
   if(old.unit!==updated.unit||old.name!==updated.name||old.role!==updated.role){
    document.dispatchEvent(new CustomEvent('account:updated',{detail:{user:updated}}));
   }
   if(old.role!==updated.role||JSON.stringify(old.permissions)!==JSON.stringify(updated.permissions)){
    // Permissions are enforced server-side; reload navigation to reflect changes.
    location.reload();
   }
  }catch(e){if(e?.status===401||e?.statusCode===401)location.replace('login.html');}
  finally{busy=false;}
 }
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
 setInterval(refresh,20000);
}

function initHeader(){const data=window.EXCEL_DATA||{};let ns=[];let notificationBusy=false;let notificationFailed=false;const pop=document.getElementById('notifPopover'),list=document.getElementById('notifList'),count=document.getElementById('notifCount');
 if(!pop||!list||!count)return;
 const readKey='ed_notif_read_'+String(window.ED_CURRENT_USER?.id||'guest');
 function readIds(){try{return new Set(JSON.parse(localStorage.getItem(readKey)||'[]'))}catch{return new Set()}}
 function markRead(ids){const seen=readIds();ids.forEach(id=>seen.add(String(id)));try{localStorage.setItem(readKey,JSON.stringify([...seen].slice(-500)))}catch(e){console.warn('Status baca notifikasi tidak dapat disimpan',e.message)}}
 function reminderDate(value){const v=String(value||'').trim();const match=v.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);const date=match?new Date(+match[3],+match[2]-1,+match[1]):new Date(v);return Number.isNaN(date.getTime())?v:date.toLocaleDateString('id-ID')}
 function render(){const u=ns.filter(x=>!x.read).length;count.textContent=u;count.style.display=u?'block':'none';list.innerHTML=ns.length?ns.map(n=>`<button class="notif-item ${n.read?'read':''}" data-id="${ED.esc(String(n.id))}" data-href="${ED.esc(n.href)}"><b>${ED.esc(n.title)}</b><span>${ED.esc(n.detail)}</span></button>`).join(''):'<div class="empty">Belum ada notifikasi.</div>'}
 async function refreshNotifications(){
  if(notificationBusy)return;
  notificationBusy=true;
  try{
   const isAdmin=String(window.ED_CURRENT_USER?.role).toLowerCase()==='superadmin';
   const requests=[fetch('/api/reminders',{credentials:'same-origin',cache:'no-store'})];
   if(isAdmin)requests.push(fetch('/api/password-reset-requests',{credentials:'same-origin',cache:'no-store'}));
   const responses=await Promise.all(requests);if(!responses[0].ok)throw new Error('HTTP '+responses[0].status+' pada pengingat');const reminders=(await responses[0].json()).data||[];
   const resets=isAdmin&&responses[1]?.ok?(await responses[1].json()).data||[]:[];
   const items=reminders.filter(x=>x&&x.id&&x.tanggal&&!/^done$/i.test(String(x.status||''))).map(x=>({id:'reminder:'+x.jenis+':'+x.id+':'+x.tanggal,title:x.jenis+' mendekati tenggat',detail:String(x.judul||'Kegiatan')+' — '+reminderDate(x.tanggal),href:x.jenis==='Task Deadline'?'task-deadline.html':'jadwal.html'}));
   for(const x of resets.filter(x=>x.status==='Menunggu'))items.push({id:'reset:'+x.id,title:'Permintaan reset kata sandi',detail:`${x.name} (@${x.username}) meminta reset kata sandi`,href:'pengguna.html'});
   const seen=readIds();ns=items.map(x=>({...x,read:seen.has(String(x.id))}));notificationFailed=false;render();
  }catch(e){console.warn('Notifikasi belum dapat dimuat',e.message);notificationFailed=true;render();list.insertAdjacentHTML('afterbegin','<div class="empty" role="status">Sinkronisasi notifikasi tertunda. Daftar mungkin belum terbaru.</div>');}
  finally{notificationBusy=false;}
 }
 render();refreshNotifications();document.addEventListener('reset-requests-updated',refreshNotifications);document.addEventListener('workspace-data-updated',refreshNotifications);window.addEventListener('storage',e=>{if(e.key==='ed_workspace_updated')refreshNotifications();if(e.key===readKey){const seen=readIds();ns=ns.map(x=>({...x,read:seen.has(String(x.id))}));render()}});document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshNotifications()});setInterval(()=>{if(!document.hidden)refreshNotifications()},15000);
document.getElementById('notifBtn').onclick=e=>{e.stopPropagation();pop.classList.toggle('show');if(pop.classList.contains('show'))refreshNotifications();document.getElementById('userPop').classList.remove('show')};list.onclick=e=>{let b=e.target.closest('.notif-item');if(!b)return;markRead([b.dataset.id]);ns=ns.map(n=>String(n.id)===b.dataset.id?{...n,read:true}:n);location.href=b.dataset.href};document.getElementById('readAll').onclick=e=>{e.stopPropagation();markRead(ns.map(n=>n.id));ns=ns.map(n=>({...n,read:true}));render()};document.getElementById('userBtn').onclick=e=>{e.stopPropagation();document.getElementById('userPop').classList.toggle('show');pop.classList.remove('show')};document.getElementById('profileAccessBtn').onclick=e=>{e.stopPropagation();openProfileAccessDialog()};document.getElementById('workspaceProfileBtn')?.addEventListener('click',()=>openProfileAccessDialog());document.getElementById('logoutBtn').onclick=async()=>{try{if(window.API)await API.logout()}catch(e){}location.href='login.html'};document.addEventListener('click',()=>{pop.classList.remove('show');document.getElementById('userPop').classList.remove('show')});const search=document.getElementById('globalSearch'),res=document.getElementById('searchResults');const idx=[['Beranda','Ringkasan pekerjaan','index.html'],['Repository','Dokumen rapat','repository.html'],['Pengumpulan Notulensi','Hasil rapat','notulen.html'],['RAKOM','Arahan dan disposisi','rakom.html'],['Monitoring','Kelengkapan kegiatan','monitoring.html'],['Agenda Kegiatan','Agenda resmi','jadwal.html'],['Jenis Fasilitasi','Fasilitasi kegiatan','fasilitasi.html'],['Task Deadline','Tugas dan tenggat','task-deadline.html'],['Logbook','Output WFH pegawai','logbook.html'],['Arsip','Daftar isi berkas','arsip.html'],['Pengguna','Pegawai DITRENDUK','pengguna.html'],['Audit Log','Riwayat aktivitas sistem','audit.html'],['Diagnostik','Kesehatan aplikasi dan database','diagnostics.html']];search.oninput=()=>{let q=search.value.toLowerCase().trim();let allowed=String(window.ED_CURRENT_USER?.role).toLowerCase()==='superadmin'?null:(window.ED_CURRENT_USER?.permissions||[]);const pages={'index.html':'beranda','repository.html':'repository','notulen.html':'notulen','rakom.html':'rakom','monitoring.html':'monitoring','jadwal.html':'agenda','fasilitasi.html':'fasilitasi','task-deadline.html':'task-deadline','logbook.html':'logbook','arsip.html':'arsip','pengguna.html':'pengguna','audit.html':'audit','diagnostics.html':'diagnostics'};let hits=idx.filter(x=>x.join(' ').toLowerCase().includes(q)&&(!allowed||(allowed.includes(pages[x[2]])||(pages[x[2]]==='fasilitasi'&&allowed.includes('agenda')))));res.innerHTML=q?(hits.map(x=>`<a href="${x[2]}"><b>${x[0]}</b><span>${x[1]}</span></a>`).join('')||'<div class="empty">Tidak ditemukan</div>'):'';res.classList.toggle('show',!!q)};document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();search.focus()}});document.getElementById('helpBtn').onclick=showWorkspaceHelp}

function openPasswordModal(force=false){
 let modal=document.getElementById('passwordModal');
 if(!modal){
  modal=document.createElement('div');modal.id='passwordModal';modal.className='modal-overlay';
  modal.innerHTML=`<div class="modal"><div class="modal-head"><div><h3>Ubah kata sandi</h3><p>${force?'Akun ini wajib mengganti kata sandi sementara sebelum melanjutkan.':'Gunakan kata sandi yang kuat dan tidak digunakan di layanan lain.'}</p></div>${force?'':'<button type="button" data-pass-close>×</button>'}</div><div class="modal-body"><label>Kata sandi saat ini</label><input id="currentPassword" class="field" type="password" autocomplete="current-password"><label>Kata sandi baru</label><input id="newPassword" class="field" type="password" autocomplete="new-password"><small>Minimal 10 karakter, mengandung huruf besar, huruf kecil, dan angka.</small><label>Ulangi kata sandi baru</label><input id="confirmPassword" class="field" type="password" autocomplete="new-password"></div><div class="modal-foot">${force?'':'<button class="btn btn-outline" type="button" data-pass-close>Batal</button>'}<button class="btn btn-navy" id="savePassword" type="button">Simpan kata sandi</button></div></div>`;
  document.body.appendChild(modal);
  modal.querySelectorAll('#currentPassword,#newPassword,#confirmPassword').forEach(input=>{
   const wrap=document.createElement('div');wrap.className='ed-pass-wrap';
   input.parentNode.insertBefore(wrap,input);wrap.appendChild(input);
   const toggle=document.createElement('button');toggle.type='button';toggle.className='ed-password-toggle';toggle.setAttribute('aria-label','Lihat kata sandi');toggle.setAttribute('aria-pressed','false');
   toggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
   toggle.addEventListener('click',()=>{const show=input.type==='password';input.type=show?'text':'password';toggle.setAttribute('aria-pressed',String(show));toggle.setAttribute('aria-label',show?'Sembunyikan kata sandi':'Lihat kata sandi');});
   wrap.appendChild(toggle);
  });
 }
 modal.classList.add('open');
 modal.querySelectorAll('[data-pass-close]').forEach(b=>b.onclick=()=>modal.classList.remove('open'));
 document.getElementById('savePassword').onclick=async()=>{const saveButton=document.getElementById('savePassword');if(saveButton.disabled)return;const current=document.getElementById('currentPassword').value,next=document.getElementById('newPassword').value,confirm=document.getElementById('confirmPassword').value;if(next!==confirm)return ED.toast('Konfirmasi kata sandi tidak sama.');saveButton.disabled=true;try{await API.changePassword(current,next);modal.classList.remove('open');if(window.ED_CURRENT_USER)window.ED_CURRENT_USER.mustChangePassword=false;ED.toast('Kata sandi berhasil diubah.');if(force){location.reload();return;}}catch(e){ED.toast(e.message)}finally{saveButton.disabled=false}};
}
document.addEventListener('DOMContentLoaded',initLayout);

function showWorkspaceHelp(){
 let modal=document.getElementById('workspaceHelpModal');
 if(!modal){modal=document.createElement('div');modal.id='workspaceHelpModal';modal.className='modal-overlay help-overlay';document.body.appendChild(modal);
 const sections=[
 ['Beranda','Ringkasan kegiatan, tugas, kelengkapan dokumen, dan logbook. Angka berasal dari data workspace yang dimuat dari server.'],
 ['Repository','Cari rapat, buka detail, periksa status, lalu buka dokumen sumber jika tautan dokumennya tersedia.'],
 ['Pengumpulan Notulensi','Isi judul dan tanggal rapat, pilih PDF/DOC/DOCX maksimal 6 MB, kemudian klik Kumpulkan notulensi. Cari unggahan melalui kotak pencarian hasil.'],
 ['RAKOM','Pantau arahan direktur, PIC, tenggat, status, progres, dan bukti dukung. Status Done berarti 100%.'],
 ['Monitoring','Periksa kegiatan dan checklist dokumen; ubah verifikasi tim keuangan dan direktur sesuai hasil pemeriksaan.'],
 ['Agenda Kegiatan','Cari atau tambah agenda, isi tanggal, tempat, waktu, dan hasil kegiatan; gunakan Lampiran untuk dokumen pendukung.'],
 ['Task Deadline','Lihat tugas dan tenggat; filter Semua, Done, atau Not yet, urutkan tanggal, dan perbarui rincian tugas.'],
 ['Jenis Fasilitasi','Pilih jenis fasilitasi dan metode Offline, Online, atau Hybrid; isi narasumber, tanggal, kegiatan, serta unggah bukti dukung PNG/JPG/PDF. Gunakan filter jenis dan metode untuk mencari kegiatan.'],
 ['Pengingat dan notifikasi','Buka ikon lonceng untuk melihat agenda dan tenggat mendekat. Klik pemberitahuan untuk menuju halaman terkait. Pilih Tandai semua dibaca jika sudah ditinjau.'],
 ['Logbook','Cari aktivitas pegawai, periksa status dan bukti kegiatan, serta perbarui detail logbook.'],
 ['Arsip','Cari arsip, periksa kelengkapan, keamanan, akses, dan nasib akhir arsip.'],
 ['Pengguna dan profil','Superadmin mengelola pengguna dan unit kerja. Gunakan menu profil untuk pengaturan akun yang tersedia.'],
 ['Pencarian dan keamanan','Pencarian global (Ctrl+K) mencari halaman. Simpan perubahan melalui tombol Simpan; akses menu mengikuti hak pengguna.']];
 modal.innerHTML='<div class="modal"><div class="modal-head"><div><h3>Panduan Penggunaan E-DITRENDUK</h3><p>Menu, fungsi, cara mengisi, dan alur kerja aplikasi.</p></div><button class="btn btn-outline" id="closeWorkspaceHelp" type="button">Tutup</button></div><div class="modal-body">'+sections.map(([a,b])=>'<section class="help-section"><h4>'+ED.esc(a)+'</h4><p>'+ED.esc(b)+'</p></section>').join('')+'</div></div>';
 modal.querySelector('#closeWorkspaceHelp').onclick=()=>modal.classList.remove('open');modal.onclick=e=>{if(e.target===modal)modal.classList.remove('open')};
 }modal.classList.add('open');
}

function setProfilePhotoTarget(target, version){
 if(!target)return;
 const url='/api/profile/photo?time='+encodeURIComponent(version);
 const photo=document.createElement('img');photo.className='profile-photo-avatar';photo.alt='Foto profil';photo.decoding='async';
 photo.onload=()=>{if(target.dataset.photoRequest!==String(version))return;target.replaceChildren(photo);target.classList.add('has-profile-photo')};
 photo.onerror=()=>{if(target.dataset.photoRequest===String(version)){target.classList.remove('has-profile-photo');const image=target.querySelector('img');if(image)image.remove();}};
 target.dataset.photoRequest=String(version);
 photo.src=url;
}
function refreshAllProfilePhotos(){
 const version=Date.now();
 const header=document.querySelector('#userBtn .avatar');
 if(header)setProfilePhotoTarget(header,version);
 const card=document.getElementById('edProfileAvatar');
 if(card)setProfilePhotoTarget(card,version);
}
function initProfilePhoto(user){window.refreshCurrentProfilePhoto=refreshAllProfilePhotos;refreshAllProfilePhotos();}
async function prepareCircularProfileImage(file){
 const objectUrl=URL.createObjectURL(file);
 try{
  const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Foto tidak terbaca'));img.src=objectUrl});
  const canvas=document.createElement('canvas');canvas.width=192;canvas.height=192;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Browser tidak mendukung pemrosesan foto.');
  const side=Math.min(image.naturalWidth,image.naturalHeight);const left=(image.naturalWidth-side)/2;const top=Math.max(0,Math.min(image.naturalHeight-side,(image.naturalHeight-side)*0.76));
  ctx.clearRect(0,0,256,256);ctx.beginPath();ctx.arc(96,96,96,0,Math.PI*2);ctx.clip();
  ctx.fillStyle='#fff';ctx.fillRect(0,0,192,192);ctx.drawImage(image,left,top,side,side,0,0,192,192);
  const data=canvas.toDataURL('image/png').split(',')[1];
  if(data.length*0.75>250000)throw Error('Foto hasil potong melebihi 250 KB. Coba gambar dengan ukuran lebih kecil.');
  return data;
 }finally{URL.revokeObjectURL(objectUrl)}
}
function openProfilePhotoDialog(refresh){
 let modal=document.getElementById('profilePhotoModal');
 if(!modal){modal=document.createElement('div');modal.id='profilePhotoModal';modal.className='modal-overlay';modal.innerHTML='<div class="modal"><div class="modal-head"><h3>Foto Profil</h3><button type="button" data-close-photo>×</button></div><div class="modal-body"><p>Pilih foto PNG, JPG, atau WEBP. Foto akan dipotong menjadi lingkaran secara otomatis.</p><div class="ed-photo-preview" id="edPhotoPreview">Pratinjau foto</div><input id="profilePhotoFile" type="file" accept="image/png,image/jpeg,image/webp"><p id="profilePhotoMessage" role="status"></p></div><div class="modal-foot"><button type="button" class="btn btn-outline" id="deleteProfilePhoto">Hapus foto</button><button type="button" class="btn btn-navy" id="saveProfilePhoto">Simpan foto</button></div></div>';document.body.appendChild(modal)}
 modal.classList.add('open');modal.querySelector('[data-close-photo]').onclick=()=>modal.classList.remove('open');
 const message=modal.querySelector('#profilePhotoMessage');
 const savePhoto=modal.querySelector('#saveProfilePhoto'),deletePhoto=modal.querySelector('#deleteProfilePhoto');
 modal.querySelector('#profilePhotoFile').onchange=e=>{const f=e.target.files?.[0];const preview=modal.querySelector('#edPhotoPreview');preview.replaceChildren();if(!f)return;const image=document.createElement('img');const url=URL.createObjectURL(f);image.src=url;image.alt='Pratinjau foto profil berbentuk bulat';image.onload=()=>URL.revokeObjectURL(url);preview.append(image)};
 savePhoto.onclick=async()=>{
  if(savePhoto.disabled)return;
  const file=modal.querySelector('#profilePhotoFile').files[0];
  if(!file){message.textContent='Pilih foto dahulu.';return;}
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)){message.textContent='Format foto harus PNG, JPG, atau WEBP.';return;}
  if(file.size===0||file.size>8*1024*1024){message.textContent='Ukuran foto harus lebih dari 0 dan maksimal 8 MB sebelum dipotong.';return;}
  savePhoto.disabled=true;deletePhoto.disabled=true;message.textContent='Mengunggah foto…';
  try{
   const base64=await prepareCircularProfileImage(file);
   await API.saveProfilePhoto('image/png',base64);refresh();modal.classList.remove('open');ED.toast('Foto profil berhasil disimpan.');
  }catch(e){message.textContent='Gagal menyimpan foto: '+e.message}
  finally{savePhoto.disabled=false;deletePhoto.disabled=false;}
 };
 deletePhoto.onclick=async()=>{
  if(deletePhoto.disabled)return;
  deletePhoto.disabled=true;savePhoto.disabled=true;message.textContent='Menghapus foto…';
  try{await API.removeProfilePhoto();for(const item of [document.querySelector('#userBtn .avatar'),document.getElementById('edProfileAvatar')]){if(item){item.dataset.photoRequest='deleted';item.classList.remove('has-profile-photo');item.textContent=String(window.ED_CURRENT_USER?.name||'?').split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase();}}modal.classList.remove('open');ED.toast('Foto profil dihapus.');}
  catch(e){message.textContent='Gagal menghapus foto: '+e.message}
  finally{deletePhoto.disabled=false;savePhoto.disabled=false;}
 };
}

function openProfileAccessDialog(){
 let modal=document.getElementById('profileAccessModal');
 if(!modal){
  modal=document.createElement('div');modal.id='profileAccessModal';modal.className='modal-overlay';
  modal.innerHTML='<div class="modal" role="dialog" aria-modal="true" aria-labelledby="myProfileHeading" style="max-width:760px"><div class="modal-head"><h3 id="myProfileHeading">Profil Saya</h3><button type="button" id="closeProfileAccess" aria-label="Tutup profil">×</button></div><div class="modal-body"><div class="ed-profile-cover"><div id="edProfileAvatar" class="ed-profile-avatar" aria-hidden="true"></div><div><h3 id="edProfileName"></h3><p id="edProfileRole"></p></div></div><div class="ed-profile-details"><div><small>Username</small><strong id="edProfileUsername"></strong></div><div><small>Unit kerja</small><strong id="edProfileUnit"></strong></div><div><small>Email</small><strong id="edProfileEmail"></strong></div></div><form id="edProfileForm"><label for="edProfileEditName">Nama tampilan</label><div class="ed-profile-edit"><input id="edProfileEditName" minlength="2" maxlength="120" required><button class="btn btn-navy" type="submit">Simpan nama</button></div></form><p role="status" id="edProfileMsg"></p><div class="ed-profile-actions"><button type="button" class="btn btn-outline" id="profilePasswordAction">Ubah Kata Sandi</button><button type="button" class="btn btn-outline" id="profilePhotoAction">Ubah Foto Profil</button></div></div></div>';
  document.body.appendChild(modal);
  modal.querySelector('#closeProfileAccess').onclick=()=>modal.classList.remove('open');
  modal.querySelector('#profilePasswordAction').onclick=()=>{modal.classList.remove('open');openPasswordModal()};
  modal.querySelector('#profilePhotoAction').onclick=()=>{modal.classList.remove('open');openProfilePhotoDialog(window.refreshCurrentProfilePhoto||(()=>location.reload()))};
  modal.onclick=e=>{if(e.target===modal)modal.classList.remove('open')};
  modal.querySelector('#edProfileForm').onsubmit=async e=>{
   e.preventDefault();const btn=modal.querySelector('[type="submit"]'),msg=modal.querySelector('#edProfileMsg');btn.disabled=true;
   try{const result=await API.updateMyProfile(modal.querySelector('#edProfileEditName').value);window.ED_CURRENT_USER=result.user;msg.textContent='Nama profil berhasil diperbarui.';modal.querySelector('#edProfileName').textContent=result.user.name;document.querySelector('#userBtn b').textContent=result.user.name;}
   catch(err){msg.textContent='Gagal memperbarui profil: '+err.message;}finally{btn.disabled=false;}
  };
 }
 const user=window.ED_CURRENT_USER||{};
 const put=(id,value)=>{modal.querySelector('#'+id).textContent=String(value||'—')};
 put('edProfileName',user.name);put('edProfileRole',user.role);put('edProfileUsername',user.username);put('edProfileUnit',user.unit);put('edProfileEmail',user.email);
 modal.querySelector('#edProfileEditName').value=user.name||'';
 modal.querySelector('#edProfileAvatar').textContent=String(user.name||'?').split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase();
 refreshAllProfilePhotos();
 modal.querySelector('#edProfileMsg').textContent='';
 document.getElementById('userPop')?.classList.remove('show');modal.classList.add('open');
}

// Konfirmasi konsisten dengan modal aplikasi; tidak memakai dialog bawaan browser.
ED.confirmAction=function(message, title='Konfirmasi tindakan'){
 return new Promise(resolve=>{
  let overlay=document.getElementById('edConfirmOverlay');
  if(!overlay){overlay=document.createElement('div');overlay.id='edConfirmOverlay';overlay.className='modal-overlay';document.body.appendChild(overlay)}
  overlay.innerHTML='<div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="edConfirmTitle"><div class="modal-head"><h3 id="edConfirmTitle">'+ED.esc(title)+'</h3></div><div class="modal-body"><p>'+ED.esc(message)+'</p></div><div class="modal-foot"><button type="button" class="btn btn-outline" id="edCancel">Batal</button><button type="button" class="btn btn-navy" id="edProceed">Ya, lanjutkan</button></div></div>';
  overlay.classList.add('open');
  const finish=value=>{overlay.classList.remove('open');overlay.innerHTML='';document.removeEventListener('keydown',onKey);resolve(value)};
  const onKey=e=>{if(e.key==='Escape')finish(false)};
  document.addEventListener('keydown',onKey);
  overlay.querySelector('#edCancel').onclick=()=>finish(false);
  overlay.querySelector('#edProceed').onclick=()=>finish(true);
  overlay.querySelector('#edCancel').focus();
 });
};
