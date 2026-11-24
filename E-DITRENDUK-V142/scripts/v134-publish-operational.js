'use strict';
// Republish operational datasets from the preserved 35 Excel sheets in Supabase.
// Idempotent: no deletes, updates, or overwrite of existing records.
const {Pool}=require('pg');
const SQL = [
`INSERT INTO monitoring(id,payload)
 SELECT 'xlsx_mon_'||substr(md5(source_hash||sheet||row_number::text),1,24),
 jsonb_build_object('id','xlsx_mon_'||substr(md5(source_hash||sheet||row_number::text),1,24),
 'nama',cells->>'C','tanggal',CASE WHEN trim(coalesce(cells->>'B','')) ~ '^[0-9]+(\\.0)?$' THEN to_char(date '1899-12-30'+(cells->>'B')::numeric::integer,'YYYY-MM-DD') ELSE coalesce(cells->>'B','') END,
 'tim',coalesce(cells->>'D',''),'kategori',coalesce(cells->>'E',''),'ro',coalesce(cells->>'F',''),'sub',coalesce(cells->>'G',''),
 'docs',jsonb_build_array((cells->>'H')='1',(cells->>'I')='1',(cells->>'J')='1',(cells->>'K')='1',(cells->>'L')='1',(cells->>'M')='1',(cells->>'N')='1',(cells->>'O')='1',(cells->>'P')='1',(cells->>'Q')='1',(cells->>'R')='1',(cells->>'S')='1'),
 'keuangan',coalesce(cells->>'T',''),'validasiDirektur',coalesce(cells->>'U',''),'verifikasi',coalesce(cells->>'T','Belum diverifikasi'),'bukti',coalesce(cells->>'V',''),'sourceSheet',sheet,'sourceRow',row_number)
 FROM ed_source_excel_rows WHERE sheet='Monitoring Kegiatan' AND row_number>=20 AND nullif(trim(cells->>'C'),'') IS NOT NULL ON CONFLICT(id) DO NOTHING`,
`INSERT INTO archive(id,payload)
 SELECT 'xlsx_arc_'||substr(md5(source_hash||sheet||row_number::text),1,24),
 jsonb_build_object('id','xlsx_arc_'||substr(md5(source_hash||sheet||row_number::text),1,24),'nomor',coalesce(cells->>'A',''),'kode',coalesce(cells->>'B',''),'item',CASE WHEN sheet='Daftar Isi Berkas 2026' THEN coalesce(cells->>'C','') ELSE '' END,
 'uraian',CASE WHEN sheet='Daftar Isi Berkas 2026' THEN cells->>'D' ELSE cells->>'C' END,
 'tanggal',CASE WHEN sheet='Daftar Isi Berkas 2026' AND trim(coalesce(cells->>'E','')) ~ '^[0-9]+(\\.0)?$' THEN to_char(date '1899-12-30'+(cells->>'E')::numeric::integer,'YYYY-MM-DD') ELSE coalesce(cells->>'D','') END,
 'jumlah',CASE WHEN sheet='Daftar Isi Berkas 2026' THEN coalesce(cells->>'F','') ELSE coalesce(cells->>'E','') END,
 'ket',CASE WHEN sheet='Daftar Isi Berkas 2026' THEN coalesce(cells->>'G','') ELSE coalesce(cells->>'F','') END,
 'keamanan',coalesce(cells->>'H',''),'akses',coalesce(cells->>'I',''),'nasib',coalesce(cells->>'J',''),'aktif',coalesce(cells->>'K',''),'inaktif',coalesce(cells->>'L',''),'media',coalesce(cells->>'M',''),'sourceSheet',sheet,'sourceRow',row_number)
 FROM ed_source_excel_rows
 WHERE (sheet='Daftar Berkas Arsip 2026' AND row_number>=8 AND nullif(trim(cells->>'C'),'') IS NOT NULL)
 OR (sheet='Daftar Isi Berkas 2026' AND row_number>=9 AND nullif(trim(cells->>'D'),'') IS NOT NULL)
 ON CONFLICT(id) DO NOTHING`,
`INSERT INTO logbook(id,payload)
 WITH source_rows AS (
 SELECT r.source_hash,r.sheet,r.row_number,r.cells,x.k AS col,x.v AS activity,h.cells->>x.k AS period,
 CASE WHEN right(x.k,1)='Z' THEN chr(ascii(left(x.k,1))+1)||'A' ELSE left(x.k,length(x.k)-1)||chr(ascii(right(x.k,1))+1) END AS proof_col
 FROM ed_source_excel_rows r JOIN ed_source_excel_rows h ON h.sheet='Output WFH 2026' AND h.row_number=5
 CROSS JOIN LATERAL jsonb_each_text(r.cells) x(k,v)
 WHERE r.sheet='Output WFH 2026' AND r.row_number>=6 AND nullif(trim(r.cells->>'B'),'') IS NOT NULL
 AND coalesce(h.cells->>x.k,'') ~* '(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)'
 AND length(trim(x.v))>=8 AND x.v NOT LIKE 'http%'
 ) SELECT 'xlsx_wfh_'||substr(md5(source_hash||sheet||row_number::text||col),1,24),
 jsonb_build_object('id','xlsx_wfh_'||substr(md5(source_hash||sheet||row_number::text||col),1,24),
 'pegawai',cells->>'B','periode',period,'tanggal',period,'aktivitas',activity,'status','Tercatat','bukti',coalesce(cells->>proof_col,''),
 'catatan','Sumber: Output WFH 2026','sourceSheet',sheet,'sourceRow',row_number,'sourceColumn',col) FROM source_rows ON CONFLICT(id) DO NOTHING`,
`INSERT INTO disposisi(id,payload)
 SELECT 'xlsx_disp_'||substr(md5(source_hash||sheet||row_number::text),1,24),
 jsonb_build_object('id','xlsx_disp_'||substr(md5(source_hash||sheet||row_number::text),1,24),
 'perihal',coalesce(cells->>'G',''),'tugas',coalesce(cells->>'I',''),
 'arahan',coalesce(nullif(trim(cells->>'J'),''),nullif(trim(cells->>'I'),''),cells->>'G'),
 'tim',coalesce(nullif(trim(cells->>'L'),''),'Belum ditetapkan'),'pic',coalesce(cells->>'K',''),'asal',coalesce(cells->>'F',''),
 'nomor',coalesce(cells->>'D',''),'tanggal',coalesce(cells->>'C',''),
 'deadline',coalesce(nullif(cells->>'O',''),nullif(cells->>'N',''),''),
 'status',coalesce(nullif(trim(cells->>'R'),''),'Belum mulai'),
 'progress',CASE WHEN lower(trim(coalesce(cells->>'R','')))='done' THEN 100 ELSE 0 END,
 'bukti',coalesce(cells->>'U',''),'sourceSheet',sheet,'sourceRow',row_number)
 FROM ed_source_excel_rows WHERE sheet='Disposisi Tahun 2026' AND row_number>=24 AND nullif(trim(cells->>'G'),'') IS NOT NULL
 ON CONFLICT(id) DO NOTHING`,
`INSERT INTO fasilitasi(id,payload)
 SELECT 'xlsx_fas_'||substr(md5(source_hash||sheet||row_number::text),1,24),
 jsonb_build_object('id','xlsx_fas_'||substr(md5(source_hash||sheet||row_number::text),1,24),
 'judul',cells->>'F','tanggal',CASE WHEN trim(coalesce(cells->>'B','')) ~ '^[0-9]+(\\.0)?$' THEN to_char(date '1899-12-30'+(cells->>'B')::numeric::integer,'YYYY-MM-DD') ELSE coalesce(cells->>'B','') END,
 'metode','Belum tercatat','jenis',CASE WHEN cells->>'F' ~* 'narasumber' THEN 'Narasumber' WHEN cells->>'F' ~* '(data|perhitungan|proyeksi)' THEN 'Fasilitasi Data' ELSE 'Belum diklasifikasikan' END,
 'narasumber',coalesce(cells->>'J',''),'bukti',coalesce(cells->>'T',''),
 'catatan',concat('Asal surat: ',coalesce(cells->>'E',''),'. Nomor: ',coalesce(cells->>'C',''),'. Arahan: ',coalesce(cells->>'I','')),
 'sourceSheet',sheet,'sourceRow',row_number)
 FROM ed_source_excel_rows WHERE sheet='Surat Pelayanan Fasilitasi' AND row_number>=22 AND nullif(trim(cells->>'F'),'') IS NOT NULL ON CONFLICT(id) DO NOTHING`
];
const COUNTS=`SELECT (SELECT count(*) FROM ed_source_excel_rows) AS source_rows,(SELECT count(DISTINCT(workbook,sheet)) FROM ed_source_excel_rows) AS sheets,
(SELECT count(*) FROM accounts) AS accounts,(SELECT count(*) FROM agenda_kegiatan) AS agenda,(SELECT count(*) FROM task_deadline) AS task,
(SELECT count(*) FROM monitoring) AS monitoring,(SELECT count(*) FROM logbook) AS logbook,(SELECT count(*) FROM archive) AS archive,
(SELECT count(*) FROM disposisi) AS disposisi,(SELECT count(*) FROM fasilitasi) AS fasilitasi`;
async function main(){
 const url=process.env.DATABASE_URL;if(!url)throw Error('DATABASE_URL belum diatur (jangan tempel password dalam chat).');
 const pool=new Pool({connectionString:url,connectionTimeoutMillis:15000});
 const client=await pool.connect();
 try{
  const before=(await client.query(COUNTS)).rows[0];
  if(!process.argv.includes('--apply')){console.log(JSON.stringify({mode:'DRY_RUN',before,sourcePreserved:true,operations:SQL.length},null,2));return;}
  if(process.env.CONFIRM_OPERATIONAL_PUBLISH!=='YES')throw Error('Set CONFIRM_OPERATIONAL_PUBLISH=YES hanya setelah memastikan target dan backup.');
  if(Number(before.source_rows)!==7089 || Number(before.sheets)!==35)throw Error('Data sumber belum lengkap: butuh 7089 baris dan 35 sheet.');
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock($1)',[1342026]);
  const inserted=[];for(const sql of SQL){const result=await client.query(sql);inserted.push(result.rowCount)}
  await client.query('COMMIT');
  const after=(await client.query(COUNTS)).rows[0];
  console.log(JSON.stringify({ok:true,inserted,after},null,2));
 }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}
 finally{client.release();await pool.end()}
}
if(require.main===module)main().catch(e=>{console.error('GAGAL:',e.message);process.exitCode=1});
module.exports={SQL,COUNTS};
