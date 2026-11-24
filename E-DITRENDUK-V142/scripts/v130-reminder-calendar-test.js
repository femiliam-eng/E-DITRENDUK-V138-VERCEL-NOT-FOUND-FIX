#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const {parseReminderDay,upcomingReminderDay,handle}=require('../backend/postgres-unified-handler');
async function run(){
 const yes=[['2028-02-29','2028-02-29'],['29/02/2028','2028-02-29'],['1-3-2026','2026-03-01'],['05.11.2026','2026-11-05']];
 for(const [input,day] of yes)assert.equal(parseReminderDay(input)?.iso,day,input);
 for(const text of ['2026-02-29','31/04/2026','2026-13-01','2026-11-31','2026-1-1','Nov 05 2026','11/05/26','',null,'2026-11-05T00:00:00Z'])assert.equal(parseReminderDay(text),null,String(text));
 const now=Date.parse('2026-11-04T18:00:00Z'); // 1 AM Nov 5 in Jakarta
 assert.equal(upcomingReminderDay('05/11/2026',now),'2026-11-05');
 assert.equal(upcomingReminderDay('12/11/2026',now),'2026-11-12');
 assert.equal(upcomingReminderDay('13/11/2026',now),null);
 assert.equal(upcomingReminderDay('04/11/2026',now),null);
 // Real HTTP-handler behavior with in-memory mock repository, without production access.
 const originalNow=Date.now;
 const rows={agenda_kegiatan:[{id:'a',tanggal:'05/11/2026',kegiatan:'Rapat',status:'Not yet'},{id:'b',tanggal:'31/11/2026',kegiatan:'Bad date'},{id:'c',tanggal:'06/11/2026',kegiatan:'Done',status:'Done'}],task_deadline:[{id:'t',deadline:'12/11/2026',tugas:'Review',status:'Not yet'},{id:'u',deadline:'13/11/2026',tugas:'Far',status:'Not yet'}]};
 const result={};
 try{Date.now=()=>now;
  await handle({req:{method:'GET'},res:{},url:new URL('http://localhost/api/reminders'),user:{id:'u',role:'Superadmin',status:'Aktif'},repo:{list:async table=>(rows[table]||[]).map(payload=>({payload}))},pool:{},readJson:async()=>({}),json:(_res,code,body)=>Object.assign(result,{code,...body})});
 }finally{Date.now=originalNow;}
 assert.equal(result.code,200);
 assert.deepEqual(result.data.map(x=>x.id),['a','t']);
 assert.equal(result.data[0].tanggal,'2026-11-05T00:00:00.000Z');
 console.log('PASS V130: tanggal ketat, WIB, tahun kabisat, jendela 7 hari, status Done, dan endpoint pengingat.');
}
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1});
module.exports={run};
