const fs=require('node:fs');const assert=require('node:assert/strict');const read=x=>fs.readFileSync(require('node:path').join(__dirname,'..',x),'utf8');
const dashboard=read('js/pages/index.js'),layout=read('js/layout.js'),agenda=read('js/pages/agenda-task.js'),app=read('js/app.js'),fac=read('js/fasilitasi.js');
for(const [label,ok] of [
 ['dashboard event refresh',dashboard.includes("document.addEventListener('workspace-data-updated',refreshDashboard)")],
 ['dashboard cross-tab refresh',dashboard.includes("event.key==='ed_workspace_updated'")],
 ['header cross-tab refresh',layout.includes("e.key==='ed_workspace_updated'")],
 ['reminder Indonesian date parsing',layout.includes('function reminderDate(value)')],
 ['agenda/task required title',agenda.includes("Tugas wajib diisi.")&&agenda.includes('Nama kegiatan wajib diisi.')],
 ['agenda/task required date',agenda.includes('Tanggal wajib diisi dengan tanggal kalender yang valid.')],
 ['repository date validation',app.includes('Tanggal rapat wajib diisi dengan tanggal yang valid.')],
 ['repository change event',app.includes("ED.toast('Status tersimpan di PostgreSQL.')")&&app.includes("localStorage.setItem('ed_workspace_updated'")],
 ['fasilitasi required fields',fac.includes('Judul, tanggal, jenis, dan metode wajib diisi.')],
 ['fasilitasi update broadcast',fac.includes('const broadcast=')],
 ['task status options',agenda.includes("['Semua','Done','Not yet']")],
 ['fasilitasi attachment MIME validation',fac.includes("application/pdf")&&fac.includes('image/png')],
]){assert.ok(ok,label);console.log('OK',label)}
