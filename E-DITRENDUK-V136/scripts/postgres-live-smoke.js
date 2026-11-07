'use strict';
// PostgreSQL integration smoke test. All writes occur in a transaction that is rolled back.
const {spawnSync} = require('node:child_process');
const crypto = require('node:crypto');
const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL wajib diatur (jangan simpan kredensial di repository).'); process.exit(2); }
const id = 'v31-smoke-' + crypto.randomUUID();
const sql = `\n\\set ON_ERROR_STOP on\nBEGIN;\nDO $$ BEGIN\n  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema=current_schema() AND table_name='monitoring') THEN\n    RAISE EXCEPTION 'Tabel monitoring belum tersedia. Jalankan postgres-apply.';\n  END IF;\nEND $$;\nINSERT INTO monitoring (id,payload) VALUES ('${id}', '{"v31_smoke":true}'::jsonb);\nDO $$ BEGIN\n IF NOT EXISTS (SELECT 1 FROM monitoring WHERE id='${id}' AND payload->>'v31_smoke'='true') THEN\n   RAISE EXCEPTION 'PostgreSQL read-after-write gagal';\n END IF;\nEND $$;\nUPDATE monitoring SET payload='{"v31_smoke":"updated"}'::jsonb WHERE id='${id}';\nDO $$ BEGIN\n IF NOT EXISTS (SELECT 1 FROM monitoring WHERE id='${id}' AND payload->>'v31_smoke'='updated') THEN\n   RAISE EXCEPTION 'PostgreSQL update gagal';\n END IF;\nEND $$;\nDELETE FROM monitoring WHERE id='${id}';\nDO $$ BEGIN\n IF EXISTS (SELECT 1 FROM monitoring WHERE id='${id}') THEN\n   RAISE EXCEPTION 'PostgreSQL delete gagal';\n END IF;\nEND $$;\nROLLBACK;\nSELECT 'V31 PostgreSQL live CRUD smoke LULUS' AS result;\n`;
const r = spawnSync('psql', [url, '-X', '-v', 'ON_ERROR_STOP=1', '-At'], {input:sql,encoding:'utf8',timeout:30000,maxBuffer:1024*1024});
if(r.error){console.error(r.error.code==='ENOENT'?'psql tidak tersedia di PATH.':r.error.message);process.exit(1)}
if(r.status!==0){console.error(r.stderr || 'PostgreSQL live smoke gagal');process.exit(1)}
console.log(r.stdout.trim());
