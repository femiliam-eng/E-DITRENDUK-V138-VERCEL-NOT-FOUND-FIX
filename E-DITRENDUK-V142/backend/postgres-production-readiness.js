'use strict';
// PostgreSQL-only production readiness. Check every table used by the application,
// not just the shared rate limiter. Does not read or disclose business data.
const REQUIRED_TABLES=Object.freeze([
 'accounts','auth_sessions','password_reset_requests','ed_profile_photos',
 'monitoring','logbook','archive','users_data','disposisi','petugas','schedules',
 'fasilitasi','agenda_kegiatan','task_deadline','notulen_submissions',
 'audit_logs','storage_files','ed_request_limits'
]);
// V122: Critical columns must exist, not only their parent tables.
// Keep this list tied to the PostgreSQL-only runtime and shipped SQL migrations.
const REQUIRED_COLUMNS=Object.freeze([
 'accounts.id','accounts.username','accounts.password_hash','accounts.role','accounts.unit','accounts.permissions','accounts.must_change_password',
 'auth_sessions.token_hash','auth_sessions.account_id','auth_sessions.expires_at','auth_sessions.revoked_at',
 'password_reset_requests.account_id','password_reset_requests.status',
 'ed_profile_photos.account_id','ed_profile_photos.mime','ed_profile_photos.content',
 'ed_request_limits.scope_key','ed_request_limits.bucket','ed_request_limits.count','ed_request_limits.expires_at',
 'monitoring.payload','logbook.payload','archive.payload','users_data.payload','disposisi.payload','petugas.payload','schedules.payload','fasilitasi.payload',
 'agenda_kegiatan.payload','task_deadline.payload',
 'notulen_submissions.stored_path','notulen_submissions.uploaded_by','notulen_submissions.mime_type',
 'audit_logs.account_id','storage_files.stored_path'
]);
function isPlaceholder(value){
 const v=String(value||'').trim();
 return !v || /(?:REPLACE|CHANGE[_ -]?ME|YOUR[_ -]|<[^>]+>|example|dummy|placeholder|password123)/i.test(v);
}
function validHttpsService(value){
 try{
  const u=new URL(value);
  return u.protocol==='https:' && !!u.hostname && !u.username && !u.password && !u.search && !u.hash && !isPlaceholder(u.hostname) && !u.hostname.endsWith('.invalid') && !/^(localhost|127\.0\.0\.1)$/i.test(u.hostname);
 }catch{return false;}
}
function validateProductionEnvironment(env){
 const errors=[];
 if(env.NODE_ENV!=='production')return errors;
 const origin=env.APP_ORIGIN;
 if(!validHttpsService(origin) || new URL(origin).pathname!=='/')errors.push('APP_ORIGIN harus URL HTTPS resmi, bukan contoh atau localhost.');
 let database;
 try{database=new URL(env.DATABASE_URL||'');}catch{}
 if(!database||!['postgres:','postgresql:'].includes(database.protocol)||!database.hostname||!database.username||isPlaceholder(database.hostname)||isPlaceholder(decodeURIComponent(database.password||''))||database.hostname.endsWith('.invalid')||/^(localhost|127\.0\.0\.1)$/i.test(database.hostname))errors.push('DATABASE_URL harus PostgreSQL online dengan kredensial asli, bukan nilai contoh.');
 if(env.NOTULEN_STORAGE_PROVIDER!=='supabase'||!validHttpsService(env.SUPABASE_URL)||isPlaceholder(env.SUPABASE_SERVICE_ROLE_KEY)||isPlaceholder(env.SUPABASE_STORAGE_BUCKET)||isPlaceholder(env.AGENDA_STORAGE_BUCKET))errors.push('Konfigurasi Supabase Storage privat wajib memakai nilai asli, bukan placeholder.');
 return errors;
}

async function checkPostgresReadiness(pool){
 if(!pool||typeof pool.query!=='function')throw new TypeError('PostgreSQL pool wajib.');
 // Single read-only query checks tables and critical columns in the same search_path.
 // Missing columns are reported as table.column, preserving the legacy `missing` output.
 const sql=`WITH missing_tables AS (
   SELECT name FROM unnest($1::text[]) AS t(name) WHERE to_regclass(t.name) IS NULL
 ), missing_columns AS (
   SELECT c.name FROM unnest($2::text[]) AS c(name)
   WHERE NOT EXISTS (
     SELECT 1 FROM pg_attribute a
     WHERE a.attrelid=to_regclass(split_part(c.name,'.',1))
       AND a.attname=split_part(c.name,'.',2)
       AND a.attnum>0 AND NOT a.attisdropped
   )
 ) SELECT name FROM missing_tables UNION SELECT name FROM missing_columns ORDER BY name`;
 const result=await pool.query(sql,[REQUIRED_TABLES,REQUIRED_COLUMNS]);
 const missing=(result.rows||[]).map(row=>row.name);
 return {ok:missing.length===0,missing};
}
module.exports={REQUIRED_TABLES,REQUIRED_COLUMNS,validateProductionEnvironment,checkPostgresReadiness};
