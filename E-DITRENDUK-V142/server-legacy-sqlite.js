'use strict';

require('./backend/production-runtime-gate').assertProductionRuntime();

const http = require('node:http');
const { originAllowed, csp } = require('./backend/request-security');
const { resolvePublicFile } = require('./backend/static-file-policy');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const { openDatabase } = require('./backend/database');
const { legacyAgendaTaskRows } = require('./backend/legacy-agenda-task-read');
const { checkDatabaseReadiness } = require('./backend/database-readiness');
const { createPayloadRepository } = require('./backend/payload-repository');
const { createPostgresReadGateway } = require('./backend/postgres-read-gateway');
const { createPostgresPayloadRepository } = require('./backend/postgres-payload-repository');
const { createPostgresPasswordResetRepository } = require('./backend/postgres-password-reset-repository');
const pgAgendaTaskHandler = require('./backend/postgres-agenda-task-handler');
const pgUnifiedHandler = require('./backend/postgres-unified-handler');
const pgNotulenHandler = require('./backend/postgres-notulen-handler');
const { createPostgresAccountRepository } = require('./backend/postgres-account-repository');
const pgAdminAccounts = require('./backend/postgres-admin-accounts');
const { createPostgresSessionRepository } = require('./backend/postgres-session-repository');
const { compareCounts } = require('./backend/postgres-parity-gateway');
const { createSessionRepository } = require('./backend/session-repository');
const { createAccountRepository } = require('./backend/account-repository');
const { createAuditRepository } = require('./backend/audit-repository');
const { createStorageRepository } = require('./backend/storage-repository');
const { createSupabaseStorage } = require('./backend/supabase-storage');
const {createHandler:createAgendaAttachmentHandler}=require('./backend/agenda-attachments');
const agendaAttachmentHandlers=new Map();
function getAgendaAttachmentHandler(repo,storage){
 const mode=process.env.PG_PRIMARY_AUTH==='1'&&process.env.PG_PRIMARY_AGENDA_TASK==='1'?'pg':'sqlite';
 if(!agendaAttachmentHandlers.has(mode))agendaAttachmentHandlers.set(mode,createAgendaAttachmentHandler({repo,storage}));
 return agendaAttachmentHandlers.get(mode);
}

const { createMeetingRepository } = require('./backend/meeting-repository');
const { validateMeetingPayload } = require('./backend/meeting-validation');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'backend', 'data');
// V44: document storage may be mounted outside the application checkout.
// A container's ephemeral filesystem is NOT a persistent document store.
const IS_PRODUCTION_STORAGE = process.env.NODE_ENV === 'production';
const NOTULEN_STORAGE_PROVIDER = process.env.NOTULEN_STORAGE_PROVIDER || 'local';
if(!['local','supabase'].includes(NOTULEN_STORAGE_PROVIDER))throw Error('NOTULEN_STORAGE_PROVIDER tidak dikenal');
const supabaseNotulen = NOTULEN_STORAGE_PROVIDER==='supabase' ? createSupabaseStorage({
  url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY,
  bucket:process.env.SUPABASE_STORAGE_BUCKET||'notulen-private'
}) : null;
const configuredUploadDir = process.env.NOTULEN_UPLOAD_DIR;
if (configuredUploadDir && !path.isAbsolute(configuredUploadDir)) throw new Error('NOTULEN_UPLOAD_DIR wajib path absolut.');
if (IS_PRODUCTION_STORAGE && !configuredUploadDir && !supabaseNotulen) throw new Error('Production memerlukan NOTULEN_UPLOAD_DIR atau Supabase Storage privat yang disetujui.');
const UPLOAD_DIR = configuredUploadDir || path.join(ROOT, 'uploads', 'notulen');
if (IS_PRODUCTION_STORAGE && !supabaseNotulen && path.resolve(UPLOAD_DIR).startsWith(path.resolve(ROOT) + path.sep)) throw new Error('Folder unggahan production harus berada di luar source aplikasi.');
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true, mode: 0o700 });
if (fs.lstatSync(UPLOAD_DIR).isSymbolicLink()) throw new Error('Folder unggahan tidak boleh symbolic link.');
if (IS_PRODUCTION_STORAGE) {
  fs.accessSync(UPLOAD_DIR, fs.constants.R_OK | fs.constants.W_OK);
  if (process.env.CONFIRM_PERSISTENT_UPLOAD_STORAGE !== 'YES') throw new Error('Konfirmasi volume persisten diperlukan: CONFIRM_PERSISTENT_UPLOAD_STORAGE=YES (setelah benar-benar diverifikasi).');
}
const db = openDatabase({ driver: process.env.DB_DRIVER, dataDir: DATA_DIR });
const payloadRepository = createPayloadRepository(db);
const sessionRepository = createSessionRepository(db);
const accountRepository = createAccountRepository(db);
const auditRepository = createAuditRepository(db);
const storageRepository = createStorageRepository(db);
const meetingRepository = createMeetingRepository(db);
// V36 hybrid preview: authentication remains SQLite; PostgreSQL is read-only.
const postgresReadGateway = process.env.PG_READ_PREVIEW === '1'
  ? createPostgresReadGateway({ connectionString: process.env.DATABASE_URL }) : null;

// V50: opt-in PostgreSQL authentication for development integration testing.
// The remaining account-management/audit routes still use SQLite: production is fail-closed.
const PG_PRIMARY_AUTH = process.env.PG_PRIMARY_AUTH === '1';
if (PG_PRIMARY_AUTH && !postgresReadGateway) throw new Error('PG_PRIMARY_AUTH memerlukan PG_READ_PREVIEW=1 dan DATABASE_URL');
const pgAccounts = PG_PRIMARY_AUTH ? createPostgresAccountRepository(postgresReadGateway.pool) : null;
const pgSessions = PG_PRIMARY_AUTH ? createPostgresSessionRepository(postgresReadGateway.pool) : null;
const pgPasswordResets = PG_PRIMARY_AUTH ? createPostgresPasswordResetRepository(postgresReadGateway.pool) : null;
const PG_PRIMARY_PAYLOAD = process.env.PG_PRIMARY_PAYLOAD === '1';
if (PG_PRIMARY_PAYLOAD && !postgresReadGateway) throw new Error('PG_PRIMARY_PAYLOAD memerlukan PG_READ_PREVIEW=1 dan DATABASE_URL');
const primaryPgPayload = PG_PRIMARY_PAYLOAD ? createPostgresPayloadRepository(postgresReadGateway.pool) : null;
// V65: isolated opt-in PostgreSQL storage for Agenda Kegiatan / Task Deadline.
// This remains a development-only hybrid until auth, audit and all modules are migrated.
const PG_PRIMARY_AGENDA_TASK = process.env.PG_PRIMARY_AGENDA_TASK === '1';
if(PG_PRIMARY_AGENDA_TASK && !postgresReadGateway) throw new Error('PG_PRIMARY_AGENDA_TASK memerlukan PG_READ_PREVIEW=1 dan DATABASE_URL');
const pgAgendaTask = PG_PRIMARY_AGENDA_TASK ? createPostgresPayloadRepository(postgresReadGateway.pool) : null;
async function primaryRows(table) {
  if (!primaryPgPayload) return payloadRows(table);
  const rows = await primaryPgPayload.list(table);
  return rows.map(row => ({...((typeof row.payload === 'string') ? JSON.parse(row.payload) : row.payload), id:row.id}));
}
async function primaryGet(table,id) {
  if (!primaryPgPayload) { const row=db.prepare(`SELECT payload FROM ${table} WHERE id=?`).get(id); return row ? JSON.parse(row.payload) : null; }
  const row=await primaryPgPayload.get(table,id);
  return row ? {...((typeof row.payload==='string') ? JSON.parse(row.payload) : row.payload),id:row.id} : null;
}
async function primaryCreate(table,id,row) { if(primaryPgPayload) return primaryPgPayload.create(table,id,row); return savePayload(table,id,row); }
async function primaryUpdate(table,id,row) { if(primaryPgPayload) return primaryPgPayload.update(table,id,row); return savePayload(table,id,row); }
async function primaryRemove(table,id) { if(primaryPgPayload) return primaryPgPayload.remove(table,id); db.prepare(`DELETE FROM ${table} WHERE id=?`).run(id); return true; }
const postgresWriteRepository = process.env.PG_WRITE_PREVIEW === '1' && postgresReadGateway
  ? createPostgresPayloadRepository(postgresReadGateway.pool) : null;
