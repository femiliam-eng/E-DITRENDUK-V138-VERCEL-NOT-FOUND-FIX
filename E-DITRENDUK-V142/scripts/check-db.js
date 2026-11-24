'use strict';
const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');
const f=path.resolve(__dirname,'../backend/data/editrenduk.sqlite');
if(!fs.existsSync(f)){console.error('Database belum ada.');process.exit(1);}
const db=new DatabaseSync(f,{readOnly:true});
try {const result=db.prepare('PRAGMA integrity_check').get().integrity_check;console.log('SQLite integrity_check:',result);if(result!=='ok')process.exitCode=1;}
finally {db.close();}
