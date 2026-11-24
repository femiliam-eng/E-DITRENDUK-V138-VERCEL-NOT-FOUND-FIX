/* E-DITRENDUK V6 enhancements: dashboard server stats + CSV export. */
(function(){
  async function downloadExport(resource){
    try{
      const base=window.API?.base||'';
      const r=await fetch(`${base}/api/export/${resource}`,{credentials:'include'});
      if(!r.ok){const b=await r.json().catch(()=>({}));throw new Error(b.message||`HTTP ${r.status}`)}
      const blob=await r.blob(), a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      const cd=r.headers.get('content-disposition')||'';
      a.download=(cd.match(/filename="?([^";]+)"?/i)||[])[1]||`E-DITRENDUK-${resource}.csv`;
      document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(a.href);
      window.ED?.toast('Data CSV berhasil diekspor.');
    }catch(e){window.ED?.toast('Ekspor gagal: '+e.message)}
  }
  function addExportButton(){
    const map={monitoring:'monitoring',logbook:'logbook',arsip:'archive'}, resource=map[document.body.dataset.page];
    if(!resource)return;
    const head=document.querySelector('.page-head'); if(!head||document.getElementById('exportCsvBtn'))return;
    const b=document.createElement('button');b.id='exportCsvBtn';b.className='btn btn-outline';b.textContent='Ekspor CSV';b.onclick=()=>downloadExport(resource);head.appendChild(b);
  }
  async function dashboard(){
    if(document.body.dataset.page!=='beranda'||!window.API)return;
    try{
      const r=await fetch(`${API.base}/api/dashboard`,{credentials:'include'}), body=await r.json(); if(!r.ok)throw new Error(body.message);
      const x=body.data;if(!x||typeof x!=='object')throw new Error('Statistik dashboard tidak lengkap');
      const ids={}; // KPI REV14 dihitung oleh dashboard personal/role-aware.
      Object.entries(ids).forEach(([id,v])=>{const el=document.getElementById(id);if(el&&Number.isFinite(Number(v)))el.textContent=Number(v)});
      // Progres mingguan dihitung dari Task Deadline oleh pageIndex().
      // Jangan timpa dengan persentase keseluruhan dari endpoint dashboard.
      const hello=document.querySelector('.hero h2');// Sapaan dikelola layout.js: tanpa emoji dan menggunakan nama akun.
    }catch(e){console.warn('Dashboard server stats:',e.message)}
  }
  document.addEventListener('layout:ready',()=>{addExportButton();dashboard();document.addEventListener('workspace-data-updated',dashboard);window.addEventListener('storage',e=>{if(e.key==='ed_workspace_updated')dashboard()});document.addEventListener('visibilitychange',()=>{if(!document.hidden)dashboard()})});
})();
