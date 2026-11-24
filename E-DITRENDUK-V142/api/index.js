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
  const configErrors=validateProductionEnvironment(process.env);
  if(configErrors.length)throw new Error('Konfigurasi produksi belum siap: '+configErrors.join(' '));
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL wajib; tidak ada fallback SQLite.');
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase Storage privat belum dikonfigurasi.');
  }
  const gateway = createPostgresReadGateway({ connectionString: process.env.DATABASE_URL });
  const notulen = createSupabaseStorage({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY,bucket:process.env.SUPABASE_STORAGE_BUCKET||'notulen-private'});
  const attachments = createSupabaseStorage({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY,bucket:process.env.AGENDA_STORAGE_BUCKET||'agenda-private'});
  app = createApp({pool:gateway.pool,storage:notulen,attachmentStorage:attachments});
  return app;
}
module.exports = (req,res) => {
  try { initialize().emit('request',req,res); }
  catch(err) { console.error('Vercel initialization failed:',err.message); if(!res.headersSent){res.statusCode=503;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({ok:false,message:'Konfigurasi server belum siap.'}));} }
};
