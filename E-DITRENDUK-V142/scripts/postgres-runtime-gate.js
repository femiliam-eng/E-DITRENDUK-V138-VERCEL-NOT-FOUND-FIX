'use strict';
// Connect to the real PostgreSQL server used by the application and fail closed.
const REQUIRED = ['accounts','auth_sessions','audit_logs','notulen_submissions','monitoring','logbook','archive','users_data','disposisi','petugas','schedules','password_reset_requests'];
async function inspect(pool) {
  const connection = await pool.query('SELECT current_database() AS db, current_user AS db_user, current_setting(\'server_version\') AS version');
  const rows = await pool.query('SELECT table_name FROM information_schema.tables WHERE table_schema=current_schema() AND table_name = ANY($1::text[])',[REQUIRED]);
  const found = new Set(rows.rows.map(x=>x.table_name));
  const missing = REQUIRED.filter(x=>!found.has(x));
  const counts = {};
  for (const table of REQUIRED) {
    if (!found.has(table)) continue;
    // Identifiers come only from the fixed whitelist above.
    const result = await pool.query(`SELECT count(*)::int AS n FROM "${table}"`);
    counts[table] = Number(result.rows[0].n);
  }
  const permissions = await pool.query("SELECT has_schema_privilege(current_user,current_schema(),'USAGE') AS schema_usage, has_table_privilege(current_user,'accounts','SELECT') AS account_read").catch(()=>({rows:[{schema_usage:false,account_read:false}]}));
  return {database:connection.rows[0].db,version:connection.rows[0].version,missing,counts,permissions:permissions.rows[0],ok:missing.length===0&&permissions.rows[0].schema_usage&&permissions.rows[0].account_read};
}
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL belum disetel');
  const { Pool } = require('pg');
  const pool = new Pool({connectionString:process.env.DATABASE_URL,password:process.env.PGPASSWORD||undefined,connectionTimeoutMillis:5000,max:1});
  try {
    const result = await inspect(pool);
    console.log('PostgreSQL runtime gate:', JSON.stringify(result,null,2));
    if (!result.ok) process.exitCode=1;
  } finally {await pool.end();}
}
if (require.main===module) main().catch(e=>{console.error('PostgreSQL runtime gate FAILED:',e.message);process.exitCode=1;});
module.exports={inspect,REQUIRED};
