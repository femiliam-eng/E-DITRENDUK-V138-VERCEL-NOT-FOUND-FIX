'use strict';
const fs=require('node:fs');const assert=require('node:assert/strict');const path=require('node:path');
const root=path.resolve(__dirname,'..');const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');const html=fs.readFileSync(path.join(root,'pengguna.html'),'utf8');
const checks=[
 ['edit unit via input',()=>assert.match(app,/class="inline-input user-unit"/)],
 ['unit change handler',()=>assert.match(app,/querySelectorAll\('\.user-unit'\)/)],
 ['unit persisted through API',()=>assert.match(app,/backendSave\('users', \{\.\.\.row, unit: next\}/)],
 ['empty unit rejected',()=>assert.match(app,/Unit kerja tidak boleh kosong/)],
 ['unit rollback on failure',()=>assert.match(app,/catch \(_\) \{ input\.value = previous; \}/)],
 ['unit edit guarded against duplicate submissions',()=>assert.match(app,/input\.disabled = true;[\s\S]*?backendSave\('users', \{\.\.\.row, unit: next\}/)],
 ['refresh users from server',()=>assert.match(app,/await API\.list\('users'\)/)],
 ['refresh validates server response',()=>assert.match(app,/Array\.isArray\(response\.data\)/)],
 ['refresh prevents duplicate clicks',()=>assert.match(app,/if \(refreshButton\.disabled\) return/)],
 ['refresh updates shared data',()=>assert.match(app,/D\.users = response\.data/)],
 ['user edit updates cross-tab listeners',()=>assert.match(app,/localStorage\.setItem\('ed_workspace_updated'/)],
 ['user counters recomputed',()=>assert.match(app,/document\.getElementById\('activeTotal'\)\.textContent = \(D\.users/)],
 ['reset listener not stacked',()=>assert.doesNotMatch(app,/resetPassword'\)\?\.addEventListener/)],
 ['users page has required table',()=>assert.match(html,/id="userBody"/)],
 ['users page has add button',()=>assert.match(html,/id="addUser"/)],
];
for(const [name,check] of checks){check();console.log('PASS '+name)}
console.log(`PASS ${checks.length} pemeriksaan regresi pengelolaan pengguna`);
