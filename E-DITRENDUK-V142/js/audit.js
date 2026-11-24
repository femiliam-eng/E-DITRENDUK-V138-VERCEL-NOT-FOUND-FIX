let auditPage=1,auditPages=1,auditTimer;
const ae=s=>ED.esc(s??'—');
async function loadAudit(){
 const q=new URLSearchParams({page:auditPage,limit:25});
 const search=document.getElementById('auditSearch').value.trim(),action=document.getElementById('auditAction').value,resource=document.getElementById('auditResource').value;
 if(search)q.set('q',search);if(action)q.set('action',action);if(resource)q.set('resource',resource);
 try{
  const r=await API.audit(q.toString());auditPages=r.pagination.pages||1;
  document.getElementById('auditMeta').textContent=`${r.pagination.total} aktivitas tercatat`;
  document.getElementById('auditPage').textContent=`${r.pagination.page} / ${auditPages}`;
  document.getElementById('auditPrev').disabled=auditPage<=1;document.getElementById('auditNext').disabled=auditPage>=auditPages;
  document.getElementById('auditBody').innerHTML=r.data.length?r.data.map(x=>`<tr><td>${ae(new Date(x.created_at+'Z').toLocaleString('id-ID'))}</td><td><b>${ae(x.account_name||'Sistem')}</b><br><small>${ae(x.username||'')}</small></td><td><span class="status-pill">${ae(x.action)}</span></td><td>${ae(x.resource)}</td><td>${ae(x.resource_id)}</td><td>${ae(x.detail)}</td></tr>`).join(''):'<tr><td colspan="6" class="empty">Belum ada aktivitas yang cocok.</td></tr>';
 }catch(e){ED.toast(e.message)}
}
document.addEventListener('layout:ready',()=>{
 loadAudit();
 ['auditAction','auditResource'].forEach(id=>document.getElementById(id).onchange=()=>{auditPage=1;loadAudit()});
 document.getElementById('auditSearch').oninput=()=>{clearTimeout(auditTimer);auditTimer=setTimeout(()=>{auditPage=1;loadAudit()},300)};
 document.getElementById('refreshAudit').onclick=loadAudit;
 document.getElementById('auditPrev').onclick=()=>{if(auditPage>1){auditPage--;loadAudit()}};
 document.getElementById('auditNext').onclick=()=>{if(auditPage<auditPages){auditPage++;loadAudit()}};
});