const PORT = Number(process.env.PORT || 3000);
const STARTED_AT = Date.now();
const IS_PROD = process.env.NODE_ENV === 'production';
const SECRET = process.env.SESSION_SECRET || 'ganti-secret-ini-sebelum-production';
if (IS_PROD && (SECRET === 'ganti-secret-ini-sebelum-production' || Buffer.byteLength(SECRET, 'utf8') < 32)) {
  throw new Error('SESSION_SECRET wajib diatur pada environment production.');
}
const loginAttempts = new Map();
const uploadAttempts = new Map(); // bounded per-account upload throttle
const ALLOWED_ORIGINS = new Set([
  `http://localhost:${PORT}`,
  `http://127.0.0.1:${PORT}`,
  'http://localhost:5500', 'http://127.0.0.1:5500',
  'http://localhost:5501', 'http://127.0.0.1:5501'
]);
if (process.env.APP_ORIGIN) ALLOWED_ORIGINS.add(process.env.APP_ORIGIN.replace(/\/$/,''));

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE,
      password_hash TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'Pegawai',
      status TEXT NOT NULL DEFAULT 'Aktif', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      unit TEXT NOT NULL DEFAULT 'DITRENDUK', permissions TEXT NOT NULL DEFAULT '[]',
      must_change_password INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS monitoring (
      id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS logbook (
      id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS archive (
      id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS users_data (
      id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS disposisi (
      id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS petugas (
      id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS notulen_submissions (
      id TEXT PRIMARY KEY, topic TEXT NOT NULL, team TEXT, meeting_date TEXT NOT NULL,
      file_name TEXT NOT NULL, stored_path TEXT NOT NULL, mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL, uploaded_by TEXT NOT NULL,
      uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(uploaded_by) REFERENCES accounts(id)
    );
    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY, topic TEXT NOT NULL, team TEXT, meeting_date TEXT, meeting_time TEXT,
      place TEXT, leader TEXT, notulis TEXT, checked_by TEXT, approved_by TEXT,
      approval_date TEXT, participants TEXT, status TEXT NOT NULL DEFAULT 'Draf',
      created_by TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(created_by) REFERENCES accounts(id)
    );
    CREATE TABLE IF NOT EXISTS meeting_sections (
      id TEXT PRIMARY KEY, meeting_id TEXT NOT NULL, section_order INTEGER NOT NULL,
      title TEXT NOT NULL, FOREIGN KEY(meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS meeting_notes (
      id TEXT PRIMARY KEY, section_id TEXT NOT NULL, speaker TEXT, organization TEXT,
      body TEXT NOT NULL, note_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(section_id) REFERENCES meeting_sections(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY, account_id TEXT, action TEXT NOT NULL, resource TEXT NOT NULL,
      resource_id TEXT, detail TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(account_id) REFERENCES accounts(id)
    );
    CREATE TABLE IF NOT EXISTS meeting_documentation (
      id TEXT PRIMARY KEY, meeting_id TEXT NOT NULL, file_name TEXT, data_url TEXT NOT NULL,
      photo_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS storage_files (
      id TEXT PRIMARY KEY, resource TEXT NOT NULL, resource_id TEXT NOT NULL, file_name TEXT NOT NULL,
      stored_path TEXT NOT NULL UNIQUE, mime_type TEXT, size_bytes INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY, account_id TEXT NOT NULL, token_hash TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NOT NULL, revoked_at TEXT, user_agent TEXT, ip_address TEXT,
      FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_account ON auth_sessions(account_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token_hash);
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt, expected] = String(stored).split(':');
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  const target = Buffer.from(expected, 'hex');
  return actual.length === target.length && crypto.timingSafeEqual(actual, target);
}
function tokenHash(token) { return crypto.createHash('sha256').update(String(token || '')).digest('hex'); }
function createServerSession(req, accountId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const id = uid('sess');
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
  const ua = String(req.headers['user-agent'] || '').slice(0, 300);
  const ip = String(req.socket.remoteAddress || '').slice(0, 80);
  sessionRepository.create({ id, accountId, tokenHash: tokenHash(token), expiresAt, userAgent: ua, ipAddress: ip });
  const active = sessionRepository.activeForAccount(accountId, new Date().toISOString());
  active.slice(5).forEach(row => sessionRepository.revokeById(row.id));
  return token;
}
function sessionFromRequest(req) {
  const token = cookies(req).ed_session;
  if (!token) return null;
  const row = sessionRepository.findActiveByTokenHash(tokenHash(token), new Date().toISOString());
  if (!row) return null;
  sessionRepository.touch(row.id);
  return row;
}
function revokeRequestSession(req) {
  const token = cookies(req).ed_session;
  if (token) sessionRepository.revokeByTokenHash(tokenHash(token));
}
function revokeAccountSessions(accountId, exceptSessionId='') {
  if (exceptSessionId) sessionRepository.revokeForAccount(accountId, exceptSessionId);
  else sessionRepository.revokeForAccount(accountId);
}
function cookies(req) {
  return Object.fromEntries(String(req.headers.cookie || '').split(';').filter(Boolean).map(v => {
    const i = v.indexOf('='); return [v.slice(0, i).trim(), decodeURIComponent(v.slice(i + 1).trim())];
  }));
}
function uid(prefix='id') { return `${prefix}_${crypto.randomUUID()}`; }

function cleanText(value, max=5000) { return String(value ?? '').trim().slice(0,max); }
function validPassword(password) {
  const p=String(password||'');
  return p.length>=10 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p);
}
function loginRateKey(req, username='') { return `${req.socket.remoteAddress||'local'}:${String(username).toLowerCase()}`; }
function loginBlocked(key) {
  const row=loginAttempts.get(key); if(!row) return false;
  if(Date.now()-row.first>15*60*1000){loginAttempts.delete(key);return false;}
  return row.count>=8;
}
function loginFail(key){const now=Date.now(),r=loginAttempts.get(key);if(!r||now-r.first>15*60*1000)loginAttempts.set(key,{count:1,first:now});else r.count++;}
function saveDataUrlImage(dataUrl, originalName, meetingId, order) {
  const m=String(dataUrl||'').match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if(!m) throw new Error('Format dokumentasi harus PNG, JPEG, atau WEBP.');
  const buf=Buffer.from(m[2],'base64');
  if(buf.length>5*1024*1024) throw new Error('Ukuran satu foto dokumentasi maksimal 5 MB.');
  const ext={ 'image/png':'png','image/jpeg':'jpg','image/webp':'webp' }[m[1]];
  const safeBase=String(originalName||`foto-${order+1}`).replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,60).replace(/\.[^.]+$/,'');
  const fileName=`${meetingId}-${String(order+1).padStart(2,'0')}-${safeBase}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR,fileName),buf);
  const storedPath=`/uploads/notulen/${fileName}`;
  storageRepository.save({id:uid('file'),resource:'notulen',resourceId:meetingId,fileName:originalName||fileName,storedPath,mimeType:m[1],sizeBytes:buf.length});
  return storedPath;
}
function removeUpload(urlPath){
  if(!String(urlPath||'').startsWith('/uploads/notulen/')) return;
  const f=path.join(ROOT,String(urlPath).replace(/^\//,''));
  if(f.startsWith(UPLOAD_DIR) && fs.existsSync(f)) fs.unlinkSync(f);
  storageRepository.removeByPath(String(urlPath));
}

function loadExcelData() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'data.js'), 'utf8'), context);
  return context.window.EXCEL_DATA || {};
}
function seedTable(table, rows, idFactory) {
  if (!Array.isArray(rows) || db.prepare(`SELECT COUNT(*) c FROM ${table}`).get().c) return;
  const stmt = db.prepare(`INSERT INTO ${table}(id,payload) VALUES(?,?)`);
  rows.forEach((row, i) => stmt.run(String(row.id || idFactory(row, i)), JSON.stringify(row)));
}
function safeUsername(name) {
  return String(name || 'pegawai').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9 ]/g,'').trim().split(/\s+/).slice(0,2).join('.').slice(0,28) || 'pegawai';
}
const ALL_MODULES=['beranda','repository','notulen','rakom','monitoring','jadwal','logbook','arsip','pengguna','agenda','task-deadline'];
function defaultPermissions(role) {
  if (String(role).includes('Admin') || role==='Superadmin') return ALL_MODULES;
  if (String(role).includes('Notulis')) return ['beranda','repository','notulen','rakom','monitoring','logbook','arsip'];
  return ['beranda','repository','notulen','rakom','monitoring','logbook','arsip'];
}
function accountPublic(row) {
  if(!row) return null;
  let permissions=[]; try{permissions=Array.isArray(row.permissions)?row.permissions:JSON.parse(row.permissions||'[]')}catch{}
  return {id:row.id,username:row.username,email:row.email,name:row.name,role:row.role,status:row.status,unit:row.unit||'DITRENDUK',permissions,mustChangePassword:!!row.must_change_password,createdAt:row.created_at,updatedAt:row.updated_at};
}
function currentAccount(req) {
  const session=sessionFromRequest(req); if(!session) return null;
  const account=accountRepository.byId(session.account_id);
  return (!account || account.status!=='Aktif') ? null : account;
}
function can(account,module) {
  if(!account || account.status!=='Aktif') return false;
  if(account.role==='Superadmin') return true;
  if(['agenda','task-deadline'].includes(module)) { let p=[]; try{p=JSON.parse(account.permissions||'[]')}catch{} return p.includes(module); }
  if(String(account.role).includes('Admin')) return true;
  let permissions=[]; try{permissions=JSON.parse(account.permissions||'[]')}catch{}
  return permissions.includes(module);
}
function audit(accountId,action,resource,resourceId='',detail={}) {
  auditRepository.record({id:uid('audit'),accountId,action,resource,resourceId,detail});
}
function seed() {
  if (!IS_PROD && !db.prepare('SELECT COUNT(*) c FROM accounts').get().c) {
    db.prepare('INSERT INTO accounts(id,username,email,password_hash,name,role,status) VALUES(?,?,?,?,?,?,?)')
      .run('acc_admin', 'femilia', 'femilia@ditrenduk.local', hashPassword('Ditrenduk2026!'), 'Femilia', 'Superadmin', 'Aktif');
  }
  const D = loadExcelData();
  // Pegawai Excel juga disiapkan sebagai akun aplikasi development agar role/hak akses dapat diuji.
  const existingNames=new Set(db.prepare('SELECT name FROM accounts').all().map(x=>x.name));
  const usedUsers=new Set(db.prepare('SELECT username FROM accounts').all().map(x=>x.username));
  (!IS_PROD ? (D.users||[]) : []).forEach((u,i)=>{
    if(existingNames.has(u.nama)) return;
    let base=safeUsername(u.nama), username=base, n=2; while(usedUsers.has(username)) username=`${base}${n++}`;
    usedUsers.add(username);
    const role=String(u.peran||'').includes('Admin')?'Superadmin':'Pegawai', permissions=defaultPermissions(role);
    db.prepare('INSERT INTO accounts(id,username,email,password_hash,name,role,status,unit,permissions,must_change_password) VALUES(?,?,?,?,?,?,?,?,?,?)')
      .run(`staff_${u.id||i+1}`,username,null,hashPassword('Ditrenduk2026!'),u.nama,role,u.status||'Aktif',u.unit||'DITRENDUK',JSON.stringify(permissions),1);
  });
  if (IS_PROD) return; // Never seed spreadsheet/demo records on production startup.
  seedTable('monitoring', D.monitoring, (r,i)=>`m_${i+1}`);
  seedTable('logbook', D.logbook, (r,i)=>`l_${i+1}`);
  seedTable('archive', D.archive, (r,i)=>`a_${i+1}`);
  seedTable('users_data', D.users, (r,i)=>`u_${i+1}`);
  seedTable('disposisi', D.disposisi, (r,i)=>`d_${i+1}`);
  seedTable('petugas', D.petugas, (r,i)=>`p_${i+1}`);
  if (!db.prepare('SELECT COUNT(*) c FROM schedules').get().c) {
    const people=(D.petugas||[]).map(x=>x.nama).filter(Boolean);
    const stmt=db.prepare('INSERT INTO schedules(id,payload) VALUES(?,?)');
    ['2026-08-03','2026-08-10','2026-08-17','2026-08-24','2026-08-31'].forEach((date,i)=>{
      const row={id:`s${i}`,date,supervisi:people[(i*3+2)%people.length]||'—',asrot:people[(i*3)%people.length]||'—',notulis:people[(i*3+1)%people.length]||'—'};
      stmt.run(row.id,JSON.stringify(row));
    });
  }
}

function cors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
}
function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}
async function readJson(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 12_000_000) { const e = new Error('Payload terlalu besar'); e.statusCode=413; throw e; }
  }
  try { return raw ? JSON.parse(raw) : {}; } catch { const e = new Error('JSON tidak valid'); e.statusCode=400; throw e; }
}
function auth(req, res) {
  const session = sessionFromRequest(req);
  if (!session || !currentAccount(req)) {
    json(res, 401, { ok:false, message:'Sesi login tidak valid atau sudah berakhir.' }); return null;
  }
  return session;
}
function payloadRows(table) { return payloadRepository.list(table); }
function savePayload(table, id, payload) { return payloadRepository.save(table, id, payload); }

const dataRoutes = {
  monitoring: 'monitoring', logbook: 'logbook', archive: 'archive', users: 'users_data',
  disposisi: 'disposisi', petugas: 'petugas', schedules: 'schedules'
};

function csvEscape(value) {
  const text = value == null ? '' : (typeof value === 'object' ? JSON.stringify(value) : String(value));
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
function csvFromRows(rows) {
  if (!rows.length) return '\ufeff';
  const keys = [...new Set(rows.flatMap(row => Object.keys(row || {})))];
  return '\ufeff' + [keys.join(','), ...rows.map(row => keys.map(key => csvEscape(row[key])).join(','))].join('\r\n');
}
function sendCsv(res, filename, rows) {
  const body = csvFromRows(rows);
  res.writeHead(200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

async function api(req, res, url) {
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (url.pathname === '/api/health') return json(res, 200, { ok:true, app:'E-DITRENDUK API', version:'14', uptimeSeconds:Math.floor((Date.now()-STARTED_AT)/1000), time:new Date().toISOString() });
  if (url.pathname === '/api/ready') {
    try {
      const result=await checkDatabaseReadiness({sqlite:db,postgresPool:postgresReadGateway?.pool,usesPostgres:PG_PRIMARY_PAYLOAD||PG_PRIMARY_AUTH||PG_PRIMARY_AGENDA_TASK});
      return json(res,result.ok?200:503,{...result,time:new Date().toISOString()});
    } catch(e) { return json(res,503,{ok:false,message:'Database belum siap.'}); }
  }

  if (url.pathname === '/api/auth/login' && req.method === 'POST') {
    const body = await readJson(req);
    const identity=cleanText(body.username,120), key=loginRateKey(req,identity);
    if(loginBlocked(key)) return json(res,429,{ok:false,message:'Terlalu banyak percobaan login. Coba lagi dalam beberapa menit.'});
    if (PG_PRIMARY_AUTH) {
      const user = await pgAccounts.byUsername(identity);
      if (!user || user.status !== 'Aktif' || !verifyPassword(body.password || '', user.password_hash)) {
        loginFail(key); return json(res,401,{ok:false,message:'Username atau kata sandi salah.'});
      }
      loginAttempts.delete(key);
      const token=crypto.randomBytes(32).toString('base64url');
      const sessionId=uid('sess');
      const expiresAt=new Date(Date.now()+8*60*60*1000).toISOString();
      await pgSessions.create({id:sessionId,accountId:user.id,tokenHash:tokenHash(token),expiresAt,userAgent:String(req.headers['user-agent']||'').slice(0,300),ipAddress:String(req.socket.remoteAddress||'').slice(0,80)});
      const active=await pgSessions.activeForAccount(user.id,new Date().toISOString());
      for(const row of active.slice(5)) await pgSessions.revokeById(row.id);
      res.setHeader('Set-Cookie',`ed_session=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800${IS_PROD?'; Secure':''}`);
      return json(res,200,{ok:true,user:{id:user.id,name:user.name,role:user.role,email:user.email}});
    }
    const user = accountRepository.byIdentity(identity);
    if (!user || user.status !== 'Aktif' || !verifyPassword(body.password || '', user.password_hash)) {
      loginFail(key); return json(res, 401, { ok:false, message:'Username/email atau kata sandi salah.' });
    }
    loginAttempts.delete(key);
    const token = createServerSession(req, user.id);
    res.setHeader('Set-Cookie', `ed_session=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800${IS_PROD?'; Secure':''}`);
    return json(res, 200, { ok:true, user:{ id:user.id, name:user.name, role:user.role, email:user.email } });
  }
  if (url.pathname === '/api/auth/logout' && req.method === 'POST') {
    if(PG_PRIMARY_AUTH) { const token=cookies(req).ed_session; if(token) await pgSessions.revokeByTokenHash(tokenHash(token)); }
    else revokeRequestSession(req);
    res.setHeader('Set-Cookie', `ed_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${IS_PROD?'; Secure':''}`);
    return json(res, 200, { ok:true });
  }
  if (url.pathname === '/api/auth/me' && req.method === 'GET') {
    if(PG_PRIMARY_AUTH) {
      const token=cookies(req).ed_session;
      const session=token ? await pgSessions.findActiveByTokenHash(tokenHash(token),new Date().toISOString()) : null;
      const user=session ? await pgAccounts.byId(session.account_id) : null;
      if(!user || user.status!=='Aktif') return json(res,401,{ok:false,message:'Sesi tidak valid.'});
      await pgSessions.touch(session.id);
      return json(res,200,{ok:true,user:accountPublic(user)});
    }
    const session = auth(req,res); if (!session) return;
    const user = accountRepository.byId(session.account_id);
    return json(res, 200, { ok:true, user:accountPublic(user) });
  }
  // V89: handler is shared across requests so per-agenda serialization actually works.
  // V84: agenda attachments in private Supabase bucket; both auth runtimes supported.
  if(/^\/api\/agenda\/[a-zA-Z0-9_-]{1,100}\/attachments(?:\/|$)/.test(url.pathname)){
    if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return json(res,503,{ok:false,message:'Penyimpanan lampiran Agenda belum dikonfigurasi.'});
    const storage=createSupabaseStorage({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY,bucket:process.env.AGENDA_STORAGE_BUCKET||'agenda-private'});
    const repo=PG_PRIMARY_AUTH&&PG_PRIMARY_AGENDA_TASK?pgAgendaTask:{
      get:async(table,id)=>db.prepare('SELECT payload FROM agenda_kegiatan WHERE id=?').get(id),
      update:async(table,id,payload)=>db.prepare('UPDATE agenda_kegiatan SET payload=? WHERE id=?').run(JSON.stringify(payload),id)
    };
    let user;
    if(PG_PRIMARY_AUTH){const token=cookies(req).ed_session;const session=token?await pgSessions.findActiveByTokenHash(tokenHash(token),new Date().toISOString()):null;user=session?await pgAccounts.byId(session.account_id):null;}
    else user=currentAccount(req);
    return getAgendaAttachmentHandler(repo,storage)({req,res,url,user,readJson,json});
  }
  // PostgreSQL auth self-service: no SQLite account/session reads or writes.
  if (PG_PRIMARY_AUTH && ['/api/auth/change-password','/api/auth/sessions'].includes(url.pathname)) {
    const token=cookies(req).ed_session;
    const session=token ? await pgSessions.findActiveByTokenHash(tokenHash(token),new Date().toISOString()) : null;
    const user=session ? await pgAccounts.byId(session.account_id) : null;
    if(!user || user.status!=='Aktif') return json(res,401,{ok:false,message:'Sesi tidak valid.'});
    if(url.pathname==='/api/auth/change-password' && req.method==='POST') {
      const b=await readJson(req);
      if(!verifyPassword(String(b.currentPassword||''),user.password_hash)) return json(res,400,{ok:false,message:'Kata sandi saat ini tidak sesuai.'});
      if(!validPassword(b.newPassword)) return json(res,400,{ok:false,message:'Kata sandi baru minimal 10 karakter dengan huruf besar, huruf kecil, dan angka.'});
      if(String(b.currentPassword)===String(b.newPassword)) return json(res,400,{ok:false,message:'Kata sandi baru harus berbeda.'});
      await pgAccounts.setPasswordHash(user.id,hashPassword(b.newPassword),false);
      await pgSessions.revokeForAccount(user.id,session.id);
      return json(res,200,{ok:true,message:'Kata sandi berhasil diubah.'});
    }
    if(url.pathname==='/api/auth/sessions' && req.method==='GET') {
      const rows=await pgSessions.listActiveForAccount(user.id,new Date().toISOString());
      return json(res,200,{ok:true,data:rows.map(r=>({...r,current:r.id===session.id}))});
    }
    return json(res,405,{ok:false,message:'Metode tidak didukung.'});
  }
  if(PG_PRIMARY_AUTH && /^\/api\/auth\/sessions\/[^/]+$/.test(url.pathname)) {
    if(req.method!=='DELETE') return json(res,405,{ok:false,message:'Metode tidak didukung.'});
    const token=cookies(req).ed_session;
    const session=token ? await pgSessions.findActiveByTokenHash(tokenHash(token),new Date().toISOString()) : null;
    const user=session ? await pgAccounts.byId(session.account_id) : null;
    if(!user || user.status!=='Aktif') return json(res,401,{ok:false,message:'Sesi tidak valid.'});
    const id=url.pathname.split('/').pop();
    if(!await pgSessions.ownedSession(id,user.id)) return json(res,404,{ok:false,message:'Sesi tidak ditemukan.'});
    await pgSessions.revokeById(id);
    if(id===session.id) res.setHeader('Set-Cookie',`ed_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${IS_PROD?'; Secure':''}`);
    return json(res,200,{ok:true});
  }
  // V67: PostgreSQL password-reset flow, isolated from SQLite. All admin actions
  // require a validated PostgreSQL session and Superadmin role.
  if(PG_PRIMARY_AUTH && url.pathname==='/api/auth/forgot-password' && req.method==='POST'){
    const b=await readJson(req),identity=cleanText(b.identity,120);
    if(!identity)return json(res,400,{ok:false,message:'Username atau email wajib diisi.'});
    const user=await pgPasswordResets.activeIdentity(identity);
    if(user)await pgPasswordResets.request(uid('reset'),user.id,identity);
    return json(res,200,{ok:true,message:'Jika akun ditemukan dan aktif, permintaan reset telah dikirim ke Admin/PIC.'});
  }
  const pgResetPath=url.pathname==='/api/admin/reset-notifications'||url.pathname==='/api/password-reset-requests'||/^\/api\/password-reset-requests\/[^/]+\/resolve$/.test(url.pathname);
  if(PG_PRIMARY_AUTH && pgResetPath){
    const token=cookies(req).ed_session;
    const session=token?await pgSessions.findActiveByTokenHash(tokenHash(token),new Date().toISOString()):null;
    const admin=session?await pgAccounts.byId(session.account_id):null;
    if(!admin||admin.status!=='Aktif')return json(res,401,{ok:false,message:'Sesi tidak valid.'});
    if(admin.role!=='Superadmin')return json(res,403,{ok:false,message:'Hanya Superadmin.'});
    if(req.method==='GET' && url.pathname==='/api/admin/reset-notifications'){
      const rows=(await pgPasswordResets.list()).filter(x=>x.status==='Menunggu');
      return json(res,200,{ok:true,count:rows.length,data:rows.map(x=>({id:x.id,name:x.name,username:x.username,requestedAt:x.requested_at}))});
    }
    if(req.method==='GET' && url.pathname==='/api/password-reset-requests')
      return json(res,200,{ok:true,data:await pgPasswordResets.list()});
    if(req.method==='POST' && url.pathname.endsWith('/resolve')){
      const b=await readJson(req),password=String(b.password||'');
      if(!validPassword(password))return json(res,400,{ok:false,message:'Kata sandi sementara minimal 10 karakter dengan huruf besar, kecil, dan angka.'});
      const id=url.pathname.split('/')[3];
      if(!await pgPasswordResets.resolve(id,hashPassword(password),admin.id))
        return json(res,404,{ok:false,message:'Permintaan reset tidak ditemukan atau sudah selesai.'});
      return json(res,200,{ok:true,message:'Kata sandi sementara dibuat. Pengguna wajib menggantinya.'});
    }
    return json(res,405,{ok:false,message:'Metode tidak didukung.'});
  }
  // V77: account administration shares PostgreSQL auth and revokes sessions on permission changes.
  if(PG_PRIMARY_AUTH && /^\/api\/accounts(?:\/|$)/.test(url.pathname)) {
    const token=cookies(req).ed_session;
    const session=token?await pgSessions.findActiveByTokenHash(tokenHash(token),new Date().toISOString()):null;
    const user=session?await pgAccounts.byId(session.account_id):null;
    return pgAdminAccounts.handle({req,res,url,user,pool:postgresReadGateway.pool,readJson,json,uid,hashPassword,validPassword});
  }
  // V70: shared PostgreSQL session authenticates Agenda and Task in one runtime.
  // Other APIs remain blocked in this development-only mode to avoid split identities.
  if(PG_PRIMARY_AUTH && PG_PRIMARY_AGENDA_TASK && /^\/api\/(agenda|task-deadline)(?:\/|$)/.test(url.pathname)) {
    const token=cookies(req).ed_session;
    const session=token?await pgSessions.findActiveByTokenHash(tokenHash(token),new Date().toISOString()):null;
    const user=session?await pgAccounts.byId(session.account_id):null;
    return pgAgendaTaskHandler.handle({req,res,url,user:user?.status==='Aktif'?user:null,repo:pgAgendaTask,readJson,json,
      audit:async(accountId,action,resource,resourceId)=>postgresReadGateway.pool.query('INSERT INTO audit_logs(id,account_id,action,resource,resource_id,detail) VALUES($1,$2,$3,$4,$5,$6::jsonb)',[uid('audit'),accountId,action,resource,resourceId,'{}'])});
  }
  // V71: seven additional modules, dashboard, bootstrap and audit use the same
  // PostgreSQL identity and persistence. No SQLite fallback in this branch.
  if(PG_PRIMARY_AUTH && PG_PRIMARY_PAYLOAD && (/^\/api\/(monitoring|logbook|archive|users|disposisi|petugas|schedules|fasilitasi)(?:\/|$)/.test(url.pathname)||
    ['/api/bootstrap','/api/dashboard','/api/audit'].includes(url.pathname))) {
    const token=cookies(req).ed_session;
    const session=token?await pgSessions.findActiveByTokenHash(tokenHash(token),new Date().toISOString()):null;
    const user=session?await pgAccounts.byId(session.account_id):null;
    return pgUnifiedHandler.handle({req,res,url,user:user?.status==='Aktif'?user:null,repo:primaryPgPayload,pool:postgresReadGateway.pool,readJson,json});
  }
  // V73: PostgreSQL notulensi metadata + private Supabase file storage.
  // No fallback to SQLite identity or local ephemeral storage in this mode.
  if(PG_PRIMARY_AUTH && /^\/api\/notulen-submissions(?:\/|$)/.test(url.pathname)) {
    if(!supabaseNotulen)return json(res,503,{ok:false,message:'Mode PostgreSQL Notulensi memerlukan Supabase Storage privat.'});
    const token=cookies(req).ed_session;
    const session=token?await pgSessions.findActiveByTokenHash(tokenHash(token),new Date().toISOString()):null;
    const user=session?await pgAccounts.byId(session.account_id):null;
    return pgNotulenHandler.createHandler({pool:postgresReadGateway.pool,storage:supabaseNotulen,readJson,json,uid,
      rateLimit:(id)=>{const now=Date.now(),v=uploadAttempts.get(id);if(v&&now-v.start<900000){if(v.count>=20)return false;v.count++;return true}uploadAttempts.set(id,{start:now,count:1});return true}
    })({req,res,url,user:user?.status==='Aktif'?user:null});
  }
  if(PG_PRIMARY_AUTH) return json(res,503,{ok:false,message:'Mode uji autentikasi PostgreSQL: modul lain dinonaktifkan sampai migrasi penuh.'});
  if (url.pathname === '/api/auth/change-password' && req.method === 'POST') {
    const session=auth(req,res); if(!session)return;
    const user=accountRepository.byId(session.account_id), b=await readJson(req);
    if(!user || !verifyPassword(String(b.currentPassword||''),user.password_hash)) return json(res,400,{ok:false,message:'Kata sandi saat ini tidak sesuai.'});
    if(!validPassword(b.newPassword)) return json(res,400,{ok:false,message:'Kata sandi baru minimal 10 karakter dan harus mengandung huruf besar, huruf kecil, serta angka.'});
    if(String(b.currentPassword)===String(b.newPassword)) return json(res,400,{ok:false,message:'Kata sandi baru harus berbeda dari kata sandi lama.'});
    accountRepository.setPassword(user.id,hashPassword(b.newPassword),false);
    revokeAccountSessions(user.id, session.id);
    audit(user.id,'CHANGE_PASSWORD','account',user.id); return json(res,200,{ok:true,message:'Kata sandi berhasil diubah.'});
  }

  if (url.pathname === '/api/auth/sessions' && req.method === 'GET') {
    const session=auth(req,res); if(!session)return;
    const rows=sessionRepository.listActiveForAccount(session.account_id, new Date().toISOString());
    return json(res,200,{ok:true,data:rows.map(r=>({...r,current:r.id===session.id}))});
  }
  const sessionRevoke=url.pathname.match(/^\/api\/auth\/sessions\/([^/]+)$/);
  if(sessionRevoke && req.method==='DELETE') {
    const session=auth(req,res); if(!session)return;
    const target=sessionRevoke[1];
    const row=sessionRepository.ownedSession(target, session.account_id);
    if(!row)return json(res,404,{ok:false,message:'Sesi tidak ditemukan.'});
    sessionRepository.revokeById(target);
    if(target===session.id) res.setHeader('Set-Cookie',`ed_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${IS_PROD?'; Secure':''}`);
    return json(res,200,{ok:true});
  }

  if (url.pathname === '/api/auth/forgot-password' && req.method === 'POST') {
    const b=await readJson(req), identity=cleanText(b.identity,120);
    if(!identity) return json(res,400,{ok:false,message:'Username atau email wajib diisi.'});
    const user=accountRepository.activeIdentity(identity);
    // Response sengaja generik agar endpoint tidak membocorkan keberadaan akun.
    if(user){
      const pending=accountRepository.pendingReset(user.id);
      if(!pending){ const id=uid('reset'); accountRepository.requestReset(id,user.id,identity); audit(user.id,'REQUEST_PASSWORD_RESET','account',user.id); }
    }
    return json(res,200,{ok:true,message:'Jika akun ditemukan dan aktif, permintaan reset telah dikirim ke Admin/PIC.'});
  }

  const session = auth(req,res); if (!session) return;
  const account=currentAccount(req);

  if (url.pathname === '/api/admin/reset-notifications' && req.method === 'GET') {
    if(account.role!=='Superadmin') return json(res,403,{ok:false,message:'Hanya Superadmin.'});
    const rows=accountRepository.resetRequests().filter(r=>r.status==='Menunggu');
    return json(res,200,{ok:true,count:rows.length,data:rows.map(r=>({id:r.id,name:r.name,username:r.username,requestedAt:r.requested_at}))});
  }
  if (url.pathname === '/api/password-reset-requests' && req.method === 'GET') {
    if(account.role!=='Superadmin') return json(res,403,{ok:false,message:'Hanya Superadmin yang dapat melihat permintaan reset.'});
    const rows=accountRepository.resetRequests();
    return json(res,200,{ok:true,data:rows});
  }
  const resetReq=url.pathname.match(/^\/api\/password-reset-requests\/([^/]+)\/resolve$/);
  if(resetReq && req.method==='POST') {
    if(account.role!=='Superadmin') return json(res,403,{ok:false,message:'Hanya Superadmin yang dapat menyelesaikan permintaan reset.'});
    const b=await readJson(req), password=String(b.password||'');
    if(!validPassword(password)) return json(res,400,{ok:false,message:'Kata sandi sementara minimal 10 karakter dengan huruf besar, kecil, dan angka.'});
    const r=accountRepository.pendingResetById(resetReq[1]);
    if(!r) return json(res,404,{ok:false,message:'Permintaan reset tidak ditemukan atau sudah selesai.'});
    accountRepository.setPassword(r.account_id,hashPassword(password),true);
    revokeAccountSessions(r.account_id);
    accountRepository.resolveReset(r.id,account.id);
    audit(account.id,'RESOLVE_PASSWORD_RESET','account',r.account_id,{requestId:r.id});
    return json(res,200,{ok:true,message:'Kata sandi sementara berhasil dibuat. Pengguna wajib menggantinya setelah login.'});
  }


  if (url.pathname === '/api/accounts' && req.method === 'GET') {
    if(!can(account,'pengguna')) return json(res,403,{ok:false,message:'Anda tidak memiliki akses ke modul Pengguna.'});
    const rows=accountRepository.list().map(accountPublic);
    return json(res,200,{ok:true,data:rows});
  }
  if (url.pathname === '/api/accounts' && req.method === 'POST') {
    if(account.role!=='Superadmin') return json(res,403,{ok:false,message:'Hanya Superadmin yang dapat membuat akun dan mengatur izin.'});
    const b=await readJson(req); if(!b.name||!b.username||!b.password) return json(res,400,{ok:false,message:'Nama, username, dan password wajib diisi.'});
    if(!validPassword(b.password) || !/^[a-zA-Z0-9._-]{3,40}$/.test(String(b.username)) || String(b.name).length>150) return json(res,400,{ok:false,message:'Username 3-40 karakter (huruf, angka, titik, underscore, strip), nama maksimal 150 karakter, dan password minimal 10 karakter dengan huruf besar, kecil, angka.'});
    if(accountRepository.byUsername(b.username)) return json(res,409,{ok:false,message:'Username sudah digunakan.'});
    const id=uid('acc'), role=b.role==='Superadmin'?'Superadmin':'Pegawai', permissions=Array.isArray(b.permissions)?b.permissions.filter(x=>ALL_MODULES.includes(x)):defaultPermissions(role);
    accountRepository.create({id,username:b.username,email:b.email||null,passwordHash:hashPassword(b.password),name:b.name,role,status:b.status||'Aktif',unit:b.unit||'DITRENDUK',permissions:JSON.stringify(permissions),mustChangePassword:b.mustChangePassword===false?0:1});
    audit(account.id,'CREATE','account',id,{username:b.username,role});
    return json(res,201,{ok:true,data:accountPublic(accountRepository.byId(id))});
  }
  const accountMatch=url.pathname.match(/^\/api\/accounts\/([^/]+)$/);
  if(accountMatch && (req.method==='PATCH'||req.method==='PUT')) {
    if(account.role!=='Superadmin') return json(res,403,{ok:false,message:'Hanya Superadmin yang dapat mengubah akun dan mengatur izin.'});
    const id=accountMatch[1], old=accountRepository.byId(id); if(!old)return json(res,404,{ok:false,message:'Akun tidak ditemukan.'});
    const b=await readJson(req); if(b.name!==undefined && (!String(b.name).trim() || String(b.name).length>150)) return json(res,400,{ok:false,message:'Nama wajib diisi dan maksimal 150 karakter.'});
    const role=b.role===undefined?old.role:(b.role==='Superadmin'?'Superadmin':'Pegawai'), permissions=Array.isArray(b.permissions)?b.permissions.filter(x=>ALL_MODULES.includes(x)):(()=>{try{return JSON.parse(old.permissions||'[]')}catch{return defaultPermissions(role)}})();
    accountRepository.update({id,name:b.name??old.name,email:b.email===undefined?old.email:(b.email||null),role,status:b.status??old.status,unit:b.unit??old.unit,permissions:JSON.stringify(permissions)});
    if ((b.status??old.status) !== 'Aktif') revokeAccountSessions(id);
    audit(account.id,'UPDATE','account',id,{fields:Object.keys(b)});
    return json(res,200,{ok:true,data:accountPublic(accountRepository.byId(id))});
  }
  const resetMatch=url.pathname.match(/^\/api\/accounts\/([^/]+)\/reset-password$/);
  if(resetMatch && req.method==='POST') {
    if(!(String(account.role).includes('Admin') || account.role==='Superadmin')) return json(res,403,{ok:false,message:'Hanya Admin yang dapat mengatur ulang kata sandi.'});
    const b=await readJson(req), password=String(b.password||''); if(!validPassword(password))return json(res,400,{ok:false,message:'Kata sandi sementara minimal 10 karakter dan harus mengandung huruf besar, huruf kecil, serta angka.'});
    const r=accountRepository.setPassword(resetMatch[1],hashPassword(password),true);
    if(!r.changes)return json(res,404,{ok:false,message:'Akun tidak ditemukan.'}); revokeAccountSessions(resetMatch[1]); audit(account.id,'RESET_PASSWORD','account',resetMatch[1]); return json(res,200,{ok:true});
  }
  if (url.pathname === '/api/audit' && req.method === 'GET') {
    if(!(String(account.role).includes('Admin') || account.role==='Superadmin')) return json(res,403,{ok:false,message:'Hanya Admin yang dapat melihat audit log.'});
    const q=cleanText(url.searchParams.get('q')||'',120), action=cleanText(url.searchParams.get('action')||'',60);
    const resource=cleanText(url.searchParams.get('resource')||'',60);
    const page=Math.max(1,Number(url.searchParams.get('page')||1)||1), limit=Math.min(100,Math.max(10,Number(url.searchParams.get('limit')||25)||25));
    const {rows,pagination}=auditRepository.search({q,action,resource,page,limit});
    return json(res,200,{ok:true,data:rows,pagination});
  }

  if (url.pathname === '/api/storage' && req.method === 'GET') {
    if(!(String(account.role).includes('Admin') || account.role==='Superadmin')) return json(res,403,{ok:false,message:'Hanya Admin yang dapat melihat status storage.'});
    const rows=storageRepository.list();
    const totalBytes=rows.reduce((n,r)=>n+Number(r.size_bytes||0),0);
    const missing=rows.filter(r=>!fs.existsSync(path.join(ROOT,String(r.stored_path||'').replace(/^\//,''))));
    return json(res,200,{ok:true,data:{files:rows,totalFiles:rows.length,totalBytes,missing:missing.map(x=>x.stored_path)}});
  }

  if (url.pathname === '/api/admin/diagnostics' && req.method === 'GET') {
    if(!(String(account.role).includes('Admin') || account.role==='Superadmin')) return json(res,403,{ok:false,message:'Hanya Admin yang dapat melihat diagnostik sistem.'});
    const dbPath=path.join(DATA_DIR,'editrenduk.sqlite');
    const tableNames=['accounts','monitoring','logbook','archive','disposisi','petugas','schedules','meetings','audit_logs','storage_files','auth_sessions'];
    const counts=Object.fromEntries(tableNames.map(name=>[name,Number(db.prepare(`SELECT COUNT(*) c FROM ${name}`).get().c||0)]));
    const storageRows=storageRepository.usage();
    const missingFiles=storageRows.filter(r=>!fs.existsSync(path.join(ROOT,String(r.stored_path||'').replace(/^\//,'')))).length;
    const integrity=db.prepare('PRAGMA quick_check').get().quick_check;
    return json(res,200,{ok:integrity==='ok',data:{
      version:'14',node:process.version,environment:process.env.NODE_ENV||'development',
      uptimeSeconds:Math.floor((Date.now()-STARTED_AT)/1000),database:{integrity,sizeBytes:fs.existsSync(dbPath)?fs.statSync(dbPath).size:0,counts},
      storage:{registeredFiles:storageRows.length,totalBytes:storageRows.reduce((n,r)=>n+Number(r.size_bytes||0),0),missingFiles},
      memory:{rss:process.memoryUsage().rss,heapUsed:process.memoryUsage().heapUsed},time:new Date().toISOString()
    }});
  }

  // V39: explicitly enabled PostgreSQL CRUD gateway, restricted to Superadmin.
  const pgWriteMatch = url.pathname.match(/^\/api\/postgres-write\/(monitoring|logbook|archive|users_data|disposisi|petugas|schedules)(?:\/([^/]+))?$/);
  if (pgWriteMatch) {
    if (process.env.PG_WRITE_PREVIEW !== '1' || !postgresReadGateway) return json(res,404,{ok:false,message:'PostgreSQL write gateway belum diaktifkan.'});
    if (account.role !== 'Superadmin') return json(res,403,{ok:false,message:'Hanya Superadmin dapat mengubah data PostgreSQL.'});
    const resource=pgWriteMatch[1], id=pgWriteMatch[2] ? decodeURIComponent(pgWriteMatch[2]) : null;
    if (id && !/^[a-zA-Z0-9_-]{1,100}$/.test(id)) return json(res,400,{ok:false,message:'ID tidak valid.'});
    if (req.method === 'POST' && !id) {
      const body=await readJson(req);
      if (!body || Array.isArray(body) || typeof body !== 'object') return json(res,400,{ok:false,message:'Data harus berupa objek.'});
      const newId=String(body.id || uid(resource[0]));
      if (!/^[a-zA-Z0-9_-]{1,100}$/.test(newId)) return json(res,400,{ok:false,message:'ID tidak valid.'});
      try {
        const row=await postgresWriteRepository.create(resource,newId,{...body,id:newId});
        audit(account.id,'PG_CREATE',resource,newId);
        return json(res,201,{ok:true,source:'postgresql',data:row.payload});
      } catch (error) { if(error.code==='23505') return json(res,409,{ok:false,message:'ID sudah digunakan.'}); throw error; }
    }
    if ((req.method === 'PUT'||req.method === 'PATCH') && id) {
      const body=await readJson(req);
      if (!body || Array.isArray(body) || typeof body !== 'object') return json(res,400,{ok:false,message:'Data harus berupa objek.'});
      const old=await postgresWriteRepository.get(resource,id);
      if(!old) return json(res,404,{ok:false,message:'Data tidak ditemukan.'});
      const oldPayload=typeof old.payload==='string'?JSON.parse(old.payload):old.payload;
      const payload=req.method==='PATCH'?{...oldPayload,...body,id}:{...body,id};
      const row=await postgresWriteRepository.update(resource,id,payload);
      audit(account.id,'PG_UPDATE',resource,id,{fields:Object.keys(body)});
      return json(res,200,{ok:true,source:'postgresql',data:row.payload});
    }
    if (req.method==='DELETE' && id) {
      const removed=await postgresWriteRepository.remove(resource,id);
      if(!removed) return json(res,404,{ok:false,message:'Data tidak ditemukan.'});
      audit(account.id,'PG_DELETE',resource,id);
      return json(res,200,{ok:true,source:'postgresql'});
    }
    return json(res,405,{ok:false,message:'Metode tidak didukung.'});
  }

  // V38: administrator-only count parity between active SQLite and PostgreSQL.
  if (url.pathname === '/api/postgres-preview-parity') {
    if (req.method !== 'GET') return json(res,405,{ok:false,message:'Hanya GET didukung.'});
    if (!postgresReadGateway) return json(res,404,{ok:false,message:'Preview PostgreSQL belum diaktifkan.'});
    if (account.role !== 'Superadmin') return json(res,403,{ok:false,message:'Hanya Superadmin dapat memeriksa parity.'});
    const result=await compareCounts(postgresReadGateway, resource=>payloadRows(resource).length);
    return json(res,200,{ok:true,source:'sqlite+postgresql',mode:'read-only-count-parity',data:result});
  }

  // V36: authenticated, permission-checked PostgreSQL preview; no writes and no SQLite fallback.
  const pgPreviewMatch = url.pathname.match(/^\/api\/postgres-preview\/(monitoring|logbook|archive|users_data|disposisi|petugas|schedules)(?:\/([^/]+))?$/);
  if (pgPreviewMatch) {
    if (req.method !== 'GET') return json(res,405,{ok:false,message:'Preview PostgreSQL hanya mendukung GET.'});
    if (!postgresReadGateway) return json(res,404,{ok:false,message:'Preview PostgreSQL belum diaktifkan.'});
    const resource = pgPreviewMatch[1];
    const permission = {archive:'arsip',users_data:'pengguna',disposisi:'rakom',petugas:'jadwal',schedules:'jadwal'}[resource] || resource;
    if (!can(account,permission)) return json(res,403,{ok:false,message:'Anda tidak memiliki akses ke modul ini.'});
    if (pgPreviewMatch[2]) {
      const id=decodeURIComponent(pgPreviewMatch[2]);
      const item=await postgresReadGateway.get(resource,id);
      return item?json(res,200,{ok:true,source:'postgresql',mode:'read-only-preview',data:item}):json(res,404,{ok:false,message:'Data PostgreSQL tidak ditemukan.'});
    }
    const rawLimit=url.searchParams.get('limit')||'25';
    const rawPage=url.searchParams.get('page')||'1';
    if(!/^\d+$/.test(rawLimit)||!/^\d+$/.test(rawPage)) return json(res,400,{ok:false,message:'Parameter pagination tidak valid.'});
    const limit=Number(rawLimit),page=Number(rawPage);
    if(!Number.isSafeInteger(page)||page<1||page>10000||limit<1||limit>100) return json(res,400,{ok:false,message:'Parameter pagination di luar batas.'});
    const [rows,total]=await Promise.all([postgresReadGateway.list(resource,limit,(page-1)*limit),postgresReadGateway.count(resource)]);
    return json(res,200,{ok:true,source:'postgresql',mode:'read-only-preview',data:rows,pagination:{page,limit,total,totalPages:Math.ceil(total/limit)}});
  }

  if (url.pathname === '/api/dashboard' && req.method === 'GET') {
    const [monitoring,logbook,disposisi]=await Promise.all(['monitoring','logbook','disposisi'].map(primaryRows));
    const complete=monitoring.filter(x=>String(x.verifikasi||'').toLowerCase()==='lengkap').length;
    const pending=disposisi.filter(x=>!['done','selesai'].includes(String(x.status||'').toLowerCase())).length;
    const completion=monitoring.length ? Math.round((complete/monitoring.length)*100) : 0;
    const recent=auditRepository.recentByAccount(account.id,5);
    return json(res,200,{ok:true,data:{monitoring:monitoring.length,pending,complete,logbook:logbook.length,completion,recent}});
  }

  const exportMatch=url.pathname.match(/^\/api\/export\/(monitoring|logbook|archive)$/);
  if(exportMatch && req.method==='GET') {
    const resource=exportMatch[1], moduleName=resource==='archive'?'arsip':resource;
    if(!can(account,moduleName)) return json(res,403,{ok:false,message:'Anda tidak memiliki akses untuk mengekspor modul ini.'});
    const table={monitoring:'monitoring',logbook:'logbook',archive:'archive'}[resource];
    audit(account.id,'EXPORT',resource,null,{format:'csv'});
    return sendCsv(res,`E-DITRENDUK-${resource}-${new Date().toISOString().slice(0,10)}.csv`,await primaryRows(table));
  }

  // Restricted operational modules. Authorization enforced for every read and mutation.
  const special=url.pathname.match(/^\/api\/(agenda|task-deadline)(?:\/([a-zA-Z0-9_-]{1,100}))?$/);
  if(special) {
    const kind=special[1], id=special[2], table=kind==='agenda'?'agenda_kegiatan':'task_deadline';
    if(!can(account,kind)) return json(res,403,{ok:false,message:'Akses modul ini harus diberikan oleh Superadmin.'});
    if(req.method==='GET' && !id) {
      if(pgAgendaTask) {
        const records=await pgAgendaTask.list(table);
        return json(res,200,{ok:true,data:records.map(x=>typeof x.payload==='string'?JSON.parse(x.payload):x.payload)});
      }
      return json(res,200,{ok:true,data:legacyAgendaTaskRows(db,table)});
    }
    if(!['POST','PATCH','PUT','DELETE'].includes(req.method)) return json(res,405,{ok:false,message:'Metode tidak didukung.'});
    if(req.method==='POST' && id) return json(res,405,{ok:false});
    if(req.method!=='POST' && !id) return json(res,405,{ok:false});
    if(req.method==='DELETE') {
      // Remove the agenda row first. Cleanup is best-effort and never exposes private file keys.
      const existingAgenda=kind==='agenda'?(pgAgendaTask?await pgAgendaTask.get(table,id):db.prepare('SELECT payload FROM agenda_kegiatan WHERE id=?').get(id)):null;
      const deleted=pgAgendaTask?await pgAgendaTask.remove(table,id):Boolean(db.prepare(`DELETE FROM ${table} WHERE id=?`).run(id).changes);
      if(!deleted)return json(res,404,{ok:false,message:'Tidak ditemukan.'});
      if(kind==='agenda'&&existingAgenda){
        const payload=typeof existingAgenda.payload==='string'?JSON.parse(existingAgenda.payload):existingAgenda.payload;
        const keys=Array.isArray(payload.attachments)?payload.attachments.map(x=>x.key).filter(x=>typeof x==='string'):[];
        if(keys.length){
          try{
            const storage=createSupabaseStorage({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY,bucket:process.env.AGENDA_STORAGE_BUCKET||'agenda-private'});
            const failures=[];
            for(const key of keys){try{await storage.remove(key)}catch{failures.push(key)}}
            if(failures.length)console.error('Agenda attachment cleanup incomplete: '+failures.length+' file(s); agenda '+id);
          }catch{console.error('Agenda attachment cleanup unavailable; agenda '+id)}
        }
      }
      audit(account.id,'DELETE',kind,id);return json(res,200,{ok:true});
    }
    const b=await readJson(req);
    if(!b || typeof b!=='object' || Array.isArray(b)) return json(res,400,{ok:false,message:'Data tidak valid.'});
    const fields=kind==='agenda'?['tanggal','asalSurat','kegiatan','tempat','waktu','disposisi','nomorSurat']:['nomorSurat','asalSurat','tugas','kebutuhan','deadline','status','disposisi'];
    const existing=id?(pgAgendaTask?await pgAgendaTask.get(table,id):db.prepare(`SELECT payload FROM ${table} WHERE id=?`).get(id)):null;
    if(id&&!existing)return json(res,404,{ok:false,message:'Tidak ditemukan.'});
    const newId=id||uid(kind==='agenda'?'agd':'tsk');
    const old=existing?(typeof existing.payload==='string'?JSON.parse(existing.payload):existing.payload):{};const row={id:newId};
    // Editing agenda fields must never discard its private attachment metadata.
    if(kind==='agenda'&&Array.isArray(old.attachments))row.attachments=old.attachments;
    for(const field of fields)row[field]=String(b[field]===undefined?(old[field]||''):b[field]||'').slice(0,5000);
    if(!(kind==='agenda'?row.kegiatan:row.tugas))return json(res,400,{ok:false,message:'Kegiatan/tugas wajib diisi.'});
    // Enforce canonical task status server-side: UI controls are not a security boundary.
    if(kind==='task-deadline') {
      const normalized=String(row.status||'not yet').trim().toLowerCase();
      if(!['done','not yet'].includes(normalized))return json(res,400,{ok:false,message:'Status harus Done atau Not yet.'});
      row.status=normalized;
    }
    const dateValue=kind==='agenda'?row.tanggal:row.deadline;
    if(dateValue && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      const year=Number(dateValue.slice(0,4));
      const date=new Date(dateValue+'T00:00:00Z');
      if(year<2026 || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10)!==dateValue)
        return json(res,400,{ok:false,message:'Tanggal tidak valid atau sebelum 2026.'});
    }

    if(pgAgendaTask) {
      if(existing)await pgAgendaTask.update(table,newId,row);
      else await pgAgendaTask.create(table,newId,row);
    } else db.prepare(`INSERT INTO ${table}(id,payload) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload`).run(newId,JSON.stringify(row));
    audit(account.id,existing?'UPDATE':'CREATE',kind,newId);
    return json(res,existing?200:201,{ok:true,data:row});
  }
  const dm = url.pathname.match(/^\/api\/(monitoring|logbook|archive|users|disposisi|petugas|schedules)(?:\/([^/]+))?$/);
  if (dm) {
    const [, resource, id] = dm; const table = dataRoutes[resource]; const moduleName={users:'pengguna',schedules:'agenda',archive:'arsip',disposisi:'rakom',petugas:'agenda'}[resource]||resource; if(!can(account,moduleName)) return json(res,403,{ok:false,message:'Anda tidak memiliki akses ke modul ini.'});
    if (req.method === 'GET' && !id) {
      const rows=await primaryRows(table), wantsPage=url.searchParams.has('page')||url.searchParams.has('limit')||url.searchParams.has('q');
      if(!wantsPage) return json(res,200,{ok:true,data:rows});
      const q=cleanText(url.searchParams.get('q')||'',120).toLowerCase();
      const page=Math.max(1,Number(url.searchParams.get('page')||1)||1), limit=Math.min(200,Math.max(1,Number(url.searchParams.get('limit')||25)||25));
      const filtered=q?rows.filter(row=>JSON.stringify(row).toLowerCase().includes(q)):rows;
      const start=(page-1)*limit;
      return json(res,200,{ok:true,data:filtered.slice(start,start+limit),pagination:{page,limit,total:filtered.length,pages:Math.max(1,Math.ceil(filtered.length/limit))}});
    }
    if (req.method === 'POST' && !id) {
      const body = await readJson(req); if(!body || Array.isArray(body) || typeof body!=='object') return json(res,400,{ok:false,message:'Data harus berupa objek.'}); const newId = String(body.id || uid(resource.slice(0,1))); if(!/^[a-zA-Z0-9_-]{1,100}$/.test(newId)) return json(res,400,{ok:false,message:'ID data tidak valid.'}); if(await primaryGet(table,newId)) return json(res,409,{ok:false,message:'ID sudah digunakan.'});
      const row = { ...body, id:newId }; await primaryCreate(table,newId,row); audit(account.id,'CREATE',resource,newId); return json(res,201,{ok:true,data:row});
    }
    if ((req.method === 'PUT' || req.method === 'PATCH') && id) {
      const current = await primaryGet(table,id);
      if (!current) return json(res,404,{ok:false,message:'Data tidak ditemukan.'});
      const body=await readJson(req); if(!body || Array.isArray(body) || typeof body!=='object') return json(res,400,{ok:false,message:'Data harus berupa objek.'}); const row=req.method==='PATCH'?{...current,...body}:{...body,id};
      row.id=id; await primaryUpdate(table,id,row); audit(account.id,'UPDATE',resource,id,{fields:Object.keys(body)}); return json(res,200,{ok:true,data:row});
    }
    if (req.method === 'DELETE' && id) { await primaryRemove(table,id); audit(account.id,'DELETE',resource,id); return json(res,200,{ok:true}); }
  }

  if (url.pathname === '/api/bootstrap' && req.method === 'GET') {
    return json(res,200,{ok:true,data:{
      monitoring:await primaryRows('monitoring'), logbook:await primaryRows('logbook'), archive:await primaryRows('archive'),
      users:await primaryRows('users_data'), disposisi:await primaryRows('disposisi'), petugas:await primaryRows('petugas'), schedules:await primaryRows('schedules')
    }});
  }

  // Pengumpulan notulensi: semua pegawai aktif dapat mengunggah dokumen hasil rapat.
  if (url.pathname === '/api/notulen-submissions' && req.method === 'GET') {
    const session=auth(req,res); if(!session)return;
    const rows=db.prepare('SELECT n.*,a.name AS uploader_name FROM notulen_submissions n JOIN accounts a ON a.id=n.uploaded_by ORDER BY n.uploaded_at DESC LIMIT 200').all();
    return json(res,200,{ok:true,data:rows});
  }
  if (url.pathname === '/api/notulen-submissions' && req.method === 'POST') {
    const session=auth(req,res); if(!session)return;
    const b=await readJson(req);
    // Shared validation for legacy and PostgreSQL paths: one source of truth.
    let validated;
    try { validated = pgNotulenHandler.validate(b); }
    catch (error) {
      if (error.statusCode === 400) return json(res,400,{ok:false,message:error.message});
      throw error;
    }
    const {topic,date,fileName,mime,bytes}=validated;
    const team='';
    const uploadWindow=uploadAttempts.get(session.account_id);
    const uploadNow=Date.now();
    if(uploadWindow && uploadNow-uploadWindow.start<15*60*1000 && uploadWindow.count>=20) return json(res,429,{ok:false,message:'Batas unggahan sementara tercapai. Coba lagi nanti.'});
    const id=uid('hasilnotulen'), stored=id+'.'+validated.ext;
    if(supabaseNotulen) await supabaseNotulen.put(stored,bytes,mime);
    else fs.writeFileSync(path.join(UPLOAD_DIR,stored),bytes,{flag:'wx',mode:0o600});
    try{db.prepare('INSERT INTO notulen_submissions(id,topic,team,meeting_date,file_name,stored_path,mime_type,size_bytes,uploaded_by) VALUES(?,?,?,?,?,?,?,?,?)').run(id,topic,team,date,fileName,'/api/notulen-submissions/'+id+'/file',mime,bytes.length,session.account_id)}catch(e){if(supabaseNotulen)await supabaseNotulen.remove(stored).catch(()=>{});else fs.unlinkSync(path.join(UPLOAD_DIR,stored));throw e}
    if(!uploadWindow || uploadNow-uploadWindow.start>=15*60*1000) uploadAttempts.set(session.account_id,{start:uploadNow,count:1}); else uploadWindow.count++;
    audit(session.account_id,'CREATE','notulen-submissions',id,{topic});
    return json(res,201,{ok:true,data:{id}});
  }
  const downloadMatch=url.pathname.match(/^\/api\/notulen-submissions\/([a-zA-Z0-9_-]+)\/file$/);
  if(downloadMatch && req.method==='GET'){
    const session=auth(req,res);if(!session)return;
    const row=db.prepare('SELECT * FROM notulen_submissions WHERE id=?').get(downloadMatch[1]);
    if(!row)return json(res,404,{ok:false,message:'Lampiran tidak ditemukan.'});
    const file=path.join(UPLOAD_DIR,row.id+'.'+({'application/pdf':'pdf','application/msword':'doc','application/vnd.openxmlformats-officedocument.wordprocessingml.document':'docx'}[row.mime_type]||'invalid'));
    if(supabaseNotulen){
      let bytes;
      try{bytes=await supabaseNotulen.get(path.basename(file))}catch(e){
        return json(res,502,{ok:false,message:'Dokumen tidak dapat diambil dari penyimpanan privat.'});
      }
      res.writeHead(200,{'Content-Type':row.mime_type,'Content-Disposition':'attachment; filename="'+row.id+'.'+file.split('.').pop()+'"','Content-Length':bytes.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
      return res.end(bytes);
    }
    if(!fs.existsSync(file))return json(res,404,{ok:false,message:'File tidak ditemukan di penyimpanan.'});
    if(!fs.lstatSync(file).isFile())return json(res,404,{ok:false,message:'Lampiran tidak valid.'});
    res.writeHead(200,{'Content-Type':row.mime_type,'Content-Disposition':'attachment; filename="'+row.id+'.'+file.split('.').pop()+'"','Content-Length':row.size_bytes,'X-Content-Type-Options':'nosniff'});
    return fs.createReadStream(file).pipe(res);
  }

  if (url.pathname === '/api/notulen' && req.method === 'GET') { if(!can(account,'notulen')) return json(res,403,{ok:false,message:'Anda tidak memiliki akses ke Notulen.'});
    const meetings=meetingRepository.list();
    return json(res,200,{ok:true,data:meetings});
  }
  const notulenDetail=url.pathname.match(/^\/api\/notulen\/([^/]+)$/);
  if (notulenDetail && req.method === 'GET') {
    const meeting=meetingRepository.detail(notulenDetail[1]);
    if(!meeting) return json(res,404,{ok:false,message:'Notulen tidak ditemukan.'});
    return json(res,200,{ok:true,data:meeting});
  }
  if (url.pathname === '/api/notulen' && req.method === 'POST') { if(!can(account,'notulen')) return json(res,403,{ok:false,message:'Anda tidak memiliki akses ke Notulen.'});
    const b=await readJson(req), id=uid('rapat');
    const validationError=validateMeetingPayload(b);
    if(validationError) return json(res,400,{ok:false,message:validationError});
    try {
      meetingRepository.create({id,body:b,accountId:session.account_id,makeId:uid,
        saveImage:saveDataUrlImage,cleanFileName:name=>cleanText(name,120)});
    } catch(fileErr) {
      // A rolled-back transaction cannot undo files already written to disk.
      for(const f of fs.readdirSync(UPLOAD_DIR).filter(x=>x.startsWith(id+'-'))) fs.unlinkSync(path.join(UPLOAD_DIR,f));
      storageRepository.removeByResource('notulen',id);
      return json(res,400,{ok:false,message:fileErr.message});
    }
    audit(account.id,'CREATE','notulen',id,{topic:b.topic||'Rapat'}); return json(res,201,{ok:true,data:{id}});
  }

  return json(res,404,{ok:false,message:'Endpoint tidak ditemukan.'});
}

function serveStatic(req,res,url) {
  if(req.method!=='GET' && req.method!=='HEAD'){res.writeHead(405);return res.end('Method not allowed');}
  const target=resolvePublicFile(ROOT,url.pathname==='/'?'/login.html':url.pathname);
  if(!target){res.writeHead(404);return res.end('Not found');}
  res.writeHead(200,{'Content-Type':target.mime,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
  if(req.method==='HEAD')return res.end();
  const stream=fs.createReadStream(target.file);
  stream.on('error',()=>res.destroy());
  stream.pipe(res);
}

initSchema();
// Password reset must work on a fresh `npm start`, not only after `npm run migrate`.
// Apply the idempotent schema before any account or reset request is handled.
db.exec(fs.readFileSync(path.join(__dirname, 'migrations', '005-password-reset-requests.sql'), 'utf8'));
seed();
for(const table of ['agenda_kegiatan','task_deadline'])db.exec(`CREATE TABLE IF NOT EXISTS ${table}(id TEXT PRIMARY KEY,payload TEXT NOT NULL)`);
const agendaSeed=require('./backend/agenda-task-import.json');
for(const [key,table] of [['agenda','agenda_kegiatan'],['task','task_deadline']]) {
  if(!IS_PROD && db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n===0){
    const put=db.prepare(`INSERT INTO ${table}(id,payload) VALUES(?,?)`);
    for(const row of agendaSeed[key])put.run(row.id,JSON.stringify(row));
  }
}

// Production fail-closed: prevent publishing known demonstration credentials.
if(IS_PROD && PG_PRIMARY_AUTH) throw new Error('Autentikasi PostgreSQL parsial belum disetujui untuk production.');
if(IS_PROD && PG_PRIMARY_PAYLOAD) throw new Error('Mode hybrid PostgreSQL/SQLite belum disetujui untuk production.');
if(IS_PROD && PG_PRIMARY_AGENDA_TASK) throw new Error('Mode hybrid Agenda/Task PostgreSQL belum disetujui untuk production.');
if(IS_PROD && !originAllowed({method:'POST',origin:process.env.APP_ORIGIN,appOrigin:process.env.APP_ORIGIN,isProd:true})) throw Error('Production wajib APP_ORIGIN HTTPS valid tanpa path, misalnya https://editrenduk.domain.go.id');
if(IS_PROD) {
  const accounts=db.prepare('SELECT username,password_hash FROM accounts').all();
  if(!accounts.length) throw new Error('Production memerlukan akun admin yang diprovisi secara aman sebelum startup.');
  if(accounts.some(a=>verifyPassword('Ditrenduk2026!',a.password_hash))) throw new Error('Password bawaan terdeteksi. Ubah semua password default sebelum production.');
  if(process.env.ALLOW_SQLITE_PUBLIC !== 'I_UNDERSTAND_THE_RISK') throw new Error('Runtime SQLite belum disetujui untuk publik. Set ALLOW_SQLITE_PUBLIC hanya setelah audit, volume persisten, backup dan persetujuan instansi.');
}
// Penyederhanaan role sesuai arahan mentor; akun lama tetap dapat login.
db.exec("UPDATE accounts SET role = CASE WHEN role LIKE '%Admin%' THEN 'Superadmin' ELSE 'Pegawai' END WHERE role NOT IN ('Superadmin','Pegawai')");
const server=http.createServer(async(req,res)=>{
  if(Number(req.headers['content-length']||0)>12_000_000){res.writeHead(413);return res.end('Payload terlalu besar');}
  const requestId=crypto.randomUUID();
  const requestStarted=Date.now();
  res.setHeader('X-Request-Id',requestId);
  res.on('finish',()=>{
    if(process.env.ACCESS_LOG==='0') return;
    console.log(JSON.stringify({type:'access',requestId,method:req.method,path:String(req.url||'').split('?')[0],status:res.statusCode,durationMs:Date.now()-requestStarted,time:new Date().toISOString()}));
  });
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','SAMEORIGIN');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy','same-origin');
  res.setHeader('Content-Security-Policy',csp(IS_PROD));
  if(IS_PROD) res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains');
  cors(req,res); const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  if(!originAllowed({method:req.method,origin:req.headers.origin,fetchSite:req.headers['sec-fetch-site'],appOrigin:process.env.APP_ORIGIN,isProd:IS_PROD,host:req.headers.host,devOrigins:[...ALLOWED_ORIGINS]})) return json(res,403,{ok:false,message:'Origin permintaan tidak diizinkan.'});
  try { if(url.pathname.startsWith('/api/')) { res.setHeader('Cache-Control','no-store'); return await api(req,res,url); } serveStatic(req,res,url); }
  catch(err){ console.error(JSON.stringify({type:'error',requestId,message:err.message,stack:IS_PROD?undefined:err.stack})); json(res,err.statusCode||500,{ok:false,message:err.statusCode?err.message:'Terjadi kesalahan pada server.',requestId,detail:process.env.NODE_ENV==='development'?err.message:undefined}); }
});
server.listen(PORT,()=>console.log(`E-DITRENDUK V44 berjalan di http://localhost:${PORT}`));
function shutdown(signal){
  console.log(`${signal}: menutup E-DITRENDUK dengan aman...`);
  server.close(()=>{ try{db.close();}catch(e){} process.exit(0); });
  setTimeout(()=>process.exit(1),10000).unref();
}
process.on('SIGTERM',()=>shutdown('SIGTERM'));
process.on('SIGINT',()=>shutdown('SIGINT'));
