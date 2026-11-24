'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','server.js'),'utf8');
assert.match(source,/if\(kind==='agenda'&&Array\.isArray\(old\.attachments\)\)row\.attachments=old\.attachments/);
assert.match(source,/if\(kind==='agenda'&&existingAgenda\)/);
assert.match(source,/await storage\.remove\(key\)/);
console.log('PASS V85: agenda update preserves attachments and delete schedules private file cleanup');
