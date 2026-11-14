const fs=require('node:fs');const assert=require('node:assert/strict');const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/app.js'),'utf8');
const fn=source.slice(source.indexOf('function ditrendukDate('),source.indexOf('function ditrendukSortDate('));
const parse=vm.runInNewContext(fn+';ditrendukDate');
const checks=[
 ['valid ISO date',()=>assert.equal(parse('2026-11-04'),Date.UTC(2026,10,4))],
 ['valid Indonesian date',()=>assert.equal(parse('04/11/2026'),Date.UTC(2026,10,4))],
 ['invalid February date',()=>assert.ok(Number.isNaN(parse('31/02/2026')))],
 ['empty date',()=>assert.ok(Number.isNaN(parse('')))],
 ['ambiguous date range not guessed',()=>assert.ok(Number.isNaN(parse('4-5 November 2026')))],
 ['archive quality filter',()=>assert.match(source,/archiveQualityFilter/)],
 ['archive count',()=>assert.match(source,/archiveResultCount/)],
 ['archive reset',()=>assert.match(source,/archiveResetFilter/)],
 ['archive CSV',()=>assert.match(source,/archiveExportCsv/)],
 ['archive CSV formula safety',()=>assert.match(source,/\[=\+@-\]/)],
 ['archive sorting copies source',()=>assert.match(source,/visible=visible\.slice\(\)\.sort/)],
 ['archive missing dates last',()=>assert.match(source,/if\(aok!==bok\)return aok\?-1:1/)],
 ['archive has 12 table cells',()=>{const block=source.slice(source.indexOf('function pageArsip(){'),source.indexOf('/* Backend integration v2'));assert.equal((block.match(/<td>/g)||[]).length,12)}],
 ['archive changes use API',()=>assert.match(source,/backendSave\('archive'/)],
];
for(const [name,check] of checks){check();console.log('PASS',name)}
console.log('PASS',checks.length,'archive quality checks');
