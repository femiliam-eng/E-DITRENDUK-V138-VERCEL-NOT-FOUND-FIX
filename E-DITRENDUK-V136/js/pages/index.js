/* Beranda: hanya satu sumber tugas, API /api/task-deadline.
   Refresh hanya berjalan saat tab terlihat dan tidak pernah menimpa data dengan nol ketika API gagal. */
document.addEventListener('layout:ready',()=>{
  pageIndex();
  // Task Deadline tersimpan pada tabel terpisah dari RAKOM.
  let taskRequestId=0;
  let taskBusy=false;
  async function refreshTaskDeadlines(){
    if(taskBusy)return;
    taskBusy=true;
    const requestId=++taskRequestId;
    try{const result=await API.list('task-deadline');if(requestId===taskRequestId&&Array.isArray(result?.data)){window.ED_TASK_DEADLINES=result.data;pageIndex();}}
    catch(e){console.warn('Task Deadline belum dapat dimuat:',e.message);const k=document.getElementById('kpiTask');if(k&&!Array.isArray(window.ED_TASK_DEADLINES))k.title='Data Task Deadline belum berhasil dimuat dari server';}
    finally{taskBusy=false;}
  }
  refreshTaskDeadlines();
  let busy=false;
  let lastError='';
  const status=document.createElement('p');
  status.id='dashboardSyncStatus';
  status.setAttribute('role','status');
  status.style.cssText='font-size:12px;color:#64748b;margin:6px 0 12px';
  const team=document.getElementById('myTeam');
  if(team?.parentElement)team.parentElement.appendChild(status);
  async function refreshDashboard(){
    if(busy||document.hidden)return;
    busy=true;
    try{
      const response=await API.bootstrap();
      const data=response?.data;
      if(!data||!Array.isArray(data.monitoring)||!Array.isArray(data.disposisi)||!Array.isArray(data.logbook)){
        throw new Error('Data server tidak lengkap');
      }
      Object.assign(window.EXCEL_DATA,data);
      await refreshTaskDeadlines();
      pageIndex();
      status.textContent='Sumber angka: database E-DITRENDUK. Tugas belum selesai dihitung dari modul Task Deadline.';
      lastError='';
    }catch(error){
      const message=String(error?.message||'Koneksi bermasalah');
      status.textContent='Data belum berhasil diperbarui. Angka terakhir tetap ditampilkan.';
      if(message!==lastError){console.warn('Dashboard refresh:',message);lastError=message;}
    }finally{busy=false;}
  }
  // Jangan polling 15 detik: perubahan hitungan mendadak dapat membingungkan.
  // Segarkan saat kembali ke tab atau saat data berubah.
  const interval=setInterval(()=>{if(!document.hidden)refreshDashboard()},300000);
  document.addEventListener('workspace-data-updated',refreshDashboard);
  window.addEventListener('storage',event=>{if(event.key==='ed_workspace_updated')refreshDashboard()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshDashboard()});
  window.addEventListener('focus',refreshDashboard);
  window.addEventListener('pagehide',()=>clearInterval(interval),{once:true});
});
