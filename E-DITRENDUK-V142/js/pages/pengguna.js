document.addEventListener('layout:ready', async () => {
        const modules = [
            ['beranda','Beranda'],['repository','Repository'],['notulen','Buat Notulen'],['rakom','RAKOM'],
            ['monitoring','Monitoring'],['agenda','Agenda Kegiatan'],['task-deadline','Task Deadline'],['logbook','Logbook'],['arsip','Arsip'],['pengguna','Pengguna']
        ];
        let rows = [], editing = null, resetId = null, pendingResetRequestId = null;
        const body = document.getElementById('userBody');
        const search = document.getElementById('userSearch');
        const permissionGrid = document.getElementById('permissionGrid');
        permissionGrid.innerHTML = modules.map(([id,label]) => `<label class="permission-item"><input type="checkbox" value="${id}"> <span>${label}</span></label>`).join('');

        const defaults = role => (role==='Superadmin' || role.includes('Admin')) ? modules.map(x=>x[0]) : ['beranda','repository','rakom','monitoring','logbook','arsip'];
        function selectedPermissions(){ return [...permissionGrid.querySelectorAll('input:checked')].map(x=>x.value); }
        function setPermissions(list){ permissionGrid.querySelectorAll('input').forEach(x=>x.checked=(list||[]).includes(x.value)); }
        function updateKpis(){document.getElementById('userTotal').textContent=rows.length;document.getElementById('activeTotal').textContent=rows.filter(x=>x.status==='Aktif').length;document.getElementById('adminTotal').textContent=rows.filter(x=>(x.role==='Superadmin' || x.role.includes('Admin'))).length;}
        function render(){
            const q=search.value.toLowerCase().trim();
            const shown=rows.filter(x=>!q||(x.name+' '+x.username+' '+(x.email||'')).toLowerCase().includes(q));
            body.innerHTML=shown.map(x=>`<tr><td><strong>${ED.esc(x.name)}</strong><small style="display:block;color:#7b8498">@${ED.esc(x.username)}${x.mustChangePassword?' · password perlu diganti':''}</small></td><td>${ED.esc(x.unit||'DITRENDUK')}</td><td><span class="badge">${ED.esc(x.role)}</span></td><td><span class="access-summary">${x.permissions.length===modules.length?'Semua modul':ED.esc(x.permissions.map(p=>modules.find(m=>m[0]===p)?.[1]||p).join(', '))}</span></td><td><span class="status-pill ${x.status==='Aktif'?'ok':'warn'}">${ED.esc(x.status)}</span></td><td><button class="link edit-account" data-id="${x.id}">Edit</button> · <button class="link reset-account" data-id="${x.id}">Atur ulang kata sandi</button></td></tr>`).join('') || '<tr><td colspan="6" class="empty">Tidak ada akun.</td></tr>';
            body.querySelectorAll('.edit-account').forEach(b=>b.onclick=()=>openEdit(b.dataset.id));
            body.querySelectorAll('.reset-account').forEach(b=>b.onclick=()=>openReset(b.dataset.id));
            updateKpis();
        }
        async function load(){try{rows=(await API.accounts()).data;render()}catch(e){ED.toast(e.message)}}
        function openCreate(){editing=null;document.getElementById('userModalTitle').textContent='Tambah pengguna';['uName','uUsername','uEmail'].forEach(id=>document.getElementById(id).value='');document.getElementById('uUnit').value='DITRENDUK';document.getElementById('uRole').value='Pegawai';document.getElementById('uStatus').value='Aktif';document.getElementById('uUsername').disabled=false;document.getElementById('passwordGroup').style.display='';setPermissions(defaults('Pegawai'));ED.open('userModal')}
        function openEdit(id){const x=rows.find(r=>r.id===id);if(!x)return;editing=id;document.getElementById('userModalTitle').textContent='Edit pengguna';document.getElementById('uName').value=x.name;document.getElementById('uUsername').value=x.username;document.getElementById('uUsername').disabled=true;document.getElementById('uEmail').value=x.email||'';document.getElementById('uUnit').value=x.unit||'DITRENDUK';document.getElementById('uRole').value=x.role;document.getElementById('uStatus').value=x.status;document.getElementById('passwordGroup').style.display='none';setPermissions(x.permissions);ED.open('userModal')}
        function openReset(id){const x=rows.find(r=>r.id===id);resetId=id;document.getElementById('resetName').textContent=`Akun: ${x.name} (@${x.username})`;document.getElementById('resetValue').value='';ED.open('resetModal')}
        document.getElementById('uRole').onchange=e=>{if(!editing)setPermissions(defaults(e.target.value))};
        document.getElementById('addUser').onclick=openCreate; search.oninput=render;
        document.getElementById('saveUser').onclick=async()=>{const data={name:document.getElementById('uName').value.trim(),username:document.getElementById('uUsername').value.trim(),email:document.getElementById('uEmail').value.trim(),unit:document.getElementById('uUnit').value.trim(),role:document.getElementById('uRole').value,status:document.getElementById('uStatus').value,permissions:selectedPermissions()};if(!data.name||!data.username)return ED.toast('Nama dan username wajib diisi.');try{if(editing)await API.updateAccount(editing,data);else{data.password=document.getElementById('uPassword').value;await API.createAccount(data)}ED.close('userModal');ED.toast(editing?'Akun diperbarui.':'Akun berhasil dibuat.');await load()}catch(e){ED.toast(e.message)}};
        document.getElementById('confirmReset').onclick=async()=>{try{await API.resetPassword(resetId,document.getElementById('resetValue').value);ED.close('resetModal');ED.toast('Kata sandi berhasil diatur ulang.');await load()}catch(e){ED.toast(e.message)}};
        await load();
    
        async function loadResetRequests(){
            const target=document.getElementById('resetRequestBody'); if(!target)return;
            try{const rr=(await API.passwordResetRequests()).data||[];target.innerHTML=rr.map(r=>`<tr><td><strong>${ED.esc(r.name)}</strong><small style="display:block;color:#7b8498">@${ED.esc(r.username)}</small></td><td>${ED.esc(r.requested_at||'-')}</td><td><span class="status-pill ${r.status==='Menunggu'?'warn':'ok'}">${ED.esc(r.status)}</span></td><td>${r.status==='Menunggu'?`<button class="link resolve-reset-request" data-id="${r.id}">Buat password sementara</button>`:'Selesai'}</td></tr>`).join('')||'<tr><td colspan="4" class="empty">Belum ada permintaan reset.</td></tr>';target.querySelectorAll('.resolve-reset-request').forEach(b=>b.onclick=()=>{
                const r=rr.find(x=>String(x.id)===b.dataset.id);if(!r)return;
                pendingResetRequestId=r.id;
                document.getElementById('requestResetIdentity').textContent=`${r.name} (@${r.username})`;
                document.getElementById('requestResetPassword').value='';
                document.getElementById('requestResetError').textContent='';
                ED.open('requestResetModal');
                document.getElementById('requestResetPassword').focus();
            });}catch(e){target.innerHTML=`<tr><td colspan="4" class="empty">${ED.esc(e.message)}</td></tr>`}
        }
        document.getElementById('confirmRequestReset').onclick=async()=>{
            const password=document.getElementById('requestResetPassword').value;
            const error=document.getElementById('requestResetError');
            if(password.length<10||!/[a-z]/.test(password)||!/[A-Z]/.test(password)||!/[0-9]/.test(password)){
                error.textContent='Minimal 10 karakter, mencakup huruf besar, huruf kecil, dan angka.';return;
            }
            const btn=document.getElementById('confirmRequestReset');btn.disabled=true;
            try{await API.resolvePasswordReset(pendingResetRequestId,password);ED.close('requestResetModal');ED.toast('Password sementara diterbitkan. Sampaikan secara aman kepada pegawai.');await loadResetRequests();await load();document.dispatchEvent(new Event('reset-requests-updated'))}
            catch(e){error.textContent=e.message}finally{btn.disabled=false}
        };
        document.getElementById('refreshResetRequests')?.addEventListener('click',loadResetRequests);
        loadResetRequests();
});
