'use strict';
const assert=require('node:assert/strict');
const {validateMeetingPayload:v}=require('../backend/meeting-validation');
const good={topic:'Rapat koordinasi',sections:[{title:'Pembukaan',notes:[{speaker:'A',body:'Laporan'}]}],participants:['A'],documentation:[{fileName:'foto.jpg',dataUrl:'data:image/jpeg;base64,AA=='}]};
assert.equal(v(good),null);
for (const bad of [null,[],{}, {...good,topic:'  '}, {...good,topic:'x'.repeat(501)}, {...good,sections:[null]}, {...good,sections:[{notes:'not array'}]}, {...good,sections:[{notes:[null]}]}, {...good,sections:[{notes:[{body:123}]}]}, {...good,participants:'x'}, {...good,participants:Array(501).fill('x')}, {...good,documentation:[{dataUrl:123}]}, {...good,documentation:Array(21).fill({dataUrl:'x'})}]) assert.ok(v(bad),JSON.stringify(bad)?.slice(0,100));
console.log('Meeting validation V30: LULUS');
