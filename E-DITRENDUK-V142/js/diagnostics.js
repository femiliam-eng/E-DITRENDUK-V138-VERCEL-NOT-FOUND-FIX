const de=s=>ED.esc(s??'—');
const mb=n=>`${(Number(n||0)/1024/1024).toFixed(2)} MB`;
async function loadDiagnostics(){
 try{
  const r=await API.diagnostics(),d=r.data,db=d.database,st=d.storage,mem=d.memory;
  document.getElementById('diagOverall').textContent=r.ok?'SEHAT':'PERLU DIPERIKSA';
  document.getElementById('diagTime').textContent=`Pemeriksaan ${new Date(d.time).toLocaleString('id-ID')}`;
  const cards=[['Versi aplikasi',`V${d.version}`],['Database',db.integrity==='ok'?'Integrity OK':db.integrity],['Ukuran database',mb(db.sizeBytes)],['Storage',`${st.registeredFiles} file · ${mb(st.totalBytes)}`],['File hilang',st.missingFiles],['Uptime',`${Math.floor(d.uptimeSeconds/60)} menit`],['Memory RSS',mb(mem.rss)],['Node / Environment',`${d.node} · ${d.environment}`]];
  document.getElementById('diagCards').innerHTML=cards.map(x=>`<div class="form-group"><label>${de(x[0])}</label><div class="field" style="display:flex;align-items:center;background:#f8fafc">${de(x[1])}</div></div>`).join('');
  document.getElementById('diagCounts').innerHTML=Object.entries(db.counts).map(([k,v])=>`<tr><td>${de(k)}</td><td><b>${de(v)}</b></td></tr>`).join('');
  document.getElementById('diagNote').textContent=st.missingFiles?`${st.missingFiles} file terdaftar tidak ditemukan. Jalankan npm run storage-check sebelum deployment.`:'Database dan registry storage tidak melaporkan masalah pada pemeriksaan ini.';
 }catch(e){ED.toast(`${e.message}${e.requestId?' · Request ID: '+e.requestId:''}`)}
}
document.addEventListener('layout:ready',()=>{loadDiagnostics();document.getElementById('refreshDiagnostics').onclick=loadDiagnostics});
