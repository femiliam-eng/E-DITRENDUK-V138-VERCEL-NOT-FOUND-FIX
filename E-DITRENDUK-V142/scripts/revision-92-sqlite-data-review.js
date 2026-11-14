// Read-only inventory. Usage: node scripts/revision-92-sqlite-data-review.js [audit-json-file]
// The audit is intentionally based on the previously verified SQLite inventory,
// and does not pretend to be a live PostgreSQL or Excel parity check.
const fs=require('node:fs');const path=require('node:path');
const file=process.argv[2]||path.join(__dirname,'..','DATA-QUALITY-AUDIT-04NOV.json');
const report=JSON.parse(fs.readFileSync(file,'utf8'));
for(const [name,data] of Object.entries(report.tables||{})){
 console.log(`${name}: ${data.rows} baris; tanggal kosong ${data.empty_date}; tanggal non-ISO ${data.non_iso_date_needs_review}; ID duplikat ${data.duplicate_ids}`);
}
const pending=Object.entries(report.tables||{}).reduce((sum,[,d])=>sum+d.empty_date+d.non_iso_date_needs_review,0);
console.log(`Temuan tanggal yang memerlukan peninjauan: ${pending} (kategori dapat beririsan).`);
console.log('Sumber: laporan audit SQLite tersimpan. Tidak menguji PostgreSQL aktif atau file Excel.');
