/* Forced first-login password activation. No workspace modules or bootstrap data are loaded. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const form=$('activationForm'),message=$('activationMessage'),button=$('activationSave'),account=$('activationAccount');
let currentUser=null,busy=false;
const setMessage=(value,error=false)=>{message.textContent=value;message.classList.toggle('is-error',error)};
for(const toggle of document.querySelectorAll('[data-eye]')){
 const input=$(toggle.dataset.eye);if(!input)continue;
 toggle.addEventListener('click',()=>{
  const reveal=input.type==='password';
  input.type=reveal?'text':'password';
  toggle.setAttribute('aria-pressed',String(reveal));
  const description=input.id==='currentPassword'?'kata sandi saat ini':input.id==='newPassword'?'kata sandi baru':'konfirmasi kata sandi';
  toggle.setAttribute('aria-label',(reveal?'Sembunyikan ':'Tampilkan ')+description);
  toggle.classList.toggle('is-visible',reveal);
 });
}
async function verifySession(){
 try{
  const result=await API.me();currentUser=result?.user;
  if(!currentUser?.id)throw Error('Sesi tidak tersedia.');
  if(!currentUser.mustChangePassword){location.replace('index.html');return}
  account.textContent='Akun: '+currentUser.name+' (@'+currentUser.username+')';
  form.hidden=false;
 }catch{
  account.textContent='Silakan login untuk mengaktifkan akun.';
  form.hidden=true;
  location.replace('login.html');
 }
}
form.addEventListener('submit',async event=>{
 event.preventDefault();if(busy||!currentUser)return;
 const old=$('currentPassword').value,newValue=$('newPassword').value,again=$('confirmPassword').value;
 if(!old||!newValue||!again)return setMessage('Lengkapi semua kolom terlebih dahulu.',true);
 if(newValue!==again)return setMessage('Konfirmasi kata sandi baru tidak cocok.',true);
 if(newValue===old)return setMessage('Kata sandi baru harus berbeda dari yang sementara.',true);
 if(newValue.length<10||!/[A-Z]/.test(newValue)||!/[a-z]/.test(newValue)||!/[0-9]/.test(newValue))
  return setMessage('Minimal 10 karakter, dengan huruf besar, huruf kecil, dan angka.',true);
 busy=true;button.disabled=true;button.textContent='Menyimpan…';setMessage('Mengamankan akun…');
 let changed=false;
 try{
  await API.changePassword(old,newValue);changed=true;
  // The server revokes previous sessions on password rotation. Authenticate the new password
  // to establish a fresh session before opening any workspace feature.
  const login=await API.login(currentUser.username,newValue);
  if(!login?.user?.id)throw Error('Sesi baru belum aktif.');
  const check=await API.me();
  if(!check?.user?.id||check.user.mustChangePassword)throw Error('Status aktivasi akun belum terverifikasi.');
  $('currentPassword').value='';$('newPassword').value='';$('confirmPassword').value='';
  setMessage('Kata sandi berhasil diganti. Membuka workspace…');
  location.replace('index.html');
 }catch(error){
  if(changed){
   setMessage('Kata sandi sudah berhasil diganti, tetapi sesi baru belum tersedia. Silakan login ulang menggunakan kata sandi baru.',true);
   button.textContent='Login dengan kata sandi baru';
   button.type='button';button.onclick=()=>location.replace('login.html');
  }else setMessage(error?.message||'Gagal mengganti kata sandi.',true);
 }finally{
  busy=false;button.disabled=false;if(!changed)button.textContent='Simpan kata sandi & masuk';
 }
});
$('activationLogout').addEventListener('click',async()=>{
 try{await API.logout()}catch{}finally{location.replace('login.html')}
});
verifySession();
})();