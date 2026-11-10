# E-DITRENDUK V133 - Impor Excel lengkap, tidak menghapus/menimpa baris lama.
# Jalankan dari folder project: .\IMPORT-SUPABASE-FREE.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$secureUrl = Read-Host 'Tempel connection string PostgreSQL Supabase dari Dashboard > Connect (input disembunyikan)' -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureUrl)
try {
  $env:DATABASE_URL = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
} finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
try {
  $uri = [uri]$env:DATABASE_URL
  if ($uri.Scheme -notin @('postgres','postgresql')) { throw 'Harus connection string PostgreSQL.' }
  if (($uri.Host -notlike '*.supabase.co') -and ($uri.Host -notlike '*.pooler.supabase.com')) { throw 'Alamat tidak terlihat sebagai server Supabase. Impor dibatalkan.' }
  $ref='hgefzuctqokmlaruugjh'
  if (($uri.Host -notlike "*$ref*") -and ($uri.UserInfo -notlike "*${ref}*")) { throw 'Connection string bukan proyek e-ditrenduk yang dituju. Impor dibatalkan.' }
  Write-Host 'Memeriksa koneksi PostgreSQL Supabase...'
  npm run postgres-check
  if ($LASTEXITCODE -ne 0) { throw 'Koneksi database gagal; tidak ada data yang diimpor.' }
  Write-Host 'Memeriksa data yang akan diimpor (dry-run)...'
  npm run import-excel-v132
  if ($LASTEXITCODE -ne 0) { throw 'Dry-run gagal; tidak ada data yang diimpor.' }
  Write-Host 'Target: 7089 baris sumber (35 sheet), 422 Agenda, 53 Task.'
  $confirmation = Read-Host 'Ketik IMPOR-7089 untuk menyimpan data ke Supabase'
  if ($confirmation -cne 'IMPOR-7089') { throw 'Dibatalkan tanpa perubahan.' }
  $env:CONFIRM_EXCEL_IMPORT = 'YES'
  npm run import-excel-v132 -- --apply --publish-modules
  if ($LASTEXITCODE -ne 0) { throw 'Impor gagal. Transaksi akan di-rollback oleh importer.' }
  @'
const {Pool}=require('pg');(async()=>{const p=new Pool({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:20000});try{const r=await p.query('SELECT (SELECT count(*)::integer FROM ed_source_excel_rows) source_rows,(SELECT count(*)::integer FROM agenda_kegiatan) agenda_rows,(SELECT count(*)::integer FROM task_deadline) task_rows');console.log('JUMLAH DATA SUPABASE:',JSON.stringify(r.rows[0]));}finally{await p.end()}})().catch(e=>{console.error('Verifikasi gagal:',e.message);process.exitCode=1})
'@ | node
  if ($LASTEXITCODE -ne 0) { throw 'Data sudah diimpor tetapi verifikasi gagal. Periksa database.' }
  Write-Host 'Selesai. Periksa hasil jumlah data di atas.'
} finally {
  Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:CONFIRM_EXCEL_IMPORT -ErrorAction SilentlyContinue
  Remove-Variable secureUrl -ErrorAction SilentlyContinue
}
