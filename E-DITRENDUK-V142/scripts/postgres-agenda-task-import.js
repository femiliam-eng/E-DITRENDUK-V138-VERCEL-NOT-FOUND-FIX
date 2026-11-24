'use strict';
// V66: explicit, verifiable migration from local SQLite to PostgreSQL.
// Default mode is a dry run; never writes without explicit confirmation.
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
const TABLES = ['agenda_kegiatan', 'task_deadline'];
function resolveSource() {
  const source = process.env.SQLITE_SOURCE_PATH || path.resolve(__dirname, '../backend/data/editrenduk.sqlite');
  if (!path.isAbsolute(source)) throw Error('SQLITE_SOURCE_PATH harus path absolut');
  if (!fs.existsSync(source)) throw Error('File SQLite tidak ditemukan: ' + source);
  return source;
}
async function main() {
  if (!process.env.DATABASE_URL) throw Error('DATABASE_URL wajib');
  const source = resolveSource();
  const write = process.argv.includes('--apply');
  if (write && process.env.CONFIRM_AGENDA_TASK_IMPORT !== 'YES') throw Error('Impor dibatalkan. Buat backup kedua database, lalu set CONFIRM_AGENDA_TASK_IMPORT=YES dan gunakan --apply');
  const { Pool } = require('pg');
  const pool = new Pool({connectionString: process.env.DATABASE_URL, password: process.env.PGPASSWORD || undefined});
  const db = new DatabaseSync(source, {readOnly:true});
  let client;
  try {
    client = await pool.connect();
    const batches = [];
    for (const table of TABLES) {
      const exists = await client.query('SELECT to_regclass($1) AS name', [table]);
      if (!exists.rows[0]?.name) throw Error('Tabel PostgreSQL ' + table + ' belum ada. Jalankan npm run postgres-agenda-task-migrate');
      const sourceRows = db.prepare(`SELECT id, payload FROM ${table} ORDER BY id`).all();
      const ids = new Set();
      for (const row of sourceRows) {
        if (ids.has(row.id)) throw Error('ID ganda dalam SQLite: ' + table + '/' + row.id);
        ids.add(row.id);
        const data = JSON.parse(row.payload);
        if (!data || typeof data !== 'object' || Array.isArray(data) || data.id !== row.id) throw Error('Payload tidak valid: ' + table + '/' + row.id);
      }
      const targetCount = Number((await client.query(`SELECT count(*)::integer AS count FROM ${table}`)).rows[0].count);
      batches.push({table, sourceRows, targetCount});
      console.log(`${table}: sumber SQLite=${sourceRows.length}, PostgreSQL saat ini=${targetCount}`);
    }
    if (!write) {console.log('DRY RUN PASS: tidak ada data yang diubah. Untuk impor gunakan --apply setelah backup.'); return;}
    await client.query('BEGIN');
    for (const {table,sourceRows} of batches) {
      let inserted=0;
      for (const row of sourceRows) {
        const result = await client.query(`INSERT INTO ${table}(id,payload) VALUES($1,$2::jsonb) ON CONFLICT(id) DO NOTHING`,[row.id,row.payload]);
        inserted+=result.rowCount;
      }
      const count=Number((await client.query(`SELECT count(*)::integer AS count FROM ${table}`)).rows[0].count);
      if (count < sourceRows.length) throw Error('Verifikasi jumlah gagal untuk ' + table);
      const verified = await client.query(`SELECT id,payload FROM ${table} WHERE id=ANY($1::text[])`,[sourceRows.map(x=>x.id)]);
      const targetIds=new Set(verified.rows.map(x=>x.id));
      if(sourceRows.some(x=>!targetIds.has(x.id)))throw Error('Verifikasi ID gagal untuk '+table);
      console.log(`${table}: ditambahkan=${inserted}, sudah ada=${sourceRows.length-inserted}, total PostgreSQL=${count}, ID sumber terverifikasi=${targetIds.size}`);
    }
    await client.query('COMMIT');
    console.log('PASS: import selesai. Data lama di PostgreSQL tidak ditimpa.');
  } catch (error) {
    if(client) try {await client.query('ROLLBACK')} catch {}
    throw error;
  } finally {
    if(client)client.release();
    db.close();
    await pool.end();
  }
}
if(require.main===module) main().catch(e=>{console.error('FAIL:',e.message);process.exitCode=1});
module.exports={resolveSource,TABLES};
