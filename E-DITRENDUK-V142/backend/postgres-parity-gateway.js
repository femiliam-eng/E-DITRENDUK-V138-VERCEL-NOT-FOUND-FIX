'use strict';
const RESOURCES=Object.freeze(['monitoring','logbook','archive','users_data','disposisi','petugas','schedules']);
async function compareCounts(pgGateway, sqliteCount) {
  if (!pgGateway || typeof pgGateway.count!=='function' || typeof sqliteCount!=='function') throw new TypeError('Gateway dan penghitung SQLite wajib tersedia');
  const rows=[];
  for(const resource of RESOURCES) {
    const sqlite=Number(sqliteCount(resource));
    if(!Number.isSafeInteger(sqlite)||sqlite<0) throw new Error('Jumlah SQLite tidak valid: '+resource);
    const postgres=await pgGateway.count(resource);
    rows.push({resource,sqlite,postgres,match:sqlite===postgres,difference:postgres-sqlite});
  }
  return {match:rows.every(row=>row.match),resources:rows,checkedAt:new Date().toISOString()};
}
module.exports={RESOURCES,compareCounts};
