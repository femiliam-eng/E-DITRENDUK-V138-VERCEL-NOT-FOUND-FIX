'use strict';
// Readiness is intentionally distinct from liveness. A hybrid deployment is
// ready only when *both* databases respond successfully.
async function checkDatabaseReadiness({sqlite, postgresPool, usesPostgres=false}) {
  if (!sqlite || typeof sqlite.prepare !== 'function') throw new TypeError('SQLite connection required while hybrid runtime exists');
  const row = sqlite.prepare('PRAGMA quick_check').get();
  if (!row || row.quick_check !== 'ok') return {ok:false, database:usesPostgres?'hybrid-sqlite-postgresql':'sqlite'};
  if (usesPostgres) {
    if (!postgresPool || typeof postgresPool.query !== 'function') throw new TypeError('PostgreSQL pool required');
    await postgresPool.query('SELECT 1');
  }
  return {ok:true,database:usesPostgres?'hybrid-sqlite-postgresql':'sqlite'};
}
module.exports={checkDatabaseReadiness};
