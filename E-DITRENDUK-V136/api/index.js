'use strict';
// Vercel Node.js function adapter for the PostgreSQL-only HTTP runtime.
// Reuse the HTTP request handler without binding a listening port.
const { createApp } = require('../server-postgres');
const { createPostgresReadGateway } = require('../backend/postgres-read-gateway');
const { createSupabaseStorage } = require('../backend/supabase-storage');
const {validateProductionEnvironment}=require('../backend/postgres-production-readiness');
let app;
function initialize() {
  if (app) return app;
  // V144: A Vercel Preview deployment may not inherit Production-only APP_ORIGIN.
  // Use ONLY a Vercel-generated HTTPS .vercel.app URL as a Preview fallback.
  // Never derive the trusted origin from incoming request Host/Origin headers.
  if (process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'preview') {
    // Always use the deployment URL for Preview; an inherited or placeholder
    // Production APP_ORIGIN must not prevent initialization.
    const candidate = process.env.VERCEL_URL || process.env.VERCEL_BRANCH_URL;
    try {
      const url = new URL(`https://${String(candidate || '').replace(/^https:\/\//, '')}`);
      if (url.protocol === 'https:' && url.hostname.endsWith('.vercel.app') && url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password) {
        process.env.APP_ORIGIN = url.origin;
      }
    } catch (_) { /* readiness validation will report the missing origin */ }
  }
  // Preview can use an existing managed PostgreSQL integration whose connection
  // string is exposed under a standard provider name rather than DATABASE_URL.
  // Never hardcode credentials, accept request headers, or substitute a public
  // Supabase anon key for a PostgreSQL connection string.
  if (process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'preview'
      && !process.env.DATABASE_URL) {
    for (const candidate of [
      process.env.POSTGRES_URL,
      process.env.POSTGRES_PRISMA_URL,
      process.env.POSTGRES_URL_NON_POOLING,
      process.env.SUPABASE_DB_URL
    ]) {
      try {
        const candidateUrl = new URL(candidate);
        if (['postgres:', 'postgresql:'].includes(candidateUrl.protocol)) {
          process.env.DATABASE_URL = candidate;
          break;
        }
      } catch (_) { /* Ignore unset or invalid provider URL */ }
    }
  }
  // Only Preview may omit optional private attachment storage. Database and
  // origin validation remain mandatory. Production still requires all settings.
  const isPreview = process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'preview';
  const configErrors=validateProductionEnvironment(process.env,{requireStorage:!isPreview});
  if(configErrors.length)throw new Error('Konfigurasi produksi belum siap: '+configErrors.join(' '));
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL wajib; tidak ada fallback SQLite.');
  const storageConfigured = process.env.NOTULEN_STORAGE_PROVIDER === 'supabase'
    && !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!isPreview && !storageConfigured) throw new Error('Supabase Storage privat belum dikonfigurasi.');
  const gateway = createPostgresReadGateway({ connectionString: process.env.DATABASE_URL });
  const notulen = storageConfigured
    ? createSupabaseStorage({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY,bucket:process.env.SUPABASE_STORAGE_BUCKET||'notulen-private'})
    : null;
  const attachments = storageConfigured
    ? createSupabaseStorage({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY,bucket:process.env.AGENDA_STORAGE_BUCKET||'agenda-private'})
    : null;
  app = createApp({pool:gateway.pool,storage:notulen,attachmentStorage:attachments});
  return app;
}
module.exports = (req,res) => {
  try { initialize().emit('request',req,res); }
  catch(err) { console.error('Vercel initialization failed:',err.message); if(!res.headersSent){res.statusCode=503;res.setHeader('Content-Type','application/json');const preview = process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'preview';
    const detail = String(err && err.message || '');
    const code = preview && /DATABASE_URL|PostgreSQL online|kredensial asli/i.test(detail)
      ? 'PREVIEW_DATABASE_CONFIG'
      : preview && /APP_ORIGIN/i.test(detail)
        ? 'PREVIEW_ORIGIN_CONFIG'
        : preview && /Supabase Storage/i.test(detail)
          ? 'PREVIEW_STORAGE_CONFIG'
          : 'SERVER_CONFIG';
    const message = code === 'PREVIEW_DATABASE_CONFIG'
      ? 'Preview belum memiliki konfigurasi koneksi database yang valid. Data tidak diubah.'
      : code === 'PREVIEW_ORIGIN_CONFIG'
        ? 'Alamat Preview belum dikenali server.'
        : code === 'PREVIEW_STORAGE_CONFIG'
          ? 'Penyimpanan privat Preview belum siap.'
          : 'Konfigurasi server belum siap.';
    res.end(JSON.stringify({ok:false,message,code}));} }
};
