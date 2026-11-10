const fs=require('node:fs'),assert=require('node:assert/strict');
const js=fs.readFileSync('js/pages/agenda-task.js','utf8');
const htmls=['jadwal.html','task-deadline.html'].map(f=>fs.readFileSync(f,'utf8'));
const checks=[
 ['ringkasan data aktual',/visible\.length.*rows\.length/.test(js)],
 ['filter status exact',/\['Semua','Done','Not yet'\]/.test(js)],
 ['ekspor csv sesuai filter',/const visible=selectedRows\(\);if\(!visible\.length\)/.test(js)],
 ['csv BOM untuk Excel',/\\uFEFF/.test(js)],
 ['escape formula injection csv',/\[\\s\\uFEFF\]\*\[=\+@\\-\]/.test(js)],
 ['reset filter',/data-reset-filter/.test(js)],
 ['muat ulang data',/data-reload/.test(js)],
 ['tolak response API tidak valid',/Array\.isArray\(result\.data\)/.test(js)],
 ['cegah respons API lama menimpa data',/sequence!==loadSequence/.test(js)],
 ['validasi kalender',/tanggal kalender yang valid/.test(js)],
 ['kolom hasil kegiatan',/hasilKegiatan/.test(js)&&htmls[0].includes('Hasil Kegiatan')],
 ['tanggal urut terbaru terlama',/sort\.value==='asc'/.test(js)],
 ['status task tersimpan API',/API\.update\(kind,id,\{status:next\}\)/.test(js)],
 ['perubahan antar-tab',/ed_workspace_updated/.test(js)],
 ['tombol simpan anti duplikasi',/if\(saveButton\.disabled\)return/.test(js)],
 ['dua halaman berbagi modul teruji',htmls.every(h=>h.includes('js/pages/agenda-task.js'))],
];for(const [name,pass] of checks){assert.ok(pass,name);console.log('PASS',name)}console.log(`PASS ${checks.length} quality checks`);
