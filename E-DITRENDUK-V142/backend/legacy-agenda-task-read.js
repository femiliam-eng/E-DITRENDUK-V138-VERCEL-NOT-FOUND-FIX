'use strict';
const TABLES=new Set(['agenda_kegiatan','task_deadline']);
function legacyAgendaTaskRows(db,table){
  if(!TABLES.has(table)) throw new RangeError('Tabel tidak diizinkan');
  return db.prepare(`SELECT payload FROM ${table} ORDER BY id`).all().map(x=>JSON.parse(x.payload));
}
module.exports={legacyAgendaTaskRows};
