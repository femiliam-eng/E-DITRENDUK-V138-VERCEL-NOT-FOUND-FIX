const fs=require('fs'),assert=require('assert');
const src=fs.readFileSync(require('path').join(__dirname,'../js/app.js'),'utf8');
const begin=src.indexOf('function pageMonitoring(){');
const end=src.indexOf('function pageJadwal(){',begin);
assert(begin>=0&&end>begin,'Halaman Monitoring harus tersedia');
const body=src.slice(begin,end);
for(const [label,pattern] of Object.entries({
 'filter kualitas tanggal':'monitorQualityFilter',
 'pencarian kegiatan':'monitorSearch',
 'reset filter':'monitorReset',
 'ekspor CSV':'monitorExport',
 'jumlah hasil':'monitorCount',
 'tanggal invalid di akhir':'Number.isFinite(da)',
 'validasi tanggal':'ditrendukDate(x.tanggal)',
 'keuangan':'monitorFinanceFilter',
 'direktur':'monitorDirectorFilter',
 'pengamanan formula CSV':"t=\"'\"+t",
 'filter ekspor sama dengan tampilan':'filteredMonitoring().map',
 'status tersimpan via API':"API.update('monitoring'"
}))assert(body.includes(pattern),label+' tidak ditemukan');
console.log('Monitoring quality regression: LULUS (12 pemeriksaan).');
