'use strict';
const assert=require('node:assert/strict');
const {assess}=require('./hosting-preflight');
const env={NODE_ENV:'production',APP_ORIGIN:'https://editrenduk.instansi.go.id',SESSION_SECRET:'x'.repeat(64),DATABASE_URL:'postgresql://user:secret@db.instansi.go.id:5432/db',NOTULEN_STORAGE_PROVIDER:'supabase',SUPABASE_URL:'https://realproject.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'private-value',SUPABASE_STORAGE_BUCKET:'notulen-private',AGENDA_STORAGE_BUCKET:'agenda-private'};
const result=assess(env);assert.equal(result.ready,true);assert(!JSON.stringify(result).includes('secret@'));assert(!JSON.stringify(result).includes('private-value'));
assert.equal(assess({...env,APP_ORIGIN:'http://localhost:3000'}).ready,false);
assert.equal(assess({...env,DATABASE_URL:'postgresql://localhost:5432/db'}).ready,false);
console.log('PASS hosting preflight config, rejects localhost, never reveals credentials');
